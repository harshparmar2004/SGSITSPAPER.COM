import { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function AdminReports() {
  // In a real app, these would come from Firestore
  const [reports] = useState([
    {
      id: 'rep-1',
      subjectCode: 'CS-402',
      issue: 'Broken PDF Link',
      reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: 'pending'
    },
    {
      id: 'rep-2',
      subjectCode: 'EC-301',
      issue: 'Wrong Semester marked (says 3rd, is actually 5th)',
      reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      status: 'pending'
    },
    {
      id: 'rep-3',
      subjectCode: 'IT-201',
      issue: 'Missing page 4',
      reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      status: 'resolved'
    }
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Flagged Content</h1>
        <p className="mt-2 text-sm text-gray-500">Review and resolve issues reported by students.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Needs Review</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-amber-900 tracking-tight">
              {reports.filter(r => r.status === 'pending').length}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Active Reports</h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {reports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`mt-1 p-2 rounded-full ${report.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                     {report.status === 'pending' ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{report.issue}</h3>
                    <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                       <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{report.subjectCode}</span>
                       <span>•</span>
                       <span>Reported {report.reportedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {report.status === 'pending' && (
                  <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-md transition-colors">
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
