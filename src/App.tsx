import { Routes, Route, Link, useLocation } from "react-router";
import { useAuth } from "./hooks/useAuth";
import { loginWithGoogle, logout } from "./lib/firebase";
import { Button } from "./components/ui";
import { LogOut, LayoutDashboard, UserCircle, FileText } from "lucide-react";
import Landing from "./pages/Landing";
import StudentView from "./pages/StudentView";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUpload from "./pages/AdminUpload";
import AdminStudents from "./pages/AdminStudents"; // Import newly created component
import AdminReports from "./pages/AdminReports";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminAllPYQs from "./pages/AdminAllPYQs";
import AdminSubjectPYQs from "./pages/AdminSubjectPYQs";
import AdminMonthlyUploads from "./pages/AdminMonthlyUploads";
import AdminDepartments from "./pages/AdminDepartments";
import AdminDepartmentDeepDives from "./pages/AdminDepartmentDeepDives";
import AdminLayout from "./components/AdminLayout";
import AdminStaff from "./pages/AdminStaff";
import AdminActivity from "./pages/AdminActivity";

import AdminSubjects from "./pages/AdminSubjects";

function Navbar() {
  const { user, isAdmin, adminRole, assignedDepartments } = useAuth();
  const location = useLocation();

  // Determine logo link
  const getHomeLink = () => {
    if (user) return isAdmin ? "/admin" : "/hub";
    return "/";
  };

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm relative">
      <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center relative">
          <div className="flex shrink-0 z-10">
            <Link
              to={getHomeLink()}
              className="flex items-center space-x-2 md:space-x-3 text-indigo-900 font-extrabold text-lg md:text-xl hover:opacity-90 transition-opacity tracking-tight"
            >
              <img
                src="/logo.svg"
                alt="SGSITS Logo"
                className="w-10 h-10 md:w-12 md:h-12 object-contain shrink-0 drop-shadow-md"
              />
              <span className="block shrink-0 uppercase">
                SGSITS <span className="text-indigo-500">PYQ Hub</span>
              </span>
            </Link>
          </div>

          <div className="flex-1 flex justify-center h-full items-center absolute inset-0 pointer-events-none">
            {isAdmin && user && (
              <div className="hidden md:flex items-center justify-center pointer-events-auto px-4 w-full h-full">
                {adminRole === "superadmin" ? (
                  <div className="bg-indigo-50 text-indigo-800 px-3 py-1 rounded-md text-sm font-bold border border-indigo-200 shadow-sm">
                    Super Admin
                  </div>
                ) : (
                  adminRole === "department" &&
                  assignedDepartments.length > 0 && (
                    <div className="flex gap-2 justify-center flex-wrap max-h-full overflow-hidden items-center py-1">
                      {assignedDepartments.map((dept) => (
                        <span
                          key={dept}
                          className="bg-indigo-50 text-indigo-800 text-sm font-bold px-3 py-1 rounded-md border border-indigo-200 shadow-sm text-center max-w-full"
                        >
                          {dept.includes("::")
                            ? dept.split("::").join(" - ")
                            : dept}{" "}
                          Department
                        </span>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 md:space-x-4 shrink-0 justify-end relative z-10">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-600 hidden sm:flex truncate flex-shrink">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      className="w-5 h-5 md:w-6 md:h-6 rounded-full flex-shrink-0"
                    />
                  )}
                  <span className="truncate">{user.email}</span>
                </div>
                {isAdmin &&
                  location.pathname !== "/admin" &&
                  !location.pathname.startsWith("/admin/") && (
                    <Link to="/admin">
                      <Button
                        variant="outline"
                        size="sm"
                        className="hidden sm:flex items-center space-x-2"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Admin Area</span>
                      </Button>
                    </Link>
                  )}
                {!isAdmin && location.pathname !== "/hub" && (
                  <Link to="/hub">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden sm:flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>PYQ Hub</span>
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  title="Log Out"
                  className="text-gray-500 hover:text-gray-800"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : location.pathname !== "/" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={loginWithGoogle}
                className="flex items-center space-x-2"
              >
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
  const isLanding = location.pathname === "/";
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div
      className={`min-h-screen flex flex-col font-sans ${isLanding ? "bg-[#020617] text-slate-50" : "bg-gray-50 text-gray-900"}`}
    >
      {!isLanding && <Navbar />}
      <div className="flex-1 w-full flex flex-col">
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route
            path="/hub"
            element={
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <StudentView />
              </main>
            }
          />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="upload" element={<AdminUpload />} />
            <Route path="manage-pyqs" element={<AdminAllPYQs />} />
            <Route path="subject-pyqs" element={<AdminSubjectPYQs />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="activity" element={<AdminActivity />} />
            <Route path="monthly-uploads" element={<AdminMonthlyUploads />} />
            <Route path="departments" element={<AdminDepartments />} />
            <Route
              path="department-deep-dives"
              element={<AdminDepartmentDeepDives />}
            />
            <Route path="subjects" element={<AdminSubjects />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>
        </Routes>
      </div>
      {!isLanding && !isAdminRoute && (
        <footer className="border-t bg-white py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm text-gray-500">
            <p>
              © {new Date().getFullYear()} SGSITS PYQ Resource Hub. Designed for
              students.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
