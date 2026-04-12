import React, { useState } from 'react';
import { User, Mail, Phone, GraduationCap, Edit2, Save, X, Camera, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';
import { db, collection, query, where, getDocs } from '../lib/firebase';

export default function Profile() {
  const { user, updateUser, students } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    mobile: user?.phone || user?.mobile || '',
    parentName: user?.parentName || '',
    parentEmail: user?.parentEmail || '',
    parentPhone: user?.parentPhone || user?.parentContact || '',
    class: user?.class || '',
    section: user?.section || '',
    rollNo: user?.rollNo || '',
    avatar: user?.avatar || ''
  });

  // Sync formData with user when not editing
  React.useEffect(() => {
    if (!isEditing && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.phone || user.mobile || '',
        parentName: user.parentName || '',
        parentEmail: user.parentEmail || '',
        parentPhone: user.parentPhone || user.parentContact || '',
        class: user.class || '',
        section: user.section || '',
        rollNo: user.rollNo || '',
        avatar: user.avatar || ''
      });
    }
  }, [user, isEditing]);

  // Calculate overall average and SGPA
  const calculateSGPA = () => {
    if (!user?.marks || user?.role?.toLowerCase() !== 'student') return null;

    const examTypeMapping = {
      'Unit Test': 'Unit Test 1',
      'Mid-Term': 'Unit Test 2',
      'Final': 'Final'
    };

    const subjectMapping = {
      'math': 'mathematics',
      'science': 'physics',
      'english': 'chemistry',
      'history': 'basic_electrical',
      'computer': 'programming'
    };

    const examTypes = ['Unit Test 1', 'Unit Test 2', 'Final'];
    const examConfigs = {
      'Unit Test 1': { max: 20, weight: 0.15 },
      'Unit Test 2': { max: 20, weight: 0.15 },
      'Final': { max: 80, weight: 0.70 }
    };

    const engineeringSubjects = ['mathematics', 'physics', 'chemistry', 'basic_electrical', 'programming'];

    let weightedTotal = 0;
    let totalWeight = 0;

    examTypes.forEach(examType => {
      // Try new exam type first, then fallback to old
      let marks = user.marks[examType];
      if (!marks) {
        const oldExamType = Object.keys(examTypeMapping).find(key => examTypeMapping[key] === examType);
        if (oldExamType) marks = user.marks[oldExamType];
      }

      if (marks) {
        const config = examConfigs[examType];
        // Use engineering subjects with fallback to old subject names
        const subjectTotal = engineeringSubjects.reduce((sum, sub) => {
          const oldSub = Object.keys(subjectMapping).find(key => subjectMapping[key] === sub);
          return sum + (marks[sub] || (oldSub ? marks[oldSub] : 0) || 0);
        }, 0);
        const maxTotal = config.max * engineeringSubjects.length;
        const percentage = (subjectTotal / maxTotal) * 100;
        weightedTotal += percentage * config.weight;
        totalWeight += config.weight;
      }
    });

    if (totalWeight === 0) return null;

    const overallPercentage = weightedTotal / totalWeight;

    // Convert to SGPA (10-point scale)
    let sgpa;
    if (overallPercentage >= 90) sgpa = 10;
    else if (overallPercentage >= 80) sgpa = 9;
    else if (overallPercentage >= 70) sgpa = 8;
    else if (overallPercentage >= 60) sgpa = 7;
    else if (overallPercentage >= 50) sgpa = 6;
    else if (overallPercentage >= 40) sgpa = 5;
    else sgpa = 0;

    return {
      percentage: overallPercentage.toFixed(2),
      sgpa: sgpa.toFixed(2),
      grade: getGradeFromSGPA(sgpa)
    };
  };

  const getGradeFromSGPA = (sgpa) => {
    if (sgpa >= 9) return 'O';
    if (sgpa >= 8) return 'A+';
    if (sgpa >= 7) return 'A';
    if (sgpa >= 6) return 'B+';
    if (sgpa >= 5) return 'B';
    if (sgpa >= 4) return 'C';
    return 'F';
  };

  const validateForm = () => {
    const errors = [];

    // Personal Info
    if (!formData.name?.trim()) errors.push('Full Name is required');
    if (!formData.email?.trim()) errors.push('Email is required');
    if (!formData.mobile?.trim()) errors.push('Mobile number is required');

    // Parent Info (required for students)
    if (user?.role?.toLowerCase() === 'student') {
      if (!formData.parentName?.trim()) errors.push('Parent Name is required');
      if (!formData.parentEmail?.trim()) errors.push('Parent Email is required');
      if (!formData.parentPhone?.trim()) errors.push('Parent Phone is required');
    }

    // Academic Info (for students)
    if (user?.role?.toLowerCase() === 'student') {
      if (!formData.class) errors.push('Class is required');
      if (!formData.section) errors.push('Section is required');
      if (!formData.rollNo?.trim()) errors.push('Roll No is required');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    if (user?.role?.toLowerCase() === 'student' && formData.parentEmail && !emailRegex.test(formData.parentEmail)) {
      errors.push('Please enter a valid parent email address');
    }

    // Phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (formData.mobile && !phoneRegex.test(formData.mobile.replace(/\D/g, ''))) {
      errors.push('Mobile number must be 10 digits');
    }
    if (user?.role?.toLowerCase() === 'student' && formData.parentPhone && !phoneRegex.test(formData.parentPhone.replace(/\D/g, ''))) {
      errors.push('Parent phone number must be 10 digits');
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }
    
    try {
      const userId = user?.id || user?.uid;
      if (!userId) {
        toast.error('User ID not found');
        return;
      }

      // Check for duplicate phone number
      const mobileQueries = [
        query(collection(db, 'users'), where('mobile', '==', formData.mobile)),
        query(collection(db, 'users'), where('phone', '==', formData.mobile)),
        query(collection(db, 'users'), where('contact', '==', formData.mobile))
      ];
      
      const querySnapshots = await Promise.all(mobileQueries.map(q => getDocs(q)));
      const isDuplicate = querySnapshots.some(snap => 
        snap.docs.some(doc => doc.id !== userId)
      );
      
      if (isDuplicate) {
        toast.error('This phone number is already linked to another account.');
        return;
      }

      await updateUser(userId, formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      mobile: user?.phone || user?.mobile || '',
      parentName: user?.parentName || '',
      parentEmail: user?.parentEmail || '',
      parentPhone: user?.parentPhone || '',
      class: user?.class || '',
      section: user?.section || '',
      rollNo: user?.rollNo || '',
      avatar: user?.avatar || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">My Profile</h1>
          <p className="text-text-secondary text-sm">View and manage your personal information.</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl border border-border text-text-secondary hover:bg-surface-elevated transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-[32px] border border-border"
      >
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <Avatar
              src={formData.avatar || user?.avatar}
              fallback={user?.name?.charAt(0) || 'U'}
              className="w-32 h-32 rounded-2xl text-4xl"
            />
            {isEditing && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({ ...formData, avatar: reader.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  id="profile-avatar-upload"
                />
                <label
                  htmlFor="profile-avatar-upload"
                  className="absolute bottom-0 right-0 p-2 rounded-xl bg-primary text-white hover:bg-primary/80 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </label>
              </>
            )}
          </div>
          <h2 className="text-2xl font-bold text-text-primary mt-4">{user?.name}</h2>
          <p className="text-text-secondary capitalize">{user?.role}</p>
          {user?.class && (
            <span className="mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              Class {user.class}{user?.section ? `-${user.section}` : ''}
            </span>
          )}
        </div>

        {/* Info Grid */}
        <div className={`grid grid-cols-1 gap-6 ${user?.role?.toLowerCase() === 'student' ? 'md:grid-cols-2' : 'max-w-2xl'}`}>
          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">
              Personal Information {user?.role?.toLowerCase() === 'student' && <span className="text-danger">*</span>}
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs text-text-muted">
                Full Name {user?.role?.toLowerCase() === 'student' && <span className="text-danger">*</span>}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:border-primary/50 outline-none"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
                  <User className="w-4 h-4 text-text-muted" />
                  <span className="text-text-primary">{user?.name || 'Not set'}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-text-muted">
                Email {user?.role?.toLowerCase() === 'student' && <span className="text-danger">*</span>}
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:border-primary/50 outline-none"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
                  <Mail className="w-4 h-4 text-text-muted" />
                  <span className="text-text-primary">{user?.email || 'Not set'}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-text-muted">
                Phone {user?.role?.toLowerCase() === 'student' && <span className="text-danger">*</span>}
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:border-primary/50 outline-none"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
                  <Phone className="w-4 h-4 text-text-muted" />
                  <span className="text-text-primary">{user?.phone || user?.mobile || 'Not set'}</span>
                </div>
              )}
            </div>
          </div>

          {user?.role?.toLowerCase() === 'student' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">
              Parent Information <span className="text-danger">*</span>
            </h3>

            <div className="space-y-2">
              <label className="text-xs text-text-muted">
                Parent Name <span className="text-danger">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:border-primary/50 outline-none"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
                  <User className="w-4 h-4 text-text-muted" />
                  <span className="text-text-primary">{user?.parentName || 'Not set'}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-text-muted">
                Parent Email <span className="text-danger">*</span>
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:border-primary/50 outline-none"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
                  <Mail className="w-4 h-4 text-text-muted" />
                  <span className="text-text-primary">{user?.parentEmail || 'Not set'}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-text-muted">
                Parent Phone <span className="text-danger">*</span>
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:border-primary/50 outline-none"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
                  <Phone className="w-4 h-4 text-text-muted" />
                  <span className="text-text-primary">{user?.parentPhone || user?.parentContact || 'Not set'}</span>
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Academic Performance - Only for students */}
        {user?.role?.toLowerCase() === 'student' && calculateSGPA() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 pt-8 border-t border-border"
          >
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">
              Academic Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center">
                <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-text-muted">Overall Average</p>
                <p className="text-2xl font-bold text-text-primary">{calculateSGPA()?.percentage}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20 text-center">
                <GraduationCap className="w-6 h-6 text-success mx-auto mb-2" />
                <p className="text-xs text-text-muted">SGPA</p>
                <p className="text-2xl font-bold text-text-primary">{calculateSGPA()?.sgpa}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 text-center">
                <User className="w-6 h-6 text-warning mx-auto mb-2" />
                <p className="text-xs text-text-muted">Grade</p>
                <p className="text-2xl font-bold text-text-primary">{calculateSGPA()?.grade}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Additional Info */}
        {user?.role?.toLowerCase() === 'student' && (
          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">
              Academic Information {user?.role?.toLowerCase() === 'student' && <span className="text-danger">*</span>}
            </h3>
            
            {isEditing ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-text-muted">
                    Year <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:border-primary/50 outline-none"
                  >
                    <option value="">Select Year</option>
                    <option value="FE">FE - First Year</option>
                    <option value="SE">SE - Second Year</option>
                    <option value="TE">TE - Third Year</option>
                    <option value="BE">BE - Final Year</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-text-muted">
                    Section <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:border-primary/50 outline-none"
                  >
                    <option value="">Select Section</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-text-muted">
                    Roll No <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    placeholder="e.g. 001"
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:border-primary/50 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-surface-elevated border border-border text-center">
                  <GraduationCap className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-text-muted">Year</p>
                  <p className="font-bold text-text-primary">{user?.class || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-elevated border border-border text-center">
                  <User className="w-6 h-6 text-secondary mx-auto mb-2" />
                  <p className="text-xs text-text-muted">Division</p>
                  <p className="font-bold text-text-primary">{user?.section || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-elevated border border-border text-center">
                  <User className="w-6 h-6 text-success mx-auto mb-2" />
                  <p className="text-xs text-text-muted">Roll No</p>
                  <p className="font-bold text-text-primary">{user?.rollNo || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-elevated border border-border text-center">
                  <User className="w-6 h-6 text-warning mx-auto mb-2" />
                  <p className="text-xs text-text-muted">Student ID</p>
                  <p className="font-bold text-text-primary text-xs">{user?.uid?.slice(0, 8) || 'N/A'}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
