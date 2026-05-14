import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Search, Moon, ChevronRight, ArrowLeft } from "lucide-react";

export default function Documentation() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("section[id]");
      let currentSection = "overview";
      
      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        if (window.scrollY >= sectionTop - 150) {
          currentSection = section.getAttribute("id") || "overview";
        }
      });
      
      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1525] text-slate-300 font-sans flex flex-col selection:bg-indigo-500/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#161d2b]/95 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
              <div className="p-1.5 rounded-md group-hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-medium hidden sm:inline text-sm">Back</span>
            </button>
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="Logo"
                className="w-8 h-8 opacity-90 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]"
              />
              <span className="text-white font-semibold tracking-tight text-lg">
                SGSITS PYQ Hub
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <div className="hidden sm:flex items-center px-4 py-1.5 bg-[#1E293B] border border-white/5 rounded-full text-xs font-medium cursor-pointer hover:bg-slate-800 transition-colors">
              <span className="w-2 h-2 rounded-full bg-indigo-400 mr-2 animate-pulse"></span>
              v1.0 (stable)
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1600px] w-full mx-auto">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-80 shrink-0 border-r border-white/5 bg-[#121927] h-[calc(100vh-64px)] overflow-y-auto sticky top-16 custom-scrollbar">
          <div className="p-6">
            <h2 className="text-white font-bold text-[13px] tracking-widest uppercase mb-6 px-2 text-slate-400">
              Navigation
            </h2>
            
            <div className="space-y-8 text-sm">
              <div>
                <h3 className="font-semibold text-slate-200 mb-3 px-2">
                  Getting Started
                </h3>
                <ul className="space-y-1">
                  <li>
                    <button 
                      onClick={() => scrollTo('overview')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeSection === 'overview' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                    >
                      Platform Overview
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => scrollTo('authentication')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeSection === 'authentication' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                    >
                      Login & Authentication
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-200 mb-3 px-2">
                  Student Guide
                </h3>
                <ul className="space-y-1">
                  <li>
                    <button 
                      onClick={() => scrollTo('issue-reporting')}
                      className={`w-full text-left flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeSection === 'issue-reporting' ? 'bg-rose-500/10 text-rose-400 font-medium' : 'bg-rose-500/5 text-rose-300 hover:bg-rose-500/10'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      Report Issues
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => scrollTo('finding-resources')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeSection === 'finding-resources' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                    >
                      Finding Resources
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => scrollTo('batch-downloads')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeSection === 'batch-downloads' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                    >
                      Batch ZIP Downloads
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-200 mb-3 px-2">
                  Administrator Guide
                </h3>
                <ul className="space-y-1">
                  <li>
                    <button 
                      onClick={() => scrollTo('roles-privileges')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeSection === 'roles-privileges' ? 'bg-amber-500/10 text-amber-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                    >
                      Roles & Privileges
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => scrollTo('admin-dashboard')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeSection === 'admin-dashboard' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                    >
                      Dashboard Overview
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => scrollTo('upload-lifecycle')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeSection === 'upload-lifecycle' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                    >
                      The Upload Lifecycle
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => scrollTo('hot-replace')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeSection === 'hot-replace' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                    >
                      Document Hot-Replace
                    </button>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-200 mb-3 px-2">
                  System Architecture
                </h3>
                <ul className="space-y-1">
                  <li>
                    <button 
                      onClick={() => scrollTo('architecture')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeSection === 'architecture' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                    >
                      Platform Architecture
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => scrollTo('security')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeSection === 'security' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                    >
                      Security & ABAC Rules
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-6 py-10 lg:p-14 xl:pr-64 max-w-5xl">
          <div className="flex items-center text-sm text-indigo-400 mb-8 gap-2 font-medium">
            <Link to="/" className="hover:text-indigo-300 transition-colors flex items-center gap-1">
              SGSITS PYQ Hub
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-slate-400">Documentation</span>
          </div>

          <h1 className="text-4xl lg:text-[44px] font-bold text-white tracking-tight mb-8 leading-tight">
            User Guide & Documentation
          </h1>

          <p className="text-xl text-slate-400 mb-16 leading-relaxed font-light">
            Welcome to the comprehensive documentation for the SGSITS PYQ Resource Hub. This guide serves as the source of truth for the platform's workflows, architecture, and security models.
          </p>

          <section id="overview" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
              Platform Overview
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 leading-relaxed mb-6">
                Information fragmentation is a critical bottleneck in university ecosystems. At SGSITS, academic assets—Previous Year Questions (PYQs), handwritten notes, and official lab manuals—are historically siloed. Students rely on ephemeral links shared via peer-to-peer networks.
              </p>
              <h3 className="text-lg font-semibold text-white mt-8 mb-4">The Solution</h3>
              <p className="text-slate-300 leading-relaxed mb-6">
                This platform addresses these pain points by engineering a Centralized Cloud-Native Hub that features:
              </p>
              <ul className="space-y-3 mb-6 bg-[#161d2b] p-6 rounded-xl border border-white/5">
                <li className="flex gap-3 text-slate-300"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div><span>A powerful, multi-faceted filtering engine designed for low time-to-discovery.</span></li>
                <li className="flex gap-3 text-slate-300"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div><span>A strict Role-Based Access Control (RBAC) Content Management System (CMS).</span></li>
                <li className="flex gap-3 text-slate-300"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div><span>An integrated Issue Reporting system that provides a direct feedback loop between consumers and curators.</span></li>
              </ul>
            </div>
          </section>

          <section id="authentication" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
              Login & Authentication
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 leading-relaxed mb-6">
                The platform utilizes a Role-Based Access Control (RBAC) model. All access begins with Google Authentication to ensure identity validity without managing passwords.
              </p>
              <div className="bg-[#121927] border border-white/5 rounded-xl overflow-hidden mb-6">
                <div className="bg-white/5 px-6 py-3 border-b border-white/5">
                  <h4 className="font-medium text-white m-0">Authentication Workflow</h4>
                </div>
                <div className="p-6">
                  <ol className="space-y-4 m-0 text-slate-300">
                    <li className="flex gap-4">
                      <span className="flex items-center justify-center w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 font-bold text-sm shrink-0">1</span>
                      <span>Navigate to the landing page and click <strong>"Student / Admin Login"</strong>.</span>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex items-center justify-center w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 font-bold text-sm shrink-0">2</span>
                      <span>Authenticate securely using your Google Account via the popup.</span>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex items-center justify-center w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 font-bold text-sm shrink-0">3</span>
                      <div>
                        <strong>Role Assignment:</strong>
                        <ul className="mt-2 space-y-2">
                          <li className="text-sm"><span className="text-indigo-400 font-medium">Students:</span> Default access, routed to the PYQ Hub.</li>
                          <li className="text-sm"><span className="text-amber-400 font-medium">Admins:</span> Elevated privileges unlock the Admin Dashboard if the email is registered.</li>
                        </ul>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </section>

          <section id="finding-resources" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
              Finding Resources
            </h2>
            <div className="prose prose-invert max-w-none text-slate-300">
              <p className="mb-6">
                The Student interface acts as an intelligent search engine tailored for academic assets.
              </p>
              <h3 className="text-lg font-semibold text-white mt-8 mb-4">Hierarchical Filtering</h3>
              <p className="mb-4">State constraints are applied in a strict hierarchy to quickly filter through thousands of documents:</p>
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-3 py-1 bg-white/5 text-slate-300 rounded border border-white/10 font-mono text-sm">Course</span>
                <ChevronRight className="w-4 h-4 mt-1.5 text-slate-500" />
                <span className="px-3 py-1 bg-white/5 text-slate-300 rounded border border-white/10 font-mono text-sm">Department</span>
                <ChevronRight className="w-4 h-4 mt-1.5 text-slate-500" />
                <span className="px-3 py-1 bg-white/5 text-slate-300 rounded border border-white/10 font-mono text-sm">Year / Semester</span>
                <ChevronRight className="w-4 h-4 mt-1.5 text-slate-500" />
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30 font-mono text-sm">Subject</span>
              </div>
              
              <h3 className="text-lg font-semibold text-white mt-8 mb-4">Text Search</h3>
              <p>
                The primary search bar evaluates against both <code className="bg-white/10 px-1 py-0.5 rounded text-sm">subjectCode</code> and <code className="bg-white/10 px-1 py-0.5 rounded text-sm">subjectName</code> locally. Simply typing "CS101" instantly displays matched resources without network calls.
              </p>
            </div>
          </section>

          <section id="batch-downloads" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
              Batch ZIP Downloads
            </h2>
            <div className="prose prose-invert max-w-none text-slate-300">
              <p className="mb-6">
                When a student selects multiple criteria, the system offers **Batch Downloads** to save bulk resources instantly.
              </p>
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-6">
                <h4 className="text-indigo-400 font-semibold mb-3">How it works under the hood</h4>
                <ul className="space-y-2 marker:text-indigo-500/50">
                  <li>The UI triggers asynchronous HTTP <code className="bg-black/30 px-1 py-0.5 rounded text-sm">fetch</code> requests to all associated Firebase Storage URLs, converting them to Blobs.</li>
                  <li>The <code className="bg-black/30 px-1 py-0.5 rounded text-sm">JSZip</code> library constructs a virtual directory tree containing these binary blobs in browser memory.</li>
                  <li><code className="bg-black/30 px-1 py-0.5 rounded text-sm">FileSaver.js</code> prompts your OS native file dialog, pushing the compressed <code className="bg-black/30 px-1 py-0.5 rounded text-sm">.zip</code>.</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="issue-reporting" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              Reporting Issues
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="mb-6 text-slate-300">
                Quality control is maintained via continuous student feedback. If an asset is flawed (e.g., missing pages, wrong year, unreadable blurriness), students hold the power to immediately flag it.
              </p>
              
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 bg-rose-500/5 rounded-bl-full border-b border-l border-rose-500/10"></div>
                <h4 className="text-rose-400 font-semibold mb-4 mt-0">How to report a broken document:</h4>
                <ol className="space-y-4 m-0 text-slate-300 relative z-10">
                  <li className="flex gap-4 items-start">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold text-sm shrink-0">1</span>
                    <span>Click the <strong>Report (Alert Icon)</strong> next to the specific file in the Student View.</span>
                  </li>
                  <li className="flex gap-4 items-start">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold text-sm shrink-0">2</span>
                    <span>A modal will appear. Select the Issue Category (e.g., "Missing Pages") and provide a quick description.</span>
                  </li>
                  <li className="flex gap-4 items-start">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold text-sm shrink-0">3</span>
                    <span>Submit. The payload is written to the database, immediately notifying the responsible <strong>Department Admin</strong> via their Dashboard for hot-replacement.</span>
                  </li>
                </ol>
              </div>
            </div>
          </section>

          <section id="roles-privileges" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-amber-500 mb-6 pb-2 border-b border-white/10 flex items-center gap-3">
              <span className="p-2 bg-amber-500/10 rounded-lg"><svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></span>
              Roles & Privileges
            </h2>
            <div className="prose prose-invert max-w-none text-slate-300">
              <p className="mb-6">
                The platform is governed by a strict Role-Based Access Control (RBAC) model. This ensures that academic materials are managed properly, and responsibility is delegated hierarchically.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-amber-500/10 rounded-bl-xl border-b border-l border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">Unlimited</div>
                  <h3 className="text-amber-400 font-bold text-xl mb-3 mt-0">Super Admin</h3>
                  <p className="text-sm mb-4">The ultimate authority in the system. Typically reserved for top-level faculty or system owners.</p>
                  <ul className="space-y-2 text-sm marker:text-amber-500/50">
                    <li>Can manage (Add/Remove) other Super Admins and Department Admins via the **Staff Directory**.</li>
                    <li>Has unrestricted visibility and edit rights across <strong>all departments</strong>.</li>
                    <li>Can view global analytics, including insights into how many documents each staff member has uploaded.</li>
                    <li>Can resolve global issue reports.</li>
                  </ul>
                </div>

                <div className="bg-sky-500/5 border border-sky-500/20 p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-sky-500/10 rounded-bl-xl border-b border-l border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">Restricted</div>
                  <h3 className="text-sky-400 font-bold text-xl mb-3 mt-0">Departmental Admin / Staff</h3>
                  <p className="text-sm mb-4">Responsible for specific departments. They curate and provide resources strictly for their assigned scope.</p>
                  <ul className="space-y-2 text-sm marker:text-sky-500/50">
                    <li><strong>Scoped Access:</strong> Can only upload, manage, or delete resources belonging to their assigned departments.</li>
                    <li>Can securely answer and resolve student Issue Reports related to their specific department's documents.</li>
                    <li>Cannot modify the Staff Directory or elevate other users.</li>
                    <li>Provides the backbone of the application by continuously uploading PYQs and Notes for the students.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section id="admin-dashboard" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
              Administrator Features & Responsibilities
            </h2>
            <div className="prose prose-invert max-w-none text-slate-300">
              <p className="mb-6">
                Administrators use a secure CMS to oversee academic content. Access is protected by Firebase Security Rules preventing arbitrary client edits. Here is a breakdown of all core features available in the Admin Area.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#161d2b] p-5 rounded-xl border border-white/5">
                  <h4 className="font-semibold text-white mb-2">📊 Analytics Dashboard</h4>
                  <p className="text-sm text-slate-400">Visualize Total Uploads, Students, Downloads, and actively Reported Issues securely pulled from aggregated counters.</p>
                </div>
                <div className="bg-[#161d2b] p-5 rounded-xl border border-white/5">
                  <h4 className="font-semibold text-white mb-2">📚 Subject Registry</h4>
                  <p className="text-sm text-slate-400">Define the global syllabus curriculum to ensure all document uploads align with official institutional subject codes.</p>
                </div>
                <div className="bg-[#161d2b] p-5 rounded-xl border border-white/5">
                  <h4 className="font-semibold text-white mb-2">⚠️ Issue Reports</h4>
                  <p className="text-sm text-slate-400">Direct feedback loop where admins can view and resolve complaints about broken files or missing pages directly submitted by students.</p>
                </div>
                <div className="bg-[#161d2b] p-5 rounded-xl border border-white/5">
                  <h4 className="font-semibold text-white mb-2">⬆️ Document Upload</h4>
                  <p className="text-sm text-slate-400">The ingestion engine to push PYQs, Notes, or Lab Manuals. Supports direct PDF file uploads or linking Google Drive URLs.</p>
                </div>
                <div className="bg-[#161d2b] p-5 rounded-xl border border-white/5">
                  <h4 className="font-semibold text-white mb-2">🔄 Content Management</h4>
                  <p className="text-sm text-slate-400">Detailed grids where admins can search across their departments, Hot-Replace incorrect files, and perform standard deletions.</p>
                </div>
                <div className="bg-[#161d2b] p-5 rounded-xl border border-white/5">
                  <h4 className="font-semibold text-white mb-2">👥 Staff Insights</h4>
                  <p className="text-sm text-slate-400">(Super Admin Only) Track top contributors and see how many resources each faculty member has provided to the hub.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="upload-lifecycle" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
              The Upload Lifecycle
            </h2>
            <div className="prose prose-invert max-w-none text-slate-300">
              <p className="mb-6">
                The ingestion pipeline is highly fault-tolerant and ensures referential integrity across the Firebase infrastructure.
              </p>
              <div className="bg-[#121927] border border-white/5 rounded-xl px-6 py-5">
                <h4 className="font-medium text-white mb-4">Pipeline Execution Steps</h4>
                <div className="relative border-l border-white/10 pl-6 space-y-6">
                  <div className="relative">
                    <span className="absolute -left-[29px] bg-[#0E1525] w-2 h-2 rounded-full border-2 border-sky-500 mt-1.5" />
                    <strong className="text-white">1. Metadata Allocation</strong>
                    <p className="text-sm text-slate-400 mt-1">Admin selects predefined structured data (Course, Subject, Year), locking the asset structurally.</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[29px] bg-[#0E1525] w-2 h-2 rounded-full border-2 border-sky-500 mt-1.5" />
                    <strong className="text-white">2. Path Resolution & Upload</strong>
                    <p className="text-sm text-slate-400 mt-1">The file streams to Cloud Storage via deterministic paths: <code className="bg-black/30 px-1 py-0.5 rounded text-xs text-sky-300">/pyqs/department/semester/filename.pdf</code></p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[29px] bg-[#0E1525] w-2 h-2 rounded-full border-2 border-sky-500 mt-1.5" />
                    <strong className="text-white">3. Atomic Commit</strong>
                    <p className="text-sm text-slate-400 mt-1">Firestore stores the generated <code className="bg-black/30 px-1 py-0.5 rounded text-xs text-sky-300">DownloadURL</code> and telemetries update atomically using <code className="bg-black/30 px-1 py-0.5 rounded text-xs text-sky-300">FieldValue.increment()</code>.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="hot-replace" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
              Document Hot-Replace
            </h2>
            <div className="prose prose-invert max-w-none text-slate-300">
              <p className="mb-6">
                To fix erroneous files without losing download statistics or associated IDs, the platform implements Document Hot-Replacing.
              </p>
              <p>
                When an admin triggers a "Replace", the system patches the <code className="bg-white/10 px-1 py-0.5 rounded text-sm">fileUrl</code> pointer in the specific Firestore document to the new file, maintaining all history, rather than deleting and re-creating the database entry.
              </p>
            </div>
          </section>

          <section id="architecture" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
              Platform Architecture
            </h2>
            <div className="prose prose-invert max-w-none text-slate-300">
              <p className="mb-6">
                The application uses a serverless, decoupled architecture prioritizing extreme read-performance and high availability.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">1</span>
                    Frontend Layer
                  </h4>
                  <p className="text-sm">Built with React 18+ and Vite. React provides a reactive virtual DOM for immediate UI updates when filtering large sets of academic data, utilizing Tailwind CSS for utility-first styling.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center">2</span>
                    Backend Layer
                  </h4>
                  <p className="text-sm">Firebase Cloud Firestore stores flat documents optimized for querying. Blob storage handles raw PDFs. Authentication issues signed JWTs via Google Identity.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="security" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
              Security & ABAC Rules
            </h2>
            <div className="prose prose-invert max-w-none text-slate-300">
              <p className="mb-6">
                The system does not trust the React client. All rules are established via strictly-typed Firebase Security Rules (<code className="bg-white/10 px-1 py-0.5 rounded text-sm">firestore.rules</code>) using the Fortress Pattern.
              </p>
              <ul className="space-y-4 marker:text-slate-600 pl-4">
                <li><strong className="text-white">Default-Deny Policy:</strong> All access requests are rejected unless explicitly allowed.</li>
                <li><strong className="text-white">Validation Blueprints:</strong> Write operations must pass structural schemas such as <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm text-sky-300">isValidPYQ(data)</code> to ensure no malicious properties are injected.</li>
                <li><strong className="text-white">Action-Based Updates:</strong> Modifying a document requires specific action allowances (e.g. <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm text-sky-300">affectedKeys().hasOnly(['fileUrl'])</code>) controlling state mutations.</li>
                <li><strong className="text-white">Authenticity Guaranty:</strong> The rule dynamically queries <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm text-sky-300">exists(/databases/$(database)/documents/admins/$(request.auth.email))</code> to approve privileged statements securely on backend execution.</li>
              </ul>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

