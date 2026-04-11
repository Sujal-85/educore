import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  MoreVertical,
  Download,
  BookOpen,
  Target,
  Zap,
  X,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';

import { GoogleGenerativeAI } from "@google/generative-ai";
import Markdown from 'react-markdown';

export default function StudyPlan() {
  const { students, theme, user, saveStudyPlan, studyPlans } = useAppStore();
  const [filterClass, setFilterClass] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingClassReport, setIsGeneratingClassReport] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [classReport, setClassReport] = useState(null);

  const isTeacher = user?.role?.toLowerCase() === 'teacher';

  const filteredStudents = students.filter(s => {
    const sClass = String(s.class || '');
    const matchesClass = filterClass === 'All' || sClass === filterClass;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUser = isTeacher || s.uid === user?.uid;
    return matchesClass && matchesSearch && matchesUser;
  });

  const handleGeneratePlan = async (student) => {
    setIsGenerating(true);
    setSelectedPlan(null);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        toast.error('Gemini API key is missing. Please check your environment configuration.');
        return;
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are an AI education assistant for FAMT Edu (Engineering College).
Create a personalized study plan for: ${student.name} (Class ${student.class}-${student.section})
Attendance: ${student.attendance}%, Behavior: ${student.behaviorScore}/100
Marks: ${JSON.stringify(student.marks)}

Create a detailed weekly study plan with:
1. Weak subjects identification
2. Time allocation based on scores
3. Revision sessions
4. Specific topics to focus on
5. Improvement tips

Use markdown formatting.`;

      const result = await model.generateContent(prompt);
      const planContent = result.response.text();
      
      await saveStudyPlan(student.id, {
        studentName: student.name,
        content: planContent
      });
      
      setSelectedPlan({ studentName: student.name, content: planContent });
      toast.success(`AI Study Plan for ${student.name} generated!`);
    } catch (error) {
      console.error("AI Plan Error:", error);
      toast.error("Failed to generate AI study plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateClassReport = async () => {
    setIsGeneratingClassReport(true);
    setClassReport(null);
    try {
      const classStudents = students.filter(s => {
        const sClass = String(s.class || '');
        return filterClass === 'All' || sClass === filterClass;
      });
      if (classStudents.length === 0) {
        toast.error(filterClass === 'All' ? 'No students found for the selected filter' : `No students found in Class ${filterClass}`);
        return;
      }

      const statsSummary = classStudents.map(s => ({
        name: s.name,
        attendance: s.attendance,
        marks: s.marks,
        behavior: s.behaviorScore
      }));

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        toast.error('Gemini API key is missing. Please check your environment configuration.');
        return;
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are an AI education assistant for FAMT Edu (Engineering College).
Analyze class performance for ${filterClass === 'All' ? 'All Classes' : `Class ${filterClass}`}.

Students Data:
${JSON.stringify(statsSummary, null, 2)}

Provide:
1. Overall class strengths and weaknesses
2. Subjects needing attention
3. Comparison across students
4. Recommendations for teachers
5. Action items for improvement

Use markdown formatting.`;

      const result = await model.generateContent(prompt);
      const reportText = result.response.text();

      setClassReport({ title: `${filterClass === 'All' ? 'All Classes' : `Class ${filterClass}`} Performance Analysis`, content: reportText });
      toast.success(`${filterClass === 'All' ? 'All classes' : `Class ${filterClass}`} report generated!`);
    } catch (error) {
      console.error("Class Report Error:", error);
      toast.error("Failed to generate class report.");
    } finally {
      setIsGeneratingClassReport(false);
    }
  };

  const viewPlan = (student) => {
    const plan = studyPlans.find(p => p.studentId === student.id);
    if (plan) {
      setSelectedPlan(plan);
    } else {
      toast.error("No study plan found for this student.");
    }
  };

  // Convert Markdown to HTML for PDF/DOC
  const markdownToHTML = (markdown) => {
    let html = markdown;

    // Headers: ### **text** -> <h3><strong>text</strong></h3>
    html = html.replace(/^### \*\*(.+?)\*\*$/gm, '<h3><strong>$1</strong></h3>');
    html = html.replace(/^## \*\*(.+?)\*\*$/gm, '<h2><strong>$1</strong></h2>');
    html = html.replace(/^# \*\*(.+?)\*\*$/gm, '<h1><strong>$1</strong></h1>');
    html = html.replace(/^### (.+?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+?)$/gm, '<h1>$1</h1>');

    // Bold: **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text* -> <em>text</em>
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Tables
    // Convert markdown tables to HTML tables
    const tableRegex = /\|(.+?)\|\n\|[-:\|\s]+\|\n((?:\|.+?\|\n?)+)/g;
    html = html.replace(tableRegex, (match, header, rows) => {
      const headers = header.split('|').map(h => h.trim()).filter(h => h);
      const headerHTML = headers.map(h => `<th>${h}</th>`).join('');

      const rowLines = rows.trim().split('\n');
      const rowsHTML = rowLines.map(row => {
        const cells = row.split('|').map(c => c.trim()).filter(c => c);
        return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
      }).join('');

      return `<table><thead><tr>${headerHTML}</tr></thead><tbody>${rowsHTML}</tbody></table>`;
    });

    // Lists
    // Unordered lists: - item or * item
    html = html.replace(/(?:^|\n)(?:[-*] (.+?)(?:\n|$))+/g, (match) => {
      const items = match.trim().split('\n').map(line => {
        const item = line.replace(/^[-*] /, '');
        return `<li>${item}</li>`;
      }).join('');
      return `<ul>${items}</ul>`;
    });

    // Ordered lists: 1. item
    html = html.replace(/(?:^|\n)(?:\d+\. (.+?)(?:\n|$))+/g, (match) => {
      const items = match.trim().split('\n').map(line => {
        const item = line.replace(/^\d+\. /, '');
        return `<li>${item}</li>`;
      }).join('');
      return `<ol>${items}</ol>`;
    });

    // Horizontal rules: ---
    html = html.replace(/\n---\n/g, '<hr>');

    // Line breaks and paragraphs
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<table') || p.startsWith('<hr')) {
        return p;
      }
      // Convert single newlines to <br>
      p = p.replace(/\n/g, '<br>');
      return `<p>${p}</p>`;
    }).join('\n');

    return html;
  };

  // Download as PDF (using print to PDF approach)
  const downloadAsPDF = (content, title) => {
    const htmlContent = markdownToHTML(content);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { margin: 40px; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; }
            h1 { color: #1a1a1a; border-bottom: 3px solid #4F8EF7; padding-bottom: 15px; margin-bottom: 30px; font-size: 28px; }
            h2 { color: #2a2a2a; margin-top: 30px; margin-bottom: 15px; font-size: 22px; border-left: 4px solid #4F8EF7; padding-left: 15px; }
            h3 { color: #3a3a3a; margin-top: 25px; margin-bottom: 12px; font-size: 18px; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #4F8EF7; color: white; font-weight: 600; }
            tr:nth-child(even) { background-color: #f8f9fa; }
            tr:hover { background-color: #f0f4ff; }
            ul, ol { margin: 16px 0; padding-left: 30px; }
            li { margin: 8px 0; line-height: 1.5; }
            strong { color: #1a1a1a; font-weight: 600; }
            em { color: #555; font-style: italic; }
            hr { border: none; border-top: 2px solid #e0e0e0; margin: 30px 0; }
            p { margin: 12px 0; text-align: justify; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${htmlContent}
          <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success('PDF download started');
  };

  // Download as DOC
  const downloadAsDOC = (content, title) => {
    const htmlContent = markdownToHTML(content);
    const fullHTML = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${title}</title>
          <style>
            body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
            h1 { color: #1a1a1a; font-size: 24pt; border-bottom: 2px solid #4472C4; padding-bottom: 10px; margin-bottom: 20px; }
            h2 { color: #2a2a2a; font-size: 18pt; margin-top: 20px; border-left: 4px solid #4472C4; padding-left: 10px; }
            h3 { color: #3a3a3a; font-size: 14pt; margin-top: 15px; }
            table { border-collapse: collapse; width: 100%; margin: 15px 0; }
            td, th { border: 1px solid #999; padding: 8px; }
            th { background-color: #4472C4; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f5f5f5; }
            ul, ol { margin: 15px 0; }
            li { margin: 5px 0; }
            strong { font-weight: bold; color: #1a1a1a; }
            em { font-style: italic; }
            p { margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${htmlContent}
        </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', fullHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('DOC download started');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">AI Study Planner</h1>
          <p className="text-text-secondary text-sm">Personalized learning paths and academic improvement strategies.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-xl glass hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all">
            <Download className="w-5 h-5" />
          </button>
          {isTeacher && (
            <button
              onClick={async () => {
                if (filteredStudents.length === 0) {
                  toast.error('No students found to generate plans for.');
                  return;
                }
                toast.loading(`Generating plans for ${filteredStudents.length} students...`, { duration: 3000 });
                let successCount = 0;
                for (const student of filteredStudents) {
                  try {
                    await handleGeneratePlan(student);
                    successCount++;
                  } catch (err) {
                    console.error(`Failed for ${student.name}:`, err);
                  }
                }
                toast.success(`Generated ${successCount}/${filteredStudents.length} study plans!`);
              }}
              disabled={isGenerating}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Bulk Generate Plans
            </button>
          )}
        </div>
      </div>

      {/* Class Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-8 rounded-[32px] border border-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 -mr-24 -mt-24 rounded-full bg-primary/5 blur-3xl transition-all group-hover:opacity-20" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">{filterClass === 'All' ? 'School Weak Areas' : `Class ${filterClass} Weak Areas`}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { subject: 'Mathematics', topic: 'Trigonometry', score: 62, status: 'Critical' },
                { subject: 'Science', topic: 'Organic Chemistry', score: 68, status: 'Warning' },
                { subject: 'English', topic: 'Grammar & Syntax', score: 74, status: 'Good' },
                { subject: 'History', topic: 'World War II', score: 82, status: 'Excellent' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-surface-elevated border border-border hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{item.subject}</span>
                    <span className={clsx(
                      "px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider",
                      item.status === 'Critical' ? "bg-danger/10 text-danger" : 
                      item.status === 'Warning' ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                    )}>{item.status}</span>
                  </div>
                  <h4 className="text-sm font-bold mb-3 text-text-primary">{item.topic}</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden border border-border">
                      <div 
                        className={clsx(
                          "h-full rounded-full transition-all duration-1000",
                          item.score < 65 ? "bg-danger" : item.score < 75 ? "bg-warning" : "bg-success"
                        )}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold font-mono text-text-muted">{item.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-[32px] border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">AI Insights</h3>
            </div>
            <div className="space-y-4">
              {[
                'Focus on Trigonometry practice for 10-A.',
                'Organize extra Science lab sessions.',
                'Peer-to-peer learning for English grammar.',
              ].map((insight, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
                  <Sparkles className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
          {isTeacher && (
            <button 
              onClick={handleGenerateClassReport}
              disabled={isGeneratingClassReport}
              className="btn-primary w-full py-3 mt-8 flex items-center justify-center gap-2"
            >
              {isGeneratingClassReport ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate Class Report
            </button>
          )}
        </div>
      </div>

      {/* Student List */}
      <div className="glass rounded-3xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-text-primary">Student-wise Study Plans</h3>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input 
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-elevated/50 border border-border rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-primary/50 transition-all text-text-primary"
              />
            </div>
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
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-elevated border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Weakest Subject</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Current GPA</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Plan Status</th>
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
                  <td className="px-6 py-4 text-text-primary">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        src={student.avatar} 
                        fallback={student.name.charAt(0)} 
                        size="xs"
                      />
                      <p className="text-sm font-bold group-hover:text-primary transition-colors">{student.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-primary">
                    <span className="text-sm font-semibold text-text-secondary">Mathematics</span>
                  </td>
                  <td className="px-6 py-4 text-text-primary">
                    <span className="text-sm font-bold font-mono text-text-primary">{student.gpa}</span>
                  </td>
                  <td className="px-6 py-4 text-text-primary">
                    <span className={clsx(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                      studyPlans.some(p => p.studentId === student.id) ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    )}>
                      {studyPlans.some(p => p.studentId === student.id) ? 'Active' : 'Missing'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {studyPlans.some(p => p.studentId === student.id) && (
                        <button 
                          onClick={() => viewPlan(student)}
                          className="p-2 rounded-lg hover:bg-primary/10 text-text-secondary hover:text-primary transition-all"
                          title="View Plan"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                      )}
                      {isTeacher && (
                        <button
                          onClick={() => handleGeneratePlan(student)}
                          disabled={isGenerating}
                          className="p-2 rounded-lg hover:bg-primary/10 text-text-secondary hover:text-primary transition-all disabled:opacity-50"
                          title="Generate Plan"
                        >
                          {isGenerating && selectedPlan?.studentName === student.name ? (
                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Plan Modal/Display */}
      <AnimatePresence>
        {(selectedPlan || classReport) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedPlan(null);
                setClassReport(null);
              }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-elevated rounded-3xl border border-border shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-text-primary">
                      {classReport ? classReport.title : `AI Study Plan: ${selectedPlan.studentName}`}
                    </h2>
                    <p className="text-xs text-text-muted">
                      {classReport ? 'Comprehensive class performance analysis' : 'Personalized academic strategy generated by FAMT AI'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedPlan(null);
                    setClassReport(null);
                  }}
                  className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className={clsx(
                  "prose prose-sm max-w-none text-text-secondary leading-relaxed",
                  theme !== 'light' && "prose-invert"
                )}>
                  <Markdown
                    components={{
                      table: ({ children }) => (
                        <table className="w-full border-collapse border border-border my-4 rounded-lg overflow-hidden">
                          {children}
                        </table>
                      ),
                      thead: ({ children }) => <thead className="bg-primary/10">{children}</thead>,
                      tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
                      tr: ({ children }) => <tr className="border-b border-border hover:bg-surface-elevated/50">{children}</tr>,
                      th: ({ children }) => (
                        <th className="border border-border px-4 py-3 text-left text-xs font-bold text-text-primary bg-primary/5">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-border px-4 py-3 text-sm text-text-secondary">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {classReport ? classReport.content : selectedPlan.content}
                  </Markdown>
                </div>
              </div>
              <div className="p-6 border-t border-border flex justify-between shrink-0">
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadAsPDF(
                      classReport ? classReport.content : selectedPlan.content,
                      classReport ? classReport.title : `Study_Plan_${selectedPlan.studentName}`
                    )}
                    className="px-4 py-2 rounded-xl bg-surface-elevated border border-border text-text-secondary hover:text-primary hover:border-primary/50 transition-all flex items-center gap-2 text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => downloadAsDOC(
                      classReport ? classReport.content : selectedPlan.content,
                      classReport ? classReport.title : `Study_Plan_${selectedPlan.studentName}`
                    )}
                    className="px-4 py-2 rounded-xl bg-surface-elevated border border-border text-text-secondary hover:text-secondary hover:border-secondary/50 transition-all flex items-center gap-2 text-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Download DOC
                  </button>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    setClassReport(null);
                  }}
                  className="btn-primary px-8 py-2.5 text-sm"
                >
                  Close {classReport ? 'Report' : 'Plan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
