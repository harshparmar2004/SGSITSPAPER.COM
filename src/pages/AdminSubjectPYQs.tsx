import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PYQ } from '../types';
import { Input, Button } from '../components/ui';
import { Loader2, Search, FileText, ChevronDown, ChevronRight, Download, BookOpen, Layers } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AdminSubjectPYQs() {
  const { isAdmin, adminRole, assignedDepartments } = useAuth();
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Grouping structure: Semester -> Subject -> PYQs
  const [expandedSemester, setExpandedSemester] = useState<string | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  useEffect(() => {
    fetchPyqs();
  }, [adminRole, assignedDepartments]);

  const fetchPyqs = async () => {
    if (!adminRole) return;
    setLoading(true);
    try {
      const q = query(collection(db, "pyqs"), orderBy("uploadedAt", "desc"));
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PYQ));

      // Filter by department if not superadmin
      if (adminRole === 'department') {
        data = data.filter(p => assignedDepartments.includes(p.department) || assignedDepartments.includes(`${p.course}::${p.department}`));
      }

      setPyqs(data);
    } catch (e) {
      console.error("Error fetching PYQs", e);
    }
    setLoading(false);
  };

  const filteredPyqs = pyqs.filter(p => 
    p.subjectCode.toLowerCase().includes(search.toLowerCase()) || 
    p.subjectName.toLowerCase().includes(search.toLowerCase()) ||
    p.semester.toLowerCase().includes(search.toLowerCase())
  );

  // Group by Semester
  const groupedBySemester = filteredPyqs.reduce((acc, pyq) => {
    if (!acc[pyq.semester]) acc[pyq.semester] = [];
    acc[pyq.semester].push(pyq);
    return acc;
  }, {} as Record<string, PYQ[]>);

  // Further Group by Subject within a Semester
  const organizeBySubject = (semPyqs: PYQ[]) => {
    return semPyqs.reduce((acc, pyq) => {
      const subKey = `${pyq.subjectCode} - ${pyq.subjectName}`;
      if (!acc[subKey]) acc[subKey] = [];
      acc[subKey].push(pyq);
      return acc;
    }, {} as Record<string, PYQ[]>);
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Subject-wise View</h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">View PYQs organized by semester and subject.</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search semester, code or title..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-9 w-full bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : Object.keys(groupedBySemester).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
           No matching PDFs found.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(groupedBySemester).sort((a,b) => a.localeCompare(b)).map(semester => {
            const semGroup = groupedBySemester[semester];
            const subjectsObj = organizeBySubject(semGroup);
            const isSemExpanded = expandedSemester === semester || (search && true); 

            return (
              <div key={semester} className="bg-white border text-gray-900 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => setExpandedSemester(isSemExpanded ? null : semester)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-100/50"
                  style={{ borderBottomWidth: isSemExpanded ? '1px' : '0px' }}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold text-gray-900 text-lg">{semester}</span>
                    <span className="ml-2 text-xs font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{semGroup.length} PDFs</span>
                  </div>
                  {isSemExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                </button>

                {isSemExpanded && (
                  <div className="bg-white flex flex-col gap-[2px]">
                     {Object.keys(subjectsObj).sort((a,b) => a.localeCompare(b)).map(subjectKey => {
                       const subjPyqs = subjectsObj[subjectKey];
                       const isSubjExpanded = expandedSubject === subjectKey || (search && true);

                       return (
                         <div key={subjectKey} className="border-b border-gray-100 last:border-b-0 overflow-hidden">
                            <button
                               onClick={() => setExpandedSubject(isSubjExpanded ? null : subjectKey)}
                               className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                            >
                               <div className="flex flex-col text-left">
                                 <span className="font-medium text-gray-900 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-indigo-400" /> {subjectKey}
                                 </span>
                                 <span className="text-xs text-gray-500 mt-1 pl-6">{subjPyqs[0].department} • {subjPyqs[0].course}</span>
                               </div>
                               <div className="flex items-center gap-3">
                                 <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-wider">{subjPyqs.length} Files</span>
                                 {isSubjExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                               </div>
                            </button>

                            {isSubjExpanded && (
                               <div className="p-4 pt-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-gray-50/50">
                                  {subjPyqs.map(pyq => (
                                    <div key={pyq.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between group">
                                      <div className="flex items-start gap-3 mb-3">
                                        <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
                                           <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm text-gray-900 line-clamp-2 leading-snug">
                                            {pyq.documentType === 'Notes' ? 'Class Notes' : 
                                             pyq.documentType === 'Syllabus' ? 'Syllabus PDF' : 
                                             `${pyq.examYear} ${pyq.examType}`}
                                          </p>
                                          <p className="text-xs text-gray-500 mt-1">{(pyq.fileSize / 1024).toFixed(1)} KB • {typeof pyq.uploadedAt === 'string' ? new Date(pyq.uploadedAt).toLocaleDateString() : new Date(pyq.uploadedAt?.seconds * 1000).toLocaleDateString()}</p>
                                        </div>
                                      </div>
                                      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400 max-w-[120px] truncate" title={pyq.fileName}>{pyq.fileName}</span>
                                        <a 
                                          href={pyq.fileUrl || '#'} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded"
                                        >
                                          View <Download className="w-3 h-3" />
                                        </a>
                                      </div>
                                    </div>
                                  ))}
                               </div>
                            )}
                         </div>
                       )
                     })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
