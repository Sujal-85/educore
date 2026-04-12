import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Phone, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Chrome,
  ArrowLeft
} from 'lucide-react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  doc, 
  getDoc, 
  setDoc,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  collection,
  query,
  where,
  getDocs
} from '../lib/firebase';
import { useAppStore } from '../store/useAppStore';
import { toast } from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setAuthUser } = useAppStore();
  const isSignup = location.pathname.includes('/signup');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    mobile: '',
    studentId: '',
    role: 'student',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    class: 'FE',
    section: 'A',
    rollNo: '',
    avatar: ''
  });

  useEffect(() => {
    if (user && user.isNew) {
      setStep(2);
      // Pre-fill name, email and avatar from Google/Auth
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        role: user.role || prev.role || 'student',
        avatar: user.avatar || user.photoURL || localStorage.getItem(`avatar_${user.uid}`) || prev.avatar
      }));
    } else if (user && !user.isNew) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // App.tsx listener will handle the rest
    } catch (error) {
      console.error('Google Auth Error:', error);
      const errorMessage = error.code === 'auth/popup-closed-by-user' 
        ? 'Sign-in popup was closed before completion.'
        : error.message || 'Authentication failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        // App.tsx listener will set user.isNew = true
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        // App.tsx listener will fetch user doc
      }
    } catch (error) {
      console.error('Email Auth Error:', error);
      let errorMessage = 'Authentication failed.';
      const errorCode = error.code || '';
      const errorMsg = error.message || '';

      if (errorCode === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use.';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = 'Password is too weak.';
      } else if (
        errorCode === 'auth/user-not-found' || 
        errorCode === 'auth/wrong-password' || 
        errorCode === 'auth/invalid-credential' ||
        errorMsg.includes('auth/invalid-credential')
      ) {
        errorMessage = 'Invalid email or password.';
      } else if (errorCode === 'auth/operation-not-allowed') {
        errorMessage = 'Email/Password authentication is not enabled in Firebase.';
      } else {
        errorMessage = errorMsg || 'Authentication failed.';
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    const isStudent = formData.role === 'student';
    if (!formData.mobile || (isStudent && !formData.studentId)) {
      toast.error(isStudent ? 'Please fill all fields' : 'Mobile number is required');
      return;
    }

    setLoading(true);
    try {
      // 1. Check if a document already exists with this UID
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      // 2. Check for existing student records by mobile/email (added by teacher)
      const existingQueries = [
        query(collection(db, 'users'), where('email', '==', user.email)),
        query(collection(db, 'users'), where('mobile', '==', formData.mobile)),
        query(collection(db, 'users'), where('phone', '==', formData.mobile)),
        query(collection(db, 'users'), where('contact', '==', formData.mobile))
      ];
      
      const querySnapshots = await Promise.all(existingQueries.map(q => getDocs(q)));
      let existingDoc = null;
      
      for (const snap of querySnapshots) {
        if (!snap.empty) {
          const match = snap.docs.find(d => d.id !== user.uid);
          if (match) {
            existingDoc = match;
            break;
          }
        }
      }

      // 3. Handle Duplicate Logic
      if (existingDoc) {
        const data = existingDoc.data();
        if (data.email === user.email) {
          // It's the same person (teacher pre-added them). Merge.
          toast.loading('Syncing your academic record...', { id: 'auth-sync' });
          const mergedData = {
            ...data,
            ...formData,
            uid: user.uid,
            email: user.email,
            avatar: formData.avatar || user.avatar || user.photoURL || data.avatar || '',
            updatedAt: new Date().toISOString()
          };
          
          await setDoc(userRef, mergedData);
          await deleteDoc(doc(db, 'users', existingDoc.id));
          toast.success('Found your record! Academic data synced.', { id: 'auth-sync' });
          setAuthUser(mergedData);
          navigate('/dashboard');
          return;
        } else {
          // Different email but same phone number. Block.
          toast.error('This phone number is already linked to another account.');
          setLoading(false);
          return;
        }
      }

      console.log('Creating user document for:', user.uid);
      const userData = {
        uid: user.uid,
        email: user.email,
        name: formData.name || user.name || user.email.split('@')[0],
        mobile: formData.mobile,
        studentId: formData.studentId,
        role: formData.role,
        avatar: formData.avatar || user.avatar || user.photoURL || formData.name?.charAt(0) || 'U',
        createdAt: new Date().toISOString(),
        behaviorScore: 100,
        attendance: 100,
        marks: {
          'Unit Test 1': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 },
          'Unit Test 2': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 },
          'Final': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 }
        },
        class: formData.class || 'FE',
        section: formData.section || 'A',
        rollNo: formData.studentId || formData.rollNo || '',
        // Parent contact details for notifications
        parentName: formData.parentName || '',
        parentEmail: formData.parentEmail || '',
        parentPhone: formData.parentPhone || ''
      };

      console.log('User data to save:', userData);
      if (formData.avatar && formData.avatar.startsWith('data:image/')) {
        localStorage.setItem(`avatar_${user.uid}`, formData.avatar);
      }
      
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('User document created successfully');
      setAuthUser(userData);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-primary/20 overflow-hidden p-1">
              <img src="https://famt.ac.in/tnp/wp-content/uploads/2021/09/cropped-new-logo.png" alt="FAMT Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <span className="text-xl sm:text-2xl font-bold font-display tracking-tight text-text-primary">FAMT Edu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-text-primary">
            {step === 1 ? (isSignup ? 'Create Account' : 'Welcome Back') : 'Complete Profile'}
          </h1>
          <p className="text-text-secondary text-sm mt-2 px-2">
            {step === 1
              ? (isSignup ? 'Join the future of education management.' : 'Sign in to access your dashboard.')
              : 'We need a few more details to get you started.'}
          </p>
        </div>

        <div className="glass p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-border shadow-2xl">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <button
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-surface-elevated text-text-primary font-bold flex items-center justify-center gap-3 hover:bg-surface-elevated/80 transition-all shadow-lg disabled:opacity-50 border border-border"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>

                <div className="relative flex items-center gap-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input 
                      type="email" 
                      placeholder="Email Address"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-surface-elevated border border-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-text-primary"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input 
                      type="password" 
                      placeholder="Password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-surface-elevated border border-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-text-primary"
                    />
                  </div>
                  {isSignup && (
                    <div className="flex gap-4">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, role: 'student'})}
                        className={clsx(
                          "flex-1 py-3 rounded-xl border transition-all text-xs font-bold",
                          formData.role === 'student' ? "bg-primary/10 border-primary text-primary" : "border-border text-text-muted"
                        )}
                      >
                        Student
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, role: 'teacher'})}
                        className={clsx(
                          "flex-1 py-3 rounded-xl border transition-all text-xs font-bold",
                          formData.role === 'teacher' ? "bg-secondary/10 border-secondary text-secondary" : "border-border text-text-muted"
                        )}
                      >
                        Teacher
                      </button>
                    </div>
                  )}
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSignup ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>

                <p className="text-center text-sm text-text-secondary">
                  {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button 
                    onClick={() => navigate(isSignup ? '/login' : '/signup')}
                    className="text-primary font-bold hover:underline"
                  >
                    {isSignup ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleCompleteProfile}
                className="space-y-6"
              >
                <div className="space-y-4">
                  {/* Role Selection in Step 2 */}
                  <div className="flex gap-4 p-1 bg-surface-elevated rounded-2xl border border-border">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, role: 'student'})}
                      className={clsx(
                        "flex-1 py-3 rounded-xl transition-all text-xs font-bold",
                        formData.role === 'student' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-muted hover:text-text-primary"
                      )}
                    >
                      Student
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, role: 'teacher'})}
                      className={clsx(
                        "flex-1 py-3 rounded-xl transition-all text-xs font-bold",
                        formData.role === 'teacher' ? "bg-secondary text-white shadow-lg shadow-secondary/20" : "text-text-muted hover:text-text-primary"
                      )}
                    >
                      Teacher
                    </button>
                  </div>

                  {/* Avatar Display */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative group">
                      <Avatar 
                        src={formData.avatar} 
                        fallback={formData.name?.charAt(0) || 'U'}
                        size="lg"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-text-primary">Profile Image</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">
                        {formData.avatar?.startsWith('data:image') ? 'Custom Upload' : formData.avatar ? 'From Google' : 'Auto-Generated'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 1024 * 1024) {
                            toast.error('File too large (max 1MB)');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({...formData, avatar: reader.result});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-primary/80 transition-all shadow-md active:scale-95"
                    >
                      Change
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <input
                        type="text"
                        placeholder={formData.role === 'teacher' ? "Full Name" : "Student Name"}
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-surface-elevated border border-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-text-primary"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <input
                        type="tel"
                        placeholder="Mobile Number"
                        required
                        value={formData.mobile}
                        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                        className="w-full bg-surface-elevated border border-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-text-primary"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      placeholder={formData.role === 'teacher' ? "Staff ID (Optional)" : "Student ID / Roll No"}
                      required={formData.role === 'student'}
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                      className="w-full bg-surface-elevated border border-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-text-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={formData.class}
                      onChange={(e) => setFormData({...formData, class: e.target.value})}
                      className="w-full bg-surface-elevated border border-border rounded-2xl py-4 px-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-text-primary"
                    >
                      <option value="FE">FE - First Year</option>
                      <option value="SE">SE - Second Year</option>
                      <option value="TE">TE - Third Year</option>
                      <option value="BE">BE - Final Year</option>
                    </select>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({...formData, section: e.target.value})}
                      className="w-full bg-surface-elevated border border-border rounded-2xl py-4 px-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-text-primary"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>

                  {/* Parent Contact Details */}
                  {formData.role === 'student' && (
                    <div className="border-t border-border pt-4 mt-4">
                      <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Parent/Guardian Details</p>
                      <div className="space-y-3">
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                          <input
                            type="text"
                            placeholder="Parent/Guardian Name"
                            value={formData.parentName}
                            onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                            className="w-full bg-surface-elevated border border-border rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-text-primary"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input
                              type="email"
                              placeholder="Parent Email"
                              value={formData.parentEmail}
                              onChange={(e) => setFormData({...formData, parentEmail: e.target.value})}
                              className="w-full bg-surface-elevated border border-border rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-text-primary"
                            />
                          </div>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input
                              type="tel"
                              placeholder="Parent Phone"
                              value={formData.parentPhone}
                              onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
                              className="w-full bg-surface-elevated border border-border rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-text-primary"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {formData.role === 'student' && (
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Parent contact details are used to send important notifications, academic reports, and attendance alerts.
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 rounded-2xl glass border border-border font-bold flex items-center justify-center gap-2 hover:bg-surface-elevated transition-all text-text-primary"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-4 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Complete
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
