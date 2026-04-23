import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PYQ, DEPARTMENTS, SEMESTERS, EXAM_TYPES } from '../types';
import { Button, Input, Select } from '../components/ui';
import { Search, ExternalLink, Loader2, FileDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router';

export default function StudentView() {
  const { user, loginLoading } = useAuth();
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [examType, setExamType] = useState('');
  const [examYear, setExamYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchPYQs();
  }, [department, semester, examType, examYear, user]);

  const fetchPYQs = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, "pyqs"),
        orderBy("uploadedAt", "desc"),
        limit(50)
      );

      const qConstraints = [];
      if (department) qConstraints.push(where("department", "==", department));
      if (semester) qConstraints.push(where("semester", "==", semester));
      if (examType) qConstraints.push(where("examType", "==", examType));
      if (examYear) qConstraints.push(where("examYear", "==", examYear));

      if (qConstraints.length > 0) {
        q = query(collection(db, "pyqs"), ...qConstraints, orderBy("uploadedAt", "desc"), limit(100));
      }

      const snapshot = await getDocs(q);
      const data: PYQ[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as PYQ);
      });
      setPyqs(data);
    } catch (error) {
      console.error("Error fetching PYQs:", error);
      // Fallback without orderBy if index is missing
      try {
         const qConstraints = [];
         if (department) qConstraints.push(where("department", "==", department));
         if (semester) qConstraints.push(where("semester", "==", semester));
         if (examType) qConstraints.push(where("examType", "==", examType));
         if (examYear) qConstraints.push(where("examYear", "==", examYear));
         const fallbackQ = query(collection(db, "pyqs"), ...qConstraints, limit(100));
         const fbSnapshot = await getDocs(fallbackQ);
         const data: PYQ[] = [];
         fbSnapshot.forEach((doc) => {
           data.push({ id: doc.id, ...doc.data() } as PYQ);
         });
         data.sort((a, b) => b.uploadedAt?.seconds - a.uploadedAt?.seconds);
         setPyqs(data);
      } catch (e) {
          console.error("Fallback query failed:", e);
      }
    }
    setLoading(false);
  };

  const filteredPyqs = pyqs.filter(p => {
    if (!searchQuery) return true;
    const lower = searchQuery.toLowerCase();
    return p.subjectName.toLowerCase().includes(lower) || p.subjectCode.toLowerCase().includes(lower);
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

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">PYQ Resource Hub</h1>
        <p className="mt-2 text-lg text-gray-600">Find previous year question papers for all departments and semesters.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
            className="pl-10 h-11" 
            placeholder="Search by Subject Name or Code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap md:flex-nowrap gap-3">
          <Select className="w-full md:w-48 h-11" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Select className="w-full md:w-36 h-11" value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">All Semesters</option>
            {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select className="w-full md:w-36 h-11" value={examType} onChange={(e) => setExamType(e.target.value)}>
            <option value="">All Exam Types</option>
            {EXAM_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
          </Select>
          <Input 
            className="w-full md:w-32 h-11" 
            placeholder="Year (e.g. 2023)" 
            value={examYear}
            onChange={(e) => setExamYear(e.target.value)}
          />
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
            <p className="mt-1 text-gray-500">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Semester</th>
                  <th className="px-6 py-4">Exam</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPyqs.map((pyq) => (
                  <tr key={pyq.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{pyq.subjectName}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{pyq.subjectCode}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{pyq.department}</td>
                    <td className="px-6 py-4 text-gray-600">{pyq.semester}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <div>{pyq.examType}</div>
                      <div className="text-xs text-gray-400">{pyq.month} {pyq.examYear}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(pyq)} className="space-x-2">
                        <ExternalLink className="w-4 h-4" />
                        <span>Open PDF</span>
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
