import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  Users,
  GraduationCap,
  CalendarCheck,
  BookOpenCheck,
  Target,
  FileText,
  Clock,
  CreditCard,
  Library,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Megaphone,
  X
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const navSections = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'ACADEMICS',
    items: [
      { name: 'Students', path: '/students', icon: Users, roles: ['teacher'] },
      { name: 'Academics', path: '/marks', icon: GraduationCap, roles: ['student', 'teacher'] },
      { name: 'Attendance', path: '/attendance', icon: CalendarCheck, roles: ['student', 'teacher'] },
      { name: 'AI Insights', path: '/dashboard', icon: Sparkles, roles: ['student'] },
      { name: 'Study Plan', path: '/study-plans', icon: BookOpenCheck, roles: ['student', 'teacher'] },
    ]
  },
  {
    title: 'DISCIPLINE',
    items: [
      { name: 'Behavior Score', path: '/behavior', icon: Target, roles: ['student', 'teacher'] },
      { name: 'Assignments', path: '/assignments', icon: FileText, roles: ['student', 'teacher'] },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Timetable', path: '/timetable', icon: Clock, roles: ['student', 'teacher'] },
      { name: 'Fees', path: '/fees', icon: CreditCard, roles: ['student', 'teacher'] },
      { name: 'Library', path: '/library', icon: Library, roles: ['student', 'teacher'] },
      { name: 'Notices', path: '/notices', icon: Megaphone, roles: ['student', 'teacher'] },
    ]
  }
];

export default function Sidebar({ isMobile = false }) {
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen, notifications, user } = useAppStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const isCollapsed = isMobile ? false : sidebarCollapsed;

  const filteredSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (!item.roles) return true;
      const userRole = user?.role?.toLowerCase() || 'student'; // Fallback to student if role is missing
      return item.roles.some(role => role.toLowerCase() === userRole);
    })
  })).filter(section => section.items.length > 0);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      className={clsx(
        "h-screen glass-elevated z-50 flex flex-col border-r border-border",
        isMobile ? "w-[280px]" : "fixed left-0 top-0"
      )}
    >
      {/* Logo Area */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden p-1">
              <img src="https://famt.ac.in/tnp/wp-content/uploads/2021/09/cropped-new-logo.png" alt="FAMT Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <span className="text-xl font-bold font-display gradient-text tracking-tight">FAMT Edu</span>
          </motion.div>
        )}
        {isCollapsed && (
           <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center mx-auto overflow-hidden p-1">
            <img src="https://famt.ac.in/tnp/wp-content/uploads/2021/09/cropped-new-logo.png" alt="FAMT Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
        )}
        {/* Mobile Close Button */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 custom-scrollbar">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            {!isCollapsed && (
              <h3 className="text-[10px] font-bold text-text-muted tracking-widest px-4 mb-2">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) => clsx(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group relative",
                    isActive 
                      ? "bg-primary/10 text-primary border-l-4 border-primary" 
                      : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                  )}
                >
                  <item.icon className={clsx("w-5 h-5", isCollapsed && "mx-auto")} />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                  {item.badge && unreadCount > 0 && !isCollapsed && (
                    <span className="ml-auto bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                  {isCollapsed && item.badge && unreadCount > 0 && (
                    <div className="absolute top-2 right-4 w-2 h-2 bg-danger rounded-full border-2 border-surface-elevated" />
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Collapse Toggle - Hidden on mobile */}
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          className="p-4 border-t border-border text-text-muted hover:text-text-primary flex items-center justify-center transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      )}
    </motion.aside>
  );
}
