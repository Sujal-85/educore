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
import Markdown from '../components/ui/Markdown';


import { sendEmailDraft, EMAIL_TEMPLATE_KEYS } from '../lib/emailTemplates';
import { calculateTotalMarks } from '../lib/utils';


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
    mobile: '',
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
      mobile: '',
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
      mobile: student.mobile || student.contact || student.parentPhone || '',
      rollNo: student.rollNo || student.studentId || '',
      marks: student.marks || defaultMarks
    });
    setIsAdding(true);
  };

  const filteredStudents = students.filter(s => {
    // Double-check role and email to prevent teacher/self from appearing
    const role = (s.role || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    const isTeacherEmail = email === 'khedekarsujay720@gmail.com' || 
                           email === 'teacher@educore.edu' || 
                           email.endsWith('@famt.ac.in');
    
    if (role !== 'student' || isTeacherEmail) return false;

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
      {/* Student Table */}
      <div className="glass rounded-[32px] border border-border overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-elevated/50">
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">Class</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">Attendance</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">Marks</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.map((student) => (
                <motion.tr 
                  key={student.id}
                  layout
                  className="hover:bg-surface-elevated/30 transition-colors group"
                >
                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <Avatar src={student.avatar} fallback={student.name?.charAt(0) || 'S'} size="sm" />
                      <div>
                        <p className="font-bold text-text-primary text-sm line-clamp-1">{student.name}</p>
                        <p className="text-[10px] text-text-muted font-mono">{student.studentId || student.rollNo || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      {student.class}-{student.section}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1 min-w-[100px]">
                      <span className={clsx("text-xs font-bold font-mono", student.attendance > 85 ? "text-success" : "text-warning")}>
                        {student.attendance}%
                      </span>
                      <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                        <div 
                          className={clsx(
                            "h-full transition-all duration-1000",
                            student.attendance >= 90 ? "bg-green-500" :
                            student.attendance >= 75 ? "bg-yellow-500" : "bg-red-500"
                          )}
                          style={{ width: `${student.attendance}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold font-mono text-text-primary">
                        {calculateTotalMarks(student.marks)}
                      </span>
                      <span className="text-[10px] text-text-muted uppercase tracking-widest">Total</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <button 
                        onClick={() => handleAnalyzeBehavior(student)}
                        disabled={analyzingId === student.id}
                        className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-all disabled:opacity-50"
                        title="AI Analysis"
                      >
                        <Sparkles className={clsx("w-4 h-4", analyzingId === student.id && "animate-spin")} />
                      </button>
                      <button 
                        onClick={() => handleSendReport(student)}
                        className="p-2 rounded-lg hover:bg-secondary/10 text-secondary transition-all"
                        title="Notify Parents"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(student)}
                        className="p-2 rounded-lg hover:bg-blue-500/10 text-text-muted hover:text-blue-500 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteStudent(student.id)}
                        className="p-2 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Analysis Result (Table Extension) */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border bg-primary/5 p-6 relative"
            >
              <button 
                onClick={() => setAnalysisResult(null)}
                className="absolute top-4 right-4 p-1.5 hover:bg-primary/10 rounded-full transition-all"
              >
                <Plus className="w-5 h-5 rotate-45 text-primary" />
              </button>
              <div className="flex items-center gap-3 mb-4 text-primary">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-widest">AI Performance Insights: {students.find(s => s.id === analysisResult.id)?.name}</span>
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <Markdown>{analysisResult.text}</Markdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Mobile Number</label>
                      <input 
                        required
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-hidden transition-all text-text-primary"
                        placeholder="e.g. 9876543210"
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
