import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Filter,
  Download,
  Search,
  X,
  GraduationCap,
  ChevronRight,
  Sparkles,
  Paperclip,
  ExternalLink,
  Eye,
  Trash2,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';
import { downloadCSV } from '../lib/utils';

export default function Assignments() {
  const { 
    assignments, 
    submissions, 
    students,
    addAssignment, 
    updateAssignment, 
    submitAssignment, 
    gradeSubmission,
    deleteAssignment, 
    user 
  } = useAppStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTeacher = user?.role?.toLowerCase() === 'teacher';

  const processedAssignments = assignments.map(a => {
    if (isTeacher) return a;
    const submission = submissions.find(s => s.assignmentId === a.id && s.studentId === user.uid);
    return {
      ...a,
      myStatus: submission ? submission.status : 'Pending',
      myScore: submission?.score,
      myFeedback: submission?.feedback,
      mySubmittedFileUrl: submission?.fileUrl,
      mySubmittedFileName: submission?.fileName
    };
  });

  const filteredAssignments = processedAssignments.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = () => {
    const data = filteredAssignments.map(a => ({
      Title: a.title,
      Subject: a.subject,
      Class: a.class,
      DueDate: a.dueDate,
      Submissions: a.submissions,
      MaxMarks: a.maxMarks,
      Status: isTeacher ? a.status : a.myStatus
    }));
    downloadCSV(data, 'Assignments_Report');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await addAssignment(data, selectedFile);
      setShowCreateModal(false);
      setSelectedFile(null);
      toast.success('Assignment created successfully');
    } catch (error) {
      toast.error('Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const score = formData.get('score');
    const feedback = formData.get('feedback');
    
    try {
      await gradeSubmission(selectedAssignment.id, selectedSubmission.studentId, { 
        score: score, 
        feedback: feedback 
      });
      setShowGradeModal(false);
      setSelectedSubmission(null);
      toast.success('Submission graded successfully');
    } catch (error) {
      toast.error('Failed to grade submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submissionFile) {
      toast.error('Please select a file to submit');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAssignment(selectedAssignment.id, user.uid, submissionFile);
      setShowDetailsModal(false);
      setSubmissionFile(null);
      toast.success('Assignment submitted successfully');
    } catch (error) {
      toast.error('Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await deleteAssignment(id);
        toast.success('Assignment deleted successfully');
      } catch (error) {
        toast.error('Failed to delete assignment');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Assignments</h1>
          <p className="text-text-secondary text-sm">Create and track student assignments and submissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownload}
            className="p-2.5 rounded-xl glass hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all"
          >
            <Download className="w-5 h-5" />
          </button>
          {isTeacher && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Assignment
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass p-4 rounded-2xl border border-border flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text"
            placeholder="Search assignments by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated/50 border border-border rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all text-text-primary"
          />
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <select className="bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all min-w-[120px] text-text-primary">
            <option>All Subjects</option>
            <option>Math</option>
            <option>Science</option>
            <option>English</option>
          </select>
          <select className="bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all min-w-[140px] text-text-primary">
            <option>Active</option>
            <option>Graded</option>
            <option>Overdue</option>
          </select>
        </div>
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.map((assignment) => (
          <motion.div 
            key={assignment.id}
            whileHover={{ y: -5 }}
            className="glass p-6 rounded-3xl border border-border card-hover flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={clsx(
                "p-3 rounded-2xl bg-opacity-10",
                assignment.subject === 'Math' ? 'bg-primary/10 text-primary' : 
                assignment.subject === 'Science' ? 'bg-success/10 text-success' : 
                assignment.subject === 'English' ? 'bg-secondary/10 text-secondary' : 'bg-warning/10 text-warning'
              )}>
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                {new Date(assignment.dueDate) < new Date() && (isTeacher ? assignment.status !== 'Graded' : assignment.myStatus === 'Pending') && (
                  <span className="px-2.5 py-1 rounded-lg bg-danger/10 text-danger text-[10px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Overdue
                  </span>
                )}
                <span className={clsx(
                  "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                  (isTeacher ? assignment.status === 'Graded' : assignment.myStatus === 'Graded') ? "bg-success/10 text-success" : 
                  (isTeacher ? assignment.status === 'Submitted' : assignment.myStatus === 'Submitted') ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                )}>
                  {isTeacher ? assignment.status : assignment.myStatus}
                </span>
                {isTeacher && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(assignment.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors text-text-primary">{assignment.title}</h3>
              <p className="text-xs text-text-muted mb-6">Class {assignment.class} • {assignment.subject}</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Calendar className="w-4 h-4" />
                    <span>Due Date</span>
                  </div>
                  <span className="font-bold font-mono text-text-primary">{assignment.dueDate}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Users className="w-4 h-4" />
                    <span>Submissions</span>
                  </div>
                  <span className="font-bold font-mono text-primary">{assignment.submissions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <GraduationCap className="w-4 h-4" />
                    <span>Max Marks</span>
                  </div>
                  <span className="font-bold font-mono text-text-primary">{assignment.maxMarks}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-surface bg-surface-elevated flex items-center justify-center text-[10px] font-bold text-text-primary">
                    S{i}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-elevated flex items-center justify-center text-[10px] font-bold text-text-muted">
                  +15
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedAssignment(assignment);
                  setShowDetailsModal(true);
                }}
                className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
              >
                View Details
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-elevated rounded-3xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-bold font-display text-text-primary">Create Assignment</h2>
                  <p className="text-sm text-text-muted">Fill in the details to publish a new assignment.</p>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1" onSubmit={handleCreate}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Assignment Title</label>
                    <input 
                      name="title"
                      required 
                      className="w-full bg-surface-elevated/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary" 
                      placeholder="e.g. Trigonometry Quiz" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Subject</label>
                    <select 
                      name="subject"
                      required 
                      className="w-full bg-surface-elevated/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary"
                    >
                      <option value="Math">Mathematics</option>
                      <option value="Science">Science</option>
                      <option value="English">English</option>
                      <option value="History">History</option>
                      <option value="Computer">Computer Science</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Class</label>
                    <select 
                      name="class"
                      required 
                      className="w-full bg-surface-elevated/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary"
                    >
                      <option value="FE-A">FE - A</option>
                      <option value="FE-B">FE - B</option>
                      <option value="SE-A">SE - A</option>
                      <option value="SE-B">SE - B</option>
                      <option value="TE-A">TE - A</option>
                      <option value="TE-B">TE - B</option>
                      <option value="BE-A">BE - A</option>
                      <option value="BE-B">BE - B</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Due Date</label>
                    <input 
                      type="date" 
                      name="dueDate"
                      required 
                      className="w-full bg-surface-elevated/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Max Marks</label>
                    <input 
                      type="number" 
                      name="maxMarks"
                      required 
                      className="w-full bg-surface-elevated/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary" 
                      placeholder="e.g. 50" 
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Description</label>
                    <textarea 
                      name="description"
                      rows={3} 
                      className="w-full bg-surface-elevated/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary" 
                      placeholder="Enter assignment instructions..." 
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Attachment (PDF)</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        className="hidden" 
                        id="assignment-file"
                      />
                      <label 
                        htmlFor="assignment-file"
                        className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all cursor-pointer bg-surface-elevated/30"
                      >
                        {selectedFile ? (
                          <>
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium text-text-primary">{selectedFile.name}</span>
                          </>
                        ) : (
                          <>
                            <Paperclip className="w-5 h-5 text-text-muted" />
                            <span className="text-sm text-text-muted">Click to upload PDF assignment</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedFile(null);
                    }}
                    className="px-6 py-3 rounded-xl hover:bg-surface-elevated text-sm font-bold transition-all text-text-primary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary px-8 py-3 flex items-center gap-2"
                  >
                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Publish Assignment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowDetailsModal(false);
                setSubmissionFile(null);
              }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-elevated rounded-3xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-display text-text-primary">{selectedAssignment.title}</h2>
                    <p className="text-sm text-text-muted">{selectedAssignment.subject} • Class {selectedAssignment.class}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSubmissionFile(null);
                  }}
                  className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-4 rounded-2xl bg-surface-elevated border border-border">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Due Date</p>
                    <p className="text-sm font-bold text-text-primary">{selectedAssignment.dueDate}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-elevated border border-border">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Max Marks</p>
                    <p className="text-sm font-bold text-text-primary">{selectedAssignment.maxMarks}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-elevated border border-border">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Status</p>
                    <span className={clsx(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-block mt-1",
                      (isTeacher ? selectedAssignment.status === 'Graded' : selectedAssignment.myStatus === 'Graded') ? "bg-success/10 text-success" : 
                      (isTeacher ? selectedAssignment.status === 'Submitted' : selectedAssignment.myStatus === 'Submitted') ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                    )}>
                      {isTeacher ? selectedAssignment.status : selectedAssignment.myStatus}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Instructions</h3>
                  <div className="p-6 rounded-2xl bg-surface-elevated/50 border border-border">
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                      {selectedAssignment.description || 'No instructions provided.'}
                    </p>
                  </div>
                </div>

                {selectedAssignment.fileUrl && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Reference Materials</h3>
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">{selectedAssignment.fileName}</p>
                          <p className="text-xs text-text-muted">PDF Document</p>
                        </div>
                      </div>
                      <a 
                        href={selectedAssignment.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-primary text-white hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 text-xs font-bold"
                      >
                        <Eye className="w-4 h-4" />
                        View PDF
                      </a>
                    </div>
                  </div>
                )}

                {/* Teacher View: List of submissions */}
                {isTeacher && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Submissions</h3>
                    <div className="space-y-3">
                      {submissions
                        .filter(s => s.assignmentId === selectedAssignment.id)
                        .map(submission => {
                          const student = students.find(std => std.uid === submission.studentId);
                          return (
                            <div key={submission.id} className="p-4 rounded-2xl bg-surface-elevated border border-border flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                  <UserCheck className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-text-primary">{student?.displayName || student?.name || 'Unknown Student'}</p>
                                  <p className="text-[10px] text-text-muted uppercase tracking-wider">{submission.status}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {submission.fileUrl && (
                                  <a 
                                    href={submission.fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-all"
                                    title="View Work"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </a>
                                )}
                                <button 
                                  onClick={() => {
                                    setSelectedSubmission(submission);
                                    setShowGradeModal(true);
                                  }}
                                  className={clsx(
                                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    submission.status === 'Graded' ? "bg-success/10 text-success" : "btn-primary"
                                  )}
                                >
                                  {submission.status === 'Graded' ? `Grade: ${submission.score}` : 'Grade Now'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      {submissions.filter(s => s.assignmentId === selectedAssignment.id).length === 0 && (
                        <div className="text-center py-8 rounded-2xl border border-dashed border-border">
                          <Users className="w-8 h-8 text-text-muted mx-auto mb-2" />
                          <p className="text-sm text-text-muted">No submissions yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Student View: Evaluation or Submission zone */}
                {!isTeacher && (
                  <>
                    {selectedAssignment.myStatus === 'Graded' && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Evaluation</h3>
                        <div className="p-6 rounded-2xl bg-success/5 border border-success/10 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-text-secondary">Your Score</span>
                            <span className="text-xl font-bold font-mono text-success">{selectedAssignment.myScore} / {selectedAssignment.maxMarks}</span>
                          </div>
                          {selectedAssignment.myFeedback && (
                            <div className="pt-4 border-t border-success/10">
                              <p className="text-[10px] font-bold text-success uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Teacher Feedback
                              </p>
                              <p className="text-sm text-text-primary italic leading-relaxed">"{selectedAssignment.myFeedback}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedAssignment.myStatus === 'Submitted' && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Your Work</h3>
                        <div className="p-4 rounded-2xl bg-success/5 border border-success/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-success/10 text-success">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-text-primary">{selectedAssignment.mySubmittedFileName}</p>
                              <p className="text-xs text-text-muted">Submitted successfully</p>
                            </div>
                          </div>
                          <a 
                            href={selectedAssignment.mySubmittedFileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-success/10 text-success transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}

                    {selectedAssignment.myStatus === 'Pending' && (
                      <div className="space-y-4 pt-4 border-t border-border">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Your Submission</h3>
                        <div className="relative">
                          <input 
                            type="file" 
                            accept=".pdf"
                            onChange={(e) => setSubmissionFile(e.target.files[0])}
                            className="hidden" 
                            id="submission-file"
                          />
                          <label 
                            htmlFor="submission-file"
                            className="flex flex-col items-center justify-center gap-3 w-full p-8 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-all cursor-pointer bg-surface-elevated/30"
                          >
                            {submissionFile ? (
                              <>
                                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                  <FileText className="w-8 h-8" />
                                </div>
                                <span className="text-sm font-bold text-text-primary">{submissionFile.name}</span>
                                <span className="text-xs text-text-muted">Click to change file</span>
                              </>
                            ) : (
                              <>
                                <div className="p-3 rounded-xl bg-surface-elevated text-text-muted">
                                  <Paperclip className="w-8 h-8" />
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-bold text-text-primary">Click to upload your work</p>
                                  <p className="text-xs text-text-muted">PDF files only (Max 10MB)</p>
                                </div>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="p-8 border-t border-border flex justify-end gap-4 shrink-0">
                <button 
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSubmissionFile(null);
                  }}
                  className="px-8 py-3 rounded-xl hover:bg-surface-elevated text-sm font-bold transition-all text-text-primary"
                >
                  Close
                </button>
                {!isTeacher && selectedAssignment.myStatus === 'Pending' && (
                  <button 
                    onClick={handleSubmitAssignment}
                    disabled={isSubmitting || !submissionFile}
                    className="btn-primary px-8 py-3 flex items-center gap-2"
                  >
                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Submit Assignment
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grade Modal (Teacher Only) */}
      <AnimatePresence>
        {showGradeModal && selectedSubmission && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowGradeModal(false);
                setSelectedSubmission(null);
              }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-elevated rounded-3xl border border-border shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-display text-text-primary">Grade Submission</h2>
                  <p className="text-xs text-text-muted">
                    {students.find(s => s.uid === selectedSubmission.studentId)?.displayName || 'Student'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowGradeModal(false);
                    setSelectedSubmission(null);
                  }}
                  className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form className="p-6 space-y-6" onSubmit={handleGrade}>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-surface-elevated border border-border">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-text-muted uppercase">Max Marks</span>
                      <span className="text-sm font-bold text-text-primary">{selectedAssignment.maxMarks}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Score</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        name="score"
                        max={selectedAssignment.maxMarks}
                        min="0"
                        defaultValue={selectedSubmission.score || ''}
                        required 
                        className="w-full bg-surface-elevated/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary" 
                        placeholder="Enter score..." 
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">
                        / {selectedAssignment.maxMarks}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Feedback</label>
                    <textarea 
                      name="feedback"
                      rows={3} 
                      defaultValue={selectedSubmission.feedback || ''}
                      className="w-full bg-surface-elevated/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary" 
                      placeholder="Add feedback for the student..." 
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowGradeModal(false);
                      setSelectedSubmission(null);
                    }}
                    className="px-6 py-2.5 rounded-xl hover:bg-surface-elevated text-sm font-bold transition-all text-text-primary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary px-8 py-2.5 text-sm flex items-center gap-2"
                  >
                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Save Grade
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
