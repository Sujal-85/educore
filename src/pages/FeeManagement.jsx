import React, { useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send,
  MoreVertical,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';

import { downloadCSV } from '../lib/utils';
import { Plus, X } from 'lucide-react';
import { sendEmailDraft, EMAIL_TEMPLATE_KEYS } from '../lib/emailTemplates';

export default function FeeManagement() {
  const { students, updateStudentFeeStatus, user, recordFeePayment, feePayments } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTeacher = user?.role?.toLowerCase() === 'teacher';
  const totalFees = 45000;

  const getStudentPaidAmount = (studentId) => feePayments
    .filter((payment) => payment.studentId === studentId)
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

  const getStudentDueAmount = (studentId) => Math.max(0, totalFees - getStudentPaidAmount(studentId));

  const getStudentFeeStatus = (student) => {
    const paid = getStudentPaidAmount(student.id);
    const due = Math.max(0, totalFees - paid);

    if (due === 0) return 'Paid';
    if (paid > 0) return 'Partial';
    return student.feeStatus === 'Overdue' ? 'Overdue' : 'Overdue';
  };
  
  const filteredStudents = students.filter(s => {
    const matchesSearch = (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNo.includes(searchQuery));
    const matchesStatus = (filterStatus === 'All' || getStudentFeeStatus(s) === filterStatus);
    const matchesUser = isTeacher || s.uid === user?.uid;
    return matchesSearch && matchesStatus && matchesUser;
  });

  const personalStudent = !isTeacher ? students.find(s => s.uid === user?.uid) : null;

  const studentPaid = personalStudent ? getStudentPaidAmount(personalStudent.id) : 0;
  const studentDue = personalStudent ? getStudentDueAmount(personalStudent.id) : totalFees;

  const totalCollected = feePayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

  const totalPending = students.reduce((sum, student) => sum + getStudentDueAmount(student.id), 0);

  const overdueCount = students.filter((student) => getStudentFeeStatus(student) === 'Overdue').length;

  const handleMarkPaid = async (student) => {
    try {
      await updateStudentFeeStatus(student.id, 'Paid');
      toast.success(`Fee marked as paid for ${student.name}`);
    } catch (error) {
      toast.error(`Failed to update fee status for ${student.name}`);
    }
  };

  const handleSendReminder = (student) => {
    try {
      sendEmailDraft({
        to: student.email,
        templateKey: EMAIL_TEMPLATE_KEYS.FEE_REMINDER,
        context: {
          studentName: student.name,
          amountDue: getStudentDueAmount(student.id).toLocaleString(),
          dueDate: 'end of this month'
        }
      });
      toast.success(`Email draft opened for ${student.name}`);
    } catch (error) {
      toast.error('Student email is missing. Please add student email first.');
    }
  };

  const handleDownload = () => {
    const data = filteredStudents.map(s => ({
      Name: s.name,
      RollNo: s.rollNo,
      Class: `${s.class}-${s.section}`,
      Status: getStudentFeeStatus(s),
      TotalAmount: totalFees,
      PaidAmount: getStudentPaidAmount(s.id),
      DueAmount: getStudentDueAmount(s.id)
    }));
    downloadCSV(data, 'Fee_Management_Report');
  };

  const handleCollectSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const studentId = formData.get('studentId');
    const amount = Number(formData.get('amount'));
    const method = formData.get('method');

    if (!studentId || !amount || amount <= 0) {
      toast.error('Please enter a valid payment amount.');
      setIsSubmitting(false);
      return;
    }

    const currentPaid = getStudentPaidAmount(studentId);
    const newTotalPaid = currentPaid + amount;
    const status = newTotalPaid >= totalFees ? 'Paid' : 'Partial';
    
    try {
      await recordFeePayment(studentId, { amount, method });
      await updateStudentFeeStatus(studentId, status);
      toast.success('Fee collected successfully!');
      setShowCollectModal(false);
    } catch (error) {
      toast.error('Failed to collect fee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentPayments = feePayments.filter(p => isTeacher || p.studentId === students.find(s => s.uid === user?.uid)?.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">Fee Management</h1>
          <p className="text-text-secondary text-sm">Monitor and manage student fee collections and dues.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownload}
            className="p-2.5 rounded-xl glass border border-border hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all"
          >
            <Download className="w-5 h-5" />
          </button>
          {isTeacher && (
            <button 
              onClick={() => setShowCollectModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Collect Fee
            </button>
          )}
        </div>
      </div>

      {/* Collect Fee Modal */}
      <AnimatePresence>
        {showCollectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCollectModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass-elevated rounded-3xl border border-border shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-display text-text-primary">Collect Fee</h2>
                  <p className="text-sm text-text-muted">Record a new fee payment transaction.</p>
                </div>
                <button 
                  onClick={() => setShowCollectModal(false)}
                  className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form className="p-8 space-y-6" onSubmit={handleCollectSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Select Student</label>
                    <select name="studentId" required className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary">
                      {students.map(s => (
                        <option key={s.id} value={s.id} className="bg-surface text-text-primary">{s.name} (Roll: {s.rollNo})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Amount (₹)</label>
                    <input name="amount" type="number" required className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary" placeholder="e.g. 5000" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Payment Method</label>
                    <select name="method" required className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary">
                      <option className="bg-surface text-text-primary">Cash</option>
                      <option className="bg-surface text-text-primary">Online Transfer</option>
                      <option className="bg-surface text-text-primary">Cheque</option>
                      <option className="bg-surface text-text-primary">UPI</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Record Payment
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-success/10 text-success">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-text-muted uppercase tracking-widest">
              {isTeacher ? 'Total Collected' : 'Total Fees'}
            </span>
          </div>
          <p className="text-3xl font-bold font-mono text-text-primary">
            ₹{(isTeacher ? totalCollected : totalFees).toLocaleString()}
          </p>
          <p className="text-xs text-success mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {isTeacher ? '+15% from last month' : 'Academic Year 2025-26'}
          </p>
        </div>
        <div className="glass p-6 rounded-3xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-text-muted uppercase tracking-widest">
              {isTeacher ? 'Pending' : 'Paid Amount'}
            </span>
          </div>
          <p className="text-3xl font-bold font-mono text-text-primary">
            ₹{(isTeacher ? totalPending : studentPaid).toLocaleString()}
          </p>
          <p className="text-xs text-text-muted mt-2">
            {isTeacher ? `${students.filter(s => s.feeStatus !== 'Paid').length} students remaining` : 'Last payment: 2 weeks ago'}
          </p>
        </div>
        <div className="glass p-6 rounded-3xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-danger/10 text-danger">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-text-muted uppercase tracking-widest">
              {isTeacher ? 'Overdue' : 'Remaining Dues'}
            </span>
          </div>
          <p className="text-3xl font-bold font-mono text-text-primary">
            {isTeacher ? overdueCount : `₹${studentDue.toLocaleString()}`}
          </p>
          <p className="text-xs text-danger mt-2 animate-pulse">
            {isTeacher ? 'Action required for overdue students' : (studentDue > 0 ? 'Please clear your dues by end of month' : 'No pending dues')}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass p-4 rounded-2xl border border-border flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text"
            placeholder="Search by name or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all text-text-primary"
          />
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all min-w-[140px] text-text-primary"
          >
            <option value="All" className="bg-surface text-text-primary">All Status</option>
            <option value="Paid" className="bg-surface text-text-primary">Paid</option>
            <option value="Partial" className="bg-surface text-text-primary">Partial</option>
            <option value="Overdue" className="bg-surface text-text-primary">Overdue</option>
          </select>
        </div>
      </div>

      {/* Fee Table */}
      <div className="glass rounded-3xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-text-primary">Student Fee Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-elevated border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Class</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Fee Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Paid</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Due</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.map((student) => (
                <motion.tr 
                  key={student.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-surface-elevated transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        src={student.avatar} 
                        fallback={student.name.charAt(0)} 
                        size="xs"
                      />
                      <p className="text-sm font-bold group-hover:text-primary transition-colors text-text-primary">{student.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-text-primary">{student.class}-{student.section}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold font-mono text-text-primary">₹45,000</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold font-mono text-success">
                      ₹{getStudentPaidAmount(student.id).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold font-mono text-danger">
                      ₹{getStudentDueAmount(student.id).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const feeStatus = getStudentFeeStatus(student);
                      return (
                    <span className={clsx(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                      feeStatus === 'Paid' ? "bg-success/10 text-success" : 
                      feeStatus === 'Partial' ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger animate-pulse"
                    )}>
                      {feeStatus}
                    </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isTeacher && getStudentDueAmount(student.id) > 0 && (
                        <button 
                          onClick={() => handleMarkPaid(student)}
                          className="p-2 rounded-lg hover:bg-success/10 text-text-secondary hover:text-success transition-all"
                          title="Mark as Paid"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {isTeacher && (
                        <button 
                          onClick={() => handleSendReminder(student)}
                          className="p-2 rounded-lg hover:bg-primary/10 text-text-secondary hover:text-primary transition-all"
                          title="Send Reminder"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-2 rounded-lg hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="glass rounded-3xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-text-primary">Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-elevated border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Method</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...studentPayments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((payment) => {
                const student = students.find(s => s.id === payment.studentId);
                return (
                  <tr key={payment.id} className="hover:bg-surface-elevated transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-text-primary">{student?.name || 'Unknown'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold font-mono text-success">₹{payment.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-secondary">{payment.method}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-muted">{new Date(payment.createdAt).toLocaleDateString()}</span>
                    </td>
                  </tr>
                );
              })}
              {studentPayments.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-text-muted italic">No payment history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
