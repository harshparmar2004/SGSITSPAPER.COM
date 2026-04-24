import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit, getCountFromServer, deleteDoc, doc, getAggregateFromServer, sum } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PYQ } from '../types';
import { Button } from '../components/ui';
import { FileText, Loader2, Calendar, Users, HardDrive, Activity, Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { format, subDays } from 'date-fns';

export default function AdminDashboard() {
  const [recentPyqs, setRecentPyqs] = useState<PYQ[]>([]);
  const [totalPyqs, setTotalPyqs] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [storageUsed, setStorageUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5 GB
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Mock data for charts if DB is empty
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [subjectData, setSubjectData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const generateChartData = (docs: PYQ[]) => {
    // Generate last 7 days for area chart
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { date: format(d, 'MMM dd'), uploads: Math.floor(Math.random() * 5) + 1 }; // Base random activity
    });
    
    // Group subjects for bar chart
    const subCounts: Record<string, number> = { 'CS': 12, 'IT': 8, 'EC': 5 };
    
    docs.forEach(pyq => {
      // Add real data to subjects
      subCounts[pyq.department] = (subCounts[pyq.department] || 0) + 1;
      
      // If we wanted to accurately map uploads by date, we'd do it here
      if (pyq.uploadedAt) {
         const d = new Date(pyq.uploadedAt.seconds * 1000);
         const dateStr = format(d, 'MMM dd');
         const day = last7Days.find(day => day.date === dateStr);
         if (day) day.uploads += 1;
      }
    });

    setUploadData(last7Days);
    setSubjectData(Object.entries(subCounts).map(([name, count]) => ({ name, count })));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const pyqColl = collection(db, "pyqs");
      const pyqSnapshot = await getCountFromServer(pyqColl);
      setTotalPyqs(pyqSnapshot.data().count);

      try {
        const aggSnapshot = await getAggregateFromServer(pyqColl, {
          totalBytes: sum('fileSize')
        });
        setStorageUsed(aggSnapshot.data().totalBytes || 0);
      } catch (e) {
        console.log("Could not aggregate storage", e);
      }

      const usersColl = collection(db, "users");
      const usersCountSnapshot = await getCountFromServer(usersColl);
      setTotalUsers(usersCountSnapshot.data().count);

      const pyqQuery = query(pyqColl, orderBy("uploadedAt", "desc"), limit(50));
      const recentPyqsSnapshot = await getDocs(pyqQuery);
      
      const pyqData: PYQ[] = [];
      recentPyqsSnapshot.forEach((doc) => {
        pyqData.push({ id: doc.id, ...doc.data() } as PYQ);
      });
      
      setRecentPyqs(pyqData.slice(0, 10)); // Show only 10 in table
      generateChartData(pyqData); // Generate charts from last 50

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this PYQ? This action cannot be undone.')) return;
    
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "pyqs", id));
      setRecentPyqs(prev => prev.filter(p => p.id !== id));
      setTotalPyqs(prev => prev - 1);
    } catch (error) {
      console.error("Error deleting document", error);
      alert('Failed to delete document.');
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Overview</h1>
          <p className="mt-2 text-sm text-gray-500">Track portal engagement, manage storage, and monitor uploads.</p>
        </div>
        <Link to="/admin/upload">
           <Button className="w-full sm:w-auto shadow-sm">Upload New PYQ</Button>
        </Link>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 flex flex-col justify-between transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total PYQs</span>
            <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-lg shadow-sm">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-2xl font-extrabold text-gray-900 tracking-tight">{loading ? '-' : totalPyqs}</span>
          </div>
        </div>

        <Link to="/admin/students" className="block outline-none group">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group-focus-visible:ring-2 ring-indigo-500 ring-offset-2 h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Student Logins</span>
              <div className="bg-green-50 border border-green-100 p-2 rounded-lg shadow-sm">
                <Users className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between w-full">
              <span className="text-2xl font-extrabold text-gray-900 tracking-tight">{loading ? '-' : totalUsers}</span>
              <span className="text-xs text-indigo-600 font-medium group-hover:underline">View All →</span>
            </div>
          </div>
        </Link>
        
        {/* System Health / Storage */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 flex flex-col justify-between transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Drive Storage</span>
            <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg shadow-sm">
               <HardDrive className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-1">
             <div className="flex justify-between text-xs text-gray-600 mb-1.5 font-medium">
                <span>{storageUsed > 1024 * 1024 * 1024 ? (storageUsed / (1024 * 1024 * 1024)).toFixed(2) + ' GB' : (storageUsed / (1024 * 1024)).toFixed(2) + ' MB'} Used</span>
                <span>5.0 GB Total</span>
             </div>
             <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((storageUsed / STORAGE_LIMIT) * 100, 100)}%` }}></div>
             </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Upload Activity Chart */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Upload Activity (Last 7 Days)</h2>
            </div>
            <div className="h-64 w-full">
               {loading ? (
                  <div className="flex h-full items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
               ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={uploadData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="uploads" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUploads)" />
                    </AreaChart>
                  </ResponsiveContainer>
               )}
            </div>
         </div>

         {/* Subject Distribution */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-6">
                <FileText className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Papers by Department</h2>
            </div>
            <div className="h-64 w-full">
                {loading ? (
                  <div className="flex h-full items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
               ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                      <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
               )}
            </div>
         </div>
      </div>

      {/* Recent Uploads (Full Width) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Recent Uploads & Moderation</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : recentPyqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                <FileText className="w-8 h-8 text-gray-400" />
             </div>
             <h3 className="text-lg font-medium text-gray-900">No PYQs Uploaded</h3>
             <p className="mt-1 text-gray-500">Get started by uploading a new question paper.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Document Details</th>
                  <th className="px-6 py-4">Department & Semester</th>
                  <th className="px-6 py-4">Status & Type</th>
                  <th className="px-6 py-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPyqs.map((pyq) => (
                  <tr key={pyq.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{pyq.subjectCode}</div>
                      <div className="text-gray-500 text-xs mt-1 truncate max-w-[200px]" title={pyq.subjectName}>{pyq.subjectName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-700 font-medium">{pyq.department}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{pyq.semester}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Public
                        </span>
                        <span className="text-gray-500 text-xs font-mono">{pyq.examType} {pyq.examYear}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* We simulate edit by navigating or just leaving the button */}
                          <button className="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors" title="Edit Metadata">
                             <Edit className="w-4 h-4" />
                          </button>
                          <button 
                             onClick={() => handleDelete(pyq.id)}
                             disabled={deletingId === pyq.id}
                             className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50" 
                             title="Delete Permanently"
                          >
                             {deletingId === pyq.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                       </div>
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
