import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  ShieldAlert, 
  BookOpen, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ChevronRight,
  BrainCircuit,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';
import Avatar from '../components/ui/Avatar';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Markdown from '../components/ui/Markdown';


const tabs = [
  { id: 'overview', name: 'Overview', icon: User },
  { id: 'academic', name: 'Academic', icon: GraduationCap },
  { id: 'attendance', name: 'Attendance', icon: Calendar },
  { id: 'behavior', name: 'Behavior', icon: ShieldAlert },
  { id: 'study-plan', name: 'Study Plan', icon: BrainCircuit },
];



import { downloadCSV, getConsolidatedMarks } from '../lib/utils';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { students, user, setEmailDraft } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyPlan, setStudyPlan] = useState(null);

  const student = students.find(s => s.id === id);

  const generateStudyPlan = async () => {
    if (!student) return;
    setIsGenerating(true);
    
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Generate a personalized study plan for a student with the following profile:
        Name: ${student.name}
        Academic Marks: ${JSON.stringify(student.marks)}
        Attendance: ${student.attendance}%
        Behavior Score: ${student.behaviorScore}/100
        GPA Grade: ${student.grade}

        The plan should identify weak subjects (marks < 60), strengths, and provide a detailed weekly schedule, behavioral advice, and subject-specific recommendations for each subject based on the student's marks. 
        Return the response in JSON format matching the schema.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      // Clean up potential markdown formatting in the response
      const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
      const plan = JSON.parse(jsonStr);
      setStudyPlan(plan);
      toast.success('AI Study Plan generated!');
    } catch (error) {
      console.error('AI Generation Error:', error);
      toast.error('Failed to generate study plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)]">
        <h2 className="text-2xl font-bold mb-4">Student not found</h2>
        <button onClick={() => navigate('/students')} className="btn-primary">Back to Directory</button>
      </div>
    );
  }

  const handleDownload = () => {
    const data = [{
      Name: student.name,
      RollNo: student.rollNo,
      Class: student.class,
      Section: student.section,
      Attendance: student.attendance,
      GPA: student.grade,
      Contact: student.mobile || student.contact || student.phone || 'N/A',
      ParentName: student.parentName,
      Address: student.address
    }];
    downloadCSV(data, `Profile_${student.name}`);
  };

  const handleEmail = () => {
    setEmailDraft({
      to: 'parent@example.com',
      subject: `Regarding ${student.name}`,
      body: `Dear Parent/Guardian,\n\nI am reaching out regarding ${student.name}'s progress.\n\nAttendance: ${student.attendance}%\nGrade: ${student.grade}\n\nPlease let me know if you would like to discuss this further.\n\nRegards,\n${user?.name || 'Teacher'}`
    });
  };

  const handleCall = () => {
    window.location.href = `tel:${student.mobile || student.contact || student.phone}`;
  };

  const handleViewDocs = () => {
    toast.success('Opening document vault...');
  };

  const consolidatedMarks = getConsolidatedMarks(student.marks);

  const radarData = [
    { subject: 'Math', A: consolidatedMarks.math || consolidatedMarks.mathematics || 0, fullMark: 100 },
    { subject: 'Science', A: consolidatedMarks.science || consolidatedMarks.physics || 0, fullMark: 100 },
    { subject: 'English', A: consolidatedMarks.english || consolidatedMarks.chemistry || 0, fullMark: 100 },
    { subject: 'History', A: consolidatedMarks.history || consolidatedMarks.basic_electrical || 0, fullMark: 100 },
    { subject: 'Computer', A: consolidatedMarks.computer || consolidatedMarks.programming || 0, fullMark: 100 },
  ];

  const attendanceTrend = [
    { month: 'Jan', rate: 95 },
    { month: 'Feb', rate: 92 },
    { month: 'Mar', rate: 88 },
    { month: 'Apr', rate: student.attendance },
  ];

  return (
    <div className="space-y-8">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/students')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors group"
        >
          <div className="p-2 rounded-xl glass group-hover:bg-surface-elevated transition-all">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Back to Directory</span>
        </button>
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-xl glass hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all">
            <Edit3 className="w-5 h-5" />
          </button>
          <button 
            onClick={handleDownload}
            className="btn-primary"
          >
            Download Report
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="glass p-8 rounded-[32px] border border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-[100px]" />
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative">
            <Avatar 
              src={student.avatar} 
              fallback={student.name?.charAt(0) || 'S'} 
              size="2xl" 
            />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-surface-elevated border-4 border-background rounded-2xl flex items-center justify-center">
              <div className={clsx("w-3 h-3 rounded-full", student.status === 'Active' ? 'bg-success' : 'bg-text-muted')} />
            </div>
          </div>
          <div className="text-center md:text-left flex-1 text-text-primary">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-4xl font-bold font-display tracking-tight text-text-primary">{student.name}</h1>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">
                Roll #{student.rollNo}
              </span>
            </div>
            <p className="text-text-secondary font-medium mb-6">Class {student.class}-{student.section} • {student.gender} • {student.status}</p>
            
            <div className="grid grid-cols-3 gap-8 max-w-md">
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">GPA Grade</p>
                <p className="text-2xl font-bold font-mono text-primary">{student.grade}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Attendance</p>
                <p className="text-2xl font-bold font-mono text-success">{student.attendance}%</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Behavior</p>
                <p className="text-2xl font-bold font-mono text-warning">{student.behaviorScore}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 glass rounded-2xl border border-border w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-primary text-white shadow-lg" 
                : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="glass p-8 rounded-3xl border border-border">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-text-primary">
                    <User className="w-5 h-5 text-primary" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Full Name</p>
                      <p className="text-sm font-medium text-text-primary">{student.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Date of Birth</p>
                      <p className="text-sm font-medium text-text-primary">{student.dob}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Email Address</p>
                      <p className="text-sm font-medium flex items-center gap-2 text-text-primary">
                        <Mail className="w-3.5 h-3.5 text-text-muted" />
                        {student.name.toLowerCase().replace(' ', '.')}@school.edu
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Phone Number</p>
                      <p className="text-sm font-medium flex items-center gap-2 text-text-primary">
                        <Phone className="w-3.5 h-3.5 text-text-muted" />
                        {student.mobile || student.contact || student.phone || 'N/A'}
                      </p>
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Residential Address</p>
                      <p className="text-sm font-medium flex items-center gap-2 text-text-primary">
                        <MapPin className="w-3.5 h-3.5 text-text-muted" />
                        {student.address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass p-8 rounded-3xl border border-border">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-text-primary">
                    <Users className="w-5 h-5 text-secondary" />
                    Guardian Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Parent Name</p>
                      <p className="text-sm font-medium text-text-primary">{student.parentName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Relationship</p>
                      <p className="text-sm font-medium text-text-primary">Father</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Emergency Contact</p>
                      <p className="text-sm font-medium text-danger">{student.mobile || student.contact || student.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="glass p-6 rounded-3xl border border-border">
                  <h3 className="text-lg font-bold mb-4 text-text-primary">Quick Actions</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={handleEmail}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-elevated hover:bg-surface transition-all group border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Mail className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-text-primary">Email Parent</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-all" />
                    </button>
                    <button 
                      onClick={handleCall}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-elevated hover:bg-surface transition-all group border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success/10 text-success">
                          <Phone className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-text-primary">Call Guardian</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-success transition-all" />
                    </button>
                    <button 
                      onClick={handleViewDocs}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-elevated hover:bg-surface transition-all group border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning/10 text-warning">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-text-primary">View Documents</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-warning transition-all" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass p-8 rounded-3xl border border-border">
                <h3 className="text-lg font-bold mb-6 text-text-primary">Subject Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-4 text-xs font-bold text-text-muted uppercase tracking-widest">Subject</th>
                        <th className="pb-4 text-xs font-bold text-text-muted uppercase tracking-widest">Score</th>
                        <th className="pb-4 text-xs font-bold text-text-muted uppercase tracking-widest">Grade</th>
                        <th className="pb-4 text-xs font-bold text-text-muted uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {Object.entries(consolidatedMarks).map(([subject, score]) => (
                        <tr key={subject} className="group">
                          <td className="py-4 text-sm font-bold capitalize group-hover:text-primary transition-colors text-text-primary">{subject.replace('_', ' ')}</td>
                          <td className="py-4 text-sm font-mono font-bold text-text-primary">{score}</td>
                          <td className="py-4">
                            <span className={clsx(
                              "px-2 py-1 rounded-lg text-[10px] font-bold",
                              score >= 80 ? "bg-success/10 text-success" : score >= 60 ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger"
                            )}>
                              {score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'F'}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className={clsx("w-1.5 h-1.5 rounded-full", score >= 35 ? "bg-success" : "bg-danger")} />
                              <span className="text-xs font-medium text-text-primary">{score >= 35 ? 'Passed' : 'Failed'}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass p-8 rounded-3xl border border-border flex flex-col items-center justify-center">
                <h3 className="text-lg font-bold mb-8 text-center text-text-primary">Skill Radar</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                      <Radar
                        name={student.name}
                        dataKey="A"
                        stroke="var(--primary)"
                        fill="var(--primary)"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass p-8 rounded-3xl border border-border">
                  <h3 className="text-lg font-bold mb-8 text-text-primary">Attendance Trend</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={attendanceTrend}>
                        <defs>
                          <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} dy={10} tick={{ fill: 'var(--text-muted)' }} />
                        <YAxis axisLine={false} tickLine={false} dx={-10} unit="%" tick={{ fill: 'var(--text-muted)' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-primary)' }}
                        />
                        <Area type="monotone" dataKey="rate" stroke="var(--success)" strokeWidth={3} fillOpacity={1} fill="url(#colorAttend)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass p-8 rounded-3xl border border-border">
                  <h3 className="text-lg font-bold mb-8 text-text-primary">Summary</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-success/5 border border-success/10">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        <span className="text-sm font-bold text-text-primary">Present Days</span>
                      </div>
                      <span className="text-lg font-bold font-mono text-text-primary">112</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-danger/5 border border-danger/10">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-danger" />
                        <span className="text-sm font-bold text-text-primary">Absent Days</span>
                      </div>
                      <span className="text-lg font-bold font-mono text-text-primary">12</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-warning/5 border border-warning/10">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-warning" />
                        <span className="text-sm font-bold text-text-primary">Late Arrivals</span>
                      </div>
                      <span className="text-lg font-bold font-mono text-text-primary">4</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'behavior' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="glass p-8 rounded-3xl border border-border flex flex-col items-center justify-center text-center">
                <h3 className="text-lg font-bold mb-8 text-text-primary">Behavior Score</h3>
                <div className="relative w-48 h-48 mb-8">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-text-muted/10"
                    />
                    <motion.circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={552.92}
                      initial={{ strokeDashoffset: 552.92 }}
                      animate={{ strokeDashoffset: 552.92 - (552.92 * student.behaviorScore) / 100 }}
                      className={clsx(
                        student.behaviorScore >= 80 ? "text-success" : student.behaviorScore >= 50 ? "text-warning" : "text-danger"
                      )}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold font-mono text-text-primary">{student.behaviorScore}</span>
                    <span className="text-xs text-text-muted font-bold uppercase tracking-widest">Points</span>
                  </div>
                </div>
                <p className="text-sm text-text-muted max-w-[200px]">
                  {student.behaviorScore >= 80 ? "Excellent conduct. Maintain this positive attitude!" : 
                   student.behaviorScore >= 50 ? "Good behavior, but there's room for improvement." : 
                   "Critical attention required for behavioral issues."}
                </p>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="glass p-8 rounded-3xl border border-border">
                  <h3 className="text-lg font-bold mb-6 text-text-primary">Score Breakdown</h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-text-secondary">Punctuality</span>
                        <span className="text-primary">28/30</span>
                      </div>
                      <div className="h-2 bg-surface-elevated rounded-full overflow-hidden border border-border">
                        <div className="h-full bg-primary rounded-full" style={{ width: '93%' }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-text-secondary">Attendance Consistency</span>
                        <span className="text-success">25/30</span>
                      </div>
                      <div className="h-2 bg-surface-elevated rounded-full overflow-hidden border border-border">
                        <div className="h-full bg-success rounded-full" style={{ width: '83%' }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-text-secondary">Classroom Conduct</span>
                        <span className="text-secondary">35/40</span>
                      </div>
                      <div className="h-2 bg-surface-elevated rounded-full overflow-hidden border border-border">
                        <div className="h-full bg-secondary rounded-full" style={{ width: '87%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass p-8 rounded-3xl border border-border">
                  <h3 className="text-lg font-bold mb-6 text-text-primary">Improvement Suggestions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4">
                      <Sparkles className="w-5 h-5 text-primary shrink-0" />
                      <p className="text-xs leading-relaxed text-text-secondary">Your punctuality score is high. Keep arriving 10 mins early consistently.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-warning/5 border border-warning/10 flex gap-4">
                      <AlertCircle className="w-5 h-5 text-warning shrink-0" />
                      <p className="text-xs leading-relaxed text-text-secondary">Try to participate more in classroom discussions to boost conduct score.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'study-plan' && (
            <div className="space-y-8">
              <div className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                  <BrainCircuit className="w-24 h-24 text-primary/10" />
                </div>
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold font-display">AI-Powered Study Plan</h3>
                        <p className="text-xs text-text-muted">Personalized learning path powered by Gemini AI</p>
                      </div>
                    </div>
                    <button 
                      onClick={generateStudyPlan}
                      disabled={isGenerating}
                      className={clsx(
                        "btn-primary flex items-center gap-2 px-6 py-2.5",
                        isGenerating && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="w-4 h-4" />
                          Generate New Plan
                        </>
                      )}
                    </button>
                  </div>
                  
                  {studyPlan ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Performance Analysis</p>
                          <div className="space-y-3">
                            <div className="p-4 rounded-2xl bg-danger/5 border border-danger/10">
                              <p className="text-[10px] font-bold text-danger uppercase mb-2">Focus Areas</p>
                              <div className="flex flex-wrap gap-2">
                                {studyPlan.weakSubjects.map((sub) => (
                                  <span key={sub} className="px-2 py-1 rounded-lg bg-danger/10 text-danger text-[10px] font-bold uppercase">
                                    {sub}
                                  </span>
                                ))}
                                {studyPlan.weakSubjects.length === 0 && <span className="text-xs text-text-secondary">No major weaknesses detected.</span>}
                              </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-success/5 border border-success/10">
                              <p className="text-[10px] font-bold text-success uppercase mb-2">Strengths</p>
                              <div className="flex flex-wrap gap-2">
                                {studyPlan.strengths.map((sub) => (
                                  <span key={sub} className="px-2 py-1 rounded-lg bg-success/10 text-success text-[10px] font-bold uppercase">
                                    {sub}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">AI Recommendations</p>
                          <ul className="space-y-3">
                            {studyPlan.recommendations.map((rec, i) => (
                              <li key={i} className="flex gap-3 text-sm text-text-secondary leading-relaxed">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                          <p className="text-[10px] font-bold text-primary uppercase mb-2">Behavioral Insight</p>
                          <div className={clsx(
                            "text-xs text-text-secondary leading-relaxed prose max-w-none",
                            theme !== 'light' && "prose-invert"
                          )}>
                            <Markdown>{studyPlan.behavioralAdvice}</Markdown>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-2 space-y-8">
                        <div>
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Subject-Specific AI Recommendations</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {studyPlan.subjectSpecificRecommendations.map((item, i) => (
                              <div key={i} className="p-4 rounded-2xl glass border border-border hover:border-primary/30 transition-all group">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-bold capitalize text-text-primary">{item.subject}</span>
                                  <span className={clsx(
                                    "px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider",
                                    item.status === 'Improvement Needed' ? 'bg-danger/10 text-danger' : 
                                    item.status === 'Good' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                                  )}>
                                    {item.status}
                                  </span>
                                </div>
                                <p className="text-xs text-text-secondary leading-relaxed group-hover:text-text-primary transition-colors">
                                  {item.recommendation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Recommended Weekly Schedule</p>
                          <div className="overflow-hidden rounded-2xl border border-border bg-surface-elevated">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border bg-surface">
                                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Day</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Focus Subject</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Duration</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Priority</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {studyPlan.weeklySchedule.map((row, i) => (
                                <tr key={i} className="hover:bg-surface transition-colors group">
                                  <td className="px-6 py-4 text-sm font-bold text-text-primary">{row.day}</td>
                                  <td className="px-6 py-4 text-sm text-text-secondary group-hover:text-text-primary transition-colors">{row.focus}</td>
                                  <td className="px-6 py-4 text-sm text-text-secondary">{row.duration}</td>
                                  <td className="px-6 py-4">
                                    <span className={clsx(
                                      "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                                      row.priority === 'High' ? 'bg-danger/10 text-danger' : 
                                      row.priority === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                                    )}>{row.priority}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-6 p-4 rounded-2xl bg-surface-elevated border border-border flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-warning shrink-0" />
                          <p className="text-xs text-text-muted italic">
                            This plan is dynamically generated based on current academic data. Follow the high-priority subjects first to see the best results.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                        <BrainCircuit className="w-10 h-10 text-primary/40" />
                      </div>
                      <h4 className="text-xl font-bold mb-2">No Study Plan Generated</h4>
                      <p className="text-sm text-text-muted max-w-md mb-8">
                        Click the button above to generate a personalized study plan using AI based on {student.name}'s performance and behavior.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
