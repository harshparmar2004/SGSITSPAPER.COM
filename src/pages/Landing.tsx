import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { loginWithGoogle } from "../lib/firebase";
import {
  Loader2,
  Snowflake,
  BadgeCheck,
  BookOpen,
  LayoutGrid,
  Shield,
  UserCog,
  ShieldAlert,
  Menu,
  Linkedin,
  X,
  Cpu,
  Zap,
  Settings,
  Building,
  TerminalSquare,
  Network,
  HeartPulse,
  Factory
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

function LandingNavbar() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 w-full z-50 bg-[#0A0F1C]/80 backdrop-blur-md border-b border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center justify-between py-3 max-w-full px-4 sm:px-6 mx-auto">
          <div className="flex items-center gap-2">
            <img
              src="/logo.svg"
              alt="SGSITS Logo"
              className="w-10 h-10 md:w-12 md:h-12 object-contain shrink-0 drop-shadow-[0_0_12px_rgba(125,211,252,0.6)]"
            />
            <span className="text-lg font-extrabold text-white tracking-tighter uppercase">
              SGSITS <span className="text-sky-300">PYQ Hub</span>
            </span>
          </div>

          {/* Expanded Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {["Home", "Resources", "Subjects", "Notes", "Community"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="relative text-slate-400 hover:text-sky-300 transition-colors duration-200 font-medium text-xs tracking-widest uppercase py-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-[1px] auto after:bg-sky-300 after:transition-all after:duration-300"
                >
                  {item}
                </a>
              ),
            )}
            <Link
              to="/docs"
              className="relative text-sky-400 hover:text-sky-300 transition-colors duration-200 font-medium text-xs tracking-widest uppercase py-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-[1px] auto after:bg-sky-300 after:transition-all after:duration-300"
            >
              Documentation
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:block">
                <button
                  onClick={loginWithGoogle}
                  className="px-4 py-2 rounded-full border border-sky-300/30 text-sky-300 font-bold text-xs tracking-widest uppercase hover:bg-sky-300/10 transition-all duration-300 shadow-[0_0_20px_rgba(125,211,252,0.1)]"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
            <button
              className="lg:hidden text-white p-1"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#0A0F1C] flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-2">
                <Snowflake className="text-sky-300 w-6 h-6 drop-shadow-[0_0_12px_rgba(125,211,252,0.6)]" />
                <span className="text-lg font-extrabold text-white tracking-tighter uppercase">
                  SGSITS <span className="text-sky-300">PYQ Hub</span>
                </span>
              </div>
              <button
                className="text-white p-2 border border-white/10 rounded-full bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-6 flex-1">
              {["Home", "Resources", "Subjects", "Notes", "Community"].map(
                (item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-2xl font-semibold text-slate-300 hover:text-sky-300 tracking-wide uppercase transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </a>
                ),
              )}
              <Link
                to="/docs"
                className="text-2xl font-semibold text-sky-400 hover:text-sky-300 tracking-wide uppercase transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Documentation
              </Link>
            </div>

            <div className="flex flex-col gap-4 mt-auto pb-4">
              <div className="w-full h-px bg-white/10 mb-2"></div>
              {user && (
                <button
                  onClick={loginWithGoogle}
                  className="w-full py-4 text-center rounded-xl bg-sky-300/10 border border-sky-300/30 text-sky-300 font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(125,211,252,0.1)]"
                >
                  GO TO DASHBOARD
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function Landing() {
  const { user, isAdmin, loginLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loginLoading && user) {
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/hub");
      }
    }
  }, [user, isAdmin, loginLoading, navigate]);

  if (loginLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-slate-50 selection:bg-sky-300/20 relative overflow-x-hidden bg-[radial-gradient(circle_at_50%_0%,#0f172a_0%,#020617_100%)]">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.02] pointer-events-none"></div>
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-sky-300/10 blur-[140px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-sky-500/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <LandingNavbar />

      {/* Main Content Area */}
      <main className="flex-grow pt-32 pb-8 px-6 relative z-10 font-sans">
        {/* Home Section */}
        <section id="home" className="max-w-7xl px-4 sm:px-6 mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-3 min-h-[calc(100vh-250px)] mb-32 pt-10 scroll-mt-32">
          {/* Information Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.15 } },
            }}
            className="flex-1 max-w-2xl"
          >
            <motion.h1
              variants={FADE_UP}
              className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-white mb-4 leading-[1.15] tracking-tight"
            >
              Empowering{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-sky-300 to-sky-500">
                Future Engineers
              </span>{" "}
              with Resources
            </motion.h1>

            <motion.p
              variants={FADE_UP}
              className="text-base md:text-lg text-slate-400 mb-10 leading-relaxed max-w-xl font-light"
            >
              The SGSITS PYQ Hub is a comprehensive digital repository designed
              to streamline academic preparation. We host an extensive
              collection of Previous Year Questions and curated academic
              resources.
            </motion.p>

            {/* Stats Grid */}
            <motion.div
              variants={FADE_UP}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-12"
            >
              <div className="p-3 bg-white/[0.02] backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-xl group hover:border-sky-300/30 transition-all duration-300">
                <div className="text-sky-300 mb-2 opacity-80">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="text-xl font-bold text-white tracking-tight">
                  5,000+
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Verified PYQs
                </div>
              </div>

              <div className="p-3 bg-white/[0.02] backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-xl group hover:border-sky-300/30 transition-all duration-300">
                <div className="text-sky-300 mb-2 opacity-80">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <div className="text-xl font-bold text-white tracking-tight">
                  8+
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Semesters
                </div>
              </div>

              <div className="p-3 bg-white/[0.02] backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-xl group hover:border-sky-300/30 transition-all duration-300">
                <div className="text-sky-300 mb-2 opacity-80">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="text-xl font-bold text-white tracking-tight">
                  Secure
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Access
                </div>
              </div>
            </motion.div>

            <motion.div variants={FADE_UP} className="flex items-center gap-3">
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#020617] bg-sky-900/30 flex items-center justify-center text-xs font-bold text-sky-300">
                  JS
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-[#020617] bg-blue-900/30 flex items-center justify-center text-xs font-bold text-sky-300">
                  AK
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-[#020617] bg-slate-800/30 flex items-center justify-center text-xs font-bold text-sky-300">
                  RT
                </div>
              </div>
              <p className="text-xs text-slate-500 tracking-wide">
                Trusted by{" "}
                <span className="text-slate-300 font-semibold">2,000+</span>{" "}
                students & faculty
              </p>
            </motion.div>
          </motion.div>

          {/* Login Card Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.4,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className="w-full max-w-md relative group mt-4 lg:mt-0"
          >
            {/* Glowing Orb Behind Card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-sky-300/20 to-sky-500/20 rounded-[20px] blur-2xl opacity-40 group-hover:opacity-60 transition duration-1000"></div>

            <div className="relative bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8 md:p-12 rounded-[20px] border border-white/10 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
              {/* Reflection effect simulated via gradient */}
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-[25deg] group-hover:left-[150%] transition-all duration-[750ms] pointer-events-none"></div>

              {/* Logo & Header */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/[0.02] backdrop-blur-md mb-4 border border-sky-300/10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <UserCog className="text-sky-300 w-8 h-8 drop-shadow-[0_0_12px_rgba(125,211,252,0.6)]" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Secure Login
                </h2>
                <p className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-[0.15em] mt-2 leading-relaxed">
                  Access portal with your Gmail ID
                </p>
              </div>

              {/* Login Action */}
              <div className="space-y-3">
                <button
                  onClick={loginWithGoogle}
                  className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 hover:border-sky-300/40 py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-all duration-300 group/btn relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-sky-300/5 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 shrink-0"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#7dd3fc"
                    ></path>
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#0ea5e9"
                    ></path>
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#38bdf8"
                    ></path>
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#bae6fd"
                    ></path>
                  </svg>
                  <span className="font-bold tracking-[0.1em] text-[11px] sm:text-xs uppercase relative z-10 whitespace-nowrap">
                    Continue with Google
                  </span>
                </button>
              </div>

              {/* Security Alert */}
              <div className="mt-4 pt-4 sm:pt-6 border-t border-white/5 text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-slate-500 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-snug text-center">
                    Authorized Access Only{" "}
                    <span className="hidden sm:inline">•</span>
                    <br className="sm:hidden" /> AES-256 Encrypted
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-[10px] sm:text-xs text-slate-600 font-bold uppercase tracking-[0.15em]">
                Developed by{" "}
                <span className="text-slate-400">Harsh Parmar</span>
              </p>
            </div>
          </motion.div>
        </section>

        {/* Resources Section */}
        <section id="resources" className="relative w-full py-16 md:py-24 scroll-mt-24 border-y border-white/5">
          <div className="absolute top-0 right-0 w-[40vh] h-[40vh] bg-sky-500/5 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[30vh] h-[30vh] bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none"></div>

          <motion.div 
            className="max-w-[1200px] px-6 lg:px-8 mx-auto relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={STAGGER_CONTAINER}
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 border-b border-white/5 pb-12">
              <motion.div variants={FADE_UP} className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-sky-400 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                  Extensive Library
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">Academic <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-indigo-400">Resources</span></h2>
                <p className="text-base md:text-lg text-slate-400 font-light leading-relaxed">
                  A highly curated repository of the most critical academic materials you need to ace your examinations, available instantly.
                </p>
              </motion.div>
              
              <motion.div variants={FADE_UP} className="hidden md:flex items-center gap-12 justify-end">
                <div className="text-left">
                  <div className="text-4xl font-black text-white mb-1">5k+</div>
                  <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Documents</div>
                </div>
                <div className="w-[1px] h-16 bg-white/10"></div>
                <div className="text-left">
                  <div className="text-4xl font-black text-white mb-1 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-200">100%</div>
                  <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Verified</div>
                </div>
              </motion.div>
            </div>
            
            <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-6 lg:gap-8">
              <motion.div variants={FADE_UP} className="bg-white/[0.02] backdrop-blur-sm border border-white/5 p-8 rounded-2xl hover:border-sky-400/30 hover:bg-white/[0.04] transition-all duration-300 group overflow-hidden relative">
                <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  <BookOpen className="text-sky-400 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Previous Year Papers</h3>
                <p className="text-sm text-slate-400 leading-relaxed min-h-[80px]">
                  Access over 5,000+ verified PYQs across all departments. Filter intuitively by year, semester, and specific subject codes to analyze past trends.
                </p>
                <div className="mt-6 flex items-center gap-2 text-sky-400 font-bold uppercase text-xs group-hover:text-sky-300 transition-colors cursor-pointer">
                  <span>Browse PYQs</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </motion.div>
              
              <motion.div variants={FADE_UP} className="bg-white/[0.02] backdrop-blur-sm border border-white/5 p-8 rounded-2xl hover:border-indigo-400/30 hover:bg-white/[0.04] transition-all duration-300 group overflow-hidden relative">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  <LayoutGrid className="text-indigo-400 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Syllabus & Curriculum</h3>
                <p className="text-sm text-slate-400 leading-relaxed min-h-[80px]">
                  Stay aligned with the official university curriculum. Always find the exact chapters, units, and modules required for your current semester.
                </p>
                <div className="mt-6 flex items-center gap-2 text-indigo-400 font-bold uppercase text-xs group-hover:text-indigo-300 transition-colors cursor-pointer">
                  <span>View Syllabus</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </motion.div>
              
              <motion.div variants={FADE_UP} className="bg-white/[0.02] backdrop-blur-sm border border-white/5 p-8 rounded-2xl hover:border-amber-400/30 hover:bg-white/[0.04] transition-all duration-300 group overflow-hidden relative">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  <BadgeCheck className="text-amber-400 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Practical Manuals</h3>
                <p className="text-sm text-slate-400 leading-relaxed min-h-[80px]">
                  Download verified lab manuals, programming assignments, and detailed experiment readings trusted by senior students and faculty.
                </p>
                <div className="mt-6 flex items-center gap-2 text-amber-400 font-bold uppercase text-xs group-hover:text-amber-300 transition-colors cursor-pointer">
                  <span>Get Manuals</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Subjects Section */}
        <section id="subjects" className="relative w-full py-16 md:py-24 border-y border-white/5">
          <motion.div 
            className="max-w-[1200px] px-6 lg:px-8 mx-auto relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={STAGGER_CONTAINER}
          >
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 mb-16 lg:items-center">
              <motion.div variants={FADE_UP} className="lg:w-1/3 shrink-0">
                <div className="w-12 h-1 bg-gradient-to-r from-emerald-400 to-sky-400 mb-6 rounded-full"></div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 tracking-tight">Branches & <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Subjects</span></h2>
                <p className="text-base text-slate-400 font-light leading-relaxed mb-8">
                  Comprehensive coverage of all academic branches at SGSITS. From core engineering concepts to specialized electives, navigate effortlessly through your targeted curriculum.
                </p>
              </motion.div>
              
              <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Computer Science', icon: <TerminalSquare className="w-5 h-5 flex-shrink-0" /> },
                  { name: 'Information Tech.', icon: <Network className="w-5 h-5 flex-shrink-0" /> },
                  { name: 'Electronics & TC', icon: <Cpu className="w-5 h-5 flex-shrink-0" /> },
                  { name: 'Electrical Engg.', icon: <Zap className="w-5 h-5 flex-shrink-0" /> },
                  { name: 'Mechanical Engg.', icon: <Settings className="w-5 h-5 flex-shrink-0" /> },
                  { name: 'Civil Engineering', icon: <Building className="w-5 h-5 flex-shrink-0" /> },
                  { name: 'Biomedical Engg.', icon: <HeartPulse className="w-5 h-5 flex-shrink-0" /> },
                  { name: 'Industrial Prod.', icon: <Factory className="w-5 h-5 flex-shrink-0" /> }
                ].map((dept, i) => (
                  <motion.div key={dept.name} variants={FADE_UP} className="group relative">
                    <div className="absolute inset-0 bg-sky-500/0 hover:bg-sky-500/5 transition-colors rounded-2xl"></div>
                    <div className="flex items-center gap-4 p-4 border border-white/5 hover:border-sky-500/20 rounded-xl transition-all cursor-pointer bg-white/[0.01] hover:bg-white/[0.03]">
                      <div className="w-10 h-10 bg-white/5 text-white rounded-lg flex items-center justify-center group-hover:bg-sky-500/10 group-hover:text-sky-400 transition-all">
                        {dept.icon}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-base group-hover:text-sky-300 transition-colors">{dept.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">Explore all branch subjects &rarr;</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Notes Guide Section */}
        <section id="notes" className="relative w-full py-16 md:py-24 border-y border-white/5">
          <motion.div 
            className="max-w-[1200px] px-6 lg:px-8 mx-auto relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={STAGGER_CONTAINER}
          >
            <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
              <motion.div variants={FADE_UP} className="lg:w-1/2 w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Notes Guide
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-tight">Curated <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-sky-400">Study Notes</span></h2>
                <p className="text-base md:text-lg text-slate-400 mb-8 leading-relaxed font-light">
                  Discover beautifully handwritten and digitally compiled notes from top-tier students. Stop wasting time figuring out what to study, and start learning from the best resources right before your mid-terms.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={loginWithGoogle} className="px-6 py-3 bg-indigo-600 text-white font-bold tracking-widest uppercase rounded-lg hover:bg-indigo-500 transition-all w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm">
                    <span>Login to Access</span>
                  </button>
                </div>
              </motion.div>

              <motion.div variants={FADE_UP} className="lg:w-1/2 w-full">
                <div className="grid gap-4">
                  {[
                    { number: "01", title: "High-yield summary sheets", desc: "For last-minute revisions and quick recaps." },
                    { number: "02", title: "Unit-wise detailed explanations", desc: "Comprehensive notes with necessary diagrams." },
                    { number: "03", title: "Important formulas", desc: "Algorithmic breakdowns for quick solving." },
                    { number: "04", title: "Step-by-step solutions", desc: "Detailed steps to commonly asked numericals." }
                  ].map((item) => (
                    <div key={item.number} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 hover:bg-white/[0.04] transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-white/5 text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-sm tracking-tighter transition-all">
                        {item.number}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-base mb-1">{item.title}</h4>
                        <p className="text-sm text-slate-400 font-light leading-snug">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Community & Documentation Section */}
        <section id="community" className="relative w-full py-16 md:py-24 border-y border-white/5">
          <motion.div 
            className="max-w-[1200px] px-6 lg:px-8 mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={STAGGER_CONTAINER}
          >
            <motion.div variants={FADE_UP} className="bg-gradient-to-br from-sky-900/40 via-indigo-900/20 to-sky-900/10 border border-sky-500/20 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl backdrop-blur-sm">
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.05] pointer-events-none"></div>
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/20 blur-[60px] rounded-full pointer-events-none"></div>
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none"></div>
              
              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight drop-shadow-sm">Platform Documentation</h2>
                <p className="text-base text-slate-300 mb-8 font-light leading-relaxed max-w-2xl mx-auto">
                  Get the most out of the hub. Learn how to navigate resources, effectively use advanced filters, and understand our curation standards. A complete guide designed to streamline your academic workflow.
                </p>
                
                <div className="flex justify-center">
                  <Link to="/docs" className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold rounded-xl transition-all w-full sm:w-auto justify-center uppercase tracking-widest hover:bg-slate-200">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-sm">Read the Documentation</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer Area */}
      <footer className="w-full py-12 bg-[#050810] border-t border-white/5 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10 max-w-[1200px] px-6 lg:px-8 mx-auto">
          {/* Left Side */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
            <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              © {new Date().getFullYear()}{" "}
              <span className="text-sky-300 font-extrabold">SGSITSPAPER</span>.
              All rights reserved.
            </p>
            <p className="text-[10px] sm:text-xs text-slate-600 font-bold uppercase tracking-[0.1em]">
              Engineered for Excellence at SGSITS Indore
            </p>
          </div>

          {/* Right Side */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3">
              {["Privacy", "Terms", "Contact", "Status"].map((link) => (
                <a
                  key={link}
                  className="text-[10px] sm:text-xs font-bold text-slate-500 hover:text-sky-300 transition-all uppercase tracking-[0.2em]"
                  href="#"
                >
                  {link}
                </a>
              ))}
            </div>

            <div className="w-px h-4 bg-white/10 hidden sm:block"></div>

            <a
              aria-label="LinkedIn"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-sky-300 hover:border-sky-300/40 transition-all duration-300 shrink-0 mt-2 sm:mt-0"
              href="https://www.linkedin.com/in/harsh-parmar-3b1160350"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
