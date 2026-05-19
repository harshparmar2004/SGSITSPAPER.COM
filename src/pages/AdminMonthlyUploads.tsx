import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getCachedCollection } from "../lib/cache";
import {
  Loader2,
  CalendarDays,
  FileText,
  User,
  Layers,
  BarChart2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts";
import { format, parseISO } from "date-fns";
import { useAuth } from "../hooks/useAuth";

interface UploadRecord {
  id: string;
  subjectCode: string;
  subjectName: string;
  department: string;
  uploadedBy: string;
  uploaderEmail: string;
  uploadedAt: Date;
  monthYear: string; // YYYY-MM format for easy grouping
  documentType?: string;
  actionType: "UPLOAD" | "DELETE";
}

export default function AdminMonthlyUploads() {
  const { adminRole, assignedDepartments } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [adminRole, assignedDepartments]);

  const fetchData = async () => {
    if (!adminRole) return;
    setLoading(true);
    try {
      const [cachedUsers, cachedPyqs, activityLogsSnap] = await Promise.all([
        getCachedCollection("users"),
        getCachedCollection("pyqs"),
        getDocs(collection(db, "activity_logs")).catch(() => ({ docs: [] }))
      ]);

      const userMap: Record<string, string> = {};
      cachedUsers.forEach((data: any) => {
        userMap[data.id] = data.email || data.name || "Unknown User";
      });

      const records: UploadRecord[] = [];
      
      const activityLogs = activityLogsSnap.docs?.map(d => ({id: d.id, ...d.data()})) || [];
      
      const loggedUploadsIds = new Set(activityLogs.filter(l => l.type === "UPLOAD").map(l => l.documentId));

      const processedLogs = activityLogs.map(log => ({
        ...log,
        actionType: log.type || "DELETE",
        uploadedBy: log.deletedBy,
        uploadedAt: log.deletedAt
      }));
      
      const mappedUploads = cachedPyqs
        .filter(p => !loggedUploadsIds.has(p.id)) // avoid double counting new uploads
        .map(p => ({
          ...p,
          actionType: "UPLOAD"
        }));

      const unifiedActivities = [...mappedUploads, ...processedLogs];

      unifiedActivities.forEach((data: any) => {
        // Filter by assigned departments if department admin
        if (adminRole === "department") {
          if (
            !assignedDepartments.some((ad) => ad === data.department || ad.endsWith(`::${data.department}`))
          ) {
            return;
          }
        }

        if (data.uploadedAt) {
          const dateObj = new Date(
            data.uploadedAt.seconds
              ? data.uploadedAt.seconds * 1000
              : data.uploadedAt,
          );
          records.push({
            id: data.id,
            actionType: data.actionType || "UPLOAD",
            documentType: data.documentType,
            subjectCode: data.subjectCode || "N/A",
            subjectName: data.subjectName || "Unknown Subject",
            department: data.department || "N/A",
            uploadedBy: data.uploadedBy || "unknown",
            uploaderEmail:
              data.deletedByEmail || userMap[data.uploadedBy] ||
              `Admin (${data.uploadedBy.slice(0, 6)})`,
            uploadedAt: dateObj,
            monthYear: format(dateObj, "yyyy-MM"),
          });
        }
      });

      setUploads(records);

      // Set default selected month to the most recent one available
      if (records.length > 0) {
        setSelectedMonth(records[0].monthYear);
      }
    } catch (error) {
      console.error("Error fetching monthly uploads:", error);
    }
    setLoading(false);
  };

  // Generate unique months for the dropdown
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set<string>(uploads.map((u) => u.monthYear)));
    // Sort descending (newest first)
    return months.sort((a: string, b: string) => b.localeCompare(a));
  }, [uploads]);

  // Aggregate data for the chart (last 12 months with data, sorted chronologically)
  const chartData = useMemo(() => {
    const aggregated: Record<string, { uploadsCount: number, deletesCount: number }> = {};
    uploads.forEach((u) => {
      if (!aggregated[u.monthYear]) {
        aggregated[u.monthYear] = { uploadsCount: 0, deletesCount: 0 };
      }
      if (u.actionType === "DELETE") {
        aggregated[u.monthYear].deletesCount += 1;
      } else {
        aggregated[u.monthYear].uploadsCount += 1;
      }
    });

    return Object.entries(aggregated)
      .map(([monthYear, counts]) => ({
        monthYear,
        label: format(parseISO(`${monthYear}-01`), "MMM yyyy"),
        uploadsCount: counts.uploadsCount,
        deletesCount: counts.deletesCount,
      }))
      .sort((a, b) => a.monthYear.localeCompare(b.monthYear)) // chronological for chart
      .slice(-12); // Keep only last 12 months minimum
  }, [uploads]);

  // Filter records for the table based on selected month
  const filteredUploads = useMemo(() => {
    if (!selectedMonth) return [];
    return uploads.filter((u) => u.monthYear === selectedMonth);
  }, [uploads, selectedMonth]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-6xl mx-auto pb-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Monthly Upload / Delete History
        </h1>
        <p className="mt-2 text-[11px] text-gray-500">
          Analyze upload and delete trends, track contributor activity, and view
          departmental distributions over time.
        </p>
      </div>

      {uploads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-300 p-8 text-center">
          <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <CalendarDays className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No Log Data</h3>
          <p className="text-gray-500 text-xs mt-1">
            There are no PYQ uploads or deletes yet to generate monthly reports.
          </p>
        </div>
      ) : (
        <>
          {/* Graphical Analysis Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden">
            <div className="bg-indigo-50 px-4 py-3 flex items-center justify-between border-b border-indigo-100">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-white shadow-sm border border-indigo-100">
                  <BarChart2 className="w-4 h-4 text-indigo-700" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
                  Upload & Delete Trends (Last 12 Active Months)
                </h2>
              </div>
            </div>
            <div className="w-full h-80 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13, fill: "#6b7280" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13, fill: "#6b7280" }}
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
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
                  <Bar
                    dataKey="uploadsCount"
                    name="Uploaded"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-up-${index}`}
                        fill={entry.monthYear === selectedMonth ? "#4f46e5" : "#a5b4fc"}
                        className="cursor-pointer transition-colors duration-300 hover:fill-indigo-500"
                        onClick={() => setSelectedMonth(entry.monthYear)}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="deletesCount"
                    name="Deleted"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-del-${index}`}
                        fill={entry.monthYear === selectedMonth ? "#ef4444" : "#fca5a5"}
                        className="cursor-pointer transition-colors duration-300 hover:fill-red-500"
                        onClick={() => setSelectedMonth(entry.monthYear)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-gray-500 text-center mt-4 italic">
              Click on any bar to view the detailed activity breakdown for that
              month.
            </p>
          </div>

          {/* Detailed Data Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden">
            <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-white shadow-sm border border-indigo-100">
                  <CalendarDays className="w-4 h-4 text-indigo-700" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
                    Detailed Report
                  </h2>
                  <p className="text-[11px] text-indigo-700/70 mt-0.5 font-medium">
                    Showing records for selected period.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="month-select"
                  className="text-xs font-bold text-indigo-900 tracking-wider"
                >
                  SELECT MONTH:
                </label>
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="block w-40 rounded-md border-indigo-200 py-1.5 pl-3 pr-10 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 border bg-white shadow-sm text-indigo-900 font-medium font-sans"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {format(parseISO(`${m}-01`), "MMMM yyyy")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredUploads.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No activity found for this month.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2 w-12 text-center">S.No.</th>
                      <th className="px-3 py-2 text-center">Action</th>
                      <th className="px-3 py-2">Document Details</th>
                      <th className="px-3 py-2">Department</th>
                      <th className="px-3 py-2">Action By</th>
                      <th className="px-3 py-2 whitespace-nowrap">
                        Date & Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUploads.map((record, index) => (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-3 py-2 text-center text-gray-500 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${record.actionType === "DELETE" ? "bg-red-100 text-red-800 border border-red-200" : "bg-green-100 text-green-800 border border-green-200"}`}>
                            {record.actionType === "DELETE" ? "Delete" : "Upload"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${record.actionType === "DELETE" ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"}`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {record.subjectName}
                              </div>
                              <div className="text-gray-500 text-xs font-mono mt-0.5 flex gap-2">
                                <span>{record.subjectCode}</span>
                                <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-[10px]">{record.documentType === "Internship Information" ? "Internship" : record.documentType === "Books & Resources" ? "Book" : record.documentType === "Lab Manual" ? "Lab" : record.documentType === "Syllabus" ? "Syllabus" : record.documentType === "Notes" ? "Notes" : "PYQ"}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="inline-flex items-center gap-1.5 text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md text-xs font-medium">
                            <Layers className="w-3.5 h-3.5 text-gray-400" />
                            {record.department}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold uppercase">
                              {record.uploaderEmail.charAt(0)}
                            </div>
                            <span className="text-gray-700 text-xs font-medium">
                              {record.uploaderEmail}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-gray-900">
                            {format(record.uploadedAt, "MMM dd, yyyy")}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            {format(record.uploadedAt, "hh:mm a")}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
