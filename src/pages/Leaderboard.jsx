import React, { useState } from 'react';
import { 
  Crown, 
  Medal, 
  TrendingUp, 
  ChevronRight, 
  Filter,
  Search,
  Star
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import Avatar from '../components/ui/Avatar';

export default function Leaderboard() {
  const { students } = useAppStore();
  const [activeTab, setActiveTab] = useState('Academic');
  const [filterClass, setFilterClass] = useState('All');

  const sortedStudents = [...students].sort((a, b) => {
    const aMarks = a.marks || { math: 0, science: 0 };
    const bMarks = b.marks || { math: 0, science: 0 };
    if (activeTab === 'Academic') return (bMarks.math + bMarks.science) - (aMarks.math + aMarks.science);
    if (activeTab === 'Behavior') return (b.behaviorScore || 0) - (a.behaviorScore || 0);
    return ((b.attendance || 0) + (b.behaviorScore || 0)) - ((a.attendance || 0) + (a.behaviorScore || 0));
  });

  const top3 = sortedStudents.slice(0, 3);
  const others = sortedStudents.slice(3);

  const getStudentScore = (student) => {
    if (!student) return 0;
    if (activeTab === 'Academic') {
      const marks = student.marks || { math: 0, science: 0 };
      return marks.math + marks.science;
    }
    return student.behaviorScore || 0;
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">Leaderboard</h1>
          <p className="text-text-secondary text-sm">Celebrating our top performing students this month.</p>
        </div>
        <div className="flex items-center gap-2 p-1 glass rounded-xl border border-border">
          {['Academic', 'Behavior', 'Overall'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                activeTab === tab ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Podium */}
      <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-0 pt-12 pb-8">
        {/* 2nd Place */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="order-2 md:order-1 flex flex-col items-center"
        >
          <div className="relative mb-4">
            <Avatar 
              src={top3[1]?.avatar} 
              fallback={top3[1]?.name?.charAt(0)} 
              size="xl"
              className="border-2 border-[#C0C0C0]/30"
            />
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#C0C0C0] rounded-full flex items-center justify-center text-background shadow-lg">
              <Medal className="w-5 h-5" />
            </div>
          </div>
          <div className="text-center mb-4">
            <h3 className="font-bold text-sm text-text-primary">{top3[1]?.name}</h3>
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Class {top3[1]?.class}-{top3[1]?.section}</p>
          </div>
          <div className="w-32 h-32 bg-linear-to-t from-surface-elevated/50 to-surface-elevated rounded-t-3xl border-x border-t border-border flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-mono text-[#C0C0C0]">2</span>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Silver</span>
          </div>
        </motion.div>

        {/* 1st Place */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="order-1 md:order-2 flex flex-col items-center z-10"
        >
          <div className="relative mb-6">
            <Avatar 
              src={top3[0]?.avatar} 
              fallback={top3[0]?.name?.charAt(0)} 
              size="2xl"
              className="border-4 border-[#FFD700]/30"
            />
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#FFD700] rounded-full flex items-center justify-center text-background shadow-xl animate-bounce">
              <Crown className="w-7 h-7" />
            </div>
          </div>
          <div className="text-center mb-6">
            <h3 className="font-bold text-lg text-text-primary">{top3[0]?.name}</h3>
            <p className="text-xs text-text-muted uppercase font-bold tracking-widest">Class {top3[0]?.class}-{top3[0]?.section}</p>
          </div>
          <div className="w-40 h-48 bg-linear-to-t from-primary/10 to-primary/20 rounded-t-[40px] border-x border-t border-primary/20 flex flex-col items-center justify-center shadow-[0_-20px_50px_rgba(79,142,247,0.1)]">
            <span className="text-5xl font-bold font-mono text-[#FFD700]">1</span>
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Gold</span>
            <div className="mt-4 flex items-center gap-1 text-primary font-bold font-mono">
              <Star className="w-4 h-4 fill-primary" />
              {getStudentScore(top3[0])}
            </div>
          </div>
        </motion.div>

        {/* 3rd Place */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="order-3 flex flex-col items-center"
        >
          <div className="relative mb-4">
            <Avatar 
              src={top3[2]?.avatar} 
              fallback={top3[2]?.name?.charAt(0)} 
              size="xl"
              className="border-2 border-[#CD7F32]/30"
            />
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#CD7F32] rounded-full flex items-center justify-center text-background shadow-lg">
              <Medal className="w-5 h-5" />
            </div>
          </div>
          <div className="text-center mb-4">
            <h3 className="font-bold text-sm text-text-primary">{top3[2]?.name}</h3>
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Class {top3[2]?.class}-{top3[2]?.section}</p>
          </div>
          <div className="w-32 h-24 bg-linear-to-t from-surface-elevated/50 to-surface-elevated rounded-t-3xl border-x border-t border-border flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-mono text-[#CD7F32]">3</span>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Bronze</span>
          </div>
        </motion.div>
      </div>

      {/* Ranked Table */}
      <div className="glass rounded-3xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-elevated border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Class</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">GPA</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Attendance</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Behavior</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {others.map((student, idx) => (
                <motion.tr 
                  key={student.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-surface-elevated transition-colors group"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold font-mono text-text-muted">#{idx + 4}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        src={student.avatar} 
                        fallback={student.name?.charAt(0) || 'S'} 
                        size="xs"
                      />
                      <p className="text-sm font-bold group-hover:text-primary transition-colors text-text-primary">{student.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-text-primary">{student.class}-{student.section}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold font-mono text-primary">{student.grade}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold font-mono text-success">{student.attendance}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold font-mono text-warning">{student.behaviorScore}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold font-mono text-primary">
                      {getStudentScore(student)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
