import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, CalendarDays, FileText, User, Layers, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';

interface UploadRecord {
  id: string;
  subjectCode: string;
  subjectName: string;
  department: string;
  uploadedBy: string;
  uploaderEmail: string;
  uploadedAt: Date;
  monthYear: string; // YYYY-MM format for easy grouping
}

export default function AdminMonthlyUploads() {
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users to map UID -> Email
      const usersSnap = await getDocs(collection(db, "users"));
      const userMap: Record<string, string> = {};
      usersSnap.forEach(doc => {
        const data = doc.data();
        userMap[doc.id] = data.email || data.name || 'Unknown User';
      });

      // 2. Fetch PYQs
      const pyqQuery = query(collection(db, "pyqs"), orderBy("uploadedAt", "desc"));
      const pyqSnap = await getDocs(pyqQuery);
      
      const records: UploadRecord[] = [];
      pyqSnap.forEach(doc => {
        const data = doc.data();
        if (data.uploadedAt) {
          const dateObj = new Date(data.uploadedAt.seconds * 1000);
          records.push({
            id: doc.id,
            subjectCode: data.subjectCode || 'N/A',
            subjectName: data.subjectName || 'Unknown Subject',
            department: data.department || 'N/A',
            uploadedBy: data.uploadedBy || 'unknown',
            uploaderEmail: userMap[data.uploadedBy] || `Admin (${data.uploadedBy.slice(0, 6)})`,
            uploadedAt: dateObj,
            monthYear: format(dateObj, 'yyyy-MM')
          });
        }
      });

      setUploads(records);
      
      // Set default selected month to the most recent one available
      if (records.length > 0) {
        setSelectedMonth(records[0].monthYear);
      }
    } catch (error) {
      console.error("Error fetching monthly uploads:", error);
    }
    setLoading(false);
  };

  // Generate unique months for the dropdown
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set<string>(uploads.map(u => u.monthYear)));
    // Sort descending (newest first)
    return months.sort((a: string, b: string) => b.localeCompare(a));
  }, [uploads]);

  // Aggregate data for the chart (last 12 months with data, sorted chronologically)
  const chartData = useMemo(() => {
    const aggregated: Record<string, number> = {};
    uploads.forEach(u => {
      aggregated[u.monthYear] = (aggregated[u.monthYear] || 0) + 1;
    });

    return Object.entries(aggregated)
      .map(([monthYear, count]) => ({
        monthYear,
        label: format(parseISO(`${monthYear}-01`), 'MMM yyyy'),
        count
      }))
      .sort((a, b) => a.monthYear.localeCompare(b.monthYear)) // chronological for chart
      .slice(-12); // Keep only last 12 months minimum
  }, [uploads]);

  // Filter records for the table based on selected month
  const filteredUploads = useMemo(() => {
    if (!selectedMonth) return [];
    return uploads.filter(u => u.monthYear === selectedMonth);
  }, [uploads, selectedMonth]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Monthly Uploads</h1>
        <p className="mt-2 text-sm text-gray-500">Analyze PYQ upload trends, track contributor activity, and view departmental distributions over time.</p>
      </div>

      {uploads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
             <CalendarDays className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No Upload Data</h3>
          <p className="text-gray-500 text-sm mt-1">There are no PYQs uploaded yet to generate monthly reports.</p>
        </div>
      ) : (
        <>
          {/* Graphical Analysis Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6 text-indigo-600">
               <BarChart2 className="w-5 h-5" />
               <h2 className="text-base font-semibold tracking-wider text-gray-900">Upload Trends (Last 12 Active Months)</h2>
            </div>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 13, fill: '#6b7280' }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 13, fill: '#6b7280' }} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="count" name="PDFs Uploaded" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.monthYear === selectedMonth ? '#4f46e5' : '#a5b4fc'} 
                        className="cursor-pointer transition-colors duration-300 hover:fill-indigo-500"
                        onClick={() => setSelectedMonth(entry.monthYear)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4 italic">Click on any bar to view the detailed upload breakdown for that month.</p>
          </div>

          {/* Detailed Data Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-200">
                     <CalendarDays className="w-5 h-5 text-indigo-600" />
                   </div>
                   <div>
                     <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Detailed Report</h2>
                     <p className="text-xs text-gray-500 mt-0.5">Showing records for selected period.</p>
                   </div>
                </div>
                
                <div className="flex items-center gap-2">
                   <label htmlFor="month-select" className="text-sm font-medium text-gray-600">Select Month:</label>
                   <select 
                     id="month-select"
                     value={selectedMonth}
                     onChange={(e) => setSelectedMonth(e.target.value)}
                     className="block w-40 rounded-md border-gray-300 py-1.5 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 border bg-white shadow-sm"
                   >
                     {availableMonths.map(m => (
                       <option key={m} value={m}>{format(parseISO(`${m}-01`), 'MMMM yyyy')}</option>
                     ))}
                   </select>
                </div>
             </div>
             
             {filteredUploads.length === 0 ? (
               <div className="p-8 text-center text-gray-500">No uploads found for this month.</div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                   <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                     <tr>
                       <th className="px-6 py-4">Document Details</th>
                       <th className="px-6 py-4">Department</th>
                       <th className="px-6 py-4">Uploaded By</th>
                       <th className="px-6 py-4 whitespace-nowrap">Date & Time</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {filteredUploads.map((record) => (
                       <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                               <FileText className="w-4 h-4" />
                             </div>
                             <div>
                               <div className="font-semibold text-gray-900">{record.subjectName}</div>
                               <div className="text-gray-500 text-xs font-mono mt-0.5">{record.subjectCode}</div>
                             </div>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="inline-flex items-center gap-1.5 text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md text-xs font-medium">
                             <Layers className="w-3.5 h-3.5 text-gray-400" />
                             {record.department}
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold uppercase">
                               {record.uploaderEmail.charAt(0)}
                             </div>
                             <span className="text-gray-700 text-xs font-medium">{record.uploaderEmail}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="text-sm text-gray-900">{format(record.uploadedAt, 'MMM dd, yyyy')}</div>
                           <div className="text-xs text-gray-400 mt-0.5">{format(record.uploadedAt, 'hh:mm a')}</div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        </>
      )}
    </div>
  );
}
