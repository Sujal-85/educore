import React, { useState } from 'react';
import { 
  Target, 
  Search, 
  Filter, 
  Users,
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ChevronRight,
  MoreVertical,
  Download,
  BarChart3,
  X,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export default function BehaviorScore() {
  const { students, user, logBehaviorIncident, behaviorIncidents } = useAppStore();
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const isTeacher = user?.role?.toLowerCase() === 'teacher';

  const filteredStudents = students.filter(s => {
    const sClass = String(s.class || '');
    const sSection = String(s.section || '');
    const matchesClass = filterClass === 'All' || sClass === filterClass;
    const matchesSection = filterSection === 'All' || sSection === filterSection;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUser = isTeacher || s.uid === user?.uid;
    return matchesClass && matchesSection && matchesSearch && matchesUser;
  }).sort((a, b) => (a.behaviorScore || 100) - (b.behaviorScore || 100));

  const handleLogIncident = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('Please select a student first');
      return;
    }

    const formData = new FormData(e.target);
    const incident = {
      type: formData.get('type'),
      description: formData.get('description'),
      scoreChange: parseInt(formData.get('scoreChange'))
    };
    
    try {
      await logBehaviorIncident(selectedStudent.id, incident);
      toast.success('Incident logged successfully');
      setShowIncidentModal(false);
    } catch (error) {
      console.error("Log Incident Error:", error);
      toast.error('Failed to log incident. Please check your permissions.');
    }
  };

  const avgScore = filteredStudents.length > 0
    ? Math.round(filteredStudents.reduce((acc, s) => acc + (s.behaviorScore || 0), 0) / filteredStudents.length)
    : 0;

  const criticalAlerts = filteredStudents.filter(s => (s.behaviorScore || 0) < 50).length;

  const chartData = filteredStudents.map(s => ({
    name: s.name.split(' ')[0],
    score: s.behaviorScore || 100
  }));

  const studentAttendanceData = [
    { day: 'Mon', status: 1 },
    { day: 'Tue', status: 1 },
    { day: 'Wed', status: 0 },
    { day: 'Thu', status: 1 },
    { day: 'Fri', status: 1 },
  ];

  const studentBehaviorData = [
    { category: 'Punctuality', score: 85 },
    { category: 'Discipline', score: 90 },
    { category: 'Participation', score: 75 },
  ];

  const personalStudent = !isTeacher ? students.find(s => s.uid === user?.uid) : null;

  const getStudentIncidents = (studentId) => behaviorIncidents
    .filter((incident) => incident.studentId === studentId)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const selectedStudentIncidents = selectedStudent ? getStudentIncidents(selectedStudent.id) : [];

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">Attendance & Behavior</h1>
          <p className="text-text-secondary text-sm">
            {isTeacher ? "Monitor student conduct and discipline across the school." : "Track your personal presence and behavioral growth."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-xl glass hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all">
            <Download className="w-5 h-5" />
          </button>
          {isTeacher && (
            <button 
              onClick={() => {
                if (students.length > 0) {
                  setSelectedStudent(filteredStudents.length > 0 ? filteredStudents[0] : students[0]);
                  setShowIncidentModal(true);
                } else {
                  toast.error('No students available to log incidents for.');
                }
              }}
              className="btn-primary flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              Log Incident
            </button>
          )}
        </div>
      </div>

      {/* Student Personal View */}
      {!isTeacher && personalStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass p-8 rounded-[32px] border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-6">Monthly Attendance Graph</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { month: 'Jan', rate: 85 },
                  { month: 'Feb', rate: 92 },
                  { month: 'Mar', rate: 88 },
                  { month: 'Apr', rate: personalStudent.attendance || 87 },
                ]}>
                  <defs>
                    <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} unit="%" tick={{ fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="rate" stroke="var(--success)" strokeWidth={3} fillOpacity={1} fill="url(#colorAttend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-sm text-text-secondary">
                <Sparkles className="w-4 h-4 text-primary inline mr-2" />
                Your attendance dropped this week. Try to be consistent!
              </p>
            </div>
          </div>

          <div className="glass p-8 rounded-[32px] border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-6">Behavior Breakdown</h3>
            <div className="space-y-6">
              {studentBehaviorData.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-text-secondary">{item.category}</span>
                    <span className="text-primary">{item.score}%</span>
                  </div>
                  <div className="h-2 bg-surface-elevated rounded-full overflow-hidden border border-border">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 rounded-2xl bg-success/5 border border-success/10">
              <p className="text-sm text-success font-medium">
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Your punctuality improved by 10% this month!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Teacher/Overview Stats Row */}
      {isTeacher && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-3xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-success/10 text-success">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-text-muted uppercase tracking-widest">Avg. Score</span>
            </div>
            <p className="text-3xl font-bold font-mono text-text-primary">{avgScore}/100</p>
            <p className="text-xs text-success mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +4% from last month
            </p>
          </div>
          <div className="glass p-6 rounded-3xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-warning/10 text-warning">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-text-muted uppercase tracking-widest">Punctuality</span>
            </div>
            <p className="text-3xl font-bold font-mono text-text-primary">78%</p>
            <p className="text-xs text-text-muted mt-2">On-time arrivals</p>
          </div>
          <div className="glass p-6 rounded-3xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-danger/10 text-danger">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-text-muted uppercase tracking-widest">Critical Alerts</span>
            </div>
            <p className="text-3xl font-bold font-mono text-text-primary">{criticalAlerts}</p>
            <p className="text-xs text-danger mt-2 animate-pulse">Students below 50 score</p>
          </div>
        </div>
      )}

      {/* Incident Modal */}
      <AnimatePresence>
        {showIncidentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIncidentModal(false)}
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
                  <h2 className="text-2xl font-bold font-display text-text-primary">Log Incident</h2>
                  <p className="text-sm text-text-muted">Record a behavior incident for a student.</p>
                </div>
                <button 
                  onClick={() => setShowIncidentModal(false)}
                  className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form className="p-8 space-y-6" onSubmit={handleLogIncident}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Student</label>
                    <select 
                      value={selectedStudent?.id || ''}
                      onChange={(e) => setSelectedStudent(students.find(s => s.id === e.target.value))}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary"
                    >
                      <option value="" disabled className="bg-surface text-text-primary">Select a student</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id} className="bg-surface text-text-primary">{s.name} (Class {s.class})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Incident Type</label>
                    <select name="type" className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary">
                      <option value="Positive" className="bg-surface text-text-primary">Positive (Reward)</option>
                      <option value="Negative" className="bg-surface text-text-primary">Negative (Penalty)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Score Change</label>
                    <input name="scoreChange" type="number" defaultValue="-5" className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Description</label>
                    <textarea name="description" required className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary h-24" placeholder="Describe the incident..." />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full py-3">Log Incident</button>
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
            <span className="text-sm font-bold text-text-muted uppercase tracking-widest">Avg. Score</span>
          </div>
          <p className="text-3xl font-bold font-mono text-text-primary">{avgScore}/100</p>
          <p className="text-xs text-success mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +4% from last month
          </p>
        </div>
        <div className="glass p-6 rounded-3xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-warning/10 text-warning">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-text-muted uppercase tracking-widest">Punctuality</span>
          </div>
          <p className="text-3xl font-bold font-mono text-text-primary">78%</p>
          <p className="text-xs text-text-muted mt-2">On-time arrivals</p>
        </div>
        <div className="glass p-6 rounded-3xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-danger/10 text-danger">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-text-muted uppercase tracking-widest">Critical Alerts</span>
          </div>
          <p className="text-3xl font-bold font-mono text-text-primary">{criticalAlerts}</p>
          <p className="text-xs text-danger mt-2 animate-pulse">Students below 50 score</p>
        </div>
      </div>

      {/* Behavior Chart */}
      <div className="glass p-8 rounded-[32px] border border-border">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Class Behavior Distribution</h3>
            <p className="text-sm text-text-muted">Behavior scores for {filterClass === 'All' ? 'All Classes' : `Class ${filterClass}`}</p>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-surface-elevated border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary/50 transition-all text-text-primary"
            >
              <option value="All">All Classes</option>
              <option value="FE">FE - First Year</option>
              <option value="SE">SE - Second Year</option>
              <option value="TE">TE - Third Year</option>
              <option value="BE">BE - Final Year</option>
            </select>
            <select 
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="bg-surface-elevated border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary/50 transition-all text-text-primary"
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} tick={{ fill: 'var(--text-muted)' }} />
              <YAxis axisLine={false} tickLine={false} dx={-10} tick={{ fill: 'var(--text-muted)' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-primary)' }}
              />
              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.score >= 80 ? 'var(--success)' : entry.score >= 50 ? 'var(--warning)' : 'var(--danger)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Student List */}
      <div className="glass rounded-3xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Student Behavior Rankings</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-elevated/50 border border-border rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-primary/50 transition-all text-text-primary"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-elevated border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Score</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Last Incident</th>
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
                    <span className={clsx(
                      "text-sm font-bold font-mono",
                      student.behaviorScore >= 80 ? "text-success" : student.behaviorScore >= 50 ? "text-warning" : "text-danger"
                    )}>{student.behaviorScore}/100</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                      student.behaviorScore >= 80 ? "bg-success/10 text-success" : 
                      student.behaviorScore >= 50 ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger"
                    )}>
                      {student.behaviorScore >= 80 ? 'Excellent' : student.behaviorScore >= 50 ? 'Good' : 'Critical'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-text-muted">
                      {getStudentIncidents(student.id)[0]?.description || 'None recorded'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleViewDetails(student)}
                      className="text-primary text-xs font-bold hover:underline flex items-center gap-1 ml-auto"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="text-center py-20 bg-surface-elevated/30">
            <Users className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-text-secondary">
              {students.length === 0 ? "No students in system" : "No students match filters"}
            </h3>
            <p className="text-sm text-text-muted">
              {students.length === 0 
                ? "Please add students or seed data in the Teacher Portal." 
                : "Try adjusting your search or class filter."}
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDetailsModal && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailsModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-elevated rounded-3xl border border-border shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl font-bold font-display text-text-primary">{selectedStudent.name}</h2>
                  <p className="text-sm text-text-muted">Behavior score: {selectedStudent.behaviorScore || 100}/100</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                {selectedStudentIncidents.length > 0 ? (
                  selectedStudentIncidents.map((incident) => (
                    <div key={incident.id} className="p-4 rounded-2xl bg-surface-elevated border border-border">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className={clsx(
                          "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                          incident.type === 'Positive' ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                        )}>
                          {incident.type}
                        </span>
                        <span className="text-xs text-text-muted">
                          {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : 'Unknown date'}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mb-2">{incident.description}</p>
                      <p className="text-xs font-bold text-text-primary">Score change: {incident.scoreChange > 0 ? `+${incident.scoreChange}` : incident.scoreChange}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-sm text-text-muted">No behavior incidents recorded for this student yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
