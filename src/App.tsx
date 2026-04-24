import { Routes, Route, Link, useLocation } from 'react-router';
import { useAuth } from './hooks/useAuth';
import { loginWithGoogle, logout } from './lib/firebase';
import { Button } from './components/ui';
import { LogOut, LayoutDashboard, UserCircle, FileText } from 'lucide-react';
import Landing from './pages/Landing';
import StudentView from './pages/StudentView';
import AdminDashboard from './pages/AdminDashboard';
import AdminUpload from './pages/AdminUpload';
import AdminStudents from './pages/AdminStudents'; // Import newly created component
import AdminReports from './pages/AdminReports';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminAllPYQs from './pages/AdminAllPYQs';
import AdminMonthlyUploads from './pages/AdminMonthlyUploads';
import AdminDepartments from './pages/AdminDepartments';
import AdminLayout from './components/AdminLayout';

function Navbar() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  // Determine logo link
  const getHomeLink = () => {
    if (user) return isAdmin ? '/admin' : '/hub';
    return '/';
  };
  
  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
      <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex">
            <Link to={getHomeLink()} className="flex items-center space-x-2 text-indigo-600 font-bold text-xl hover:opacity-90 transition-opacity">
              <FileText className="w-6 h-6" />
              <span>SGSITS PYQs</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-600 hidden sm:flex">
                  {user.photoURL && <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full" />}
                  <span>{user.email}</span>
                </div>
                {isAdmin && location.pathname !== '/admin' && !location.pathname.startsWith('/admin/') && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm" className="hidden sm:flex items-center space-x-2">
                       <LayoutDashboard className="w-4 h-4" />
                       <span>Admin Area</span>
                    </Button>
                  </Link>
                )}
                {!isAdmin && location.pathname !== '/hub' && (
                  <Link to="/hub">
                    <Button variant="outline" size="sm" className="hidden sm:flex items-center space-x-2">
                       <FileText className="w-4 h-4" />
                       <span>PYQ Hub</span>
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={logout} title="Log Out" className="text-gray-500 hover:text-gray-800">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : location.pathname !== '/' ? (
              <Button variant="outline" size="sm" onClick={loginWithGoogle} className="flex items-center space-x-2">
                <UserCircle className="w-4 h-4" />
                <span>Student / Admin Login</span>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isLanding ? 'bg-[#020617] text-slate-50' : 'bg-gray-50 text-gray-900'}`}>
      {!isLanding && <Navbar />}
      <div className="flex-1 w-full flex flex-col">
        <Routes>
          <Route path="/" element={<Landing />} />
          
          <Route path="/hub" element={
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <StudentView />
            </main>
          } />
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="upload" element={<AdminUpload />} />
            <Route path="manage-pyqs" element={<AdminAllPYQs />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="monthly-uploads" element={<AdminMonthlyUploads />} />
            <Route path="departments" element={<AdminDepartments />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>
        </Routes>
      </div>
      {!isLanding && (
        <footer className="border-t bg-white py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} SGSITS PYQ Resource Hub. Designed for students.</p>
          </div>
        </footer>
      )}
    </div>
  );
}
