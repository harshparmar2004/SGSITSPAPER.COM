import { useState, useEffect } from 'react';
import { collection, query, getDocs, limit, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PYQ, YEARS, SEMESTERS, EXAM_TYPES, MONTHS } from '../types';
import { Button, Input, Select } from '../components/ui';
import { ExternalLink, Loader2, FileDown, DownloadCloud, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAcademicConfig } from '../hooks/useAcademicConfig';
import { Navigate } from 'react-router';
import JSZip from 'jszip';

export default function StudentView() {
  const { user, loginLoading } = useAuth();
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingZip, setDownloadingZip] = useState(false);
  
  // Filters
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [examType, setExamType] = useState('');
  const [month, setMonth] = useState('');
  const [examYear, setExamYear] = useState('');
  const [session, setSession] = useState('');
  const [section, setSection] = useState('');

  const { programs, loading: configLoading } = useAcademicConfig();

  // Dynamic lists based on selections
  const availableCourses = programs.map(p => p.course);
  const selectedProgramObj = programs.find(p => p.course === course);
  const availableDepartments = selectedProgramObj ? selectedProgramObj.departments : [];

  useEffect(() => {
    if (!user) return;
    fetchPYQs();
  }, [user]);

  const fetchPYQs = async () => {
    setLoading(true);
    try {
      // Fetch recent PYQs. For full complex filtering, we do it client-side 
      // since Firestore requires custom composite indexes for many where clauses.
      const q = query(
        collection(db, "pyqs"),
        orderBy("uploadedAt", "desc"),
        limit(500)
      );

      const snapshot = await getDocs(q);
      const data: PYQ[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as PYQ);
      });
      setPyqs(data);
    } catch (error) {
       console.error("Error fetching PYQs:", error);
    }
    setLoading(false);
  };

  const filteredPyqs = pyqs.filter(p => {
    if (department && p.department !== department) return false;
    if (course && p.course !== course) return false;
    if (year && p.year !== year) return false;
    if (semester && p.semester !== semester) return false;
    if (subjectCode && !p.subjectCode.toLowerCase().includes(subjectCode.toLowerCase())) return false;
    if (subjectName && !p.subjectName.toLowerCase().includes(subjectName.toLowerCase())) return false;
    if (examType && p.examType !== examType) return false;
    if (month && p.month !== month) return false;
    if (examYear && p.examYear !== examYear) return false;
    if (session && p.session !== session) return false;
    if (section && p.section !== section) return false;
    return true;
  });

  const handleDownload = async (pyq: PYQ) => {
    if (user) {
      try {
        await addDoc(collection(db, "downloads"), {
          pyqId: pyq.id,
          userId: user.uid,
          userEmail: user.email,
          department: pyq.department,
          course: pyq.course || 'B.Tech',
          subjectCode: pyq.subjectCode,
          subjectName: pyq.subjectName,
          examType: pyq.examType,
          downloadedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Error recording download analytics", err);
      }
    }
    window.open(pyq.fileUrl, '_blank');
  };

  const recordBulkDownloadAnalytics = async (items: PYQ[]) => {
    if (!user) return;
    try {
      const promises = items.map(pyq => 
        addDoc(collection(db, "downloads"), {
          pyqId: pyq.id,
          userId: user.uid,
          userEmail: user.email,
          department: pyq.department,
          course: pyq.course || 'B.Tech',
          subjectCode: pyq.subjectCode,
          subjectName: pyq.subjectName,
          examType: pyq.examType,
          downloadedAt: serverTimestamp()
        })
      );
      await Promise.all(promises);
    } catch (err) {
      console.error("Error logging bulk analytics", err);
    }
  };

  const handleBulkDownload = async () => {
    if (filteredPyqs.length === 0) return;
    setDownloadingZip(true);
    
    try {
      const zip = new JSZip();
      
      const downloadPromises = filteredPyqs.map(async (pyq) => {
        try {
          const response = await fetch(pyq.fileUrl);
          if (response.ok) {
            const blob = await response.blob();
            const filename = `${pyq.subjectCode}_${pyq.subjectName.replace(/[^a-zA-Z0-9]/g, '_')}_${pyq.examType}_${pyq.examYear}.pdf`;
            zip.file(filename, blob);
          }
        } catch (e) {
          console.error(`Failed to fetch ${pyq.subjectName}`, e);
        }
      });
      
      await Promise.all(downloadPromises);
      await recordBulkDownloadAnalytics(filteredPyqs);
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PYQs_Bulk_Download_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error generating Zip file:", error);
      alert("Failed to download ZIP file. Ensure CORS is configured locally or try opening PDFs individually.");
    }
    
    setDownloadingZip(false);
  };

  if (loginLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  const studentName = user.displayName || user.email?.split('@')[0] || 'Student';

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome, {studentName}! 👋</h1>
          <p className="mt-2 text-lg text-gray-600">Find and download previous year question papers instantly.</p>
        </div>
      </div>

      {/* Advanced Filter Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
           <Search className="w-5 h-5 text-indigo-500" />
           Search Criteria
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {/* Row 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course / Program</label>
            <Select value={course} onChange={(e) => { setCourse(e.target.value); setDepartment(''); }} className="w-full">
              <option value="">All Courses</option>
              {availableCourses.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <Select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full" disabled={!course}>
              <option value="">{course ? 'All Departments' : 'Select Course First'}</option>
              {availableDepartments.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
          </div>

          {/* Row 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <Select value={year} onChange={(e) => setYear(e.target.value)} className="w-full">
              <option value="">All Years</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <Select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full">
              <option value="">All Semesters</option>
              {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>

          {/* Row 3 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
            <Input placeholder="e.g. CS101" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
            <Input placeholder="e.g. Data Structures" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="w-full" />
          </div>

          {/* Row 4 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
            <Select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full">
              <option value="">All Exam Types</option>
              {EXAM_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
            </Select>
          </div>
          <div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full">
                    <option value="">All Months</option>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </Select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Year</label>
                  <Input placeholder="e.g. 2026" value={examYear} onChange={(e) => setExamYear(e.target.value)} className="w-full" />
               </div>
             </div>
          </div>

          {/* Row 5 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
            <Input placeholder="e.g. 2023-2024" value={session} onChange={(e) => setSession(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section (Optional)</label>
            <Input placeholder="e.g. A" value={section} onChange={(e) => setSection(e.target.value)} className="w-full" />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
           <Button 
             onClick={handleBulkDownload} 
             disabled={downloadingZip || filteredPyqs.length === 0}
             className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
           >
             {downloadingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
             {downloadingZip ? 'Zipping Files...' : `Download ${filteredPyqs.length} Result(s) as ZIP`}
           </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : filteredPyqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <FileDown className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No PYQs found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your filters to find existing records.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Title / Code</th>
                  <th className="px-6 py-4">Program / Sem</th>
                  <th className="px-6 py-4">Session / Dept</th>
                  <th className="px-6 py-4">Type / Year</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPyqs.map((pyq) => (
                  <tr key={pyq.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 max-w-xs truncate">
                      <div className="font-semibold text-gray-900 truncate" title={pyq.subjectName}>{pyq.subjectName}</div>
                      <div className="text-gray-500 text-xs font-mono mt-0.5">{pyq.subjectCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{pyq.course}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{pyq.semester}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{pyq.session}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{pyq.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{pyq.examType}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{pyq.month} {pyq.examYear}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(pyq)} className="space-x-1.5 shadow-sm text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View PDF</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


