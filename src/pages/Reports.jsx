import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Search, 
  ChevronRight, 
  Calendar, 
  Users, 
  Target, 
  CreditCard,
  PieChart as PieChartIcon,
  TrendingUp,
  Sparkles,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Markdown from 'react-markdown';

const reportTypes = [
  { id: 'progress', title: 'Student Progress Report', desc: 'Detailed academic performance for individual students.', icon: FileText, color: 'bg-primary' },
  { id: 'class', title: 'Class Performance Report', desc: 'Compare subject-wise performance across classes.', icon: BarChart3, color: 'bg-secondary' },
  { id: 'attendance', title: 'Attendance Summary', desc: 'Monthly and yearly attendance trends and alerts.', icon: Calendar, color: 'bg-success' },
  { id: 'fee', title: 'Fee Collection Report', desc: 'Financial summary of collections, dues, and overdue.', icon: CreditCard, color: 'bg-warning' },
  { id: 'behavior', title: 'Behavior Analysis', desc: 'Discipline scores and behavior event tracking.', icon: Target, color: 'bg-danger' },
];

import { downloadCSV } from '../lib/utils';

export default function Reports() {
  const { students, user } = useAppStore();
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterClass, setFilterClass] = useState('10');

  const isTeacher = user?.role?.toLowerCase() === 'teacher';

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);

  const generateAIInsight = async (reportId, title) => {
    setIsGeneratingAI(true);
    setAiInsight(null);
    try {
      let filteredStudents;
      if (isTeacher) {
        filteredStudents = filterClass === 'All' 
          ? students 
          : students.filter(s => s.class === filterClass);
      } else {
        filteredStudents = students.filter(s => s.uid === user?.uid);
      }

      const statsSummary = filteredStudents.map(s => ({
        name: s.name,
        attendance: s.attendance,
        marks: s.marks,
        behavior: s.behaviorScore
      }));

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `As FAMTBot, provide a high-level AI analysis for the "${title}" of Class ${filterClass}.
        Data Summary: ${JSON.stringify(statsSummary.slice(0, 10))}
        
        Identify:
        1. Overall class performance trends.
        2. Top 3 performing areas.
        3. 2 areas that need immediate attention.
        4. A strategic recommendation for the teachers.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setAiInsight({ title, content: text });
      toast.success(`AI Analysis for ${title} generated!`);
    } catch (error) {
      console.error("AI Report Error:", error);
      toast.error("Failed to generate AI analysis.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generatePDF = (reportType, title) => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    
    // Add Logo/Header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('FAMT Edu - Academic Report', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Report Type: ${title}`, 14, 32);
    doc.text(`Generated on: ${timestamp}`, 14, 40);
    doc.text(`Class: ${filterClass === 'All' ? 'All Classes' : `Class ${filterClass}`}`, 14, 48);

    let tableData = [];
    let tableHeaders = [];

    let filteredStudents;
    if (isTeacher) {
      filteredStudents = filterClass === 'All' 
        ? students 
        : students.filter(s => s.class === filterClass);
    } else {
      filteredStudents = students.filter(s => s.uid === user?.uid);
    }

    if (reportType === 'progress' || reportType === 'class') {
      tableHeaders = [['Student Name', 'ID', 'Math', 'Science', 'English', 'Attendance']];
      tableData = filteredStudents.map(s => [
        s.name,
        s.studentId || 'N/A',
        s.marks?.math || 0,
        s.marks?.science || 0,
        s.marks?.english || 0,
        `${s.attendance || 0}%`
      ]);
    } else if (reportType === 'attendance') {
      tableHeaders = [['Student Name', 'ID', 'Attendance %', 'Status']];
      tableData = filteredStudents.map(s => [
        s.name,
        s.studentId || 'N/A',
        `${s.attendance || 0}%`,
        (s.attendance || 0) > 75 ? 'Good' : 'Low'
      ]);
    } else if (reportType === 'fee') {
      tableHeaders = [['Student Name', 'ID', 'Fee Status', 'Last Payment']];
      tableData = filteredStudents.map(s => [
        s.name,
        s.studentId || 'N/A',
        s.feeStatus || 'Pending',
        s.lastPaymentDate || 'N/A'
      ]);
    } else if (reportType === 'behavior') {
      tableHeaders = [['Student Name', 'ID', 'Behavior Score', 'Status']];
      tableData = filteredStudents.map(s => [
        s.name,
        s.studentId || 'N/A',
        s.behaviorScore || 100,
        (s.behaviorScore || 100) > 80 ? 'Excellent' : 'Needs Improvement'
      ]);
    }

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 60,
      theme: 'grid',
      headStyles: { fillStyle: [79, 142, 247] },
      styles: { fontSize: 9 }
    });

    doc.save(`FAMT_Edu_${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
  };

  const handleGenerate = (reportId, title) => {
    if (students.length === 0) {
      toast.error('No student data available to generate report');
      return;
    }

    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          generatePDF(reportId, title);
          resolve();
        }, 1500);
      }),
      {
        loading: `Generating ${title}...`,
        success: `${title} downloaded successfully!`,
        error: 'Failed to generate report.',
      }
    );
  };

  const handleDownload = () => {
    const data = reportTypes.map(r => ({
      Title: r.title,
      Description: r.desc,
      Type: r.id
    }));
    downloadCSV(data, 'FAMT_Edu_Report_Types');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setSelectedReport(null);
    setFilterClass('10');
    toast.success('Filters reset');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">Academic Reports</h1>
          <p className="text-text-secondary text-sm">Generate and export comprehensive school data reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownload}
            className="p-2.5 rounded-xl glass hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={handlePrint}
            className="p-2.5 rounded-xl glass hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => (
          <motion.div 
            key={report.id}
            whileHover={{ y: -5 }}
            onClick={() => setSelectedReport(report.id)}
            className={clsx(
              "glass p-8 rounded-[32px] border border-border card-hover cursor-pointer relative overflow-hidden group",
              selectedReport === report.id ? "border-primary/50 shadow-[0_0_30px_rgba(79,142,247,0.1)]" : ""
            )}
          >
            <div className={clsx("absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full opacity-5 blur-3xl transition-all group-hover:opacity-10", report.color)} />
            <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", report.color.replace('bg-', 'bg-opacity-10 text-'))}>
              <report.icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors text-text-primary">{report.title}</h3>
            <p className="text-sm text-text-muted mb-8 leading-relaxed">{report.desc}</p>
            
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerate(report.id, report.title);
                  }}
                  className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                >
                  Generate Now
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    generateAIInsight(report.id, report.title);
                  }}
                  disabled={isGeneratingAI}
                  className="p-2 rounded-lg hover:bg-primary/10 text-text-secondary hover:text-primary transition-all disabled:opacity-50"
                  title="AI Analysis"
                >
                  {isGeneratingAI && aiInsight?.title === report.title ? (
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex -space-x-2">
                {[1, 2].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-surface bg-surface-elevated flex items-center justify-center text-[8px] font-bold text-text-muted">
                    PDF
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Report Configuration */}
      {selectedReport && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-[32px] border border-border relative overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row gap-12 relative z-10">
            <div className="flex-1 space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-2 text-text-primary">Configure Report Parameters</h3>
                <p className="text-sm text-text-muted">Customize the data inclusion for your report.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Select Class</label>
                  <select 
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="w-full bg-surface-elevated/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary"
                  >
                    <option value="FE">FE - First Year</option>
                    <option value="SE">SE - Second Year</option>
                    <option value="TE">TE - Third Year</option>
                    <option value="BE">BE - Final Year</option>
                    <option value="All">All Classes</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Date Range</label>
                  <select className="w-full bg-surface-elevated/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary">
                    <option>Current Semester</option>
                    <option>Last 3 Months</option>
                    <option>Academic Year 2025-26</option>
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-4">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Include Data Sections</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {['Marks Table', 'Attendance Chart', 'Behavior Timeline', 'GPA Trend', 'Teacher Feedback', 'Parent Comments'].map(section => (
                      <label key={section} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border hover:border-primary/30 cursor-pointer transition-all group">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border bg-surface-elevated text-primary focus:ring-primary/20" />
                        <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary">{section}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  onClick={() => handleGenerate(selectedReport, reportTypes.find(r => r.id === selectedReport).title)}
                  className="btn-primary px-8 py-3 flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Generate Preview
                </button>
                <button 
                  onClick={handleReset}
                  className="px-8 py-3 rounded-xl glass hover:bg-surface-elevated text-sm font-bold transition-all text-text-primary"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            <div className="w-full lg:w-80 space-y-6">
              <div className="glass-elevated p-6 rounded-3xl border border-border">
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-text-primary">
                  <PieChartIcon className="w-4 h-4 text-primary" />
                  Recent Reports
                </h4>
                <div className="space-y-4">
                  {[
                    { title: 'FE Mid-Term Exam', date: '2 days ago' },
                    { title: 'SE Attendance Summary', date: '1 week ago' },
                    { title: 'TE Fee Collection', date: '2 weeks ago' },
                  ].map((report, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-pointer">
                      <div>
                        <p className="text-xs font-bold group-hover:text-primary transition-colors text-text-primary">{report.title}</p>
                        <p className="text-[10px] text-text-muted">{report.date}</p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {/* AI Insight Modal */}
      <AnimatePresence>
        {aiInsight && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAiInsight(null)}
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
                    <h2 className="text-xl font-bold font-display text-text-primary">AI Analysis: {aiInsight.title}</h2>
                    <p className="text-xs text-text-muted">Strategic intelligence report generated by FAMT AI</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAiInsight(null)}
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
                  <Markdown>{aiInsight.content}</Markdown>
                </div>
              </div>
              <div className="p-6 border-t border-border flex justify-end shrink-0">
                <button 
                  onClick={() => setAiInsight(null)}
                  className="btn-primary px-8 py-2.5 text-sm"
                >
                  Close Analysis
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
