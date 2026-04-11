import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  Minimize2, 
  Maximize2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useAppStore } from '../store/useAppStore';
import Markdown from 'react-markdown';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm FAMTBot, your AI academic assistant. How can I help you today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { students, user, theme } = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Missing VITE_GEMINI_API_KEY');
      }

      const systemInstruction = `
        You are FAMTBot, an AI assistant for a Student Management System called FAMT Edu.
        Current User: ${user?.name} (Role: ${user?.role})
        
        Context:
        - Total Students: ${students.length}
        - Current Student Data: ${JSON.stringify(students.slice(0, 10))}
        
        Capabilities:
        1. Behavior Analysis: Analyze student behavior scores and trends.
        2. Recommendations: Suggest study plans or improvements based on marks.
        3. General Help: Answer questions about the system, timetable, or library.
        
        Guidelines:
        - Be professional, encouraging, and concise.
        - Use markdown for formatting (bold, lists, etc.).
        - If the user is a teacher, provide management insights.
        - If the user is a student, provide personalized academic advice.
        - Never share private PII like mobile numbers or IDs unless specifically relevant to the authenticated user's own data.
      `;

      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Handle different versions of the SDK
      let model;
      if (genAI.getGenerativeModel) {
        model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          systemInstruction: systemInstruction 
        });
      } else if (genAI.ai && genAI.ai.getGenerativeModel) {
        model = genAI.ai.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          systemInstruction: systemInstruction 
        });
      } else {
        throw new Error('GoogleGenerativeAI API not available');
      }

      const result = await model.generateContent({
        contents: [...messages
          .filter(m => m.role !== 'system')
          .map(m => ({ 
            role: m.role === 'assistant' ? 'model' : 'user', 
            parts: [{ text: m.content }] 
          })), 
          { role: 'user', parts: [{ text: input }] }
        ]
      });

      const response = result.response;
      const text = response.text();

      const aiMessage = { role: 'assistant', content: text };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[calc(100vw-32px)] sm:w-[380px] h-[60vh] sm:h-[500px] glass-elevated rounded-[24px] sm:rounded-[32px] border border-border shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Chat Header */}
            <div className="p-4 bg-linear-to-r from-primary/20 to-secondary/20 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">FAMTBot AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {messages.map((msg, idx) => (
                    <div 
                      key={idx}
                      className={clsx(
                        "flex gap-3",
                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={clsx(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                        msg.role === 'user' ? "bg-primary/20 text-primary" : "bg-surface-elevated border border-border text-text-muted"
                      )}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={clsx(
                        "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                        msg.role === 'user' 
                          ? "bg-primary text-white rounded-tr-none" 
                          : "bg-surface-elevated border border-border text-text-primary rounded-tl-none shadow-sm"
                      )}>
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <div className={clsx(
                            "prose prose-sm max-w-none",
                            theme !== 'light' && "prose-invert"
                          )}>
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-text-muted">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-surface-elevated border border-border p-4 rounded-2xl rounded-tl-none">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-border bg-surface">
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Ask FAMTBot something..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      className="w-full bg-surface-elevated border border-border rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all text-text-primary"
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-primary text-white hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl transition-all relative group",
          isOpen ? "bg-surface-elevated text-text-primary border border-border rotate-90" : "bg-primary text-white"
        )}
      >
        <div className="absolute inset-0 rounded-[24px] bg-primary blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
        {isOpen ? <X className="w-8 h-8 relative z-10" /> : <MessageSquare className="w-8 h-8 relative z-10" />}
      </motion.button>
    </div>
  );
}
