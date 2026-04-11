import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, LogOut, Settings, Command, Menu } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { auth, signOut } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Avatar from '../ui/Avatar';

export default function Topbar() {
  const { user, notifications, markNotificationAsRead, mobileMenuOpen, setMobileMenuOpen } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const unreadCount = notifications.filter(n => !n.read).length;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  const recentNotifications = notifications.slice(0, 5);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-16 sm:h-20 glass border-b border-border sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu + Search */}
      <div className="flex items-center gap-3 flex-1">
        {/* Mobile Hamburger */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Search Bar */}
        <div className="relative group max-w-md w-full">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
          <input
            id="global-search"
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-9 sm:pl-12 pr-8 sm:pr-12 py-2 sm:py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-muted/50 text-text-primary"
          />
          <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 bg-surface border border-border rounded-md text-[10px] font-mono text-text-muted">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all group"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-surface shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-[320px] sm:w-80 glass-elevated rounded-2xl border border-border shadow-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-text-primary">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-danger/10 text-danger text-xs font-bold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <div className="p-6 text-center text-text-secondary text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    recentNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          setShowNotifications(false);
                        }}
                        className={`p-4 border-b border-border hover:bg-surface-elevated cursor-pointer transition-all ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <p className={`text-sm font-semibold ${!n.read ? 'text-text-primary' : 'text-text-secondary'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-text-muted mt-1 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-text-muted mt-2">{n.time}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-border">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/notifications');
                    }}
                    className="w-full py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-xl transition-all"
                  >
                    View All Notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 sm:gap-3 p-1.5 sm:pr-3 rounded-xl hover:bg-surface-elevated transition-all group"
          >
            <Avatar
              src={user?.avatar}
              fallback={user?.name?.charAt(0) || 'U'}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg"
            />
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors truncate max-w-[100px]">{user?.name || 'User'}</p>
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{user?.role || 'Student'}</p>
            </div>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-56 glass-elevated rounded-2xl border border-border shadow-2xl p-2 overflow-hidden"
              >
                <div className="p-3 border-b border-border mb-1">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-text-muted">{user?.role}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-all"
                >
                  <User className="w-4 h-4" />
                  Profile Settings
                </button>
                <button 
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-all"
                >
                  <Settings className="w-4 h-4" />
                  System Preferences
                </button>
                <div className="h-px bg-border my-1" />
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
