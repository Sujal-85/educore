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
          if (userDoc.exists()) {
            const data = userDoc.data();
            // Check if profile is incomplete (missing required fields for students)
            const isStudent = data.role?.toLowerCase() === 'student';
            const isIncomplete = isStudent && (
              !data.class || !data.section || !data.rollNo ||
              !data.parentName || !data.parentEmail || !data.parentPhone
            );

            setAuthUser({
              uid: firebaseUser.uid,
              ...data,
              name: data.name || firebaseUser.displayName || '',
              avatar: data.avatar || firebaseUser.photoURL || '',
              isNew: isIncomplete
            });
          } else {
            // User exists in Auth but not in Firestore yet (e.g. middle of signup)
            // Bootstrap the primary user or demo teacher as a teacher if they log in
            const isPrimary = firebaseUser.email === 'khedekarsujay720@gmail.com';
            const isDemoTeacher = firebaseUser.email === 'teacher@educore.edu';

            if (isPrimary || isDemoTeacher) {
              const userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: isPrimary ? (firebaseUser.displayName || 'Admin') : 'Demo Teacher',
                role: 'teacher',
                avatar: isPrimary ? (firebaseUser.photoURL || '👨‍🏫') : '👨‍🏫',
                createdAt: new Date().toISOString(),
                class: 'FE',
                section: 'A',
                marks: {
                  'Unit Test 1': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 },
                  'Unit Test 2': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 },
                  'Final': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 }
                }
              };
              await setDoc(doc(db, 'users', firebaseUser.uid), userData);
              setAuthUser(userData);
            } else {
              setAuthUser({ 
                uid: firebaseUser.uid, 
                email: firebaseUser.email, 
                name: firebaseUser.displayName || '',
                avatar: firebaseUser.photoURL || '',
                isNew: true 
              });
            }
          }
        } catch (error) {
          console.error('Firestore sync error:', error);
          // If Firestore fails (e.g. permissions), still set basic auth user so they aren't stuck
          setAuthUser({ uid: firebaseUser.uid, email: firebaseUser.email, isNew: true });
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
    </Router>
  );
}
