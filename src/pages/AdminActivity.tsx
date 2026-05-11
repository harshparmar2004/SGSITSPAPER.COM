import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, Activity, Users, UserCheck, Download } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PYQ } from '../types';
import { format } from 'date-fns';
import { Button } from '../components/ui';

interface AdminData {
  id: string; // UID
  email: string;
  role: 'superadmin' | 'department';
  departments: string[];
}

export default function AdminActivity() {
  const { adminRole, user, assignedDepartments } = useAuth();
  const [activeTab, setActiveTab] = useState<'your' | 'superadmin' | 'staff' | 'student'>('your');
  const [myHistory, setMyHistory] = useState<PYQ[]>([]);
  const [superadminHistory, setSuperadminHistory] = useState<PYQ[]>([]);
  const [staffHistory, setStaffHistory] = useState<PYQ[]>([]);
  const [studentHistory, setStudentHistory] = useState<PYQ[]>([]);
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminRole && adminRole !== 'superadmin') {
      setActiveTab('staff');
    }
  }, [adminRole]);

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
        
        const superadminEmails = new Set(adminList.filter(a => a.role === 'superadmin').map(a => a.email?.toLowerCase()).filter(Boolean));
        superadminEmails.add('harshparma007@gmail.com');
        const superadminUids = new Set(adminList.filter(a => a.role === 'superadmin').map(a => a.id));

        const staffEmails = new Set(adminList.filter(a => a.role === 'department').map(a => a.email?.toLowerCase()).filter(Boolean));
        const staffUids = new Set(adminList.filter(a => a.role === 'department').map(a => a.id));

        const superadminPyqs = allPyqs.filter(p => p.uploadedBy && (superadminEmails.has(p.uploadedBy.toLowerCase()) || superadminUids.has(p.uploadedBy)));
        let staffPyqs = allPyqs.filter(p => p.uploadedBy && (staffEmails.has(p.uploadedBy.toLowerCase()) || staffUids.has(p.uploadedBy)));
        
        // Filter staff Pyqs based on assigned departments if not superadmin
        if (adminRole !== 'superadmin') {
          staffPyqs = staffPyqs.filter(p => {
             const fullDept = `${p.course}::${p.department}`;
             return assignedDepartments.includes(fullDept) || assignedDepartments.includes(p.department);
          });
        }

        const studentPyqs = allPyqs.filter(p => p.uploadedBy && !(superadminEmails.has(p.uploadedBy.toLowerCase()) || superadminUids.has(p.uploadedBy)) && !(staffEmails.has(p.uploadedBy.toLowerCase()) || staffUids.has(p.uploadedBy)) && p.uploadedBy !== user?.uid);

        setSuperadminHistory(superadminPyqs);
        setStaffHistory(staffPyqs);
        // User requested last 50 actions by the students
        setStudentHistory(studentPyqs.slice(0, 50));

        if (user && user.email) {
            // Your Last 50 Actions
            const userEmailLower = user.email.toLowerCase();
            const myDocs = allPyqs.filter(p => p.uploadedBy && (p.uploadedBy.toLowerCase() === userEmailLower || p.uploadedBy === user.uid));
            setMyHistory(myDocs.slice(0, 50));
        }

      } catch (e) {
        console.error("Error fetching activity data", e);
      }
      setLoading(false);
    };

    if (adminRole) {
      fetchData();
    }
  }, [user, adminRole, assignedDepartments]);

  const exportActivityLog = () => {
    let targetData: PYQ[] = [];
    let logName = '';

    if (activeTab === 'your') {
      targetData = myHistory;
      logName = 'Your_Uploads';
    } else if (activeTab === 'superadmin') {
      targetData = superadminHistory;
      logName = 'SuperAdmin_History';
    } else if (activeTab === 'staff') {
      targetData = staffHistory;
      logName = 'Staff_History';
    } else {
      targetData = studentHistory;
      logName = 'Student_History';
    }

    if (targetData.length === 0) return;

    const headers = ["ID", "Uploaded By", "Subject Code", "Subject Name", "Department", "Course", "Year", "Semester", "Document Type", "Date"];
    const rows = targetData.map(p => {
      let uploader = p.uploadedBy || 'unknown';
      if (activeTab === 'staff' || activeTab === 'superadmin') {
        const staffMatch = admins.find(a => a.email?.toLowerCase() === p.uploadedBy?.toLowerCase() || a.id === p.uploadedBy);
        if (staffMatch) {
          uploader = staffMatch.email;
        }
      }
      return [
        p.id,
        `"${uploader}"`,
        `"${p.subjectCode}"`,
        `"${p.subjectName}"`,
        `"${p.department}"`,
        `"${p.course}"`,
        `"${p.year}"`,
        `"${p.semester}"`,
        `"${p.documentType || 'PYQ'}"`,
        p.uploadedAt ? `"${format(p.uploadedAt.toDate(), "MMM d, yyyy h:mm a")}"` : "Unknown"
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Activity_Log_${logName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3 max-w-6xl mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Activity Log</h1>
          <p className="mt-2 text-[11px] text-gray-500">View recent portal activity including uploads by staff members and students.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Button variant="outline" size="sm" onClick={exportActivityLog} disabled={loading} className="w-full sm:w-auto text-xs whitespace-nowrap">
            <Download className="w-4 h-4 mr-2" /> Export Log
          </Button>
          {adminRole === 'superadmin' && (
            <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto min-w-min">
              <button
                onClick={() => setActiveTab('your')}
                className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'your' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Your Upload History
              </button>
              <button
                 onClick={() => setActiveTab('superadmin')}
                className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'superadmin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Super Admin History
              </button>
              <button
                 onClick={() => setActiveTab('staff')}
                className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'staff' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Staff History
              </button>
              <button
                onClick={() => setActiveTab('student')}
                className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Student Log History
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'your' && adminRole === 'superadmin' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
        <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
             <UserCheck className="w-5 h-5 text-indigo-500" />
             Your Upload History
           </h3>
           <span className="text-[11px] text-gray-500 font-medium">Your Last 50 Actions</span>
        </div>
        
        {loading ? (
           <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : myHistory.length === 0 ? (
           <div className="p-8 text-center text-gray-500 bg-gray-50/30">You have no recent uploads.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-12 text-center">S.No.</th>
                  <th className="px-3 py-2">Action Done By</th>
                  <th className="px-3 py-2">Target Document</th>
                  <th className="px-3 py-2">Department Addressed</th>
                  <th className="px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myHistory.map((pyq, index) => {
                  return (
                    <tr key={pyq.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-center text-gray-500 font-medium">{index + 1}</td>
                      <td className="px-3 py-2">
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
                      <td className="px-3 py-2">
                         <div className="font-medium text-gray-900">{pyq.subjectCode}</div>
                         <div className="text-gray-500 text-xs mt-0.5 truncate max-w-[150px]" title={pyq.subjectName}>{pyq.subjectName}</div>
                      </td>
                      <td className="px-3 py-2">
                         <div className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            {pyq.department}
                         </div>
                         <div className="text-gray-500 text-xs mt-1 ml-1">{pyq.examType} {pyq.examYear} - {pyq.semester}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-500 font-medium">
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

      {activeTab === 'superadmin' && adminRole === 'superadmin' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
        <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
             <UserCheck className="w-5 h-5 text-indigo-500" />
             Super Admin History
           </h3>
           <span className="text-[11px] text-gray-500 font-medium">All Time</span>
        </div>
        
        {loading ? (
           <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : superadminHistory.length === 0 ? (
           <div className="p-8 text-center text-gray-500 bg-gray-50/30">No super admin uploads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-12 text-center">S.No.</th>
                  <th className="px-3 py-2">Action Done By</th>
                  <th className="px-3 py-2">Target Document</th>
                  <th className="px-3 py-2">Department Addressed</th>
                  <th className="px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {superadminHistory.map((pyq, index) => {
                  const adminMatch = admins.find(a => a.email?.toLowerCase() === pyq.uploadedBy?.toLowerCase() || a.id === pyq.uploadedBy);
                  let displayName = adminMatch?.name || 'Unknown User';
                  
                  // if no name in admin doc but we have an email, use it
                  if (!adminMatch?.name && adminMatch?.email) {
                    displayName = adminMatch.email.split('@')[0];
                  } else if (!adminMatch) {
                    // if it's an email, use name part
                    if (pyq.uploadedBy?.includes('@')) {
                       displayName = pyq.uploadedBy.split('@')[0];
                    } else if (pyq.uploadedBy === user?.uid) {
                       displayName = 'You';
                    } else {
                       displayName = 'Super Admin';
                    }
                  }

                  return (
                    <tr key={pyq.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-center text-gray-500 font-medium">{index + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                           <div className={'w-8 h-8 rounded flex items-center justify-center font-bold text-xs uppercase bg-indigo-100 text-indigo-700'}>
                              {displayName[0] || '?'}
                           </div>
                           <div>
                              <div className="font-medium text-gray-900 truncate max-w-[200px]" title={displayName}>
                                 {displayName}
                              </div>
                              <div className="text-xs text-indigo-500 font-medium mt-0.5">{pyq.uploadedBy}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                         <div className="font-medium text-gray-900">{pyq.subjectCode}</div>
                         <div className="text-gray-500 text-xs mt-0.5 truncate max-w-[150px]" title={pyq.subjectName}>{pyq.subjectName}</div>
                      </td>
                      <td className="px-3 py-2">
                         <div className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            {pyq.department}
                         </div>
                         <div className="text-gray-500 text-xs mt-1 ml-1">{pyq.examType} {pyq.examYear} - {pyq.semester}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-500 font-medium">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
        <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
             <Activity className="w-5 h-5 text-indigo-500" />
             Staff & Teacher Upload History
           </h3>
           <span className="text-[11px] text-gray-500 font-medium">All Time</span>
        </div>
        
        {loading ? (
           <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : staffHistory.length === 0 ? (
           <div className="p-8 text-center text-gray-500 bg-gray-50/30">No staff uploads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-12 text-center">S.No.</th>
                  <th className="px-3 py-2">Action Done By</th>
                  <th className="px-3 py-2">Target Document</th>
                  <th className="px-3 py-2">Department Addressed</th>
                  <th className="px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffHistory.map((pyq, index) => {
                  const staffMatch = admins.find(a => a.email?.toLowerCase() === pyq.uploadedBy?.toLowerCase() || a.id === pyq.uploadedBy);
                  let displayName = staffMatch?.name || 'Unknown User';
                  
                  // if no name in admin doc but we have an email, use it
                  if (!staffMatch?.name && staffMatch?.email) {
                    displayName = staffMatch.email.split('@')[0];
                  } else if (!staffMatch) {
                    // if it's an email, use name part
                    if (pyq.uploadedBy?.includes('@')) {
                       displayName = pyq.uploadedBy.split('@')[0];
                    } else {
                       displayName = 'Staff Member'; // fallback when only UID is there
                    }
                  }
                  
                  return (
                    <tr key={pyq.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-center text-gray-500 font-medium">{index + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                           <div className={'w-8 h-8 rounded flex items-center justify-center font-bold text-xs uppercase bg-purple-100 text-purple-700'}>
                              {displayName[0] || '?'}
                           </div>
                           <div>
                              <div className="font-medium text-gray-900 truncate max-w-[200px]" title={displayName}>
                                 {displayName}
                              </div>
                              <div className="text-xs text-purple-500 font-medium mt-0.5">{pyq.uploadedBy}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                         <div className="font-medium text-gray-900">{pyq.subjectCode}</div>
                         <div className="text-gray-500 text-xs mt-0.5 truncate max-w-[150px]" title={pyq.subjectName}>{pyq.subjectName}</div>
                      </td>
                      <td className="px-3 py-2">
                         <div className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            {pyq.department}
                         </div>
                         <div className="text-gray-500 text-xs mt-1 ml-1">{pyq.examType} {pyq.examYear} - {pyq.semester}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-500 font-medium">
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

      {activeTab === 'student' && adminRole === 'superadmin' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
             <Users className="w-5 h-5 text-indigo-500" />
             Student Upload History
           </h3>
           <span className="text-[11px] text-gray-500 font-medium">Last 50 Actions</span>
        </div>
        
        {loading ? (
           <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : studentHistory.length === 0 ? (
           <div className="p-8 text-center text-gray-500 bg-gray-50/30">No recent student uploads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-12 text-center">S.No.</th>
                  <th className="px-3 py-2">Action Done By</th>
                  <th className="px-3 py-2">Target Document</th>
                  <th className="px-3 py-2">Department Addressed</th>
                  <th className="px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentHistory.map((pyq, index) => {
                  return (
                    <tr key={pyq.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-center text-gray-500 font-medium">{index + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                           <div className={'w-8 h-8 rounded flex items-center justify-center font-bold text-xs uppercase bg-gray-100 text-gray-600'}>
                              {pyq.uploadedBy?.[0] || '?'}
                           </div>
                           <div>
                              <div className="font-medium text-gray-900 truncate max-w-[200px]" title={pyq.uploadedBy || 'Unknown'}>
                                 {pyq.uploadedBy || 'Unknown User'}
                              </div>
                              <div className="text-[11px] text-gray-500 font-medium mt-0.5">Student</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                         <div className="font-medium text-gray-900">{pyq.subjectCode}</div>
                         <div className="text-gray-500 text-xs mt-0.5 truncate max-w-[150px]" title={pyq.subjectName}>{pyq.subjectName}</div>
                      </td>
                      <td className="px-3 py-2">
                         <div className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            {pyq.department}
                         </div>
                         <div className="text-gray-500 text-xs mt-1 ml-1">{pyq.examType} {pyq.examYear} - {pyq.semester}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-500 font-medium">
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

