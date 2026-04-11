import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Mail,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import Markdown from 'react-markdown';

export default function Notices() {
  const { notices, students, createNotice, updateNotice, deleteNotice, user } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);

  const isTeacher = user?.role?.toLowerCase() === 'teacher';

  // Filter notices based on user role and notice target
  const userNotices = isTeacher 
    ? notices 
    : notices.filter(n => {
        // Teachers see all notices
        if (n.targetType === 'all') return true;
        // Students see notices targeted to their class
        if (n.targetType === 'class' && n.targetClasses?.includes(user?.class)) return true;
        // Students see notices targeted to their section
        if (n.targetType === 'section' && n.targetClasses?.includes(`${user?.class}-${user?.section}`)) return true;
        // Students see notices specifically targeted to them
        if (n.targetType === 'specific' && n.targetStudents?.includes(user?.uid)) return true;
        return false;
      });

  const filteredNotices = userNotices.filter(n =>
    n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNotice = async (formData) => {
    try {
      await createNotice(formData);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating notice:', error);
    }
  };

  const handleUpdateNotice = async (noticeId, updates) => {
    try {
      await updateNotice(noticeId, updates);
      setEditingNotice(null);
    } catch (error) {
      console.error('Error updating notice:', error);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        await deleteNotice(noticeId);
        if (selectedNotice?.id === noticeId) setSelectedNotice(null);
      } catch (error) {
        console.error('Error deleting notice:', error);
      }
    }
  };

  // Convert Markdown to HTML for PDF
  const markdownToHTML = (markdown) => {
    if (!markdown) return '';
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

    // Lists
    html = html.replace(/(?:^|\n)(?:[-*] (.+?)(?:\n|$))+/g, (match) => {
      const items = match.trim().split('\n').map(line => {
        const item = line.replace(/^[-*] /, '');
        return `<li>${item}</li>`;
      }).join('');
      return `<ul>${items}</ul>`;
    });

    // Ordered lists
    html = html.replace(/(?:^|\n)(?:\d+\. (.+?)(?:\n|$))+/g, (match) => {
      const items = match.trim().split('\n').map(line => {
        const item = line.replace(/^\d+\. /, '');
        return `<li>${item}</li>`;
      }).join('');
      return `<ol>${items}</ol>`;
    });

    // Paragraphs
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol')) return p;
      p = p.replace(/\n/g, '<br>');
      return `<p>${p}</p>`;
    }).join('\n');

    return html;
  };

  // Download as PDF
  const downloadAsPDF = (notice) => {
    const htmlContent = markdownToHTML(notice.message);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${notice.title}</title>
          <style>
            @page { margin: 20mm; }
            body { font-family: 'Times New Roman', Georgia, serif; line-height: 1.6; color: #333; max-width: 210mm; margin: 0 auto; font-size: 12pt; }
            .letterhead { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
            .header-flex { display: flex; align-items: flex-start; gap: 20px; }
            .logo { width: 80px; height: 80px; flex-shrink: 0; }
            .logo img { width: 100%; height: 100%; object-fit: contain; }
            .header-text { flex: 1; text-align: center; }
            .header-text p { margin: 2px 0; }
            .org-name { font-size: 14pt; font-weight: bold; color: #1f2937; line-height: 1.3; }
            .naac { color: #2563eb; font-weight: 600; font-size: 11pt; }
            .affiliation { font-size: 9pt; color: #4b5563; line-height: 1.2; }
            .established { font-size: 9pt; color: #4b5563; }
            .circular-info { text-align: right; margin: 20px 0; font-size: 11pt; }
            .circular-info p { margin: 3px 0; }
            .circular-title { text-align: center; margin: 25px 0; }
            .circular-title h2 { font-size: 16pt; font-weight: bold; text-decoration: underline; text-underline-offset: 4px; color: #1f2937; margin: 0; }
            .content { text-align: justify; line-height: 1.8; margin: 20px 0; }
            .content p { margin: 12px 0; text-indent: 40px; }
            .signature { margin-top: 40px; display: flex; justify-content: flex-end; }
            .signature-box { text-align: center; }
            .signature-line { width: 120px; height: 40px; border-bottom: 1px solid #9ca3af; margin-bottom: 5px; }
            .signature-box p { margin: 0; font-weight: bold; }
            .copy-section { margin-top: 30px; padding-top: 15px; border-top: 1px solid #d1d5db; }
            .copy-section p { margin: 5px 0; font-size: 10pt; }
            .copy-label { font-weight: bold; }
            .footer-address { margin-top: 20px; padding-top: 10px; border-top: 1px solid #d1d5db; text-align: center; font-size: 9pt; color: #6b7280; }
            ul, ol { margin: 16px 0; padding-left: 40px; }
            li { margin: 6px 0; }
            strong { font-weight: bold; }
            em { font-style: italic; }
          </style>
        </head>
        <body>
          <!-- Letterhead -->
          <div class="letterhead">
            <div class="header-flex">
              <div class="logo">
                <img src="https://famt.ac.in/tnp/wp-content/uploads/2021/09/cropped-new-logo.png" alt="FAMT Logo" />
              </div>
              <div class="header-text">
                <p style="font-size: 10pt; color: #4b5563; margin-bottom: 4px;">Hope Foundation's</p>
                <p class="org-name">FINOLEX ACADEMY OF MANAGEMENT AND TECHNOLOGY</p>
                <p class="naac">Accredited by NAAC</p>
                <p class="affiliation">Approved by AICTE, New Delhi | Recognized by DTE, Govt. of Maharashtra | Affiliated to University of Mumbai</p>
                <p class="established">(Established in 1996)</p>
              </div>
            </div>
          </div>

          <!-- Circular Info -->
          <div class="circular-info">
            <p style="font-weight: bold;">FAMT/CIRC/${notice.id?.slice(0, 3) || '000'}/${new Date(notice.createdAt).getFullYear()}</p>
            <p>DT ${new Date(notice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')}</p>
          </div>

          <!-- Circular Title -->
          <div class="circular-title">
            <h2>${notice.title.toUpperCase()}</h2>
          </div>

          <!-- Content -->
          <div class="content">
            ${htmlContent}
          </div>

          <!-- Signature -->
          <div class="signature">
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>Principal</p>
            </div>
          </div>

          <!-- Copy Distribution -->
          <div class="copy-section">
            <p class="copy-label">Copy :-</p>
            <p>VP / All Deans / All HoDs - Circulation among the faculty, staff & students / Registrar / SFC / Office / Library / C&M / Students Notice Board / Canteen & Mess / Hostel / Security / Afexco</p>
          </div>

          <!-- Footer Address -->
          <div class="footer-address">
            <p>P-60, P-60/1, MIDC, Mirjole Block, Ratnagiri - 415 639, Maharashtra, India</p>
          </div>

          <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success('PDF download started');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Notices & Circulars</h1>
          <p className="text-text-secondary text-sm">Manage and circulate important announcements to students and parents.</p>
        </div>
        <div className="flex items-center gap-3">
          {isTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Notice
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
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated/50 border border-border rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all text-text-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Total: {filteredNotices.length} notices</span>
        </div>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredNotices.map((notice) => (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-[24px] border border-border card-hover cursor-pointer"
            onClick={() => setSelectedNotice(notice)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary line-clamp-1">{notice.title}</h3>
                  <p className="text-xs text-text-muted">
                    {new Date(notice.createdAt).toLocaleDateString()} • {notice.createdByName || 'Admin'}
                  </p>
                </div>
              </div>
              {isTeacher && (
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingNotice(notice);
                    }}
                    className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-primary transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotice(notice.id);
                    }}
                    className="p-2 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm text-text-secondary line-clamp-3 mb-4">{notice.message}</p>

            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {notice.targetType === 'all' ? 'All Students' : notice.targetClasses?.join(', ')}
              </span>
              {notice.sendToParents && (
                <span className="flex items-center gap-1 text-secondary">
                  <Mail className="w-3.5 h-3.5" />
                  Parents notified
                </span>
              )}
            </div>
          </motion.div>
        ))}

        {filteredNotices.length === 0 && (
          <div className="col-span-2 p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-surface-elevated flex items-center justify-center mb-6">
              <Megaphone className="w-10 h-10 text-text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-text-primary">No notices yet</h3>
            <p className="text-text-secondary max-w-xs">
              {isTeacher ? 'Create your first notice to notify students and parents.' : 'No notices have been posted yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingNotice) && (
          <NoticeFormModal
            notice={editingNotice}
            students={students}
            onClose={() => {
              setShowCreateModal(false);
              setEditingNotice(null);
            }}
            onSubmit={editingNotice ?
              (data) => handleUpdateNotice(editingNotice.id, data) :
              handleCreateNotice
            }
          />
        )}
      </AnimatePresence>

      {/* View Notice Modal */}
      <AnimatePresence>
        {selectedNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotice(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[600px] bg-white rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header Actions */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button
                  onClick={() => downloadAsPDF(selectedNotice)}
                  className="p-2 rounded-xl bg-surface-elevated/80 backdrop-blur-sm border border-border text-text-muted hover:text-primary transition-all"
                  title="Download PDF"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="p-2 rounded-xl bg-surface-elevated/80 backdrop-blur-sm border border-border text-text-muted hover:text-text-primary transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Official Circular Content */}
              <div className="overflow-y-auto custom-scrollbar bg-white">
                {/* FAMT Letterhead */}
                <div className="p-8 pb-4 border-b-2 border-blue-600">
                  <div className="flex items-start gap-4">
                    {/* FAMT Logo */}
                    <div className="w-20 h-20 flex-shrink-0">
                      <img 
                        src="https://famt.ac.in/tnp/wp-content/uploads/2021/09/cropped-new-logo.png" 
                        alt="FAMT Logo" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-xs text-gray-600">Hope Foundation's</p>
                      <h1 className="text-lg font-bold text-gray-800 leading-tight">
                        FINOLEX ACADEMY OF MANAGEMENT AND TECHNOLOGY
                      </h1>
                      <p className="text-sm font-semibold text-blue-700">Accredited by NAAC</p>
                      <p className="text-[10px] text-gray-600 leading-tight">
                        Approved by AICTE, New Delhi | Recognized by DTE, Govt. of Maharashtra | Affiliated to University of Mumbai
                      </p>
                      <p className="text-[10px] text-gray-600">(Established in 1996)</p>
                    </div>
                  </div>
                </div>

                {/* Circular Info */}
                <div className="px-8 py-4">
                  <div className="flex justify-end text-sm text-gray-700">
                    <div className="text-right">
                      <p className="font-semibold">FAMT/CIRC/{selectedNotice.id?.slice(0, 3) || '000'}/{new Date(selectedNotice.createdAt).getFullYear()}</p>
                      <p>DT {new Date(selectedNotice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')}</p>
                    </div>
                  </div>

                  {/* CIRCULAR Title */}
                  <div className="text-center my-6">
                    <h2 className="text-xl font-bold text-gray-800 underline underline-offset-4">{selectedNotice.title.toUpperCase()}</h2>
                  </div>

                  {/* Message Content */}
                  <div className="text-gray-800 leading-relaxed text-justify">
                    <Markdown
                      components={{
                        p: ({ children }) => <p className="mb-4 text-gray-800">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                      }}
                    >
                      {selectedNotice.message}
                    </Markdown>
                  </div>

                  {/* Signature Area */}
                  <div className="mt-12 flex justify-end">
                    <div className="text-center">
                      <div className="w-32 h-16 border-b border-gray-400 mb-2"></div>
                      <p className="font-bold text-gray-800">Principal</p>
                    </div>
                  </div>

                  {/* Distribution List */}
                  <div className="mt-8 pt-4 border-t border-gray-300">
                    <p className="text-sm font-bold text-gray-700 mb-2">Copy :-</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      VP / All Deans / All HoDs - Circulation among the faculty, staff & students / Registrar / SFC / Office / Library / C&M / Students Notice Board / Canteen & Mess / Hostel / Security / Afexco
                    </p>
                  </div>

                  {/* Footer Address */}
                  <div className="mt-8 pt-4 border-t border-gray-300 text-center">
                    <p className="text-xs text-gray-600">
                      P-60, P-60/1, MIDC, Mirjole Block, Ratnagiri - 415 639, Maharashtra, India
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Notice Form Modal Component
function NoticeFormModal({ notice, students, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: notice?.title || '',
    message: notice?.message || '',
    targetType: notice?.targetType || 'all',
    targetClasses: notice?.targetClasses || [],
    targetStudents: notice?.targetStudents || [],
    sendToParents: notice?.sendToParents || false,
    priority: notice?.priority || 'normal'
  });

  const availableClasses = ['9', '10', '11', '12'];
  const availableSections = ['A', 'B', 'C'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  const toggleClass = (cls) => {
    setFormData(prev => ({
      ...prev,
      targetClasses: prev.targetClasses?.includes(cls)
        ? prev.targetClasses.filter(c => c !== cls)
        : [...(prev.targetClasses || []), cls]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl glass-elevated rounded-3xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Megaphone className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold font-display text-text-primary">
              {notice ? 'Edit Notice' : 'Create New Notice'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
              Notice Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter notice title..."
              className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-text-primary"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
              Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter notice message... (Markdown supported)"
              rows={6}
              className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-text-primary resize-none"
              required
            />
            <p className="text-xs text-text-muted mt-1">Markdown formatting supported</p>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
              Target Audience
            </label>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { id: 'all', label: 'All Students' },
                { id: 'class', label: 'Specific Classes' },
                { id: 'section', label: 'Specific Sections' },
                { id: 'specific', label: 'Specific Students' }
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, targetType: option.id, targetClasses: [], targetStudents: [] })}
                  className={clsx(
                    "px-3 py-2 rounded-xl text-xs font-bold transition-all",
                    formData.targetType === option.id
                      ? "bg-primary text-white"
                      : "bg-surface-elevated border border-border text-text-secondary hover:text-text-primary"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Class Selection */}
            {(formData.targetType === 'class' || formData.targetType === 'section') && (
              <div className="space-y-3">
                <p className="text-xs text-text-muted">Select Classes:</p>
                <div className="flex flex-wrap gap-2">
                  {availableClasses.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => toggleClass(cls)}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        formData.targetClasses?.includes(cls)
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-surface-elevated border border-border text-text-secondary hover:text-text-primary"
                      )}
                    >
                      Class {cls}
                    </button>
                  ))}
                </div>

                {formData.targetType === 'section' && formData.targetClasses?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-text-muted mb-2">Select Sections:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.targetClasses.map((cls) =>
                        availableSections.map((sec) => (
                          <button
                            key={`${cls}-${sec}`}
                            type="button"
                            onClick={() => toggleClass(`${cls}-${sec}`)}
                            className={clsx(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              formData.targetClasses?.includes(`${cls}-${sec}`)
                                ? "bg-secondary/20 text-secondary border border-secondary/30"
                                : "bg-surface-elevated border border-border text-text-secondary hover:text-text-primary"
                            )}
                          >
                            {cls}-{sec}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Specific Students */}
            {formData.targetType === 'specific' && (
              <div className="max-h-48 overflow-y-auto bg-surface-elevated rounded-xl p-3 border border-border">
                {students.map((student) => (
                  <label key={student.id} className="flex items-center gap-3 p-2 hover:bg-surface rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.targetStudents?.includes(student.id)}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          targetStudents: e.target.checked
                            ? [...(prev.targetStudents || []), student.id]
                            : (prev.targetStudents || []).filter(id => id !== student.id)
                        }));
                      }}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{student.name}</p>
                      <p className="text-xs text-text-muted">Class {student.class}-{student.section}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Send to Parents */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-elevated border border-border">
            <input
              type="checkbox"
              id="sendToParents"
              checked={formData.sendToParents}
              onChange={(e) => setFormData({ ...formData, sendToParents: e.target.checked })}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="sendToParents" className="flex-1 cursor-pointer">
              <p className="text-sm font-semibold text-text-primary">Send email to parents</p>
              <p className="text-xs text-text-muted">Parents will receive an email notification with this notice</p>
            </label>
            <Mail className="w-5 h-5 text-secondary" />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {[
                { id: 'low', label: 'Low', color: 'success' },
                { id: 'normal', label: 'Normal', color: 'primary' },
                { id: 'high', label: 'High', color: 'warning' },
                { id: 'urgent', label: 'Urgent', color: 'danger' }
              ].map((priority) => (
                <button
                  key={priority.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: priority.id })}
                  className={clsx(
                    "flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                    formData.priority === priority.id
                      ? `bg-${priority.color}/20 text-${priority.color} border border-${priority.color}/30`
                      : "bg-surface-elevated border border-border text-text-secondary hover:text-text-primary"
                  )}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-border flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-all text-sm font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary px-6 py-2.5 text-sm"
          >
            {notice ? 'Update Notice' : 'Publish Notice'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
