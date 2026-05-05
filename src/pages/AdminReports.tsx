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
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`mt-1 p-2 rounded-full ${report.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                     {report.status === 'pending' ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{report.issue}</h3>
                    {report.pyqDetails && (
                      <div className="mt-1 flex items-center space-x-2 text-xs text-gray-700">
                        <span>Resource: <span className="font-semibold">{report.pyqDetails}</span></span>
                        {report.fileUrl && (
                          <>
                            <span>•</span>
                            <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1">
                              View PDF
                            </a>
                          </>
                        )}
                      </div>
                    )}
                    <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                       <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{report.subjectCode}</span>
                       <span>•</span>
                       <span>Reported {report.reportedAt ? (typeof report.reportedAt === 'string' ? new Date(report.reportedAt).toLocaleDateString() : new Date(report.reportedAt.seconds * 1000).toLocaleDateString()) : 'Unknown Date'}</span>
                       {report.reportedBy && (
                         <>
                           <span>•</span>
                           <span>By: {report.reportedBy}</span>
                         </>
                       )}
                    </div>
                  </div>
                </div>
                {report.status === 'pending' && (
                  <button onClick={() => handleMarkResolved(report.id!)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-md transition-colors">
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
