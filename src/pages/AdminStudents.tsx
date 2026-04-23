import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, Users, Search, Mail } from 'lucide-react';
import { Input } from '../components/ui';

interface AppUser {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  lastLoginAt?: any;
}

export default function AdminStudents() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch the top 100 most recently active users
      const usersColl = collection(db, "users");
      const userQuery = query(usersColl, orderBy("lastLoginAt", "desc"), limit(100));
      const snapshot = await getDocs(userQuery);
      
      const userData: AppUser[] = [];
      snapshot.forEach((doc) => {
        userData.push({ id: doc.id, ...doc.data() } as AppUser);
      });
      setUsers(userData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const lower = searchQuery.toLowerCase();
    return u.email?.toLowerCase().includes(lower) || u.displayName?.toLowerCase().includes(lower);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Student Logins</h1>
          <p className="mt-2 text-sm text-gray-500">View and manage students who have accessed the portal.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              className="pl-9 bg-white" 
              placeholder="Search by email or name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Showing {filteredUsers.length} student(s)
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Student Profile</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {u.photoURL ? (
                           <img src={u.photoURL} alt={u.displayName || 'Avatar'} className="w-10 h-10 rounded-full border border-gray-200 shadow-sm object-cover" />
                        ) : (
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                             <Users className="w-5 h-5" />
                           </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{u.displayName || 'Unknown Student'}</div>
                          <div className="text-gray-500 text-xs font-mono mt-0.5">ID: {u.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">
                       {u.lastLoginAt ? new Date(u.lastLoginAt.seconds * 1000).toLocaleString(undefined, {
                         dateStyle: 'medium',
                         timeStyle: 'short'
                       }) : 'N/A'}
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
