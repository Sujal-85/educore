import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Trash2, 
  MoreVertical, 
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';

export default function Notifications() {
  const { notifications, markNotificationAsRead, clearNotifications } = useAppStore();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'All' || 
                      (activeTab === 'Unread' && !n.read) || 
                      (activeTab === 'Alerts' && n.type === 'Alert');
    return matchesSearch && matchesTab;
  });

  const handleMarkAllRead = () => {
    notifications.forEach(n => markNotificationAsRead(n.id));
    toast.success('All notifications marked as read');
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      clearNotifications();
      toast.success('Notifications cleared');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">Notifications</h1>
          <p className="text-text-secondary text-sm">Stay updated with the latest school events and alerts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleMarkAllRead}
            className="px-4 py-2.5 rounded-xl glass hover:bg-surface-elevated text-sm font-bold transition-all text-text-primary"
          >
            Mark All Read
          </button>
          <button 
            onClick={handleClear}
            className="p-2.5 rounded-xl glass hover:bg-danger/10 text-text-secondary hover:text-danger transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass p-4 rounded-2xl border border-border flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated/50 border border-border rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all text-text-primary"
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-surface-elevated rounded-xl border border-border">
          {['All', 'Unread', 'Alerts'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                activeTab === tab ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Feed */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.map((notification) => (
            <motion.div 
              key={notification.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => markNotificationAsRead(notification.id)}
              className={clsx(
                "glass p-6 rounded-[32px] border border-border card-hover cursor-pointer group relative overflow-hidden",
                !notification.read ? "border-primary/20 bg-primary/5" : ""
              )}
            >
              {!notification.read && (
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              )}
              <div className="flex gap-6">
                <div className={clsx(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                  notification.type === 'Alert' ? 'bg-danger/10 text-danger' : 
                  notification.type === 'Warning' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                )}>
                  {notification.type === 'Alert' ? <AlertCircle className="w-7 h-7" /> : 
                   notification.type === 'Warning' ? <Clock className="w-7 h-7" /> : <Info className="w-7 h-7" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className={clsx(
                        "text-lg font-bold group-hover:text-primary transition-colors",
                        !notification.read ? "text-text-primary" : "text-text-secondary"
                      )}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-text-secondary mt-1 leading-relaxed">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-medium text-text-secondary whitespace-nowrap">{notification.time}</span>
                      <button className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <button className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {!notification.read && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationAsRead(notification.id);
                        }}
                        className="text-success text-xs font-bold hover:underline flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredNotifications.length === 0 && (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-surface-elevated flex items-center justify-center mb-6">
              <Bell className="w-10 h-10 text-text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-text-primary">No notifications</h3>
            <p className="text-text-secondary max-w-xs">You're all caught up! There are no notifications matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
