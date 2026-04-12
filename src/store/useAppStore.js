import { create } from 'zustand';
import toast from 'react-hot-toast';
import { 
  db,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  updateDoc,
  deleteDoc,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';

export const useAppStore = create((set, get) => ({
  students: [],
  teachers: [],
  notifications: [],
  assignments: [],
  books: [],
  issuedBooks: [],
  bookRequests: [],
  attendance: [],
  studyPlans: [],
  behaviorIncidents: [],
  feePayments: [],
  submissions: [],
  timetable: {},
  notices: [],
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  isMobile: window.innerWidth < 1024,
  theme: localStorage.getItem('theme') || 'dark',
  user: null,
  authLoading: true,
  unsubs: [],
  emailDraft: null, // { to, cc, subject, body, templateKey, context }
  
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  
  setAuthUser: (user) => {
    const { unsubs } = get();
    // Cleanup existing listeners
    unsubs.forEach(unsub => unsub());
    
    set({ user, authLoading: false, unsubs: [] });
    if (user) {
      get().initData();
    }
  },
  
  setAuthLoading: (loading) => set({ authLoading: loading }),
  
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  
  setIsMobile: (isMobile) => set({ isMobile }),
  
  setEmailDraft: (draft) => set({ emailDraft: draft }),
  
  initData: () => {
    const { user } = get();
    if (!user) return;

    const isTeacher = user.role?.toLowerCase() === 'teacher';

    // Listen for students and teachers (users collection)
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Total users fetched:', usersData.length);
      
      // Filter students: must have role 'student' and NOT be a known teacher email
      const studentsData = usersData.filter(u => {
        const role = (u.role || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const isTeacherEmail = email === 'khedekarsujay720@gmail.com' || 
                               email === 'teacher@educore.edu' || 
                               email.endsWith('@famt.ac.in');
        return role === 'student' && !isTeacherEmail;
      });

      // Filter teachers: must have role 'teacher' OR be a known teacher email
      const teachersData = usersData.filter(u => {
        const role = (u.role || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const isTeacherEmail = email === 'khedekarsujay720@gmail.com' || 
                               email === 'teacher@educore.edu' || 
                               email.endsWith('@famt.ac.in');
        return role === 'teacher' || isTeacherEmail;
      });

      console.log('Students:', studentsData.length, 'Teachers:', teachersData.length);
      set({ students: studentsData, teachers: teachersData });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    // Listen for notifications - filter by userId for students
    const notificationsQuery = isTeacher 
      ? collection(db, 'notifications')
      : query(collection(db, 'notifications'), where('userId', '==', user.uid));

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ notifications: notificationsData });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    });

    // Listen for assignments
    const unsubscribeAssignments = onSnapshot(collection(db, 'assignments'), (snapshot) => {
      const assignmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ assignments: assignmentsData });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'assignments');
    });

    // Listen for books
    const unsubscribeBooks = onSnapshot(collection(db, 'books'), (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ books: booksData });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'books');
    });

    // Listen for issued books
    const unsubscribeIssuedBooks = onSnapshot(collection(db, 'issuedBooks'), (snapshot) => {
      const issuedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ issuedBooks: issuedData });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'issuedBooks');
    });

    // Listen for book requests
    const unsubscribeBookRequests = onSnapshot(collection(db, 'bookRequests'), (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ bookRequests: requestsData });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'bookRequests');
    });

    // Listen for timetable
    const unsubscribeTimetable = onSnapshot(collection(db, 'timetable'), (snapshot) => {
      const timetableData = {};
      snapshot.docs.forEach(doc => {
        timetableData[doc.id] = doc.data().schedule;
      });
      set({ timetable: timetableData });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'timetable');
    });

    // Listen for attendance
    const unsubscribeAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      const attendanceData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ attendance: attendanceData });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'attendance');
    });

    // Listen for study plans
    const unsubscribeStudyPlans = onSnapshot(collection(db, 'studyPlans'), (snapshot) => {
      const studyPlansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ studyPlans: studyPlansData });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'studyPlans');
    });

    // Listen for behavior incidents
    const unsubscribeBehaviorIncidents = onSnapshot(collection(db, 'behaviorIncidents'), (snapshot) => {
      const behaviorIncidentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ behaviorIncidents: behaviorIncidentsData });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'behaviorIncidents');
    });

    // Listen for fee payments - filter by studentId for students
    const feePaymentsQuery = isTeacher
      ? collection(db, 'feePayments')
      : query(collection(db, 'feePayments'), where('studentId', '==', user.uid));

    const unsubscribeFeePayments = onSnapshot(feePaymentsQuery, (snapshot) => {
      const feePaymentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ feePayments: feePaymentsData });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'feePayments');
    });

    // Listen for submissions
    const submissionsQuery = isTeacher
      ? collection(db, 'submissions')
      : query(collection(db, 'submissions'), where('studentId', '==', user.uid));

    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ submissions: submissionsData });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'submissions');
    });

    // Listen for notices - all users get all notices, filtering happens in UI
    const noticesQuery = collection(db, 'notices');

    const unsubscribeNotices = onSnapshot(noticesQuery, (snapshot) => {
      const noticesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ notices: noticesData });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notices');
    });

    // Handle resize for mobile detection
  window.addEventListener('resize', () => {
    const isMobile = window.innerWidth < 1024;
    set({ isMobile });
    if (!isMobile) {
      set({ mobileMenuOpen: false });
    }
  });

  const currentUnsubs = [
      unsubscribeUsers,
      unsubscribeNotifications,
      unsubscribeAssignments,
      unsubscribeBooks,
      unsubscribeIssuedBooks,
      unsubscribeBookRequests,
      unsubscribeTimetable,
      unsubscribeAttendance,
      unsubscribeStudyPlans,
      unsubscribeBehaviorIncidents,
      unsubscribeFeePayments,
      unsubscribeSubmissions,
      unsubscribeNotices
    ];

    set({ unsubs: currentUnsubs });

    return () => {
      currentUnsubs.forEach(unsub => unsub());
    }
  },

  seedDemoData: async () => {
    const { user } = get();
    if (!user || user.role?.toLowerCase() !== 'teacher') {
      toast.error('Only teachers can seed demo data');
      return;
    }

    const demoStudents = [
      {
        name: 'Aravind Swamy',
        studentId: 'STU001',
        rollNo: '1',
        class: 'SE',
        section: 'A',
        email: 'aravind@example.com',
        parentName: 'Swamy K.',
        contact: '9876543210',
        attendance: 92,
        behaviorScore: 95,
        feeStatus: 'Paid',
        marks: {
          'Unit Test 1': { mathematics: 17, physics: 18, chemistry: 17, basic_electrical: 16, programming: 18 },
          'Unit Test 2': { mathematics: 16, physics: 18, chemistry: 17, basic_electrical: 16, programming: 19 },
          'Final': { mathematics: 70, physics: 74, chemistry: 72, basic_electrical: 68, programming: 76 }
        }
      },
      {
        name: 'Priya Sharma',
        studentId: 'STU002',
        rollNo: '2',
        class: 'SE',
        section: 'A',
        email: 'priya@example.com',
        parentName: 'Rajesh Sharma',
        contact: '9876543211',
        attendance: 88,
        behaviorScore: 98,
        feeStatus: 'Pending',
        marks: {
          'Unit Test 1': { mathematics: 18, physics: 17, chemistry: 19, basic_electrical: 18, programming: 18 },
          'Unit Test 2': { mathematics: 19, physics: 17, chemistry: 18, basic_electrical: 19, programming: 18 }
        }
      },
      {
        name: 'Rahul Verma',
        studentId: 'STU003',
        rollNo: '3',
        class: 'FE',
        section: 'B',
        email: 'rahul@example.com',
        parentName: 'Sanjay Verma',
        contact: '9876543212',
        attendance: 75,
        behaviorScore: 85,
        feeStatus: 'Paid',
        marks: {
          'Unit Test 1': { mathematics: 15, physics: 16, chemistry: 15, basic_electrical: 16, programming: 17 },
          'Unit Test 2': { mathematics: 16, physics: 16, chemistry: 17, basic_electrical: 16, programming: 17 }
        }
      }
    ];

    const demoBooks = [
      { title: 'Organic Chemistry', author: 'Dr. Robert Smith', subject: 'Science', color: '#FF5733', status: 'Available' },
      { title: 'Advanced Calculus', author: 'Prof. James Green', subject: 'Math', color: '#33FF57', status: 'Available' },
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', subject: 'English', color: '#3357FF', status: 'Available' },
      { title: 'Modern Physics', author: 'Dr. Alan Walker', subject: 'Science', color: '#F333FF', status: 'Available' }
    ];

    const demoAssignments = [
      {
        title: 'Trigonometry Basics',
        subject: 'Mathematics',
        class: '10',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        maxMarks: 50,
        description: 'Complete the exercises from chapter 4.',
        submissions: '0/30',
        status: 'Pending'
      }
    ];

    try {
      // Seed Students
      const studentPromises = demoStudents.map(student => {
        const newDoc = doc(collection(db, 'users'));
        return setDoc(newDoc, { 
          ...student, 
          role: 'student', 
          uid: newDoc.id,
          createdAt: new Date().toISOString() 
        });
      });

      // Seed Books
      const bookPromises = demoBooks.map(book => {
        const newDoc = doc(collection(db, 'books'));
        return setDoc(newDoc, { ...book, createdAt: new Date().toISOString() });
      });

      // Seed Assignments
      const assignmentPromises = demoAssignments.map(assignment => {
        const newDoc = doc(collection(db, 'assignments'));
        return setDoc(newDoc, { ...assignment, createdAt: new Date().toISOString() });
      });

      await Promise.all([...studentPromises, ...bookPromises, ...assignmentPromises]);
      toast.success('Demo data seeded successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seed');
    }
  },
  
  addStudent: async (student) => {
    const path = 'users';
    try {
      const newDoc = student.uid ? doc(db, path, student.uid) : doc(collection(db, path));
      const studentData = { 
        ...student, 
        role: 'student', 
        uid: student.uid || newDoc.id,
        createdAt: new Date().toISOString(),
        marks: student.marks || {
          'Unit Test 1': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 },
          'Unit Test 2': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 },
          'Final': { mathematics: 0, physics: 0, chemistry: 0, basic_electrical: 0, programming: 0 }
        }
      };
      await setDoc(newDoc, studentData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
  
  updateStudent: async (id, updatedData) => {
    const path = `users/${id}`;
    try {
      if (updatedData.avatar && updatedData.avatar.startsWith('data:image/')) {
        localStorage.setItem(`avatar_${id}`, updatedData.avatar);
      }
      await updateDoc(doc(db, 'users', id), updatedData);
      
      // Update local user state if it's the current user
      const currentUser = get().user;
      if (currentUser && (currentUser.id === id || currentUser.uid === id)) {
        set({ user: { ...currentUser, ...updatedData } });
      }
      toast.success('Student updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },
  
  updateUser: async (userId, updatedData) => {
    if (!userId) {
      toast.error('User ID is required');
      return;
    }
    const path = `users/${userId}`;
    try {
      if (updatedData.avatar && updatedData.avatar.startsWith('data:image/')) {
        localStorage.setItem(`avatar_${userId}`, updatedData.avatar);
      }
      await setDoc(doc(db, path), updatedData, { merge: true });
      // Update local user state
      const currentUser = get().user;
      if (currentUser && (currentUser.id === userId || currentUser.uid === userId)) {
        set({ user: { ...currentUser, ...updatedData } });
      }
      toast.success('Profile updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
  
  addNotification: async (notification) => {
    const path = 'notifications';
    try {
      const newDoc = doc(collection(db, path));
      await setDoc(newDoc, { ...notification, read: false, createdAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  markNotificationAsRead: async (id) => {
    const path = `notifications/${id}`;
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },
  
  clearNotifications: () => set({ notifications: [] }),
  
  deleteStudent: async (id) => {
    const path = `users/${id}`;
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  addAssignment: async (assignment, file) => {
    const path = 'assignments';
    try {
      let fileUrl = null;
      let fileName = null;

      if (file) {
        const storageRef = ref(storage, `assignments/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(snapshot.ref);
        fileName = file.name;
      }

      const newDoc = doc(collection(db, path));
      await setDoc(newDoc, { 
        ...assignment, 
        fileUrl,
        fileName,
        submissions: '0/30', 
        status: 'Pending', 
        createdAt: new Date().toISOString() 
      });
      // Notify all students
      const { students } = get();
      students.forEach(s => {
        get().addNotification({
          userId: s.uid,
          title: 'New Assignment',
          message: `New assignment: ${assignment.title} for ${assignment.subject}`,
          type: 'assignment'
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  updateAssignment: async (id, updatedData) => {
    const path = `assignments/${id}`;
    try {
      await updateDoc(doc(db, 'assignments', id), updatedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deleteAssignment: async (id) => {
    const path = `assignments/${id}`;
    try {
      await deleteDoc(doc(db, 'assignments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  addBook: async (book) => {
    const path = 'books';
    try {
      const newDoc = doc(collection(db, path));
      await setDoc(newDoc, { ...book, createdAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  updateBook: async (id, updatedData) => {
    const path = `books/${id}`;
    try {
      await updateDoc(doc(db, 'books', id), updatedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  requestBookIssue: async (bookId, userId, userName) => {
    const path = 'bookRequests';
    try {
      const newDoc = doc(collection(db, path));
      const book = get().books.find(b => b.id === bookId);
      await setDoc(newDoc, {
        bookId,
        bookTitle: book.title,
        studentId: userId,
        studentName: userName,
        type: 'Issue',
        status: 'Pending',
        createdAt: new Date().toISOString()
      });

      // Notify teachers
      const { teachers } = get();
      teachers.forEach(t => {
        get().addNotification({
          userId: t.uid,
          title: 'New Book Request',
          message: `${userName} requested to issue "${book.title}"`,
          type: 'library'
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  handleBookRequest: async (requestId, action) => {
    const path = `bookRequests/${requestId}`;
    try {
      const request = get().bookRequests.find(r => r.id === requestId);
      if (!request) return;

      if (action === 'Approve') {
        if (request.type === 'Issue') {
          // Add to issuedBooks
          const issueId = doc(collection(db, 'issuedBooks')).id;
          const issueDate = new Date();
          const dueDate = new Date();
          dueDate.setDate(issueDate.getDate() + 14); // 14 days loan

          await setDoc(doc(db, 'issuedBooks', issueId), {
            bookId: request.bookId,
            bookTitle: request.bookTitle,
            studentId: request.studentId,
            studentName: request.studentName,
            issueDate: issueDate.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'Active'
          });

          // Update book status
          await updateDoc(doc(db, 'books', request.bookId), { status: 'Issued' });
        } else if (request.type === 'Return') {
          // Find issued record and delete/update
          const issuedRecord = get().issuedBooks.find(ib => ib.bookId === request.bookId && ib.studentId === request.studentId);
          if (issuedRecord) {
            await deleteDoc(doc(db, 'issuedBooks', issuedRecord.id));
          }
          // Update book status
          await updateDoc(doc(db, 'books', request.bookId), { status: 'Available' });
        } else if (request.type === 'Renew') {
          const issuedRecord = get().issuedBooks.find(ib => ib.bookId === request.bookId && ib.studentId === request.studentId);
          if (issuedRecord) {
            const currentDueDate = new Date(issuedRecord.dueDate);
            currentDueDate.setDate(currentDueDate.getDate() + 14);
            await updateDoc(doc(db, 'issuedBooks', issuedRecord.id), { 
              dueDate: currentDueDate.toISOString().split('T')[0] 
            });
          }
        }

        await updateDoc(doc(db, 'bookRequests', requestId), { status: 'Approved' });
        
        // Notify student
        get().addNotification({
          userId: request.studentId,
          title: `Book ${request.type} Approved`,
          message: `Your request for "${request.bookTitle}" has been approved.`,
          type: 'library'
        });

      } else {
        await updateDoc(doc(db, 'bookRequests', requestId), { status: 'Rejected' });
        // Notify student
        get().addNotification({
          userId: request.studentId,
          title: `Book ${request.type} Rejected`,
          message: `Your request for "${request.bookTitle}" was not approved.`,
          type: 'library'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  requestBookAction: async (bookId, userId, userName, type) => {
    const path = 'bookRequests';
    try {
      const book = get().books.find(b => b.id === bookId) || get().issuedBooks.find(ib => ib.bookId === bookId);
      const newDoc = doc(collection(db, path));
      await setDoc(newDoc, {
        bookId,
        bookTitle: book.bookTitle || book.title,
        studentId: userId,
        studentName: userName,
        type, // 'Return' or 'Renew'
        status: 'Pending',
        createdAt: new Date().toISOString()
      });

      // Notify teachers
      const { teachers } = get();
      teachers.forEach(t => {
        get().addNotification({
          userId: t.uid,
          title: `New Book ${type} Request`,
          message: `${userName} requested to ${type.toLowerCase()} "${book.bookTitle || book.title}"`,
          type: 'library'
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  updateStudentMarks: async (studentId, marks, examType) => {
    const path = `users/${studentId}`;
    try {
      const student = get().students.find(s => s.id === studentId);
      const currentMarks = student?.marks || {};
      await updateDoc(doc(db, 'users', studentId), { 
        marks: { ...currentMarks, [examType]: marks } 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  updateStudentFeeStatus: async (studentId, feeStatus) => {
    const path = `users/${studentId}`;
    try {
      await updateDoc(doc(db, 'users', studentId), { feeStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  recordFeePayment: async (studentId, payment) => {
    const path = 'feePayments';
    try {
      const newDoc = doc(collection(db, path));
      await setDoc(newDoc, { ...payment, studentId, createdAt: new Date().toISOString() });
      
      const student = get().students.find(s => s.id === studentId);
      if (student) {
        get().addNotification({
          userId: student.uid,
          title: 'Fee Payment Recorded',
          message: `Your payment of ₹${payment.amount} has been recorded.`,
          type: 'fee'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  updateTimetable: async (classId, schedule) => {
    const path = `timetable/${classId}`;
    try {
      await setDoc(doc(db, 'timetable', classId), { schedule });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  submitAttendance: async (date, classId, data) => {
    const path = 'attendance';
    try {
      if (!classId || !Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid attendance payload');
      }

      const normalizedData = data.map((entry) => ({
        id: entry.id,
        name: entry.name || 'Unknown Student',
        rollNo: entry.rollNo ?? '',
        status: entry.status || 'P'
      }));

      const id = `${date}_${classId}`;
      await setDoc(doc(db, 'attendance', id), {
        date,
        classId,
        data: normalizedData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  saveStudyPlan: async (studentId, plan) => {
    const path = 'studyPlans';
    try {
      const newDoc = doc(collection(db, path));
      await setDoc(newDoc, { ...plan, studentId, createdAt: new Date().toISOString() });
      
      const student = get().students.find(s => s.id === studentId);
      if (student) {
        get().addNotification({
          userId: student.uid,
          title: 'New Study Plan',
          message: 'A new AI study plan has been generated for you.',
          type: 'study'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  submitAssignment: async (assignmentId, studentId, file) => {
    const path = `submissions`;
    try {
      let fileUrl = null;
      let fileName = null;

      if (file) {
        const storageRef = ref(storage, `submissions/${assignmentId}/${studentId}_${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(snapshot.ref);
        fileName = file.name;
      }

      const submissionId = `${assignmentId}_${studentId}`;
      await setDoc(doc(db, 'submissions', submissionId), {
        assignmentId,
        studentId,
        fileUrl,
        fileName,
        submittedAt: new Date().toISOString(),
        status: 'Submitted'
      });

      // Update assignment submission count
      const assignmentRef = doc(db, 'assignments', assignmentId);
      const assignmentSnap = await getDoc(assignmentRef);
      if (assignmentSnap.exists()) {
        const currentData = assignmentSnap.data();
        const submissionsStr = currentData.submissions || '0/30';
        const [count, total] = submissionsStr.split('/').map(Number);
        await updateDoc(assignmentRef, { 
          submissions: `${count + 1}/${total}`
        });
      }

      // Add notification for teacher
      const { teachers } = get();
      teachers.forEach(t => {
        get().addNotification({
          userId: t.uid,
          title: 'New Assignment Submission',
          message: `A student has submitted an assignment.`,
          type: 'assignment'
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  gradeSubmission: async (assignmentId, studentId, gradeData) => {
    const submissionId = `${assignmentId}_${studentId}`;
    const path = `submissions/${submissionId}`;
    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        ...gradeData,
        status: 'Graded',
        gradedAt: new Date().toISOString()
      });

      // Notify student
      const student = get().students.find(s => s.uid === studentId);
      if (student) {
        get().addNotification({
          userId: studentId,
          title: 'Assignment Graded',
          message: `Your assignment has been graded. Score: ${gradeData.score}`,
          type: 'assignment'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  logBehaviorIncident: async (studentId, incident) => {
    const path = 'behaviorIncidents';
    try {
      const newDoc = doc(collection(db, path));
      await setDoc(newDoc, { ...incident, studentId, createdAt: new Date().toISOString() });
      
      const student = get().students.find(s => s.id === studentId);
      if (student) {
        const newScore = Math.max(0, Math.min(100, (student.behaviorScore || 100) + incident.scoreChange));
        await get().updateStudent(studentId, { behaviorScore: newScore });
        
        get().addNotification({
          userId: student.uid,
          title: 'Behavior Incident Logged',
          message: `A ${incident.type.toLowerCase()} incident was logged: ${incident.description}`,
          type: 'behavior'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Notice/Circular Management Functions
  createNotice: async (noticeData) => {
    const path = 'notices';
    try {
      // Ensure targetClasses includes 'All' when targetType is 'all'
      const finalNoticeData = {
        ...noticeData,
        targetClasses: noticeData.targetType === 'all' 
          ? ['All']
          : (noticeData.targetClasses || [])
      };
      const newDoc = doc(collection(db, path));
      await setDoc(newDoc, {
        ...finalNoticeData,
        id: newDoc.id,
        createdAt: new Date().toISOString(),
        createdBy: get().user?.uid,
        createdByName: get().user?.name
      });

      // Send notifications to target students and parents
      const { students, addNotification } = get();
      const targetStudents = students.filter(s => {
        if (noticeData.targetType === 'all') return true;
        if (noticeData.targetType === 'class') return noticeData.targetClasses?.includes(s.class);
        if (noticeData.targetType === 'section') return noticeData.targetClasses?.includes(`${s.class}-${s.section}`);
        if (noticeData.targetType === 'specific') return noticeData.targetStudents?.includes(s.id);
        return false;
      });

      // Notify students
      targetStudents.forEach(student => {
        addNotification({
          userId: student.uid,
          title: `New Notice: ${noticeData.title}`,
          message: noticeData.message?.substring(0, 100) + (noticeData.message?.length > 100 ? '...' : ''),
          type: 'notice'
        });

        // Email notification to parent if email exists
        if (student.parentEmail && noticeData.sendToParents) {
          import('../lib/emailTemplates').then(({ sendEmailDraft }) => {
            sendEmailDraft({
              to: student.parentEmail,
              templateKey: 'noticeToParents',
              context: {
                parentName: student.parentName || 'Parent',
                studentName: student.name,
                noticeTitle: noticeData.title,
                noticeMessage: noticeData.message,
                date: new Date().toLocaleDateString()
              }
            });
          });
        }
      });

      toast.success(`Notice sent to ${targetStudents.length} students`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  updateNotice: async (noticeId, updates) => {
    try {
      await updateDoc(doc(db, 'notices', noticeId), updates);
      toast.success('Notice updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notices');
    }
  },

  deleteNotice: async (noticeId) => {
    try {
      await deleteDoc(doc(db, 'notices', noticeId));
      toast.success('Notice deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'notices');
    }
  }
}));
