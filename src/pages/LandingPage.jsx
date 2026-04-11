import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Users, 
  BarChart3, 
  MessageSquare,
  Globe,
  CheckCircle2,
  Star,
  Quote,
  BookOpen,
  Trophy,
  Clock
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-primary/30 transition-colors duration-300">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden p-1">
              <img src="https://famt.ac.in/tnp/wp-content/uploads/2021/09/cropped-new-logo.png" alt="FAMT Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight text-text-primary">FAMT Edu</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
            <a href="#stats" className="hover:text-primary transition-colors">Stats</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold hover:text-primary transition-colors text-text-primary">Login</Link>
            <Link to="/signup" className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full" />
          <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-primary tracking-widest uppercase"
            >
              <Sparkles className="w-3 h-3" />
              AI-Powered Education Management
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold font-display tracking-tight leading-[1.1] text-text-primary"
            >
              The Future of <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">Student Management</span> is Here.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
            >
              A premium, production-grade system designed for modern institutions. 
              Real-time insights, AI-driven behavior analysis, and seamless teacher-student collaboration.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link to="/signup" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="w-full sm:w-auto px-8 py-4 rounded-2xl glass border border-white/10 font-bold hover:bg-white/5 transition-all">
                View Demo
              </Link>
            </motion.div>
          </div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="absolute -inset-4 bg-linear-to-r from-primary/20 to-secondary/20 blur-3xl opacity-50 rounded-[40px]" />
            <div className="relative glass rounded-[32px] border border-border overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1920&auto=format&fit=crop" 
                alt="Modern Educational Dashboard" 
                className="w-full h-[600px] object-cover opacity-90"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
              
              {/* Floating UI Elements */}
              <div className="absolute top-10 left-10 p-6 glass rounded-2xl border border-border hidden lg:block animate-bounce">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Attendance Rate</p>
                    <p className="text-xl font-bold text-text-primary">98.5%</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-20 right-10 p-6 glass rounded-2xl border border-border hidden lg:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">AI Insights</p>
                    <p className="text-xl font-bold text-text-primary">New Report Ready</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 border-y border-border bg-surface/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Active Students", value: "10k+", icon: Users },
              { label: "Expert Teachers", value: "500+", icon: GraduationCap },
              { label: "AI Insights Generated", value: "50k+", icon: Zap },
              { label: "Success Rate", value: "99%", icon: Trophy }
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-4xl font-bold font-display text-text-primary">{stat.value}</h4>
                <p className="text-sm text-text-secondary uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-text-primary">Everything you need to scale</h2>
            <p className="text-text-secondary max-w-xl mx-auto">Powerful tools designed to help teachers manage and students excel.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Secure Auth",
                desc: "Google OAuth integration with mobile verification for maximum security."
              },
              {
                icon: Zap,
                title: "AI Insights",
                desc: "Automated behavior analysis and personalized study recommendations."
              },
              {
                icon: Users,
                title: "Teacher Portal",
                desc: "Dedicated workspace for educators to manage grades, attendance, and reports."
              },
              {
                icon: BarChart3,
                title: "Real-time Analytics",
                desc: "Visual performance tracking and comprehensive academic reporting."
              },
              {
                icon: MessageSquare,
                title: "AI Chatbot",
                desc: "24/7 intelligent assistance for students and administrative staff."
              },
              {
                icon: Globe,
                title: "Global Access",
                desc: "Access your institution from anywhere, on any device, at any time."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 rounded-[32px] glass border border-border hover:border-primary/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-text-primary">{feature.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-surface/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold font-display leading-tight text-text-primary">Simplify your institution's workflow in <span className="text-primary">3 simple steps</span></h2>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Onboard Staff & Students", desc: "Easily import your data or use our automated onboarding tools to get started in minutes." },
                  { step: "02", title: "Track & Analyze", desc: "Monitor attendance, grades, and behavior in real-time with our intuitive dashboard." },
                  { step: "03", title: "Generate AI Insights", desc: "Let FAMTBot provide personalized recommendations and automated reports for every student." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="text-2xl font-bold text-primary/20 font-display">{item.step}</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2 text-text-primary">{item.title}</h4>
                      <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full" />
              <img 
                src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1000&auto=format&fit=crop" 
                alt="Teacher using tablet" 
                className="relative rounded-[32px] border border-border shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-text-primary">Loved by educators everywhere</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Dr. Sarah Johnson",
                role: "Principal, Global Academy",
                quote: "FAMT Edu has completely transformed how we manage our student data. The AI insights are a game-changer.",
                avatar: "https://i.pravatar.cc/150?u=sarah"
              },
              {
                name: "Prof. Michael Chen",
                role: "Head of Science Dept",
                quote: "The teacher portal is so intuitive. I save hours every week on administrative tasks and focus more on teaching.",
                avatar: "https://i.pravatar.cc/150?u=michael"
              },
              {
                name: "Emily Rodriguez",
                role: "Student Counselor",
                quote: "The behavior analysis tool helps us identify students who need support much earlier than before. It's invaluable.",
                avatar: "https://i.pravatar.cc/150?u=emily"
              }
            ].map((testimonial, i) => (
              <div key={i} className="p-8 rounded-[32px] glass border border-border flex flex-col gap-6">
                <Quote className="w-10 h-10 text-primary/20" />
                <p className="text-lg leading-relaxed italic text-text-primary">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4 mt-auto">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full border border-border" referrerPolicy="no-referrer" />
                  <div>
                    <h5 className="font-bold text-text-primary">{testimonial.name}</h5>
                    <p className="text-xs text-text-secondary">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-[40px] overflow-hidden bg-linear-to-br from-primary to-secondary p-12 md:p-20 text-center space-y-8">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <h2 className="text-4xl md:text-6xl font-bold text-white font-display relative z-10">Ready to modernize your institution?</h2>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto relative z-10">Join 500+ institutions already using FAMT Edu to empower their students and staff.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 relative z-10">
              <Link to="/signup" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white text-primary font-bold shadow-xl hover:scale-105 transition-all">
                Get Started Now
              </Link>
              <Link to="/contact" className="w-full sm:w-auto px-10 py-5 rounded-2xl border border-white/20 text-white font-bold hover:bg-white/10 transition-all">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden p-0.5">
                  <img src="https://famt.ac.in/tnp/wp-content/uploads/2021/09/cropped-new-logo.png" alt="FAMT Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <span className="text-lg font-bold font-display tracking-tight text-text-primary">FAMT Edu</span>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                Empowering educational institutions with AI-driven management tools for a better tomorrow.
              </p>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-text-primary">Product</h5>
              <ul className="space-y-4 text-sm text-text-secondary">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">AI Insights</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Teacher Portal</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-text-primary">Company</h5>
              <ul className="space-y-4 text-sm text-text-secondary">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-text-primary">Support</h5>
              <ul className="space-y-4 text-sm text-text-secondary">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Status</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8">
            <p className="text-text-muted text-sm">© 2026 FAMT Edu Management System. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-text-muted">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
