import React, { useState } from 'react';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Download, 
  Save, 
  BarChart3, 
  Send,
  MoreVertical,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';

import { downloadCSV } from '../lib/utils';

export default function Marks() {
  const { students, updateStudentMarks, user, seedDemoData } = useAppStore();
  const navigate = useNavigate();
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [examType, setExamType] = useState('Unit Test 2');
  const [searchQuery, setSearchQuery] = useState('');
  const [localMarks, setLocalMarks] = useState({});
  const [isSeeding, setIsSeeding] = useState(false);

  const isTeacher = user?.role?.toLowerCase() === 'teacher';

  const handleSeed = async () => {
    setIsSeeding(true);
    await seedDemoData();
    setIsSeeding(false);
  };

  const resetFilters = () => {
    setFilterClass('All');
    setFilterSection('All');
    setSearchQuery('');
    setSubjectFilter('All');
  };

  const filteredStudents = students.filter(s => {
    const sClass = String(s.class || '');
    const sSection = String(s.section || '');
    const matchesClass = filterClass === 'All' || sClass === filterClass;
    const matchesSection = filterSection === 'All' || sSection === filterSection;
    const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (s.rollNo || '').toString().includes(searchQuery);
    // For teachers: show all students (no user filter)
    // For students: show only their own data
    const matchesUser = isTeacher ? true : s.uid === user?.uid;
    return matchesClass && matchesSection && matchesSearch && matchesUser;
  });

  // Debug: log student count for teachers
  if (isTeacher) {
    console.log(`Total students: ${students.length}, Filtered: ${filteredStudents.length}`);
  }

  const [sortBy, setSortBy] = useState('total');
  const [sortOrder, setSortOrder] = useState('desc');
  const [subjectFilter, setSubjectFilter] = useState('All');

  const subjects = ['mathematics', 'physics', 'chemistry', 'basic_electrical', 'programming'];

  const subjectLabels = {
    mathematics: 'Mathematics',
    physics: 'Physics',
    chemistry: 'Chemistry',
    basic_electrical: 'Basic Electrical',
    programming: 'Programming'
  };

  // Map old subject names to new ones for backward compatibility
  const subjectMapping = {
    'math': 'mathematics',
    'science': 'physics',
    'english': 'chemistry',
    'history': 'basic_electrical',
    'computer': 'programming'
  };

  // Map old exam types to new ones for backward compatibility
  const examTypeMapping = {
    'Unit Test': 'Unit Test 1',
    'Mid-Term': 'Unit Test 2',
    'Final': 'Final'
  };

  // Helper function to get marks with backward compatibility
  const getMarksWithFallback = (marks) => {
    const result = {};
    subjects.forEach(subject => {
      result[subject] = marks[subject] || marks[Object.keys(subjectMapping).find(key => subjectMapping[key] === subject)] || 0;
    });
    return result;
  };

  // Helper function to get exam marks with backward compatibility
  const getExamMarks = (student) => {
    // Try current exam type first
    let marks = student.marks?.[examType];
    // If not found, try old exam type mapping
    if (!marks) {
      const oldExamType = Object.keys(examTypeMapping).find(key => examTypeMapping[key] === examType);
      if (oldExamType) {
        marks = student.marks?.[oldExamType];
      }
    }
    return marks || {};
  };

  // Exam configuration with max marks and passing marks
  const getExamConfig = (type) => {
    switch (type) {
      case 'Unit Test 1':
      case 'Unit Test 2':
        return { maxMarks: 20, passingMarks: 8 };
      case 'Final':
        return { maxMarks: 80, passingMarks: 32 };
      default:
        return { maxMarks: 20, passingMarks: 8 };
    }
  };

  const examConfig = getExamConfig(examType);

  const calculateAverage = (marks) => calculateTotal(marks) / subjects.length;

  const calculateTotal = (marks) => {
    const normalizedMarks = getMarksWithFallback(marks);
    return subjects.reduce((acc, sub) => acc + (normalizedMarks[sub] || 0), 0);
  };

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const marksA = getMarksWithFallback(localMarks[a.id] || getExamMarks(a));
    const marksB = getMarksWithFallback(localMarks[b.id] || getExamMarks(b));
    
    let valA, valB;
    if (sortBy === 'total') {
      valA = calculateTotal(marksA);
      valB = calculateTotal(marksB);
    } else {
      valA = marksA[sortBy] || 0;
      valB = marksB[sortBy] || 0;
    }
    
    return sortOrder === 'desc' ? valB - valA : valA - valB;
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleMarkChange = (studentId, subject, value) => {
    const student = filteredStudents.find(s => s.id === studentId);
    const existingMarks = getMarksWithFallback(getExamMarks(student));
    setLocalMarks(prev => ({
      ...prev,
      [studentId]: {
        ...existingMarks,
        [subject]: parseInt(value) || 0
      }
    }));
  };

  const handleSave = async () => {
    const promises = Object.entries(localMarks).map(([id, marks]) => 
      updateStudentMarks(id, marks, examType)
    );
    
    if (promises.length === 0) {
      toast.error('No changes to save');
      return;
    }

    try {
      await Promise.all(promises);
      toast.success('Marks updated successfully!');
      setLocalMarks({});
    } catch (error) {
      toast.error('Failed to update marks.');
    }
  };

  const calculateGrade = (total) => {
    // Calculate percentage based on exam max marks
    const maxTotal = examConfig.maxMarks * subjects.length;
    const percentage = (total / maxTotal) * 100;
    
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const handleDownload = () => {
    const data = sortedStudents.map(s => {
      const marks = getMarksWithFallback(localMarks[s.id] || getExamMarks(s));
      const total = calculateTotal(marks);
      return {
        Name: s.name,
        RollNo: s.rollNo,
        Class: s.class,
        Section: s.section,
        ...subjectLabels,
        ...marks,
        Total: total,
        Grade: calculateGrade(total)
      };
    });
    downloadCSV(data, `${examType.replace(/\s/g, '_')}_Marks.csv`);
  };

  const handleSendReports = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Sending reports to parents...',
        success: 'Reports sent successfully to all parents!',
        error: 'Failed to send reports.',
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Marks & Grades</h1>
          <p className="text-text-secondary text-sm">Enter and manage student academic results.</p>
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
              onClick={handleSave}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass p-4 rounded-2xl border border-border flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full text-text-primary">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text"
            placeholder="Search by name or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated/50 border border-border rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all text-text-primary"
          />
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all min-w-[120px] text-text-primary"
          >
            <option value="total">Sort by Total</option>
            {subjects.map(s => (
              <option key={s} value={s}>Sort by {subjectLabels[s]}</option>
            ))}
          </select>
          <select 
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all min-w-[100px] text-text-primary"
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
            className="bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all min-w-[100px] text-text-primary"
          >
            <option value="All">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
          <select 
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all min-w-[140px] text-text-primary"
          >
            <option value="Unit Test 1">Unit Test 1 (20 marks)</option>
            <option value="Unit Test 2">Unit Test 2 (20 marks)</option>
            <option value="Final">Final Exam (80 marks)</option>
          </select>
          <button 
            onClick={handleSendReports}
            className="px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Reports
          </button>
        </div>
      </div>

      {/* Marks Table */}
      <div className="glass rounded-3xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-elevated border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest sticky left-0 bg-surface z-10">Student</th>
                {subjects.map(sub => (
                  <th 
                    key={sub} 
                    onClick={() => handleSort(sub)}
                    className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-center cursor-pointer hover:text-primary transition-colors"
                  >
                    {subjectLabels[sub]} {sortBy === sub && (sortOrder === 'desc' ? '▼' : '▲')}
                  </th>
                ))}
                <th 
                  onClick={() => handleSort('total')}
                  className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-center cursor-pointer hover:text-primary transition-colors"
                >
                  Total {sortBy === 'total' && (sortOrder === 'desc' ? '▼' : '▲')}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedStudents.map((student) => {
                const currentMarks = getMarksWithFallback(localMarks[student.id] || getExamMarks(student));
                const total = calculateTotal(currentMarks);
                const grade = calculateGrade(total);
                return (
                  <motion.tr 
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-surface-elevated transition-colors group"
                  >
                    <td className="px-6 py-4 sticky left-0 bg-surface/80 backdrop-blur-md z-10">
                      <div className="flex items-center gap-3">
                        <Avatar 
                          src={student.avatar} 
                          fallback={student.name.charAt(0)} 
                          size="xs"
                        />
                        <div>
                          <p className="text-sm font-bold group-hover:text-primary transition-colors text-text-primary">{student.name}</p>
                          <p className="text-[10px] text-text-muted font-mono">#{student.rollNo}</p>
                        </div>
                      </div>
                    </td>
                    {subjects.map(subject => {
                      const score = currentMarks[subject] || 0;
                      return (
                        <td key={subject} className="px-6 py-4 text-center">
                          {isTeacher ? (
                            <input 
                              type="number"
                              value={score}
                              onChange={(e) => handleMarkChange(student.id, subject, e.target.value)}
                              className={clsx(
                                "w-16 bg-surface-elevated border border-border rounded-lg px-2 py-1.5 text-center text-sm font-mono focus:outline-none focus:border-primary/50 transition-all",
                                score < 35 ? "text-danger border-danger/50 bg-danger/5" : score < 60 ? "text-warning border-warning/50 bg-warning/5" : "text-success border-success/50 bg-success/5"
                              )}
                            />
                          ) : (
                            <span className={clsx(
                              "text-sm font-bold font-mono px-3 py-1 rounded-lg border",
                              score < 35 ? "text-danger border-danger/50 bg-danger/10" : score < 60 ? "text-warning border-warning/50 bg-warning/10" : "text-success border-success/50 bg-success/10"
                            )}>
                              {score}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold font-mono text-text-primary">{total}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        grade === 'A+' ? "bg-success/10 text-success" : 
                        grade === 'A' ? "bg-primary/10 text-primary" : 
                        grade === 'B' ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger"
                      )}>
                        {grade}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
              {sortedStudents.length === 0 && (
                <tr>
                  <td colSpan={subjects.length + 3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 rounded-2xl bg-surface-elevated text-text-muted">
                        <GraduationCap className="w-12 h-12 opacity-20" />
                      </div>
                      <p className="text-text-secondary font-medium">No students found for the selected criteria.</p>
                      {isTeacher && (
                        <div className="flex flex-col gap-3">
                          <button 
                            onClick={() => navigate('/teacher-portal')}
                            className="mt-4 btn-primary flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Student in Teacher Portal
                          </button>
                          <button 
                            onClick={handleSeed}
                            disabled={isSeeding}
                            className="px-6 py-2.5 rounded-xl border border-primary/50 text-primary text-sm font-bold hover:bg-primary/10 transition-all flex items-center gap-2 justify-center"
                          >
                            {isSeeding ? (
                              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Seed Demo Students
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-text-muted mt-2">Try changing the class or search query.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
