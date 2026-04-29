import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, Activity } from 'lucide-react';
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
  const [history, setHistory] = useState<PYQ[]>([]);
  const [myHistory, setMyHistory] = useState<PYQ[]>([]);
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [adminSnap, pyqSnap] = await Promise.all([
           getDocs(query(collection(db, "admins"))),
           getDocs(query(collection(db, "pyqs"), orderBy("uploadedAt", "desc"), limit(50)))
        ]);
        
        setAdmins(adminSnap.docs.map(d => ({ id: d.id, ...d.data() } as AdminData)));
        
        const allPyqs = pyqSnap.docs.map(d => ({ id: d.id, ...d.data() } as PYQ));
        setHistory(allPyqs);

        if (user && user.email) {
            // Also fetch explicitly for the user to make sure we don't miss anything that fell off the global top 50
            const myq = query(collection(db, "pyqs"), where("uploadedBy", "==", user.email));
            const mySnap = await getDocs(myq);
            const myDocs = mySnap.docs.map(d => ({ id: d.id, ...d.data() } as PYQ));
            myDocs.sort((a, b) => {
               const timeA = a.uploadedAt?.seconds || 0;
               const timeB = b.uploadedAt?.seconds || 0;
               return timeB - timeA;
            });
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Activity Log</h1>
        <p className="mt-2 text-sm text-gray-500">View recent portal activity including uploads by staff members and users.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
             <Activity className="w-5 h-5 text-indigo-500" />
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
             <Activity className="w-5 h-5 text-indigo-500" />
             Recent Staff & Upload Activity
           </h3>
           <span className="text-xs text-gray-500 font-medium">Last 50 Actions</span>
        </div>
        
        {loading ? (
           <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : history.length === 0 ? (
           <div className="p-8 text-center text-gray-500 bg-gray-50/30">No recent uploads found.</div>
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
                {history.map((pyq) => {
                  const isStaff = admins.some(a => a.email === pyq.uploadedBy);
                  return (
                    <tr key={pyq.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs uppercase ${isStaff ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                              {pyq.uploadedBy?.[0] || '?'}
                           </div>
                           <div>
                              <div className="font-medium text-gray-900 truncate max-w-[200px]" title={pyq.uploadedBy || 'Unknown'}>
                                 {pyq.uploadedBy || 'Unknown User'}
                              </div>
                              <div className="text-xs text-indigo-500 font-medium mt-0.5">{isStaff ? 'Staff Member' : 'Student/User'}</div>
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
    </div>
  );
}
