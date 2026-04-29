import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, Activity, Users, UserCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PYQ } from '../types';
import { format } from 'date-fns';

interface AdminData {
  id: string; // UID
  email: string;
  role: 'superadmin' | 'department';
  departments: string[];
}

export default function AdminActivity() {
  const { adminRole, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'your' | 'staff' | 'student'>('your');
  const [myHistory, setMyHistory] = useState<PYQ[]>([]);
  const [staffHistory, setStaffHistory] = useState<PYQ[]>([]);
  const [studentHistory, setStudentHistory] = useState<PYQ[]>([]);
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [adminSnap, pyqSnap] = await Promise.all([
           getDocs(query(collection(db, "admins"))),
           // Fetch all to allow "forever" history for staff
           getDocs(query(collection(db, "pyqs"), orderBy("uploadedAt", "desc")))
        ]);
        
        const adminList = adminSnap.docs.map(d => ({ id: d.id, ...d.data() } as AdminData));
        setAdmins(adminList);
        
        const allPyqs = pyqSnap.docs.map(d => ({ id: d.id, ...d.data() } as PYQ));
        
        const staffEmails = new Set(adminList.map(a => a.email.toLowerCase()));

        const staffPyqs = allPyqs.filter(p => p.uploadedBy && staffEmails.has(p.uploadedBy.toLowerCase()));
        const studentPyqs = allPyqs.filter(p => p.uploadedBy && !staffEmails.has(p.uploadedBy.toLowerCase()));

        setStaffHistory(staffPyqs);
        // User requested last 50 actions by the students
        setStudentHistory(studentPyqs.slice(0, 50));

        if (user && user.email) {
            // Your Last 50 Actions
            const userEmailLower = user.email.toLowerCase();
            const myDocs = allPyqs.filter(p => p.uploadedBy && p.uploadedBy.toLowerCase() === userEmailLower);
            setMyHistory(myDocs.slice(0, 50));
        }

      } catch (e) {
        console.error("Error fetching activity data", e);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Activity Log</h1>
          <p className="mt-2 text-sm text-gray-500">View recent portal activity including uploads by staff members and students.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('your')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'your' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Your Upload History
          </button>
          <button
             onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'staff' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Staff History
          </button>
          <button
            onClick={() => setActiveTab('student')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Student Log History
          </button>
        </div>
      </div>

      {activeTab === 'your' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
             <UserCheck className="w-5 h-5 text-indigo-500" />
             Your Upload History
           </h3>
           <span className="text-xs text-gray-500 font-medium">Your Last 50 Actions</span>
        </div>
        
        {loading ? (
           <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : myHistory.length === 0 ? (
           <div className="p-8 text-center text-gray-500 bg-gray-50/30">You have no recent uploads.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Action Done By</th>
                  <th className="px-6 py-4">Target Document</th>
                  <th className="px-6 py-4">Department Addressed</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myHistory.map((pyq) => {
                  return (
                    <tr key={pyq.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs uppercase ${adminRole ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                              {pyq.uploadedBy?.[0] || '?'}
                           </div>
                           <div>
                              <div className="font-medium text-gray-900 truncate max-w-[200px]" title={pyq.uploadedBy || 'Unknown'}>
                                 {pyq.uploadedBy || 'Unknown User'}
                              </div>
                              <div className="text-xs text-indigo-500 font-medium mt-0.5">You</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="font-medium text-gray-900">{pyq.subjectCode}</div>
                         <div className="text-gray-500 text-xs mt-0.5 truncate max-w-[150px]" title={pyq.subjectName}>{pyq.subjectName}</div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            {pyq.department}
                         </div>
                         <div className="text-gray-500 text-xs mt-1 ml-1">{pyq.examType} {pyq.examYear} - {pyq.semester}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">
                        {pyq.uploadedAt ? format(new Date(pyq.uploadedAt.seconds * 1000), 'MMM dd, yyyy HH:mm') : 'Unknown'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {activeTab === 'staff' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
             <Activity className="w-5 h-5 text-indigo-500" />
             Staff & Teacher Upload History
           </h3>
           <span className="text-xs text-gray-500 font-medium">All Time</span>
        </div>
        
        {loading ? (
           <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : staffHistory.length === 0 ? (
           <div className="p-8 text-center text-gray-500 bg-gray-50/30">No staff uploads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Action Done By</th>
                  <th className="px-6 py-4">Target Document</th>
                  <th className="px-6 py-4">Department Addressed</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffHistory.map((pyq) => {
                  return (
                    <tr key={pyq.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className={'w-8 h-8 rounded flex items-center justify-center font-bold text-xs uppercase bg-purple-100 text-purple-700'}>
                              {pyq.uploadedBy?.[0] || '?'}
                           </div>
                           <div>
                              <div className="font-medium text-gray-900 truncate max-w-[200px]" title={pyq.uploadedBy || 'Unknown'}>
                                 {pyq.uploadedBy || 'Unknown User'}
                              </div>
                              <div className="text-xs text-purple-500 font-medium mt-0.5">Staff Member</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="font-medium text-gray-900">{pyq.subjectCode}</div>
                         <div className="text-gray-500 text-xs mt-0.5 truncate max-w-[150px]" title={pyq.subjectName}>{pyq.subjectName}</div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            {pyq.department}
                         </div>
                         <div className="text-gray-500 text-xs mt-1 ml-1">{pyq.examType} {pyq.examYear} - {pyq.semester}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">
                        {pyq.uploadedAt ? format(new Date(pyq.uploadedAt.seconds * 1000), 'MMM dd, yyyy HH:mm') : 'Unknown'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {activeTab === 'student' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
             <Users className="w-5 h-5 text-indigo-500" />
             Student Upload History
           </h3>
           <span className="text-xs text-gray-500 font-medium">Last 50 Actions</span>
        </div>
        
        {loading ? (
           <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : studentHistory.length === 0 ? (
           <div className="p-8 text-center text-gray-500 bg-gray-50/30">No recent student uploads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Action Done By</th>
                  <th className="px-6 py-4">Target Document</th>
                  <th className="px-6 py-4">Department Addressed</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentHistory.map((pyq) => {
                  return (
                    <tr key={pyq.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className={'w-8 h-8 rounded flex items-center justify-center font-bold text-xs uppercase bg-gray-100 text-gray-600'}>
                              {pyq.uploadedBy?.[0] || '?'}
                           </div>
                           <div>
                              <div className="font-medium text-gray-900 truncate max-w-[200px]" title={pyq.uploadedBy || 'Unknown'}>
                                 {pyq.uploadedBy || 'Unknown User'}
                              </div>
                              <div className="text-xs text-gray-500 font-medium mt-0.5">Student</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="font-medium text-gray-900">{pyq.subjectCode}</div>
                         <div className="text-gray-500 text-xs mt-0.5 truncate max-w-[150px]" title={pyq.subjectName}>{pyq.subjectName}</div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            {pyq.department}
                         </div>
                         <div className="text-gray-500 text-xs mt-1 ml-1">{pyq.examType} {pyq.examYear} - {pyq.semester}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">
                        {pyq.uploadedAt ? format(new Date(pyq.uploadedAt.seconds * 1000), 'MMM dd, yyyy HH:mm') : 'Unknown'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

