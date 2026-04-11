import React, { useState } from 'react';
import { 
  Library as LibraryIcon, 
  Search, 
  Filter, 
  Plus, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  MoreVertical,
  UserPlus,
  Book,
  Mail,
  X,
  Download,
  Upload,
  History,
  Calendar,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';

import { useAppStore } from '../store/useAppStore';
import { sendEmailDraft, EMAIL_TEMPLATE_KEYS } from '../lib/emailTemplates';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function Library() {
  const { books, issuedBooks, bookRequests, addBook, updateBook, requestBookIssue, requestBookAction, handleBookRequest, user, teachers } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Catalog');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    subject: 'Math',
    color: '#4F8EF7',
    available: true,
    pdfUrl: '',
    pdfName: ''
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const isTeacher = user?.role?.toLowerCase() === 'teacher';

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      subject: 'Math',
      color: '#4F8EF7',
      available: true,
      pdfUrl: '',
      pdfName: ''
    });
    setPdfFile(null);
    setUploadProgress(0);
    setIsSubmitting(false);
    setShowAddModal(false);
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let bookData = { ...formData };
      
      // Upload PDF if selected
      if (pdfFile) {
        const storageRef = ref(storage, `books/${Date.now()}_${pdfFile.name}`);
        await uploadBytes(storageRef, pdfFile);
        const downloadUrl = await getDownloadURL(storageRef);
        bookData.pdfUrl = downloadUrl;
        bookData.pdfName = pdfFile.name;
      }
      
      await addBook(bookData);
      toast.success('Book added successfully to catalog');
      resetForm();
    } catch (error) {
      toast.error('Failed to add book');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         b.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === 'All' || b.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const handleIssueRequest = async (book) => {
    if (book.status !== 'Available') {
      toast.error('This book is currently not available.');
      return;
    }
    const alreadyRequested = bookRequests.some(r => r.bookId === book.id && r.studentId === user.uid && r.status === 'Pending');
    if (alreadyRequested) {
      toast.error('You already have a pending request for this book.');
      return;
    }
    await requestBookIssue(book.id, user.uid, user.name);
    toast.success(`Issue request for "${book.title}" sent to teacher`);
  };

  const handleBookActionRequest = async (bookId, title, action) => {
    const alreadyRequested = bookRequests.some(r => r.bookId === bookId && r.studentId === user.uid && r.status === 'Pending' && r.type === action);
    if (alreadyRequested) {
      toast.error(`You already have a pending ${action.toLowerCase()} request for this book.`);
      return;
    }
    await requestBookAction(bookId, user.uid, user.name, action);
    toast.success(`${action} request for "${title}" sent to teacher`);
  };

  const handleEmailTeacher = (item) => {
    try {
      const teacherEmail = teachers.find((t) => t.email)?.email;
      sendEmailDraft({
        to: teacherEmail,
        templateKey: EMAIL_TEMPLATE_KEYS.LIBRARY_RENEWAL,
        context: {
          teacherName: teachers.find((t) => t.name)?.name || 'Teacher',
          studentName: user?.name || 'Student',
          bookTitle: item.bookTitle,
          dueDate: item.dueDate
        }
      });
      toast.success('Email draft opened for library renewal request');
    } catch (error) {
      toast.error('Teacher email is not available.');
    }
  };

  const handleDownload = (book) => {
    if (book.pdfUrl) {
      window.open(book.pdfUrl, '_blank');
      toast.success(`Opening "${book.title}" PDF...`);
    } else {
      toast.error('No PDF available for this book');
    }
  };

  const handleViewHistory = (book) => {
    setSelectedBook(book);
    setShowHistoryModal(true);
  };

  const getBookHistory = (bookId) => {
    return issuedBooks.filter(record => record.bookId === bookId);
  };

  const myIssuedBooks = isTeacher ? issuedBooks : issuedBooks.filter(ib => ib.studentId === user?.uid);
  const pendingRequests = bookRequests.filter(r => r.status === 'Pending');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">School Library</h1>
          <p className="text-text-secondary text-sm">Manage book catalog and student borrowings.</p>
        </div>
        <div className="flex items-center gap-2 p-1 glass rounded-xl border border-border">
          {['Catalog', 'Issued Books', ...(isTeacher ? ['Requests'] : [])].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all relative",
                activeTab === tab ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tab}
              {tab === 'Requests' && pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-[10px] flex items-center justify-center rounded-full animate-bounce">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass p-4 rounded-2xl border border-border flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text"
            placeholder="Search by title, author, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all text-text-primary"
          />
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <select 
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all min-w-[140px] text-text-primary"
          >
            <option value="All" className="bg-surface text-text-primary">All Subjects</option>
            <option value="Math" className="bg-surface text-text-primary">Math</option>
            <option value="Science" className="bg-surface text-text-primary">Science</option>
            <option value="English" className="bg-surface text-text-primary">English</option>
            <option value="Computer" className="bg-surface text-text-primary">Computer</option>
            <option value="History" className="bg-surface text-text-primary">History</option>
          </select>
          {isTeacher && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Book
            </button>
          )}
        </div>
      </div>

      {activeTab === 'Catalog' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <motion.div
              key={book.id}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-[32px] bg-surface-elevated border border-border p-6 hover:border-primary/30 transition-all"
            >
              {/* Debug - check PDF data */}
              {console.log(`Book: ${book.title}, has PDF: ${!!book.pdfUrl}`)}
              
              {/* Cover Image / Gradient */}
              <div className="relative h-48 rounded-2xl overflow-hidden mb-6">
                <div className="absolute inset-0 bg-linear-to-br opacity-80" style={{ backgroundImage: `linear-gradient(135deg, ${book.color}, var(--surface-elevated))` }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <Book className="w-12 h-12 text-white/40 mb-4" />
                  <h3 className="text-lg font-bold text-white drop-shadow-lg line-clamp-2">{book.title}</h3>
                  <p className="text-xs text-white/95 drop-shadow-md mt-2 font-medium">{book.author}</p>
                </div>
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3">
                  {!isTeacher && book.status === 'Available' ? (
                    <button 
                      onClick={() => handleIssueRequest(book)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Request Issue
                    </button>
                  ) : book.status !== 'Available' ? (
                    <span className="px-4 py-2 bg-warning/20 text-warning text-xs font-bold rounded-xl border border-warning/30 backdrop-blur-md">
                      Currently Issued
                    </span>
                  ) : null}
                  {book.pdfUrl && (
                    <button 
                      onClick={() => handleDownload(book)}
                      className="px-6 py-2 rounded-xl bg-surface-elevated border border-border text-text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2 shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-surface-elevated text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    {book.subject}
                  </span>
                  <span className={clsx(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                    book.status === 'Available' ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  )}>
                    {book.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold group-hover:text-primary transition-colors text-text-primary">{book.title}</h3>
                <p className="text-xs text-text-muted mt-1">{book.author}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="text-text-muted hover:text-text-primary transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {book.pdfUrl && (
                    <span className="text-[10px] text-success bg-success/10 px-2 py-1 rounded-full">
                      PDF Available
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => handleViewHistory(book)}
                  className="text-primary text-xs font-bold hover:underline flex items-center gap-1"
                >
                  View History
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : activeTab === 'Issued Books' ? (
        <div className="glass rounded-3xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-elevated border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Book Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Issue Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Return Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {myIssuedBooks.map((item) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-surface-elevated transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold group-hover:text-primary transition-colors text-text-primary">{item.studentName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-text-primary">{item.bookTitle}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-text-secondary">{item.issueDate}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "text-sm font-mono",
                        new Date(item.dueDate) < new Date() ? "text-danger" : "text-text-secondary"
                      )}>{item.dueDate}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        new Date(item.dueDate) >= new Date() ? "bg-success/10 text-success" : "bg-danger/10 text-danger animate-pulse"
                      )}>
                        {new Date(item.dueDate) >= new Date() ? 'Active' : 'Overdue'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isTeacher && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleBookActionRequest(item.bookId, item.bookTitle, 'Return')}
                            className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all"
                          >
                            Request Return
                          </button>
                          <button 
                            onClick={() => handleBookActionRequest(item.bookId, item.bookTitle, 'Renew')}
                            className="px-4 py-2 rounded-xl bg-secondary/10 text-secondary text-xs font-bold hover:bg-secondary/20 transition-all"
                          >
                            Renew
                          </button>
                          <button
                            onClick={() => handleEmailTeacher(item)}
                            className="px-4 py-2 rounded-xl bg-warning/10 text-warning text-xs font-bold hover:bg-warning/20 transition-all flex items-center gap-2"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email Teacher
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
                {myIssuedBooks.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-text-muted">No books issued yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass rounded-3xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-elevated border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Book Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Request Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingRequests.map((request) => (
                  <motion.tr 
                    key={request.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-surface-elevated transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-text-primary">{request.studentName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-text-primary">{request.bookTitle}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        request.type === 'Issue' ? "bg-primary/10 text-primary" : 
                        request.type === 'Return' ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"
                      )}>
                        {request.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleBookRequest(request.id, 'Approve')}
                          className="px-4 py-2 rounded-xl bg-success text-white text-xs font-bold hover:bg-success/80 transition-all"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleBookRequest(request.id, 'Reject')}
                          className="px-4 py-2 rounded-xl bg-danger text-white text-xs font-bold hover:bg-danger/80 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {pendingRequests.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-text-muted">No pending requests.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Add Book Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative w-full max-w-md glass-elevated rounded-3xl border border-border shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-display text-text-primary">Add New Book</h2>
                  <p className="text-xs text-text-muted">Register a new resource in the library catalog.</p>
                </div>
                <button 
                  onClick={resetForm}
                  className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form className="p-6 space-y-4" onSubmit={handleAddBook}>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Book Title</label>
                  <input 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary" 
                    placeholder="e.g. Organic Chemistry Vol 1" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Author</label>
                  <input 
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary" 
                    placeholder="e.g. Dr. Robert Smith" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Subject</label>
                    <select 
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary"
                    >
                      <option value="Math">Math</option>
                      <option value="Science">Science</option>
                      <option value="English">English</option>
                      <option value="Computer">Computer</option>
                      <option value="History">History</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Cover Color</label>
                    <input 
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-[46px] bg-surface-elevated border border-border rounded-xl px-2 py-1 cursor-pointer"
                    />
                  </div>
                </div>

                {/* PDF Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Book PDF (Optional)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files[0])}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="flex items-center gap-2 w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm cursor-pointer hover:bg-surface transition-all text-text-primary"
                    >
                      <Upload className="w-4 h-4 text-text-muted" />
                      <span className="truncate">
                        {pdfFile ? pdfFile.name : (formData.pdfName || 'Click to upload PDF')}
                      </span>
                    </label>
                    {(pdfFile || formData.pdfUrl) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPdfFile(null);
                          setFormData({ ...formData, pdfUrl: '', pdfName: '' });
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {formData.pdfUrl && !pdfFile && (
                    <p className="text-xs text-success">PDF already uploaded</p>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-3 rounded-xl glass hover:bg-surface-elevated text-sm font-bold transition-all text-text-primary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Add to Catalog
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Book History Modal */}
      <AnimatePresence>
        {showHistoryModal && selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass-elevated rounded-[32px] border border-border shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-16 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{ backgroundColor: selectedBook.color || '#4F8EF7' }}
                  >
                    <Book className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">{selectedBook.title}</h3>
                    <p className="text-sm text-text-secondary">by {selectedBook.author}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* History Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary">Issue History</h4>
                    <p className="text-xs text-text-muted">
                      {getBookHistory(selectedBook.id).length} record(s) found
                    </p>
                  </div>
                </div>

                {getBookHistory(selectedBook.id).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-text-muted" />
                    </div>
                    <p className="text-text-secondary">No issue history found</p>
                    <p className="text-xs text-text-muted mt-1">This book has never been issued</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getBookHistory(selectedBook.id).map((record, index) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-2xl bg-surface-elevated border border-border hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-text-primary text-sm">
                                {record.studentName || 'Unknown Student'}
                              </p>
                              <p className="text-xs text-text-muted">
                                ID: {record.studentId?.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <span className={clsx(
                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                            record.status === 'Returned' 
                              ? "bg-success/10 text-success" 
                              : "bg-warning/10 text-warning"
                          )}>
                            {record.status || 'Issued'}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Issued: {record.issueDate ? new Date(record.issueDate).toLocaleDateString() : 'N/A'}
                          </span>
                          {record.returnDate && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-success" />
                              Returned: {new Date(record.returnDate).toLocaleDateString()}
                            </span>
                          )}
                          {record.dueDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-text-muted" />
                              Due: {new Date(record.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-surface-elevated/50">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="w-full py-3 rounded-xl bg-surface-elevated border border-border text-text-primary font-semibold hover:bg-surface transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
