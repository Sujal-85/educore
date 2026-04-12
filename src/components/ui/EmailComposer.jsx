import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Minus, Maximize2, Minimize2, Trash2, Paperclip, MoreVertical } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import toast from 'react-hot-toast';

const EmailComposer = () => {
  const { emailDraft, setEmailDraft } = useAppStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    subject: '',
    body: ''
  });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (emailDraft) {
      setFormData({
        to: emailDraft.to || '',
        cc: emailDraft.cc || '',
        subject: emailDraft.subject || '',
        body: emailDraft.body || ''
      });
      setIsMinimized(false);
    }
  }, [emailDraft]);

  if (!emailDraft) return null;

  const handleSend = async () => {
    if (!formData.to) {
      toast.error('Recipient email is required');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formData.to,
          subject: formData.subject,
          body: formData.body,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Email sent successfully!');
        setEmailDraft(null);
      } else {
        toast.error(data.message || 'Failed to send email');
        console.error('Email send failed:', data);
      }
    } catch (error) {
      console.error('Email send error:', error);
      toast.error('Connection error: Make sure the email server is running (npm run server)');
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const containerVariants = {
    initial: { y: 100, opacity: 0, scale: 0.95 },
    animate: { y: 0, opacity: 1, scale: 1 },
    exit: { y: 100, opacity: 0, scale: 0.95 }
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`fixed bottom-0 right-4 z-[9999] bg-background border border-border shadow-2xl rounded-t-xl overflow-hidden transition-all duration-300 ${
          isMaximized ? 'w-[calc(100%-2rem)] h-[calc(100%-2rem)] top-4' : 'w-[540px] h-[500px]'
        } ${isMinimized ? 'h-12 w-80' : ''}`}
      >
        {/* Header */}
        <div className="bg-surface px-4 h-12 flex items-center justify-between border-b border-border cursor-pointer" 
             onClick={() => isMinimized && setIsMinimized(false)}>
          <span className="font-medium text-sm text-text-primary">
            {formData.subject || 'New Message'}
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
            >
              <Minus size={16} className="text-text-secondary" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); }}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
            >
              {isMaximized ? <Minimize2 size={16} className="text-text-secondary" /> : <Maximize2 size={16} className="text-text-secondary" />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setEmailDraft(null); }}
              className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex flex-col h-[calc(100%-48px)]">
            {/* Form Fields */}
            <div className="px-4 py-2 border-b border-border space-y-2">
              <div className="flex items-center gap-2 group">
                <span className="text-text-secondary text-sm w-8">To</span>
                <input
                  type="text"
                  name="to"
                  value={formData.to}
                  onChange={handleChange}
                  className="flex-1 bg-transparent border-none text-sm focus:ring-0 text-text-primary"
                />
              </div>
              <div className="flex items-center gap-2 group">
                <span className="text-text-secondary text-sm w-8">Cc</span>
                <input
                  type="text"
                  name="cc"
                  value={formData.cc}
                  onChange={handleChange}
                  className="flex-1 bg-transparent border-none text-sm focus:ring-0 text-text-primary"
                />
              </div>
              <div className="flex items-center gap-2 group">
                <input
                  type="text"
                  name="subject"
                  placeholder="Subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 text-text-primary placeholder:text-text-tertiary"
                />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 relative">
              <textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                className="w-full h-full p-6 bg-transparent border-none resize-none text-sm leading-relaxed focus:ring-0 text-text-primary scrollbar-hide"
                placeholder="Type your message here..."
              />
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-surface border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSend}
                  disabled={isSending || !formData.to}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-full font-medium text-sm hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {isSending ? 'Sending...' : 'Send'}
                </button>
                <div className="flex items-center gap-1 border-l border-border ml-2 pl-2">
                  <button className="p-2 hover:bg-white/5 rounded text-text-secondary transition-colors" title="Attach files">
                    <Paperclip size={18} />
                  </button>
                  <button className="p-2 hover:bg-white/5 rounded text-text-secondary transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => setEmailDraft(null)}
                className="p-2 hover:bg-red-500/10 text-text-tertiary hover:text-red-400 rounded transition-colors"
                title="Discard draft"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default EmailComposer;
