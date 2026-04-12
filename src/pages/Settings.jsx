import React, { useState } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Globe, 
  Moon, 
  Sun, 
  Monitor, 
  Mail, 
  Phone, 
  Lock, 
  ChevronRight,
  Save,
  Trash2,
  AlertCircle,
  Edit3
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';
import { db, collection, query, where, getDocs } from '../lib/firebase';

const settingSections = [
  { id: 'profile', name: 'Profile Settings', icon: User, desc: 'Manage your personal information and public profile.' },
  { id: 'system', name: 'System Preferences', icon: SettingsIcon, desc: 'Customize the dashboard appearance and behavior.' },
  { id: 'security', name: 'Security & Privacy', icon: Shield, desc: 'Update your password and manage account security.' },
  { id: 'notifications', name: 'Notification Settings', icon: Bell, desc: 'Control which alerts and emails you receive.' },
];

export default function Settings() {
  const { user, updateUser, theme, setTheme } = useAppStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || user?.contact || '',
    language: 'English (US)'
  });

  // Sync formData with user
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.contact || user.mobile || user.phone || '',
        language: formData.language || 'English (US)'
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      // Check for duplicate phone number
      const mobileQueries = [
        query(collection(db, 'users'), where('mobile', '==', formData.mobile)),
        query(collection(db, 'users'), where('phone', '==', formData.mobile)),
        query(collection(db, 'users'), where('contact', '==', formData.mobile))
      ];
      
      const querySnapshots = await Promise.all(mobileQueries.map(q => getDocs(q)));
      const isDuplicate = querySnapshots.some(snap => 
        snap.docs.some(doc => doc.id !== user.uid && doc.id !== user.id)
      );
      
      if (isDuplicate) {
        toast.error('This phone number is already linked to another account.');
        return;
      }

      await updateUser(user.uid || user.id, formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('File too large (max 1MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
        updateUser(user.uid || user.id, { ...formData, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">Settings</h1>
          <p className="text-text-secondary text-sm">Manage your account and system preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {settingSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                activeTab === section.id 
                  ? "bg-primary/10 text-primary border-l-4 border-primary" 
                  : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
              )}
            >
              <section.icon className="w-5 h-5" />
              <div className="text-left">
                <p className="text-sm font-bold">{section.name}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'profile' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-8 rounded-[32px] border border-border space-y-8"
            >
              <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-border">
                <div className="relative group">
                  <Avatar 
                    src={formData.avatar || user?.avatar} 
                    fallback={user?.name?.charAt(0) || 'U'} 
                    size="xl" 
                  />
                  <input
                    type="file"
                    id="settings-avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  <label 
                    htmlFor="settings-avatar-upload"
                    className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-surface-elevated border border-border text-text-muted hover:text-text-primary transition-all shadow-lg cursor-pointer active:scale-95"
                  >
                    <Edit3 className="w-4 h-4" />
                  </label>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold mb-1 text-text-primary">{user?.name}</h3>
                  <p className="text-sm text-text-secondary mb-4">{user?.role} • Since 2024</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">{user?.role === 'teacher' ? 'Administrator' : 'Student'}</span>
                    <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase tracking-widest border border-success/20">Verified</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input 
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input 
                      value={formData.mobile} 
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Language</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <select 
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary"
                    >
                      <option>English (US)</option>
                      <option>Hindi (IN)</option>
                      <option>Spanish (ES)</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-8 rounded-[32px] border border-border space-y-8"
            >
              <div>
                <h3 className="text-xl font-bold mb-6 text-text-primary">Appearance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'light', name: 'Light Mode', icon: Sun },
                    { id: 'dark', name: 'Dark Mode', icon: Moon },
                    { id: 'system', name: 'System Default', icon: Monitor },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={clsx(
                        "flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all",
                        theme === t.id 
                          ? "bg-primary/10 border-primary text-primary" 
                          : "bg-surface border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                      )}
                    >
                      <t.icon className="w-6 h-6" />
                      <span className="text-sm font-bold">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-6 text-text-primary">Dashboard Layout</h3>
                <div className="space-y-4">
                  {[
                    { title: 'Compact View', desc: 'Show more data in less space.', active: true },
                    { title: 'Glassmorphism Effects', desc: 'Enable blur and transparency effects.', active: true },
                    { title: 'Animations', desc: 'Smooth transitions and micro-interactions.', active: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border">
                      <div>
                        <p className="text-sm font-bold text-text-primary">{item.title}</p>
                        <p className="text-xs text-text-secondary">{item.desc}</p>
                      </div>
                      <div className={clsx(
                        "w-12 h-6 rounded-full p-1 transition-all cursor-pointer",
                        item.active ? "bg-primary" : "bg-border"
                      )}>
                        <div className={clsx(
                          "w-4 h-4 rounded-full bg-white transition-all",
                          item.active ? "translate-x-6" : "translate-x-0"
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-8 rounded-[32px] border border-border space-y-8"
            >
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-6 text-text-primary">Change Password</h3>
                <form className="grid grid-cols-1 gap-6 max-w-md" onSubmit={(e) => {
                  e.preventDefault();
                  toast.success('Password update request sent to your email.');
                }}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input type="password" required placeholder="••••••••" className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input type="password" required placeholder="••••••••" className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary" />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-fit px-8 py-3">Update Password</button>
                </form>
              </div>

              <div className="pt-8 border-t border-border">
                <h3 className="text-xl font-bold mb-6 text-danger">Danger Zone</h3>
                <div className="p-6 rounded-3xl bg-danger/5 border border-danger/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex gap-4">
                    <AlertCircle className="w-6 h-6 text-danger shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-danger">Delete Account</p>
                      <p className="text-xs text-text-secondary mt-1">Once you delete your account, there is no going back. Please be certain.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
                        toast.error('Account deletion is restricted in this demo environment.');
                      }
                    }}
                    className="px-6 py-3 rounded-xl bg-danger text-white text-sm font-bold hover:bg-danger/80 transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-8 rounded-[32px] border border-border space-y-8"
            >
              <h3 className="text-xl font-bold mb-6 text-text-primary">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { title: 'Email Notifications', desc: 'Receive updates about assignments and fees via email.', active: true },
                  { title: 'In-App Notifications', desc: 'Show alerts in the dashboard notification center.', active: true },
                  { title: 'Weekly Reports', desc: 'Receive a weekly summary of academic progress.', active: false },
                  { title: 'Attendance Alerts', desc: 'Get notified immediately if a student is marked absent.', active: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border">
                    <div>
                      <p className="text-sm font-bold text-text-primary">{item.title}</p>
                      <p className="text-xs text-text-secondary">{item.desc}</p>
                    </div>
                    <div className={clsx(
                      "w-12 h-6 rounded-full p-1 transition-all cursor-pointer",
                      item.active ? "bg-primary" : "bg-border"
                    )}>
                      <div className={clsx(
                        "w-4 h-4 rounded-full bg-white transition-all",
                        item.active ? "translate-x-6" : "translate-x-0"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
