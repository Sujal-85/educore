import React, { useState } from 'react';
import { 
  Calendar, 
  Check, 
  X, 
  Clock, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Download,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';

import { downloadCSV } from '../lib/utils';

export default function Attendance() {
  const { students, user, submitAttendance, attendance: allAttendance, seedDemoData } = useAppStore();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [localAttendance, setLocalAttendance] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const isTeacher = user?.role?.toLowerCase() === 'teacher';

  const handleSeed = async () => {
    setIsSeeding(true);
    await seedDemoData();
    setIsSeeding(false);
  };

  const filteredStudents = students.filter(s => {
    const sClass = String(s.class || '');
    const sSection = String(s.section || '');
    const matchesClass = filterClass === 'All' || sClass === filterClass;
    const matchesSection = filterSection === 'All' || sSection === filterSection;
    const matchesUser = isTeacher || s.uid === user?.uid;
    return matchesClass && matchesSection && matchesUser;
  });

  // Fetch existing attendance for the selected date and class
  React.useEffect(() => {
    const classId = filterSection !== 'All' ? `${filterClass}-${filterSection}` : filterClass;
    const existing = allAttendance.find(a => a.date === selectedDate && a.classId === classId);
    if (existing) {
      setLocalAttendance(existing.data.reduce((acc, s) => ({ ...acc, [s.id]: s.status }), {}));
    } else {
      setLocalAttendance(filteredStudents.reduce((acc, s) => ({ ...acc, [s.id]: 'P' }), {}));
    }
  }, [selectedDate, filterClass, filterSection, allAttendance, students]);

  const handleMark = (id, status) => {
    if (!isTeacher) return;
    setLocalAttendance(prev => ({ ...prev, [id]: status }));
  };

  const markAllPresent = () => {
    const newAttendance = { ...localAttendance };
    filteredStudents.forEach(s => newAttendance[s.id] = 'P');
    setLocalAttendance(newAttendance);
    toast.success('All students marked as present');
  };

  const handleSubmit = async () => {
    if (filteredStudents.length === 0) {
      toast.error(filterClass === 'All' ? 'No students found to mark attendance.' : `No students found in Class ${filterClass}`);
      return;
    }
    setIsSubmitting(true);
    const data = filteredStudents.map(s => ({
      id: s.id,
      name: s.name,
      rollNo: s.rollNo,
      status: localAttendance[s.id] || 'P'
    }));
    
    const classId = filterSection !== 'All' ? `${filterClass}-${filterSection}` : filterClass;
    
    try {
      await submitAttendance(selectedDate, classId, data);
      toast.success('Attendance submitted successfully for ' + selectedDate);
    } catch (error) {
      console.error("Attendance Submission Error:", error);
      toast.error('Failed to submit attendance. Please check your connection and permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    const data = filteredStudents.map(s => ({
      Date: selectedDate,
      Name: s.name,
      RollNo: s.rollNo,
      Class: s.class,
      Status: localAttendance[s.id] === 'P' ? 'Present' : localAttendance[s.id] === 'A' ? 'Absent' : 'Late'
    }));
    downloadCSV(data, `Attendance_${selectedDate}_Class_${filterClass}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">Daily Attendance</h1>
          <p className="text-text-secondary text-sm">Mark and track student presence for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownload}
            className="p-2.5 rounded-xl glass hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all"
          >
            <Download className="w-5 h-5" />
          </button>
          {isTeacher && (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Submit Attendance
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="glass p-4 rounded-2xl border border-border flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:w-auto">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-surface-elevated border border-border rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all w-full text-text-primary"
          />
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <select 
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all min-w-[100px] flex-1 lg:flex-none text-text-primary"
          >
            <option value="All">All Classes</option>
            <option value="FE">FE - First Year</option>
            <option value="SE">SE - Second Year</option>
            <option value="TE">TE - Third Year</option>
            <option value="BE">BE - Final Year</option>
          </select>
          <select 
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all min-w-[100px] flex-1 lg:flex-none text-text-primary"
          >
            <option value="All">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
          {isTeacher && (
            <button 
              onClick={markAllPresent}
              className="px-4 py-2.5 rounded-xl bg-success/10 text-success text-sm font-bold hover:bg-success/20 transition-all flex-1 lg:flex-none whitespace-nowrap"
            >
              Mark All Present
            </button>
          )}
        </div>
      </div>

      {/* Attendance Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStudents.map((student) => (
          <motion.div 
            key={student.id}
            whileHover={{ y: -5 }}
            className="glass p-6 rounded-3xl border border-border card-hover"
          >
            <div className="flex items-center gap-4 mb-6">
              <Avatar 
                src={student.avatar} 
                fallback={student.name?.charAt(0) || 'S'} 
                size="md" 
              />
              <div>
                <h3 className="text-sm font-bold text-text-primary">{student.name}</h3>
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Roll #{student.rollNo}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleMark(student.id, 'P')}
                className={clsx(
                  "flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all border",
                  localAttendance[student.id] === 'P' 
                    ? "bg-success/10 border-success/50 text-success" 
                    : "bg-surface-elevated border-transparent text-text-muted hover:bg-surface"
                )}
              >
                <Check className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Present</span>
              </button>
              <button 
                onClick={() => handleMark(student.id, 'A')}
                className={clsx(
                  "flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all border",
                  localAttendance[student.id] === 'A' 
                    ? "bg-danger/10 border-danger/50 text-danger" 
                    : "bg-surface-elevated border-transparent text-text-muted hover:bg-surface"
                )}
              >
                <X className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Absent</span>
              </button>
              <button 
                onClick={() => handleMark(student.id, 'L')}
                className={clsx(
                  "flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all border",
                  localAttendance[student.id] === 'L' 
                    ? "bg-warning/10 border-warning/50 text-warning" 
                    : "bg-surface-elevated border-transparent text-text-muted hover:bg-surface"
                )}
              >
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Late</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-20 glass rounded-[32px] border border-border">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-text-secondary">No students found</h3>
          <p className="text-sm text-text-muted mb-6">Try adjusting your filters or adding students in the Teacher Portal.</p>
          {isTeacher && (
            <div className="flex flex-col gap-3 mx-auto">
              <button 
                onClick={() => navigate('/teacher-portal')}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Go to Teacher Portal
              </button>
              <button 
                onClick={handleSeed}
                disabled={isSeeding}
                className="px-6 py-2.5 rounded-xl border border-primary/50 text-primary text-sm font-bold hover:bg-primary/10 transition-all flex items-center gap-2 justify-center"
              >
                {isSeeding ? (
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Seed Demo Students
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
