import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TeacherPortal = lazy(() => import('./pages/TeacherPortal'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const Profile = lazy(() => import('./pages/Profile'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Marks = lazy(() => import('./pages/Marks'));
const BehaviorScore = lazy(() => import('./pages/BehaviorScore'));
const StudyPlan = lazy(() => import('./pages/StudyPlan'));
const Assignments = lazy(() => import('./pages/Assignments'));
const Timetable = lazy(() => import('./pages/Timetable'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Reports = lazy(() => import('./pages/Reports'));

import EmailComposer from './components/ui/EmailComposer';
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const FeeManagement = lazy(() => import('./pages/FeeManagement'));
const Library = lazy(() => import('./pages/Library'));
const Notices = lazy(() => import('./pages/Notices'));
const Settings = lazy(() => import('./pages/Settings'));

import { onAuthStateChanged, auth, doc, getDoc, db, setDoc } from './lib/firebase';
import { useAppStore } from './store/useAppStore';

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
);

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAppStore();
  if (!user) return <Navigate to="/login" replace />;
  // If user is new (no Firestore doc yet), redirect to complete profile
  if (user.isNew) return <Navigate to="/signup" replace />;
  const userRole = user.role?.toLowerCase();
  if (roles && !roles.some(role => role.toLowerCase() === userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default function App() {
  const { user, authLoading, setAuthUser, theme } = useAppStore();

  React.useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (t) => {
      if (t === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        if (systemTheme === 'light') root.classList.add('light');
        else root.classList.remove('light');
      } else if (t === 'light') {
        root.classList.add('light');
      } else {
        root.classList.remove('light');
      }
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      const handler = () => applyTheme('system');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const isTeacherByEmail = 
            firebaseUser.email === 'khedekarsujay720@gmail.com' || 
            firebaseUser.email === 'teacher@educore.edu' || 
            firebaseUser.email?.endsWith('@famt.ac.in');

          if (userDoc.exists()) {
            const data = userDoc.data();
            // Force role correction for specific teacher emails
            const activeRole = isTeacherByEmail ? 'teacher' : (data.role || 'student');
            
            // Check if profile is complete
            const isIncomplete = !data.mobile || (activeRole === 'student' && (!data.class || !data.section));

            // Database avatar wins if present, otherwise check localStorage, then Google
            const dbAvatar = data.avatar || data.profilePic;
            const localAvatar = localStorage.getItem(`avatar_${firebaseUser.uid}`);
            const googleAvatar = firebaseUser.photoURL;
            const finalAvatar = dbAvatar || localAvatar || googleAvatar || '';

            // Sync avatar with localStorage if it's a base64 string and NOT already there
            if (dbAvatar && dbAvatar.startsWith('data:image/') && dbAvatar !== localAvatar) {
              localStorage.setItem(`avatar_${firebaseUser.uid}`, dbAvatar);
            }

            setAuthUser({
              uid: firebaseUser.uid,
              ...data,
              role: activeRole,
              name: data.name || firebaseUser.displayName || '',
              avatar: finalAvatar,
              isNew: isIncomplete
            });

            // Update role in Firestore if it was corrected
            if (activeRole !== data.role) {
              await updateDoc(doc(db, 'users', firebaseUser.uid), { role: activeRole });
            }
          } else {
            // New User or first-time login
            if (isTeacherByEmail) {
              const teacherData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || 'Teacher',
                role: 'teacher',
                avatar: firebaseUser.photoURL || '👨‍🏫',
                createdAt: new Date().toISOString()
              };
              await setDoc(doc(db, 'users', firebaseUser.uid), teacherData);
              setAuthUser(teacherData);
            } else {
              // New Student
              const googleAvatar = firebaseUser.photoURL;
              if (googleAvatar) {
                localStorage.setItem(`avatar_${firebaseUser.uid}`, googleAvatar);
              }

              setAuthUser({ 
                uid: firebaseUser.uid, 
                email: firebaseUser.email, 
                name: firebaseUser.displayName || '',
                role: 'student',
                avatar: googleAvatar || '',
                isNew: true 
              });
            }
          }
        } catch (error) {
          console.error('Auth sync error:', error);
        }
      } else {
        setAuthUser(null);
      }
    });

    return () => unsubscribe();
  }, [setAuthUser]);

  if (authLoading) return <PageLoader />;

  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1D24',
            color: '#F1F3F9',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
          },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={user ? (user.isNew ? <Navigate to="/signup" replace /> : <Navigate to="/dashboard" replace />) : <LandingPage />} />
          <Route path="/login" element={user ? (user.isNew ? <Navigate to="/signup" replace /> : <Navigate to="/dashboard" replace />) : <Auth />} />
          <Route path="/signup" element={user ? (user.isNew ? <Auth /> : <Navigate to="/dashboard" replace />) : <Auth />} />
          
          <Route element={user ? (user.isNew ? <Navigate to="/signup" replace /> : <Layout />) : <Navigate to="/login" replace />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherPortal />
              </ProtectedRoute>
            } />
            <Route path="/student/:id" element={<StudentProfile />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/marks" element={<Marks />} />
            <Route path="/behavior" element={<BehaviorScore />} />
            <Route path="/study-plans" element={<StudyPlan />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/fees" element={<FeeManagement />} />
            <Route path="/library" element={<Library />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <EmailComposer />
    </Router>
  );
}
