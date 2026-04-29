import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button, Input, Select } from '../components/ui';
import { Loader2, UserPlus, Trash2, Shield, Search, FileText, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAcademicConfig } from '../hooks/useAcademicConfig';
import { PYQ } from '../types';
import { format } from 'date-fns';

interface AdminData {
  id: string; // UID
  email: string;
  role: 'superadmin' | 'department';
  departments: string[];
}

export default function AdminStaff() {
  const { adminRole } = useAuth();
  const { programs } = useAcademicConfig();
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);

  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'superadmin' | 'department'>('department');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const allDepartments = Array.from(new Set(programs.flatMap(p => p.departments)));

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "admins"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AdminData));
      setAdmins(data);
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
    setLoading(false);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    
    setAdding(true);
    setError('');

    try {
      // 1. Look up user by email in the "users" collection to get their UID
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", newEmail.trim().toLowerCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setError("User not found. They must log in to the application at least once before they can be assigned as staff.");
        setAdding(false);
        return;
      }
      
      const uid = snap.docs[0].id;
      
      // 2. Add to admins collection
      await setDoc(doc(db, "admins", uid), {
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        departments: newRole === 'department' ? selectedDepartments : []
      });

      setNewEmail('');
      setSelectedDepartments([]);
      fetchAdmins();
    } catch (err: any) {
      console.error(err);
      setError("Failed to add staff. " + err.message);
    }
    setAdding(false);
  };

  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  const handleDeleteStaff = async () => {
    if (!deleteModal) return;
    try {
      await deleteDoc(doc(db, "admins", deleteModal));
      setAdmins(prev => prev.filter(a => a.id !== deleteModal));
    } catch (err: any) {
      setError("Failed to remove: " + err.message);
    }
    setDeleteModal(null);
  };

  const toggleDept = (dept: string) => {
    setSelectedDepartments(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  if (adminRole !== 'superadmin') return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to remove this staff member?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteStaff}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manage Staff</h1>
        <p className="mt-2 text-sm text-gray-500">Assign users to Department Panels or make them Super Admins.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-600" />
          Add New Staff Member
        </h3>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">{error}</div>}

        <form onSubmit={handleAddStaff} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">User Email Address *</label>
              <Input 
                type="email" 
                placeholder="staff@example.com" 
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Role *</label>
              <Select value={newRole} onChange={e => setNewRole(e.target.value as any)}>
                <option value="department">Department Admin</option>
                <option value="superadmin">Super Admin</option>
              </Select>
            </div>
          </div>

          {newRole === 'department' && (
            <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <label className="text-sm font-medium text-gray-900">Assign Departments *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-2 bg-white border border-gray-100 rounded">
                {allDepartments.map(dept => (
                  <label key={dept} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={selectedDepartments.includes(dept)}
                      onChange={() => toggleDept(dept)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                    />
                    <span className="truncate" title={dept}>{dept}</span>
                  </label>
                ))}
                {allDepartments.length === 0 && <span className="text-gray-400 text-sm py-2">No departments available. Create programs/departments first.</span>}
              </div>
              {selectedDepartments.length === 0 && <p className="text-xs text-amber-600">Please select at least one department.</p>}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={adding || !newEmail || (newRole === 'department' && selectedDepartments.length === 0)}>
              {adding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign Role
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
             <Shield className="w-4 h-4 text-gray-500" />
             Current Staff Members
           </h3>
        </div>
        
        {loading ? (
           <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : admins.length === 0 ? (
           <div className="p-8 text-center text-gray-500 bg-gray-50/30">No staff members assigned yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Assigned Departments</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.map(admin => (
                  <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{admin.email}</td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${admin.role === 'superadmin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                         {admin.role === 'superadmin' ? 'Super Admin' : 'Department Admin'}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                       {admin.role === 'superadmin' ? (
                         <span className="text-gray-400 italic">All Access</span>
                       ) : (
                         <div className="flex gap-1 flex-wrap max-w-md">
                           {admin.departments?.map(d => (
                             <span key={d} className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs truncate max-w-[120px]" title={d}>{d}</span>
                           ))}
                         </div>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(admin.email !== "harshparma007@gmail.com") && (
                        <button 
                          onClick={() => setDeleteModal(admin.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove Staff"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
