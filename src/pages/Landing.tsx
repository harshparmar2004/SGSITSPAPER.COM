import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { loginWithGoogle } from '../lib/firebase';
import { Loader2, Snowflake, BadgeCheck, BookOpen, LayoutGrid, Shield, UserCog, ShieldAlert, Menu, Linkedin } from 'lucide-react';
import { motion } from 'motion/react';

const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

function LandingNavbar() {
  const { user } = useAuth();
  
  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 w-full z-50 bg-white/[0.02] backdrop-blur-md border-b border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Snowflake className="text-sky-300 w-6 h-6 drop-shadow-[0_0_12px_rgba(125,211,252,0.6)]" />
          <span className="text-lg font-extrabold text-white tracking-tighter uppercase">
            SGSITS <span className="text-sky-300">PYQ Hub</span>
          </span>
        </div>
        
        {/* Expanded Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {['Home', 'Resources', 'Subjects', 'Notes', 'Community'].map((item) => (
            <a 
              key={item}
              href="#" 
              className="relative text-slate-400 hover:text-sky-300 transition-colors duration-200 font-medium text-xs tracking-widest uppercase py-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-[1px] auto after:bg-sky-300 after:transition-all after:duration-300"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          {!user ? (
            <>
              <button onClick={loginWithGoogle} className="hidden md:block text-slate-400 hover:text-sky-300 transition-colors duration-200 font-medium text-xs tracking-widest uppercase">
                STUDENT PORTAL
              </button>
              <button 
                onClick={loginWithGoogle}
                className="px-5 py-2 rounded-full border border-sky-300/30 text-sky-300 font-bold text-xs tracking-widest uppercase hover:bg-sky-300/10 transition-all duration-300 shadow-[0_0_20px_rgba(125,211,252,0.1)]"
              >
                ADMIN ACCESS
              </button>
            </>
          ) : (
            <button 
              onClick={loginWithGoogle}
              className="px-5 py-2 rounded-full border border-sky-300/30 text-sky-300 font-bold text-xs tracking-widest uppercase hover:bg-sky-300/10 transition-all duration-300 shadow-[0_0_20px_rgba(125,211,252,0.1)]"
            >
              Go to Dashboard
            </button>
          )}
          <button className="lg:hidden text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}

export default function Landing() {
  const { user, isAdmin, loginLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loginLoading && user) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/hub');
      }
    }
  }, [user, isAdmin, loginLoading, navigate]);

  if (loginLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
         <Loader2 className="w-10 h-10 animate-spin text-sky-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-slate-50 selection:bg-sky-300/20 relative overflow-x-hidden bg-[radial-gradient(circle_at_50%_0%,#0f172a_0%,#020617_100%)]">
      {/* Background Decor */}
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-sky-300/10 blur-[140px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-sky-500/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <LandingNavbar />
      
      {/* Main Content Area */}
      <main className="flex-grow pt-32 pb-12 px-6 relative z-10 font-sans">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 min-h-[calc(100vh-250px)]">
          
          {/* Information Section */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.15 } }
            }}
            className="flex-1 max-w-2xl"
          >
            <motion.h1 variants={FADE_UP} className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
              Empowering <span className="text-transparent bg-clip-text bg-gradient-to-br from-sky-300 to-sky-500">Future Engineers</span> with Resources
            </motion.h1>
            
            <motion.p variants={FADE_UP} className="text-lg text-slate-400 mb-12 leading-relaxed max-w-xl font-light">
              The SGSITS PYQ Hub is a comprehensive digital repository designed to streamline academic preparation. We host an extensive collection of Previous Year Questions and curated academic resources.
            </motion.p>

            {/* Stats Grid */}
            <motion.div variants={FADE_UP} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <div className="p-5 bg-white/[0.02] backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-xl group hover:border-sky-300/30 transition-all duration-300">
                <div className="text-sky-300 mb-2 opacity-80"><BookOpen className="w-6 h-6" /></div>
                <div className="text-2xl font-bold text-white tracking-tight">5,000+</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Verified PYQs</div>
              </div>
              
              <div className="p-5 bg-white/[0.02] backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-xl group hover:border-sky-300/30 transition-all duration-300">
                <div className="text-sky-300 mb-2 opacity-80"><LayoutGrid className="w-6 h-6" /></div>
                <div className="text-2xl font-bold text-white tracking-tight">8+</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Semesters</div>
              </div>
              
              <div className="p-5 bg-white/[0.02] backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-xl group hover:border-sky-300/30 transition-all duration-300">
                <div className="text-sky-300 mb-2 opacity-80"><Shield className="w-6 h-6" /></div>
                <div className="text-2xl font-bold text-white tracking-tight">Secure</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Access</div>
              </div>
            </motion.div>

            <motion.div variants={FADE_UP} className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#020617] bg-sky-900/30 flex items-center justify-center text-xs font-bold text-sky-300">JS</div>
                <div className="w-10 h-10 rounded-full border-2 border-[#020617] bg-blue-900/30 flex items-center justify-center text-xs font-bold text-sky-300">AK</div>
                <div className="w-10 h-10 rounded-full border-2 border-[#020617] bg-slate-800/30 flex items-center justify-center text-xs font-bold text-sky-300">RT</div>
              </div>
              <p className="text-sm text-slate-500 tracking-wide">
                Trusted by <span className="text-slate-300 font-semibold">2,000+</span> students & faculty
              </p>
            </motion.div>
          </motion.div>

          {/* Login Card Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="w-full max-w-md relative group mt-8 lg:mt-0"
          >
            {/* Glowing Orb Behind Card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-sky-300/20 to-sky-500/20 rounded-[20px] blur-2xl opacity-40 group-hover:opacity-60 transition duration-1000"></div>
            
            <div className="relative bg-white/[0.02] backdrop-blur-xl p-8 md:p-12 rounded-[20px] border border-white/10 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
               {/* Reflection effect simulated via gradient */}
               <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-[25deg] group-hover:left-[150%] transition-all duration-[750ms] pointer-events-none"></div>

              {/* Logo & Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/[0.02] backdrop-blur-md mb-4 border border-sky-300/10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <UserCog className="text-sky-300 w-10 h-10 drop-shadow-[0_0_12px_rgba(125,211,252,0.6)]" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Student Login</h2>
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-[0.15em] mt-2">Login with your @sgsits.ac.in Gmail ID</p>
              </div>

              {/* Login Action */}
              <div className="space-y-6">
                <button 
                  onClick={loginWithGoogle}
                  className="w-full flex items-center justify-center gap-3 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 hover:border-sky-300/40 py-4 px-6 rounded-lg transition-all duration-300 group/btn relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-sky-300/5 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                  <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#7dd3fc"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#0ea5e9"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#38bdf8"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#bae6fd"></path>
                  </svg>
                  <span className="font-bold tracking-wider text-sm uppercase relative z-10">Continue with Google</span>
                </button>
              </div>

              {/* Security Alert */}
              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-500 mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Authorized Access Only • AES-256 Encrypted</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center hidden lg:block">
              <p className="text-xs text-slate-600 font-bold uppercase tracking-[0.15em]">
                  Developed by <span className="text-slate-400">Harsh Parmar</span>
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer Area */}
      <footer className="w-full py-12 bg-white/[0.02] backdrop-blur-md border-t border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] relative z-10 mt-12">
        <div className="flex flex-col lg:flex-row justify-between items-center px-8 gap-8 max-w-7xl mx-auto">
          {/* Left Side */}
          <div className="flex flex-col items-center lg:items-start gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              © {new Date().getFullYear()} <span className="text-sky-300">SGSITSPAPER</span>. All rights reserved to the creators.
            </span>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.1em]">
              Engineered for Excellence at SGSITS Indore
            </p>
          </div>
          
          {/* Right Side */}
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
            {['Privacy', 'Terms', 'Contact', 'Status'].map(link => (
              <a key={link} className="text-[10px] font-bold text-slate-500 hover:text-sky-300 transition-all uppercase tracking-[0.2em]" href="#">
                {link}
              </a>
            ))}
            <div className="w-px h-4 bg-white/10 hidden md:block"></div>
            <a aria-label="LinkedIn" className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-sky-300 hover:border-sky-300/40 transition-all duration-300" href="#">
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
