import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  User,
  BookOpen,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';

const timeSlots = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM'
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const subjectColors = {
  'Math': 'bg-primary text-white',
  'Science': 'bg-success text-white',
  'English': 'bg-secondary text-white',
  'History': 'bg-warning text-white',
  'Computer': 'bg-danger text-white',
  'Break': 'bg-surface-elevated text-text-primary'
};

import { downloadCSV } from '../lib/utils';

export default function Timetable() {
  const { timetable, teachers, updateTimetable, user } = useAppStore();
  const [selectedClass, setSelectedClass] = useState('10-A');
  const [editMode, setEditMode] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(14);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  const isTeacher = user?.role?.toLowerCase() === 'teacher';

  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isCurrentSlot = (day, timeStr) => {
    const now = currentTime;
    const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
    if (currentDay !== day) return false;

    const [hourStr, minuteStr, ampm] = timeStr.match(/(\d+):(\d+)\s(AM|PM)/).slice(1);
    let hour = parseInt(hourStr);
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    const slotStart = new Date(now);
    slotStart.setHours(hour, 0, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return now >= slotStart && now < slotEnd;
  };

  const handleCellClick = (day, time, currentSlot) => {
    if (editMode && isTeacher) {
      setEditingSlot({
        day,
        time: time.split(' ')[0],
        fullTime: time,
        subject: currentSlot?.subject || 'Math',
        teacher: currentSlot?.teacher || (teachers.length > 0 ? teachers[0].name : '')
      });
      setShowEditModal(true);
    }
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const subject = formData.get('subject');
    const teacher = formData.get('teacher');

    const classData = [...(timetable[selectedClass] || [])];
    let dayData = classData.find(d => d.day === editingSlot.day);

    if (!dayData) {
      dayData = { day: editingSlot.day, slots: [] };
      classData.push(dayData);
    } else {
      // Create a copy of dayData to avoid direct mutation
      dayData = { ...dayData, slots: [...dayData.slots] };
      const dayIndex = classData.findIndex(d => d.day === editingSlot.day);
      classData[dayIndex] = dayData;
    }

    const slotIndex = dayData.slots.findIndex(s => s.time === editingSlot.time);
    if (slotIndex > -1) {
      dayData.slots[slotIndex] = { ...dayData.slots[slotIndex], subject, teacher };
    } else {
      dayData.slots.push({ time: editingSlot.time, subject, teacher });
    }

    await updateTimetable(selectedClass, classData);
    setShowEditModal(false);
    setEditingSlot(null);
    toast.success('Timetable updated successfully');
  };

  const handleDownload = () => {
    const data = days.flatMap(day => {
      const dayData = timetable[selectedClass]?.find(d => d.day === day);
      return dayData?.slots.map(slot => ({
        Class: selectedClass,
        Day: day,
        Time: slot.time,
        Subject: slot.subject,
        Teacher: slot.teacher
      })) || [];
    });
    downloadCSV(data, `Timetable_Class_${selectedClass}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">Class Timetable</h1>
          <p className="text-text-secondary text-sm">View and manage weekly schedules for all classes.</p>
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
              onClick={() => setEditMode(!editMode)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                editMode ? "bg-success text-white" : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              <Edit3 className="w-4 h-4" />
              {editMode ? 'Save Changes' : 'Edit Timetable'}
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass p-4 rounded-2xl border border-border flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Select Class:</span>
          </div>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all min-w-[140px] text-text-primary"
          >
            <option value="FE-A">FE - A</option>
            <option value="FE-B">FE - B</option>
            <option value="SE-A">SE - A</option>
            <option value="SE-B">SE - B</option>
            <option value="TE-A">TE - A</option>
            <option value="TE-B">TE - B</option>
            <option value="BE-A">BE - A</option>
            <option value="BE-B">BE - B</option>
          </select>
        </div>
        <div className="flex-1 text-center hidden lg:block">
          <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Academic Year 2025-26 • Semester 1</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentWeek(prev => Math.max(1, prev - 1))}
            className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-text-primary">Week {currentWeek}</span>
          <button 
            onClick={() => setCurrentWeek(prev => prev + 1)}
            className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="glass rounded-3xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
            <thead>
              <tr className="bg-surface-elevated border-b border-border">
                <th className="w-24 px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-center">Time</th>
                {days.map(day => (
                  <th key={day} className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {timeSlots.map((time, timeIdx) => (
                <tr key={time} className="group">
                  <td className="px-6 py-8 text-center border-r border-border">
                    <span className="text-xs font-bold font-mono text-text-muted">{time}</span>
                  </td>
                  {days.map(day => {
                    const dayData = timetable[selectedClass]?.find(d => d.day === day);
                    const slot = dayData?.slots.find(s => s.time === time.split(' ')[0]);
                    
                    const isCurrent = isCurrentSlot(day, time);
                    
                    return (
                      <td 
                        key={`${day}-${time}`} 
                        className={clsx(
                          "p-2 border-r border-border last:border-r-0 transition-all",
                          isCurrent && "bg-primary/5 ring-2 ring-inset ring-primary/20"
                        )}
                        onClick={() => handleCellClick(day, time, slot)}
                      >
                        {slot ? (
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className={clsx(
                              "p-3 rounded-2xl border border-border h-full flex flex-col justify-between group/card relative overflow-hidden cursor-pointer",
                              subjectColors[slot.subject] || 'bg-surface-elevated',
                              isCurrent && "shadow-lg shadow-primary/20 ring-2 ring-white/50"
                            )}
                          >
                            {isCurrent && (
                              <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded-full z-20">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                <span className="text-[8px] font-bold text-white uppercase">Now</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-background/40 backdrop-blur-sm opacity-0 group-hover/card:opacity-100 transition-all flex items-center justify-center z-10">
                              <Edit3 className="w-5 h-5 text-white" />
                            </div>
                            <div className="relative z-0">
                              <div className="flex items-center justify-between mb-2">
                                <span className={clsx(
                                  "text-[10px] font-bold uppercase tracking-widest",
                                  slot.subject === 'Break' ? "text-text-secondary" : "text-white/80"
                                )}>{slot.subject}</span>
                                <BookOpen className={clsx(
                                  "w-3 h-3",
                                  slot.subject === 'Break' ? "text-text-muted" : "text-white/40"
                                )} />
                              </div>
                              <h4 className={clsx(
                                "text-sm font-bold mb-1",
                                slot.subject === 'Break' ? "text-text-primary" : "text-white"
                              )}>{slot.subject}</h4>
                              <div className={clsx(
                                "flex items-center gap-1.5 text-[10px] font-medium",
                                slot.subject === 'Break' ? "text-text-muted" : "text-white/60"
                              )}>
                                <User className="w-3 h-3" />
                                {slot.teacher}
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <div className={clsx(
                            "h-full min-h-[80px] rounded-2xl border border-dashed border-border flex items-center justify-center group/empty transition-all",
                            editMode ? "hover:border-primary/50 cursor-pointer" : ""
                          )}>
                            {editMode && <Plus className="w-5 h-5 text-text-muted group-hover/empty:text-primary transition-all" />}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Slot Modal */}
      <AnimatePresence>
        {showEditModal && editingSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-elevated rounded-3xl border border-border shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-display text-text-primary">Edit Schedule Slot</h2>
                  <p className="text-xs text-text-muted">{editingSlot.day} • {editingSlot.fullTime} • Class {selectedClass}</p>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form className="p-6 space-y-6" onSubmit={handleSaveSlot}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Subject</label>
                    <select 
                      name="subject" 
                      defaultValue={editingSlot.subject}
                      required 
                      className="w-full bg-surface-elevated/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary"
                    >
                      {Object.keys(subjectColors).map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Teacher</label>
                    <select 
                      name="teacher" 
                      defaultValue={editingSlot.teacher}
                      required 
                      className="w-full bg-surface-elevated/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary"
                    >
                      {teachers.map(t => (
                        <option key={t.id} value={t.name}>{t.name} ({t.subject})</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2.5 rounded-xl hover:bg-surface-elevated text-sm font-bold transition-all text-text-primary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary px-8 py-2.5 text-sm"
                  >
                    Update Slot
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
