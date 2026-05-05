import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Report } from '../types';

export default function AdminReports() {
  const { adminRole, assignedDepartments } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "reports"), orderBy("reportedAt", "desc"));
        const pyqSnap = await getDocs(q);
        const allReports = pyqSnap.docs.map(d => ({ id: d.id, ...d.data() } as Report));
        setReports(allReports);
      } catch (err) {
         console.error("Error fetching reports", err);
      }
      setLoading(false);
    };
    fetchReports();
  }, []);

  const handleMarkResolved = async (reportId: string) => {
     try {
       await updateDoc(doc(db, "reports", reportId), {
         status: 'resolved'
       });
       setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
     } catch (err) {
        console.error("Error marking as resolved", err);
        alert("Failed to mark report as resolved.");
     }
  };

  const filteredReports = reports.filter(r => {
    if (adminRole === 'superadmin') return true;
    return assignedDepartments.some(d => d.includes(r.department));
  });

  if (loading) {
     return <div className="p-12 text-center text-gray-500">Loading reports...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Flagged Content</h1>
        <p className="mt-2 text-sm text-gray-500">Review and resolve issues reported by students for your assigned departments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Needs Review</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-amber-900 tracking-tight">
              {filteredReports.filter(r => r.status === 'pending').length}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Active Reports</h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredReports.length === 0 ? (
             <div className="p-12 text-center text-gray-500">No reports found for your departments.</div>
          ) : filteredReports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gray-50/50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`mt-1 p-2 rounded-full shrink-0 ${report.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                     {report.status === 'pending' ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      {report.issueCategory && (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-red-100 text-red-700 px-2 py-0.5 rounded-md border border-red-200">
                          {report.issueCategory}
                        </span>
                      )}
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        Reported on {report.reportedAt ? (typeof report.reportedAt === 'string' ? new Date(report.reportedAt).toLocaleDateString() : new Date(report.reportedAt.seconds * 1000).toLocaleDateString()) : 'Unknown Date'}
                      </span>
                    </div>
                    
                    <h3 className="text-base font-medium text-gray-900 mb-4">{report.issue}</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-gray-50/80 border border-gray-100 rounded-lg p-4">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Target Resource</p>
                        <div className="text-sm font-semibold text-gray-800 break-words">{report.pyqDetails || 'Unknown Resource'}</div>
                        <div className="flex items-center flex-wrap gap-2 mt-1.5">
                          <span className="font-mono bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">
                            {report.subjectCode}
                          </span>
                          {report.fileUrl && (
                            <>
                              <span className="text-gray-300">•</span>
                              <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 text-xs font-medium">
                                View PDF
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      {(report.reporterName || report.reporterId || report.reporterBranch || report.reportedBy) && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Reported By</p>
                          <div className="text-sm">
                            <span className="font-semibold text-gray-800 pr-1">{report.reporterName || 'Unknown Student'}</span>
                            {report.reporterId && <span className="text-gray-500 font-mono text-xs">({report.reporterId})</span>}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-2 gap-y-1 items-center">
                            {report.reporterBranch && <span className="font-medium text-gray-600">{report.reporterBranch}</span>}
                            {report.reporterBranch && report.reportedBy && <span className="text-gray-300">•</span>}
                            {report.reportedBy && <span>Account: <span className="text-gray-600 hover:text-gray-900">{report.reportedBy}</span></span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {report.status === 'pending' && (
                  <button onClick={() => handleMarkResolved(report.id!)} className="shrink-0 text-sm font-semibold tracking-wide text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-4 py-2 rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
