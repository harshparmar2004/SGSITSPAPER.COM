import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useAcademicConfig } from "../hooks/useAcademicConfig";
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
  Factory,
  ChevronDown,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const FADE_UP = {
  hidden: { opacity: 0, y: 60, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } },
};

const FADE_RIGHT = {
  hidden: { opacity: 0, x: -60, scale: 0.96 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } },
};

const FADE_LEFT = {
  hidden: { opacity: 0, x: 60, scale: 0.96 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } },
};

const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
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
        className="fixed top-0 w-full z-50 bg-[#FAF7F2]/80 backdrop-blur-md border-b border-stone-200 shadow-sm"
      >
        <div className="flex items-center justify-between py-3 max-w-full px-4 sm:px-6 mx-auto">
          <div className="flex items-center gap-2">
            <img
              src="/logo.svg"
              alt="SGSITS Logo"
              className="w-8 h-8 md:w-12 md:h-12 object-contain shrink-0 drop-shadow-[0_0_12px_rgba(125,211,252,0.6)]"
            />
            <span className="text-base md:text-lg font-extrabold text-stone-900 tracking-tighter uppercase">
              SGSITS <span className="text-amber-700">PYQ Hub</span>
            </span>
          </div>

          {/* Expanded Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {["Home", "Resources", "Subjects", "Notes", "Community"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="relative text-stone-600 hover:text-amber-700 transition-colors duration-200 font-medium text-xs tracking-widest uppercase py-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-[1px] auto after:bg-amber-700 after:transition-all after:duration-300"
                >
                  {item}
                </a>
              ),
            )}
            <Link
              to="/docs"
              className="relative text-amber-600 hover:text-amber-700 transition-colors duration-200 font-medium text-xs tracking-widest uppercase py-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-[1px] auto after:bg-amber-700 after:transition-all after:duration-300"
            >
              Documentation
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:block">
                <button
                  onClick={loginWithGoogle}
                  className="px-4 py-2 rounded-full border border-amber-700/30 text-amber-700 font-bold text-xs tracking-widest uppercase hover:bg-amber-700/10 transition-all duration-300 shadow-[0_0_20px_rgba(125,211,252,0.1)]"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
            <button
              className="lg:hidden text-stone-900 p-1"
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
            className="fixed inset-0 z-[60] bg-[#FAF7F2] flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-2">
                <Snowflake className="text-amber-700 w-6 h-6 drop-shadow-[0_0_12px_rgba(125,211,252,0.6)]" />
                <span className="text-base md:text-lg font-extrabold text-stone-900 tracking-tighter uppercase">
                  SGSITS <span className="text-amber-700">PYQ Hub</span>
                </span>
              </div>
              <button
                className="text-stone-900 p-2 border border-stone-200/80 rounded-full bg-stone-100"
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
                    className="text-2xl font-semibold text-stone-700 hover:text-amber-700 tracking-wide uppercase transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </a>
                ),
              )}
              <Link
                to="/docs"
                className="text-2xl font-semibold text-amber-600 hover:text-amber-700 tracking-wide uppercase transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Documentation
              </Link>
            </div>

            <div className="flex flex-col gap-4 mt-auto pb-4">
              <div className="w-full h-px bg-stone-200 mb-2"></div>
              {user && (
                <button
                  onClick={loginWithGoogle}
                  className="w-full py-4 text-center rounded-xl bg-amber-700/10 border border-amber-700/30 text-amber-700 font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(125,211,252,0.1)]"
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
  const { programs, subjects } = useAcademicConfig();
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const allDepartments = Array.from(new Set(programs.flatMap(p => p.departments)));

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
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-stone-900 selection:bg-amber-200/50 relative overflow-x-hidden bg-[#FAF7F2]">
      {/* Elegant, clean background without AI glow */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#00000004_1px,transparent_1px),linear-gradient(to_bottom,#00000004_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#FAF7F2]/50 to-[#FAF7F2] pointer-events-none"></div>

      <LandingNavbar />

      {/* Main Content Area */}
      <main className="flex-grow pt-24 md:pt-32 pb-8 px-4 sm:px-6 lg:px-8 relative z-10 font-sans">
        {/* Home Section */}
        <section id="home" className="max-w-7xl px-4 sm:px-6 mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-3 min-h-[calc(100vh-200px)] lg:min-h-[calc(100vh-250px)] mb-20 lg:mb-32 pt-8 lg:pt-10 scroll-mt-32">
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
              className="text-[2.5rem] sm:text-5xl lg:text-[4rem] font-extrabold text-stone-900 mb-4 leading-[1.15] tracking-tight"
            >
              Empowering{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-700 to-amber-500">
                Future Engineers
              </span>{" "}
              with Resources
            </motion.h1>

            <motion.p
              variants={FADE_UP}
              className="text-sm sm:text-base md:text-lg text-stone-600 mb-8 md:mb-10 leading-relaxed max-w-xl font-light"
            >
              The SGSITS PYQ Hub is a comprehensive digital repository designed
              to streamline academic preparation. We host an extensive
              collection of Previous Year Questions and curated academic
              resources.
            </motion.p>

            {/* Stats Grid */}
            <motion.div
              variants={FADE_UP}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 md:mb-12"
            >
              <div className="p-3 bg-white backdrop-blur-md border border-stone-200/80 shadow-sm rounded-xl group hover:border-amber-700/30 transition-all duration-300">
                <div className="text-amber-700 mb-2 opacity-80">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="text-xl font-bold text-stone-900 tracking-tight">
                  5,000+
                </div>
                <div className="text-xs font-bold text-stone-9000 uppercase tracking-widest mt-1">
                  Verified PYQs
                </div>
              </div>

              <div className="p-3 bg-white backdrop-blur-md border border-stone-200/80 shadow-sm rounded-xl group hover:border-amber-700/30 transition-all duration-300">
                <div className="text-amber-700 mb-2 opacity-80">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <div className="text-xl font-bold text-stone-900 tracking-tight">
                  8+
                </div>
                <div className="text-xs font-bold text-stone-9000 uppercase tracking-widest mt-1">
                  Semesters
                </div>
              </div>

              <div className="p-3 bg-white backdrop-blur-md border border-stone-200/80 shadow-sm rounded-xl group hover:border-amber-700/30 transition-all duration-300">
                <div className="text-amber-700 mb-2 opacity-80">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="text-xl font-bold text-stone-900 tracking-tight">
                  Secure
                </div>
                <div className="text-xs font-bold text-stone-9000 uppercase tracking-widest mt-1">
                  Access
                </div>
              </div>
            </motion.div>

            <motion.div variants={FADE_UP} className="flex items-center gap-3">
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#FAF7F2] bg-amber-100/50 flex items-center justify-center text-xs font-bold text-amber-700">
                  JS
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-[#FAF7F2] bg-amber-100/40 flex items-center justify-center text-xs font-bold text-amber-700">
                  AK
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-[#FAF7F2] bg-amber-100/30 flex items-center justify-center text-xs font-bold text-amber-700">
                  RT
                </div>
              </div>
              <p className="text-xs text-stone-9000 tracking-wide">
                Trusted by{" "}
                <span className="text-stone-700 font-semibold">2,000+</span>{" "}
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
            className="w-full max-w-[22rem] sm:max-w-md mx-auto lg:mx-0 lg:ml-auto relative group mt-8 lg:mt-0"
          >
            {/* Glowing Orb Behind Card */}
            <div className="absolute -inset-1 bg-amber-400/20 rounded-[20px] blur-2xl opacity-40 group-hover:opacity-60 transition duration-1000"></div>

            <div className="relative bg-white backdrop-blur-xl p-8 sm:p-10 md:px-12 md:py-16 rounded-[24px] border border-stone-200/80 overflow-hidden shadow-sm">
              {/* Reflection effect simulated via gradient */}
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-[25deg] group-hover:left-[150%] transition-all duration-[750ms] pointer-events-none"></div>

              {/* Logo & Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white backdrop-blur-md mb-6 border border-amber-700/10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <UserCog className="text-amber-700 w-8 h-8 drop-shadow-[0_0_12px_rgba(125,211,252,0.6)]" />
                </div>
                <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                  Secure Login
                </h2>
                <p className="text-[8px] sm:text-[10px] text-stone-9000 uppercase tracking-[0.15em] mt-3 leading-relaxed">
                  Access portal with your Gmail ID
                </p>
              </div>

              {/* Login Action */}
              <div className="space-y-3 mt-4">
                <button
                  onClick={loginWithGoogle}
                  className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-white hover:bg-stone-100 text-stone-900 border border-stone-200/80 hover:border-amber-700/40 py-4 px-4 sm:px-6 rounded-xl transition-all duration-300 group/btn relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-amber-700/5 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 shrink-0"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    ></path>
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    ></path>
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    ></path>
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    ></path>
                  </svg>
                  <span className="font-bold tracking-[0.1em] text-[11px] sm:text-xs uppercase relative z-10 whitespace-nowrap">
                    Continue with Google
                  </span>
                </button>
              </div>

              {/* Security Alert */}
              <div className="mt-8 pt-6 sm:pt-8 border-t border-stone-200 text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-stone-9000 mb-2">
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
              <p className="text-[10px] sm:text-xs text-stone-400 font-bold uppercase tracking-[0.15em]">
                Developed by{" "}
                <span className="text-stone-600">Harsh Parmar</span>
              </p>
            </div>
          </motion.div>
        </section>

        {/* Resources Section */}
        <section id="resources" className="relative w-full py-12 md:py-24 scroll-mt-24 border-y border-stone-200">

          <motion.div 
            className="max-w-[1200px] px-6 lg:px-8 mx-auto relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-100px" }}
            variants={STAGGER_CONTAINER}
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10 mb-10 md:mb-16 border-b border-stone-200 pb-8 md:pb-12">
              <motion.div variants={FADE_RIGHT} className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 border border-stone-200/80 rounded-full text-xs font-bold uppercase tracking-widest text-amber-600 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  Extensive Library
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 mb-4 tracking-tight">Academic <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-stone-500">Resources</span></h2>
                <p className="text-sm sm:text-base md:text-lg text-stone-600 font-light leading-relaxed">
                  A highly curated repository of the most critical academic materials you need to ace your examinations, available instantly.
                </p>
              </motion.div>
              
              <motion.div variants={FADE_LEFT} className="hidden md:flex items-center gap-12 justify-end">
                <div className="text-left">
                  <div className="text-4xl font-black text-stone-900 mb-1">5k+</div>
                  <div className="text-xs text-stone-9000 uppercase tracking-widest font-bold">Documents</div>
                </div>
                <div className="w-[1px] h-16 bg-stone-200"></div>
                <div className="text-left">
                  <div className="text-4xl font-black text-stone-900 mb-1 bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-teal-500">100%</div>
                  <div className="text-xs text-stone-9000 uppercase tracking-widest font-bold">Verified</div>
                </div>
              </motion.div>
            </div>
            
            <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-6 lg:gap-8">
              <motion.div variants={FADE_UP} className="bg-white backdrop-blur-sm border border-stone-200 p-6 sm:p-8 rounded-2xl hover:border-amber-600/30 hover:bg-stone-50 transition-all duration-300 group overflow-hidden relative">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  <BookOpen className="text-amber-600 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-3 tracking-tight">Previous Year Papers</h3>
                <p className="text-sm text-stone-600 leading-relaxed min-h-[80px]">
                  Access over 5,000+ verified PYQs across all departments. Filter intuitively by year, semester, and specific subject codes to analyze past trends.
                </p>
                <div className="mt-6 flex items-center gap-2 text-amber-600 font-bold uppercase text-xs group-hover:text-amber-700 transition-colors cursor-pointer">
                  <span>Browse PYQs</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </motion.div>
              
              <motion.div variants={FADE_UP} className="bg-white backdrop-blur-sm border border-stone-200 p-6 sm:p-8 rounded-2xl hover:border-stone-500/30 hover:bg-stone-50 transition-all duration-300 group overflow-hidden relative">
                <div className="w-12 h-12 bg-stone-400/10 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  <LayoutGrid className="text-stone-500 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-3 tracking-tight">Syllabus & Curriculum</h3>
                <p className="text-sm text-stone-600 leading-relaxed min-h-[80px]">
                  Stay aligned with the official university curriculum. Always find the exact chapters, units, and modules required for your current semester.
                </p>
                <div className="mt-6 flex items-center gap-2 text-stone-500 font-bold uppercase text-xs group-hover:text-stone-600 transition-colors cursor-pointer">
                  <span>View Syllabus</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </motion.div>
              
              <motion.div variants={FADE_UP} className="bg-white backdrop-blur-sm border border-stone-200 p-6 sm:p-8 rounded-2xl hover:border-amber-400/30 hover:bg-stone-50 transition-all duration-300 group overflow-hidden relative">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  <BadgeCheck className="text-amber-400 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-3 tracking-tight">Practical Manuals</h3>
                <p className="text-sm text-stone-600 leading-relaxed min-h-[80px]">
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
        <section id="subjects" className="relative w-full py-12 md:py-24 border-y border-stone-200">
          <motion.div 
            className="max-w-[1200px] px-6 lg:px-8 mx-auto relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-100px" }}
            variants={STAGGER_CONTAINER}
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10 mb-10 md:mb-16 border-b border-stone-200 pb-8 md:pb-12">
              <motion.div variants={FADE_RIGHT} className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 border border-stone-200/80 rounded-full text-xs font-bold uppercase tracking-widest text-teal-700 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-700"></span>
                  Comprehensive Curriculum
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 mb-4 tracking-tight">Branches & <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-amber-600">Subjects</span></h2>
                <p className="text-sm sm:text-base md:text-lg text-stone-600 font-light leading-relaxed">
                  Comprehensive coverage of all academic branches at SGSITS. From core engineering concepts to specialized electives, navigate effortlessly through your targeted curriculum.
                </p>
              </motion.div>
              
              <motion.div variants={FADE_LEFT} className="hidden md:flex items-center gap-12 justify-end shrink-0">
                <div className="text-left">
                  <div className="text-4xl font-black text-stone-900 mb-1">{allDepartments.length}</div>
                  <div className="text-xs text-teal-700 uppercase tracking-widest font-bold">Branches</div>
                </div>
                <div className="w-[1px] h-16 bg-stone-200"></div>
                <div className="text-left">
                  <div className="text-4xl font-black text-stone-900 mb-1">{subjects.length}</div>
                  <div className="text-xs text-amber-600 uppercase tracking-widest font-bold">Subjects</div>
                </div>
              </motion.div>
            </div>
              
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
              {allDepartments.map((dept, i) => {
                return (
                  <motion.div key={dept} variants={FADE_UP} className="flex items-center gap-4 p-4 border border-stone-200 hover:border-teal-800/20 rounded-xl transition-all bg-white hover:bg-white group cursor-pointer animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-10 h-10 bg-teal-800/10 rounded-lg flex items-center justify-center group-hover:bg-teal-800/20 transition-colors flex-shrink-0">
                      <Layers className="w-5 h-5 text-teal-700 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <h3 className="font-bold text-sm text-stone-900 group-hover:text-teal-600 transition-colors truncate">{dept}</h3>
                    </div>
                  </motion.div>
                );
              })}
              {allDepartments.length === 0 && (
                <div className="col-span-full text-center py-12 px-6 border border-stone-200 rounded-2xl bg-white">
                  <div className="w-16 h-16 bg-stone-100 flex items-center justify-center rounded-full mx-auto mb-4 text-stone-600">
                    <Layers className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">No Departments Yet</h3>
                  <p className="text-stone-600 text-sm">Admins are currently setting up the structure.</p>
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* Notes Guide Section */}
        <section id="notes" className="relative w-full py-12 md:py-24 border-y border-stone-200">
          <motion.div 
            className="max-w-[1200px] px-6 lg:px-8 mx-auto relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-100px" }}
            variants={STAGGER_CONTAINER}
          >
            <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
              <motion.div variants={FADE_LEFT} className="lg:w-1/2 w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-400/10 border border-stone-400/20 rounded-full text-xs font-bold uppercase tracking-widest text-stone-500 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span>
                  Notes Guide
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-stone-900 mb-6 tracking-tight">Curated <span className="text-transparent bg-clip-text bg-gradient-to-r from-stone-600 to-amber-600">Study Notes</span></h2>
                <p className="text-base md:text-lg text-stone-600 mb-8 leading-relaxed font-light">
                  Discover beautifully handwritten and digitally compiled notes from top-tier students. Stop wasting time figuring out what to study, and start learning from the best resources right before your mid-terms.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={loginWithGoogle} className="px-6 py-3 bg-stone-900 text-white text-stone-900 font-bold tracking-widest uppercase rounded-lg hover:bg-stone-400 transition-all w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm">
                    <span>Login to Access</span>
                  </button>
                </div>
              </motion.div>

              <motion.div variants={FADE_RIGHT} className="lg:w-1/2 w-full">
                <div className="grid gap-4">
                  {[
                    { number: "01", title: "High-yield summary sheets", desc: "For last-minute revisions and quick recaps." },
                    { number: "02", title: "Unit-wise detailed explanations", desc: "Comprehensive notes with necessary diagrams." },
                    { number: "03", title: "Important formulas", desc: "Algorithmic breakdowns for quick solving." },
                    { number: "04", title: "Step-by-step solutions", desc: "Detailed steps to commonly asked numericals." }
                  ].map((item) => (
                    <div key={item.number} className="flex gap-4 p-4 rounded-xl bg-white border border-stone-200 hover:border-stone-400/20 hover:bg-stone-50 transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-600 group-hover:bg-stone-400/10 group-hover:text-stone-500 flex items-center justify-center shrink-0 font-bold text-sm tracking-tighter transition-all">
                        {item.number}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-stone-900 font-bold text-base mb-1">{item.title}</h4>
                        <p className="text-sm text-stone-600 font-light leading-snug">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Community & Documentation Section */}
        <section id="community" className="relative w-full py-12 md:py-24 border-y border-stone-200">
          <motion.div 
            className="max-w-[1200px] px-6 lg:px-8 mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-100px" }}
            variants={STAGGER_CONTAINER}
          >
            <motion.div variants={FADE_UP} className="bg-white border border-stone-200/50 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.05] pointer-events-none"></div>
              
              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 mb-4 tracking-tight drop-shadow-sm">Platform Documentation</h2>
                <p className="text-base text-stone-700 mb-8 font-light leading-relaxed max-w-2xl mx-auto">
                  Get the most out of the hub. Learn how to navigate resources, effectively use advanced filters, and understand our curation standards. A complete guide designed to streamline your academic workflow.
                </p>
                
                <div className="flex justify-center">
                  <Link to="/docs" className="flex items-center gap-2 px-8 py-4 bg-stone-900 text-stone-50 font-bold rounded-xl hover:bg-stone-800 cursor-pointer transition-all w-full sm:w-auto justify-center uppercase tracking-widest hover:bg-slate-200">
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
      <footer className="w-full py-12 bg-[#FAF7F2] border-t border-stone-200 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10 max-w-[1200px] px-6 lg:px-8 mx-auto">
          {/* Left Side */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
            <p className="text-xs sm:text-sm font-bold text-stone-600 uppercase tracking-widest leading-relaxed">
              © {new Date().getFullYear()}{" "}
              <span className="text-amber-700 font-extrabold">SGSITSPAPER</span>.
              All rights reserved.
            </p>
            <p className="text-[10px] sm:text-xs text-stone-400 font-bold uppercase tracking-[0.1em]">
              Engineered for Excellence at SGSITS Indore
            </p>
          </div>

          {/* Right Side */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3">
              {["Privacy", "Terms", "Contact", "Status"].map((link) => (
                <a
                  key={link}
                  className="text-[10px] sm:text-xs font-bold text-stone-9000 hover:text-amber-700 transition-all uppercase tracking-[0.2em]"
                  href="#"
                >
                  {link}
                </a>
              ))}
            </div>

            <div className="w-px h-4 bg-stone-200 hidden sm:block"></div>

            <a
              aria-label="LinkedIn"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 border border-stone-200/80 text-stone-600 hover:text-amber-700 hover:border-amber-700/40 transition-all duration-300 shrink-0 mt-2 sm:mt-0"
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
