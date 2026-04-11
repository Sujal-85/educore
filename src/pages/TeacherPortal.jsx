import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Mail, 
  FileText, 
  Trash2, 
  Edit2, 
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';
import Markdown from 'react-markdown';
import { sendEmailDraft, EMAIL_TEMPLATE_KEYS } from '../lib/emailTemplates';

export default function TeacherPortal() {
  const { students, deleteStudent, updateStudent, addStudent, theme, seedDemoData } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [isAdding, setIsAdding] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    await seedDemoData();
    setIsSeeding(false);
  };

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    class: 'FE',
    section: 'A',
    attendance: 100,
    behaviorScore: 100,
    email: '',
    parentName: '',
    contact: '',
    rollNo: '',
    marks: {
      'Unit Test 1': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 },
      'Unit Test 2': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 },
      'Final': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 }
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      studentId: '',
      class: 'FE',
      section: 'A',
      attendance: 100,
      behaviorScore: 100,
      email: '',
      parentName: '',
      contact: '',
      rollNo: '',
      marks: {
        'Unit Test 1': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 },
        'Unit Test 2': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 },
        'Final': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 }
      }
    });
    setIsAdding(false);
    setEditingStudent(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalData = {
        ...formData,
        marks: {
          'Unit Test 1': formData.marks['Unit Test 1'],
          'Unit Test 2': formData.marks['Unit Test 2'],
          'Final': formData.marks['Final']
        }
      };

      if (editingStudent) {
        await updateStudent(editingStudent.id, finalData);
        toast.success('Student updated successfully');
      } else {
        await addStudent(finalData);
        toast.success('Student added successfully');
      }
      resetForm();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    const defaultMarks = {
      'Unit Test 1': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 },
      'Unit Test 2': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 },
      'Final': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 }
    };
    setFormData({
      name: student.name,
      studentId: student.studentId || '',
      class: student.class || 'FE',
      section: student.section || 'A',
      attendance: student.attendance || 100,
      behaviorScore: student.behaviorScore || 100,
      email: student.email || '',
      parentName: student.parentName || '',
      contact: student.contact || student.parentPhone || '',
      rollNo: student.rollNo || student.studentId || '',
      marks: student.marks || defaultMarks
    });
    setIsAdding(true);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (s.studentId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 'All' || String(s.class) === filterClass;
    const matchesSection = filterSection === 'All' || String(s.section) === filterSection;
    return matchesSearch && matchesClass && matchesSection;
  });

  const handleAnalyzeBehavior = async (student) => {
    setAnalyzingId(student.id);
    setAnalysisResult(null);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const prompt = `
        You are FAMTBot, the AI assistant for FAMT Edu.
        Analyze the behavior and academic performance of this student for the teacher:
        Name: ${student.name}
        Behavior Score: ${student.behaviorScore}
        Attendance: ${student.attendance}%
        Marks: ${JSON.stringify(student.marks)}
        
        Provide a concise analysis (max 100 words) and a professional recommendation for the teacher.
        Format with markdown.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setAnalysisResult({ id: student.id, text });
      toast.success(`Analysis complete for ${student.name}`);
    } catch (error) {
      console.error(error);
      toast.error('AI Analysis failed.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleSendReport = (student) => {
    try {
      sendEmailDraft({
        to: student.email,
        templateKey: EMAIL_TEMPLATE_KEYS.PERFORMANCE_REPORT,
        context: {
          studentName: student.name,
          attendance: student.attendance,
          grade: student.grade || 'N/A'
        }
      });
      toast.success(`Performance report draft opened for ${student.name}`);
    } catch (error) {
      toast.error('Student email is missing. Please add student email first.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">Teacher Portal</h1>
          <p className="text-text-secondary text-sm">Manage students, analyze performance, and generate reports.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass p-4 rounded-2xl border border-border">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-xl pl-12 pr-4 py-2 text-sm focus:border-primary outline-hidden transition-all text-text-primary"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-text-muted hidden sm:block" />
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-surface-elevated border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:border-primary outline-hidden transition-all flex-1 md:flex-none min-w-[100px] sm:min-w-[120px] text-text-primary"
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
            className="bg-surface-elevated border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:border-primary outline-hidden transition-all flex-1 md:flex-none min-w-[100px] sm:min-w-[120px] text-text-primary"
          >
            <option value="All">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
        </div>
      </div>

      {/* Student List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredStudents.map((student) => (
          <motion.div 
            key={student.id}
            layout
            className="glass p-6 rounded-[32px] border border-border hover:border-primary/20 transition-all group"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Profile Info */}
              <div className="flex items-center gap-4 min-w-[240px]">
                <Avatar 
                  src={student.avatar} 
                  fallback={student.name.charAt(0)} 
                  size="lg" 
                />
                <div>
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors text-text-primary">{student.name}</h3>
                  <p className="text-sm text-text-muted">ID: {student.studentId || 'N/A'}</p>
                  <p className="text-xs font-bold text-primary mt-1 uppercase tracking-widest">Class {student.class}-{student.section}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-2xl bg-surface-elevated border border-border">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Attendance</p>
                  <div className="flex items-center gap-2">
                    <span className={clsx("text-lg font-bold font-mono", student.attendance > 85 ? "text-success" : "text-warning")}>
                      {student.attendance}%
                    </span>
                    {student.attendance > 90 ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-warning" />}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-surface-elevated border border-border">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Behavior</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-primary">{student.behaviorScore}</span>
                    <AlertCircle className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-surface-elevated border border-border">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Grade</p>
                  <span className="text-lg font-bold font-mono text-secondary">{student.grade || 'A'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-surface-elevated border border-border">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Marks</p>
                  <span className="text-lg font-bold font-mono text-text-primary">
                    {Object.values(student.marks || {}).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 lg:flex-col lg:justify-center">
                <button 
                  onClick={() => handleAnalyzeBehavior(student)}
                  disabled={analyzingId === student.id}
                  className="flex-1 lg:w-full p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-2 text-xs font-bold disabled:opacity-50"
                >
                  {analyzingId === student.id ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  AI Analyze
                </button>
                <button 
                  onClick={() => handleSendReport(student)}
                  className="flex-1 lg:w-full p-2.5 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <Mail className="w-4 h-4" />
                  Notify Parents
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(student)}
                    className="p-2.5 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteStudent(student.id)}
                    className="p-2.5 rounded-xl hover:bg-danger/10 text-text-muted hover:text-danger transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* AI Analysis Result */}
            <AnimatePresence>
              {analysisResult?.id === student.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-6 pt-6 border-t border-border"
                >
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">AI Behavior Analysis</span>
                    </div>
                    <div className={clsx(
                      "text-sm text-text-secondary leading-relaxed prose prose-sm max-w-none",
                      theme !== 'light' && "prose-invert"
                    )}>
                      <Markdown>{analysisResult.text}</Markdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {students.length === 0 ? (
        <div className="text-center py-20 glass rounded-[32px] border border-border">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-text-secondary">No students in system</h3>
          <p className="text-sm text-text-muted mb-6">Get started by adding a student or seeding demo data.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setIsAdding(true)}
              className="btn-primary px-6 py-2.5 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Student
            </button>
            <button 
              onClick={handleSeed}
              disabled={isSeeding}
              className="px-6 py-2.5 rounded-xl border border-primary/50 text-primary text-sm font-bold hover:bg-primary/10 transition-all flex items-center gap-2"
            >
              {isSeeding ? (
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Seed Demo Data
            </button>
          </div>
        </div>
      ) : filteredStudents.length === 0 && (
        <div className="text-center py-20 glass rounded-[32px] border border-border">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-text-secondary">No students match filters</h3>
          <p className="text-sm text-text-muted">Try adjusting your search or filters to see more students.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-elevated rounded-[32px] border border-border overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-bold font-display tracking-tight text-text-primary">
                    {editingStudent ? 'Edit Student' : 'Add New Student'}
                  </h2>
                  <p className="text-text-secondary text-sm">Fill in the details below to {editingStudent ? 'update' : 'register'} a student.</p>
                </div>
                <button onClick={resetForm} className="p-2 rounded-xl hover:bg-surface-elevated transition-all text-text-primary">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Full Name</label>
                      <input 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-hidden transition-all text-text-primary"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Student ID</label>
                      <input 
                        required
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-hidden transition-all text-text-primary"
                        placeholder="e.g. STU123"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Class</label>
                      <select 
                        value={formData.class}
                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                        className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-hidden transition-all text-text-primary"
                      >
                        <option value="FE">FE - First Year</option>
                        <option value="SE">SE - Second Year</option>
                        <option value="TE">TE - Third Year</option>
                        <option value="BE">BE - Final Year</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Section</label>
                      <select 
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-hidden transition-all text-text-primary"
                      >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Email Address</label>
                      <input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-hidden transition-all text-text-primary"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Roll Number</label>
                      <input 
                        value={formData.rollNo}
                        onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                        className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-hidden transition-all text-text-primary"
                        placeholder="e.g. 01"
                      />
                    </div>
                  </div>

                  {/* Unit Test 1 Marks */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Unit Test 1 Marks (Max: 20)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {['mathematics', 'physics', 'chemistry', 'basic_electrical', 'programming'].map((subject) => (
                        <div key={`ut1-${subject}`} className="space-y-2">
                          <label className="text-[10px] font-bold text-text-muted uppercase tracking-tight">{subject.replace('_', ' ')}</label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={formData.marks['Unit Test 1']?.[subject] || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              marks: {
                                ...formData.marks,
                                'Unit Test 1': { ...formData.marks['Unit Test 1'], [subject]: parseInt(e.target.value) || 0 }
                              }
                            })}
                            className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm font-mono focus:border-primary outline-hidden transition-all text-text-primary text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Unit Test 2 Marks */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Unit Test 2 Marks (Max: 20)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {['mathematics', 'physics', 'chemistry', 'basic_electrical', 'programming'].map((subject) => (
                        <div key={`ut2-${subject}`} className="space-y-2">
                          <label className="text-[10px] font-bold text-text-muted uppercase tracking-tight">{subject.replace('_', ' ')}</label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={formData.marks['Unit Test 2']?.[subject] || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              marks: {
                                ...formData.marks,
                                'Unit Test 2': { ...formData.marks['Unit Test 2'], [subject]: parseInt(e.target.value) || 0 }
                              }
                            })}
                            className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm font-mono focus:border-primary outline-hidden transition-all text-text-primary text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Final Exam Marks */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Final Exam Marks (Max: 80)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {['mathematics', 'physics', 'chemistry', 'basic_electrical', 'programming'].map((subject) => (
                        <div key={`final-${subject}`} className="space-y-2">
                          <label className="text-[10px] font-bold text-text-muted uppercase tracking-tight">{subject.replace('_', ' ')}</label>
                          <input
                            type="number"
                            min="0"
                            max="80"
                            value={formData.marks['Final']?.[subject] || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              marks: {
                                ...formData.marks,
                                'Final': { ...formData.marks['Final'], [subject]: parseInt(e.target.value) || 0 }
                              }
                            })}
                            className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm font-mono focus:border-primary outline-hidden transition-all text-text-primary text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="btn-primary flex-1 py-3">
                      {editingStudent ? 'Update Student' : 'Add Student'}
                    </button>
                    <button 
                      type="button" 
                      onClick={resetForm}
                      className="flex-1 py-3 rounded-xl glass hover:bg-surface-elevated text-sm font-bold transition-all text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
