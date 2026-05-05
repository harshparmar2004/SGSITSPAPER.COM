import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router';
import { LayoutDashboard, PlusCircle, Users, AlertTriangle, Layers, LineChart, CalendarDays, FileStack, Activity, BookOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Report } from '../types';

export default function AdminLayout() {
  const { isAdmin, adminRole, assignedDepartments, loginLoading } = useAuth();
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "reports"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => doc.data() as Report);
      const filteredReports = reports.filter(r => {
        if (adminRole === 'superadmin') return true;
        return assignedDepartments.some(d => d.includes(r.department));
      });
      setPendingReportsCount(filteredReports.length);
    }, (error) => {
      console.error("Error fetching reports count:", error);
    });

    return () => unsubscribe();
  }, [isAdmin, adminRole, assignedDepartments]);

  if (loginLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

    const navItems = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true, showForAuth: true },
    { name: 'Manage PYQs', path: '/admin/manage-pyqs', icon: FileStack, exact: false, showForAuth: true },
    { name: 'Subject-wise View', path: '/admin/subject-pyqs', icon: BookOpen, exact: false, showForAuth: true },
    { name: 'Upload PYQ', path: '/admin/upload', icon: PlusCircle, exact: false, showForAuth: true },
    
    // Super admin only routes
    { name: 'Programs & Departments', path: '/admin/departments', icon: Layers, exact: false, showForAuth: adminRole === 'superadmin' },
    { name: 'Manage Subjects', path: '/admin/subjects', icon: BookOpen, exact: false, showForAuth: true },
    { name: 'Monthly Uploads', path: '/admin/monthly-uploads', icon: CalendarDays, exact: false, showForAuth: true }, // 2
    { name: 'Download Analytics', path: '/admin/analytics', icon: LineChart, exact: false, showForAuth: true },
    { name: 'Student Logins', path: '/admin/students', icon: Users, exact: false, showForAuth: adminRole === 'superadmin' }, // 3
    { name: 'Manage Staff', path: '/admin/staff', icon: Users, exact: false, showForAuth: adminRole === 'superadmin' },
    { name: 'Reports', path: '/admin/reports', icon: AlertTriangle, exact: false, showForAuth: true, badgeCount: pendingReportsCount }, // 5
    { name: 'Activity Log', path: '/admin/activity', icon: Activity, exact: false, showForAuth: true },
  ].filter(item => item.showForAuth);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col shadow-sm z-10 shrink-0">
        <div className="p-3 pb-2">
          <h2 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">
            Admin Panel
          </h2>
        </div>
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <div className="flex items-center gap-3 truncate">
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badgeCount ? (
                <span className="inline-flex items-center justify-center w-5 h-5 ml-2 text-[10px] font-bold text-white bg-red-500 rounded-full shrink-0 animate-in fade-in zoom-in">
                  {item.badgeCount > 99 ? '99+' : item.badgeCount}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-3 md:p-4">
        <Outlet />
      </main>
    </div>
  );
}
