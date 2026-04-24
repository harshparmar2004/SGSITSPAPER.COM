import { NavLink, Outlet } from 'react-router';
import { LayoutDashboard, PlusCircle, Users, AlertTriangle, Layers, LineChart, CalendarDays, FileStack } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router';

export default function AdminLayout() {
  const { isAdmin, loginLoading } = useAuth();

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
    { name: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Manage PYQs', path: '/admin/manage-pyqs', icon: FileStack, exact: false },
    { name: 'Programs & Departments', path: '/admin/departments', icon: Layers, exact: false },
    { name: 'Monthly Uploads', path: '/admin/monthly-uploads', icon: CalendarDays, exact: false },
    { name: 'Download Analytics', path: '/admin/analytics', icon: LineChart, exact: false },
    { name: 'Student Logins', path: '/admin/students', icon: Users, exact: false },
    { name: 'Upload PYQ', path: '/admin/upload', icon: PlusCircle, exact: false },
    { name: 'Reports', path: '/admin/reports', icon: AlertTriangle, exact: false },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col shadow-sm z-10">
        <div className="p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Admin Panel
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className={`w-5 h-5 ${item.name === 'Overview' ? '' : ''}`} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
