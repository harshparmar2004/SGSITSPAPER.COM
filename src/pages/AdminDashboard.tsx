import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  getCountFromServer,
  deleteDoc,
  doc,
  getAggregateFromServer,
  sum,
  where,
} from "firebase/firestore";
import { getCachedCollection } from "../lib/cache";
import { db } from "../lib/firebase";
import { PYQ } from "../types";
import { Button } from "../components/ui";
import {
  FileText,
  Loader2,
  Calendar,
  Users,
  HardDrive,
  Activity,
  Trash2,
  Edit,
  BookOpen,
  Layers,
  Download,
  LineChart,
} from "lucide-react";
import { Link } from "react-router";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { format, subDays } from "date-fns";
import { useAuth } from "../hooks/useAuth";
import { useAcademicConfig } from "../hooks/useAcademicConfig";

export default function AdminDashboard() {
  const { adminRole, assignedDepartments } = useAuth();
  const { subjects, loading: configLoading } = useAcademicConfig();
  const [recentPyqs, setRecentPyqs] = useState<PYQ[]>([]);
  const [totalPyqs, setTotalPyqs] = useState(0);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [totalPdfs, setTotalPdfs] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);
  const [storageUsed, setStorageUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5 GB
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    step: 1 | 2;
  } | null>(null);

  // Mock data for charts if DB is empty
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [subjectData, setSubjectData] = useState<any[]>([]);
  const [dashboardPyqs, setDashboardPyqs] = useState<PYQ[]>([]);

  useEffect(() => {
    if (!configLoading) {
      fetchData();
    }
  }, [adminRole, assignedDepartments, configLoading, subjects]);

  const fetchData = async () => {
    if (!adminRole) return;
    setLoading(true);
    try {
      const pyqColl = collection(db, "pyqs");

      let finalTotal = 0;
      let finalStorage = 0;

      if (adminRole === "superadmin") {
        const pyqSnapshot = await getCountFromServer(pyqColl);
        finalTotal = pyqSnapshot.data().count;

        try {
          const aggSnapshot = await getAggregateFromServer(pyqColl, {
            totalBytes: sum("fileSize"),
          });
          finalStorage = aggSnapshot.data().totalBytes || 0;
        } catch (e) {
          console.log("Could not aggregate storage", e);
        }
      }

      let finalTotalUsers = 0;
      let finalTotalDownloads = 0;

      if (adminRole === "superadmin") {
        const usersColl = collection(db, "users");
        const usersCountSnapshot = await getCountFromServer(usersColl);
        finalTotalUsers = usersCountSnapshot.data().count;

        try {
          const adminsSnap = await getCountFromServer(collection(db, "admins"));
          setTotalStaff(adminsSnap.data().count);
        } catch (e) {
          console.log("Could not count admins", e);
        }
      } else {
        // For department admins, we'll fetch downloads to show engagement instead of total users
        try {
          const allDownloads = await getCachedCollection("downloads");
          let downDocs = allDownloads.slice(0, 1000);
          downDocs = downDocs.filter(
            (d) =>
              assignedDepartments.some((ad) => ad === d.department || ad.endsWith(`::${d.department}`)),
          );

          // Count unique students who downloaded
          const uniqueUsers = new Set(
            downDocs.map((d) => d.userId).filter(Boolean),
          );
          finalTotalUsers = uniqueUsers.size;
          finalTotalDownloads = downDocs.length;
        } catch (e) {
          console.log("Error fetching downloads", e);
        }
      }

      setTotalUsers(finalTotalUsers);

      // Fetch docs to calculate data. For department admin, we just pull everything and filter in memory if needed
      // since 'in' query has 30 elements limits, but it's fine for small scales.
      const pyqQuery = query(pyqColl, orderBy("uploadedAt", "desc")); // Get all basically for graph..
      // To prevent large reads, we'll just get up to 1000 latest
      const allCachedPyqs = await getCachedCollection("pyqs");
      let pyqData: PYQ[] = allCachedPyqs.slice(0, 1000);

      if (adminRole === "department") {
        pyqData = pyqData.filter(
          (p) =>
            assignedDepartments.some((ad) => ad === p.department || ad.endsWith(`::${p.department}`)),
        );
        setTotalPdfs(pyqData.length);
        setTotalPyqs(
          pyqData.filter((p) => !p.documentType || p.documentType === "PYQ")
            .length,
        );

        const displayedSubjects = subjects.filter((s) => {
          if (!s.departments || s.departments.length === 0) return true;
          return s.departments.some((d) => {
            const parts = d.split("::");
            const deptName = parts.length > 1 ? parts[1] : d;
            return (
              assignedDepartments.includes(d) ||
              assignedDepartments.includes(deptName)
            );
          });
        });
        setTotalSubjects(displayedSubjects.length);
      } else {
        setTotalPyqs(finalTotal);
        setStorageUsed(finalStorage);
      }

      setDashboardPyqs(pyqData);
      setRecentPyqs(pyqData.slice(0, 10)); // Show only 10 in table

      // Generate last 30 days for area chart
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = subDays(new Date(), 29 - i);
        return { date: format(d, "MMM dd"), uploads: 0 };
      });

      // Group subjects for bar chart
      const subCounts: Record<string, number> = {};

      pyqData.forEach((pyq) => {
        // Add real data to subjects
        subCounts[pyq.department] = (subCounts[pyq.department] || 0) + 1;

        if (pyq.uploadedAt) {
          const d = new Date(pyq.uploadedAt.seconds * 1000);
          const dateStr = format(d, "MMM dd");
          const day = last30Days.find((dObj) => dObj.date === dateStr);
          if (day) day.uploads += 1;
        }
      });

      setUploadData(last30Days);
      setSubjectData(
        Object.entries(subCounts).map(([name, count]) => ({ name, count })),
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
    setLoading(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteModal({ isOpen: true, id, step: 1 });
  };

  const executeDelete = async () => {
    if (!deleteModal) return;
    const { id } = deleteModal;

    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "pyqs", id));
      setRecentPyqs((prev) => prev.filter((p) => p.id !== id));
      setTotalPyqs((prev) => prev - 1);
      setDeleteModal(null);
    } catch (error) {
      console.error("Error deleting document", error);
      alert("Failed to delete document.");
      setDeleteModal(null);
    }
    setDeletingId(null);
  };

  const exportDashboardCsv = () => {
    if (dashboardPyqs.length === 0) return;

    const headers = [
      "ID",
      "Subject Code",
      "Subject Name",
      "Department",
      "Course",
      "Year",
      "Semester",
      "Exam Type",
      "Exam Year",
      "Document Type",
      "File Size (KB)",
      "Date Uploaded",
    ];

    const rows = dashboardPyqs.map((p) => [
      p.id,
      `"${p.subjectCode}"`,
      `"${p.subjectName}"`,
      `"${p.department}"`,
      `"${p.course}"`,
      `"${p.year}"`,
      `"${p.semester}"`,
      `"${p.examType || ""}"`,
      `"${p.examYear || ""}"`,
      `"${p.documentType || "PYQ"}"`,
      p.fileSize ? Math.round(p.fileSize / 1024) : 0,
      p.uploadedAt
        ? `"${format(new Date(p.uploadedAt.seconds * 1000), "yyyy-MM-dd")}"`
        : "Unknown",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `dashboard_report_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3 max-w-6xl mx-auto pb-8">
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-3 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {deleteModal.step === 1 ? "Confirm Deletion" : "DOUBLE CHECK!"}
            </h3>
            <p className="text-gray-600 mb-4">
              {deleteModal.step === 1 ? (
                <>Are you sure you want to delete this PYQ?</>
              ) : (
                <>
                  Deleting this PYQ is permanent and cannot be undone. Are you
                  absolutely sure?
                </>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteModal(null)}>
                Cancel
              </Button>
              {deleteModal.step === 1 ? (
                <Button
                  variant="danger"
                  onClick={() => setDeleteModal({ ...deleteModal, step: 2 })}
                >
                  Yes, continue
                </Button>
              ) : (
                <Button variant="danger" onClick={executeDelete}>
                  {deletingId === deleteModal.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  ) : null}
                  I am absolutely sure, Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Admin Overview
            </h1>
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            Track portal engagement, manage storage, and monitor uploads.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={exportDashboardCsv}
            disabled={dashboardPyqs.length === 0}
            className="w-full sm:w-auto shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
          <Link to="/admin/upload" className="w-full sm:w-auto">
            <Button className="w-full shadow-sm">Upload New PYQ</Button>
          </Link>
        </div>
      </div>

      {/* Top Stats Row */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`}
      >
        <Link to="/admin/subject-pyqs" className="block outline-none group">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group-focus-visible:ring-2 ring-indigo-500 ring-offset-2 h-full overflow-hidden">
            <div className="bg-indigo-500 px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Total PYQs
              </span>
              <FileText className="w-4 h-4 text-white opacity-90" />
            </div>
            <div className="p-4 flex items-baseline justify-between w-full">
              <span className="text-3xl font-black text-gray-900 tracking-tight">
                {loading ? "-" : totalPyqs}
              </span>
              <span className="text-xs text-indigo-600 font-medium group-hover:underline">
                View All →
              </span>
            </div>
          </div>
        </Link>

        {adminRole === "superadmin" && (
          <Link to="/admin/students" className="block outline-none group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group-focus-visible:ring-2 ring-green-500 ring-offset-2 h-full overflow-hidden">
              <div className="bg-emerald-500 px-3 py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Student Logins
                </span>
                <Users className="w-4 h-4 text-white opacity-90" />
              </div>
              <div className="p-4 flex items-baseline justify-between w-full">
                <span className="text-3xl font-black text-gray-900 tracking-tight">
                  {loading ? "-" : totalUsers}
                </span>
                <span className="text-xs text-emerald-600 font-medium group-hover:underline">
                  View All →
                </span>
              </div>
            </div>
          </Link>
        )}

        {adminRole === "superadmin" && (
          <Link to="/admin/staff" className="block outline-none group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group-focus-visible:ring-2 ring-purple-500 ring-offset-2 h-full overflow-hidden">
              <div className="bg-purple-500 px-3 py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Active Staff
                </span>
                <Activity className="w-4 h-4 text-white opacity-90" />
              </div>
              <div className="p-4 flex items-baseline justify-between w-full">
                <span className="text-3xl font-black text-gray-900 tracking-tight">
                  {loading ? "-" : totalStaff}
                </span>
                <span className="text-xs text-purple-600 font-medium group-hover:underline">
                  View All →
                </span>
              </div>
            </div>
          </Link>
        )}

        {adminRole === "superadmin" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col transition-shadow hover:shadow-md h-full overflow-hidden">
            <div className="bg-blue-500 px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Drive Storage
              </span>
              <HardDrive className="w-4 h-4 text-white opacity-90" />
            </div>
            <div className="p-4 mt-auto flex flex-col justify-center w-full">
              <div className="flex justify-between text-[11px] text-gray-600 mb-1.5 font-bold uppercase tracking-wider">
                <span>
                  {storageUsed > 1024 * 1024 * 1024
                    ? (storageUsed / (1024 * 1024 * 1024)).toFixed(2) + " GB"
                    : (storageUsed / (1024 * 1024)).toFixed(2) + " MB"}{" "}
                  Used
                </span>
                <span>5.0 GB Total</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${storageUsed / STORAGE_LIMIT > 0.8 ? "bg-red-500" : "bg-blue-500"}`}
                  style={{
                    width: `${Math.min((storageUsed / STORAGE_LIMIT) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {adminRole === "department" && (
          <>
            <Link to="/admin/subjects" className="block outline-none group">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group-focus-visible:ring-2 ring-emerald-500 ring-offset-2 h-full overflow-hidden">
                <div className="bg-emerald-500 px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Total Subjects
                  </span>
                  <BookOpen className="w-4 h-4 text-white opacity-90" />
                </div>
                <div className="p-4 flex items-baseline justify-between w-full">
                  <span className="text-3xl font-black text-gray-900 tracking-tight">
                    {loading ? "-" : totalSubjects}
                  </span>
                  <span className="text-xs text-emerald-600 font-medium group-hover:underline">
                    View All →
                  </span>
                </div>
              </div>
            </Link>

            <Link to="/admin/pyqs" className="block outline-none group">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group-focus-visible:ring-2 ring-amber-500 ring-offset-2 h-full overflow-hidden">
                <div className="bg-amber-500 px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Total PDFs Uploaded
                  </span>
                  <Layers className="w-4 h-4 text-white opacity-90" />
                </div>
                <div className="p-4 flex items-baseline justify-between w-full">
                  <span className="text-3xl font-black text-gray-900 tracking-tight">
                    {loading ? "-" : totalPdfs}
                  </span>
                  <span className="text-xs text-amber-600 font-medium group-hover:underline">
                    View All →
                  </span>
                </div>
              </div>
            </Link>
            <Link to="/admin/analytics" className="block outline-none group">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group-focus-visible:ring-2 ring-indigo-500 ring-offset-2 h-full overflow-hidden">
                <div className="bg-indigo-500 px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Analytics
                  </span>
                  <LineChart className="w-4 h-4 text-white opacity-90" />
                </div>
                <div className="p-4 flex items-baseline justify-between w-full h-full flex-col justify-end">
                  <span className="text-sm font-medium text-gray-500 mb-2">View downloads & engagement</span>
                  <div className="w-full text-right">
                    <span className="text-xs text-indigo-600 font-medium group-hover:underline">
                      Go to Analytics →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="flex flex-col gap-6">
        {/* Upload Activity Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full overflow-hidden">
          <div className="bg-indigo-50 px-4 py-3 flex items-center justify-between border-b border-indigo-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-white shadow-sm border border-indigo-100">
                <Activity className="w-4 h-4 text-indigo-700" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
                Upload Activity (Last 30 Days)
              </h2>
            </div>
          </div>
          <div className="h-[280px] w-full p-4">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={uploadData}
                  margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorUploads"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="uploads"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorUploads)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Subject Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full overflow-hidden">
          <div className="bg-indigo-50 px-4 py-3 flex items-center justify-between border-b border-indigo-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-white shadow-sm border border-indigo-100">
                <FileText className="w-4 h-4 text-indigo-700" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
                Papers by Department
              </h2>
            </div>
          </div>
          <div className="h-[280px] w-full p-4">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectData}
                  margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f3f4f6" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Uploads (Full Width) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="bg-indigo-50 px-4 py-3 flex items-center justify-between border-b border-indigo-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-white shadow-sm border border-indigo-100">
              <Layers className="w-4 h-4 text-indigo-700" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
              Recent Uploads & Moderation
            </h2>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : recentPyqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No PYQs Uploaded
            </h3>
            <p className="mt-1 text-gray-500">
              Get started by uploading a new question paper.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-12 text-center">S.No.</th>
                  <th className="px-3 py-2">Document Details</th>
                  <th className="px-3 py-2">Department & Semester</th>
                  <th className="px-3 py-2">Status & Type</th>
                  <th className="px-3 py-2">Uploaded By</th>
                  <th className="px-3 py-2 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPyqs.map((pyq, index) => (
                  <tr
                    key={pyq.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-3 py-2 text-center text-gray-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-gray-900">
                        {pyq.subjectCode}
                      </div>
                      <div
                        className="text-gray-500 text-xs mt-1 truncate max-w-[200px]"
                        title={pyq.subjectName}
                      >
                        {pyq.subjectName}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-gray-700 font-medium">
                        {pyq.department}
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        {pyq.semester}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{" "}
                          Public
                        </span>
                        <span className="text-gray-500 text-xs font-mono">
                          {pyq.documentType === "Internship Information" ? "Internship" : pyq.documentType === "Books & Resources" ? "Book" : pyq.documentType === "Lab Manual" ? "Lab" : pyq.documentType === "Syllabus" ? "Syllabus" : pyq.documentType === "Notes" ? "Notes" : `${pyq.examType || ""} ${pyq.examYear || ""}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center uppercase">
                          {pyq.uploadedBy?.[0] || "?"}
                        </div>
                        <div
                          className="text-xs font-medium text-gray-700 truncate max-w-[150px]"
                          title={pyq.uploadedBy || "Unknown"}
                        >
                          {pyq.uploadedBy || "Unknown"}
                        </div>
                      </div>
                      {pyq.uploadedAt && (
                        <div className="text-[11px] text-gray-400 mt-1">
                          {format(
                            new Date(pyq.uploadedAt.seconds * 1000),
                            "MMM dd, yyyy HH:mm",
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* We simulate edit by navigating or just leaving the button */}
                        <button
                          className="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                          title="Edit Metadata"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(pyq.id)}
                          disabled={deletingId === pyq.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete Permanently"
                        >
                          {deletingId === pyq.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
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
