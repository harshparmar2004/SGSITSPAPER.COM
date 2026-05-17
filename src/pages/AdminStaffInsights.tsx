import { useState, useEffect } from "react";
import {
  Loader2,
  Download,
  UserCircle,
  X,
  Activity,
  FileText,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subMonths } from "date-fns";
import { useAuth } from "../hooks/useAuth";
import { getCachedCollection } from "../lib/cache";

export default function AdminStaffInsights() {
  const { adminRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [staffInsights, setStaffInsights] = useState<Record<string, any>>({});
  const [selectedStaffInsight, setSelectedStaffInsight] = useState<any | null>(
    null,
  );

  useEffect(() => {
    fetchAnalytics();
  }, [adminRole]);

  const fetchAnalytics = async () => {
    if (adminRole !== "superadmin") return;
    setLoading(true);
    try {
      const [adminList, allPyqs, allUsers] = await Promise.all([
        getCachedCollection("admins"),
        getCachedCollection("pyqs"),
        getCachedCollection("users"),
      ]);

      const staffMembers = adminList.filter(
        (a: any) => a.role === "department",
      );

      const uidToEmail = new Map<string, string>();
      const uidToName = new Map<string, string>();
      allUsers.forEach((u: any) => {
        if (u.email && u.id) {
          uidToEmail.set(u.id, u.email.toLowerCase());
          uidToName.set(u.id, u.displayName || u.name || "");
        }
      });

      const staffMap: Record<string, any> = {};

      staffMembers.forEach((staff: any) => {
        if (staff.email) {
          staffMap[staff.email.toLowerCase()] = {
            id: staff.id,
            email: staff.email.toLowerCase(),
            name:
              staff.name ||
              uidToName.get(staff.id) ||
              staff.email.split("@")[0],
            departments: staff.departments?.join(", ") || "N/A",
            totalUploads: 0,
            documentTypes: {},
            courses: new Set(),
            files: [],
            uploadData: {},
          };
        }
      });

      const template12Months: Record<string, number> = {};
      for (let i = 0; i < 12; i++) {
        template12Months[format(subMonths(new Date(), 11 - i), "MMM yyyy")] = 0;
      }

      Object.values(staffMap).forEach((staff) => {
        staff.uploadData = { ...template12Months };
      });

      allPyqs.forEach((doc: any) => {
        if (!doc.uploadedBy) return;

        let uploaderEmail = doc.uploaderEmail?.toLowerCase();
        if (!uploaderEmail) {
          uploaderEmail = uidToEmail.get(doc.uploadedBy);
        }
        if (!uploaderEmail && doc.uploadedBy.includes("@")) {
          uploaderEmail = doc.uploadedBy.toLowerCase();
        }

        const staffKey = uploaderEmail || doc.uploadedBy;
        const mappedStaffKey = staffMap[staffKey]
          ? staffKey
          : uidToEmail.get(doc.uploadedBy) || "";

        const staffRef =
          staffMap[mappedStaffKey] ||
          Object.values(staffMap).find((s: any) => s.id === doc.uploadedBy);

        if (staffRef && doc.uploadedAt) {
          const dStr = format(
            new Date(doc.uploadedAt.seconds * 1000),
            "MMM yyyy",
          );
          staffRef.totalUploads++;
          if (staffRef.uploadData[dStr] !== undefined) {
            staffRef.uploadData[dStr]++;
          }

          const docType = doc.documentType || "Unknown";
          if (!staffRef.documentTypes[docType]) {
            staffRef.documentTypes[docType] = 0;
          }
          staffRef.documentTypes[docType]++;

          if (doc.course) {
            staffRef.courses.add(doc.course);
          }

          staffRef.files.push({
            id: doc.id || String(Math.random()),
            fileName:
              doc.fileName ||
              doc.subjectName ||
              doc.subjectCode ||
              "Unknown File",
            date: new Date(doc.uploadedAt.seconds * 1000),
            dateStr: format(
              new Date(doc.uploadedAt.seconds * 1000),
              "dd MMM yyyy, hh:mm a",
            ),
            documentType: docType,
            course: doc.course || "N/A",
            subject: doc.subjectName || doc.subjectCode || "N/A",
          });
        }
      });

      Object.keys(staffMap).forEach((key) => {
        const s = staffMap[key];
        s.chartData = Object.keys(s.uploadData).map((date) => ({
          date,
          uploads: s.uploadData[date],
        }));
        s.coursesCount = s.courses.size;
        s.files.sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
      });

      setStaffInsights(staffMap);
    } catch (err) {
      console.error(err);
      setStaffInsights({});
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {selectedStaffInsight ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <button
                  onClick={() => setSelectedStaffInsight(null)}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-700 mb-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Back to Staff List
                </button>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">
                  {selectedStaffInsight.name}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedStaffInsight.email}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-300 shadow-md">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                  Total Uploads
                </span>
                <span className="text-3xl font-black text-green-600">
                  {selectedStaffInsight.totalUploads}
                </span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-300 shadow-md">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                  Courses Handled
                </span>
                <span className="text-3xl font-black text-amber-600">
                  {selectedStaffInsight.coursesCount}
                </span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-300 shadow-md">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                  Top Doc Type
                </span>
                <span className="text-2xl font-bold text-blue-600 truncate block">
                  {Object.entries(selectedStaffInsight.documentTypes).sort(
                    (a: any, b: any) => b[1] - a[1],
                  )[0]?.[0] || "N/A"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Document Types Breakdown */}
              <div className="bg-white p-5 rounded-xl shadow-md border border-gray-300 flex flex-col">
                <h3 className="text-sm font-bold text-gray-800 mb-5 border-b border-gray-100 pb-2">
                  Document Types
                </h3>
                <div className="flex-1 space-y-3">
                  {Object.entries(selectedStaffInsight.documentTypes).map(
                    ([type, count]: [string, any]) => (
                      <div
                        key={type}
                        className="flex justify-between items-center text-sm border-b border-gray-50 pb-2"
                      >
                        <span className="text-gray-600 font-medium">
                          {type}
                        </span>
                        <span className="bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          {count}
                        </span>
                      </div>
                    ),
                  )}
                  {Object.keys(selectedStaffInsight.documentTypes).length ===
                    0 && (
                    <div className="text-sm text-gray-500 italic mt-4 text-center">
                      No documents uploaded.
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-white p-5 rounded-xl shadow-md border border-gray-300 lg:col-span-2">
                <h3 className="text-sm font-bold text-gray-800 mb-5 border-b border-gray-100 pb-2">
                  Recent Upload Timeline
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={selectedStaffInsight.chartData}
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
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f3f4f6"
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
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="uploads"
                        name="Uploads"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorUploads)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* All History Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden">
              <div className="p-5 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-800">
                  All Upload History (From Day One)
                </h3>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Date
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        File Name
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Type
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Course / Subject
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedStaffInsight.files.map((file: any) => (
                      <tr
                        key={file.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {file.dateStr}
                        </td>
                        <td
                          className="px-5 py-4 text-sm font-medium text-gray-900 max-w-[300px] truncate"
                          title={file.fileName}
                        >
                          {file.fileName}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-300">
                            {file.documentType}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 flex flex-col gap-1">
                          <span className="font-semibold text-gray-800">
                            {file.course}
                          </span>
                          <span className="text-xs text-gray-500">
                            {file.subject}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {selectedStaffInsight.files.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-5 py-10 text-center text-sm text-gray-500 italic"
                        >
                          No upload history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Staff Activity Deep Dives
            </h1>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-300 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Object.values(staffInsights).map((staff: any) => (
                <div
                  key={staff.email}
                  onClick={() => setSelectedStaffInsight(staff)}
                  className="p-3 bg-gray-50/80 hover:bg-indigo-50 border border-gray-100 rounded-lg cursor-pointer transition-colors shadow-md text-center flex flex-col"
                >
                  <div className="w-8 h-8 mx-auto bg-white border border-gray-300 rounded-full flex items-center justify-center mb-2 shadow-md">
                    <UserCircle className="w-4 h-4 text-indigo-500" />
                  </div>
                  <h3
                    className="text-[11px] font-bold text-gray-800 line-clamp-1 leading-tight"
                    title={staff.name}
                  >
                    {staff.name}
                  </h3>
                  <p
                    className="text-[9px] text-gray-500 line-clamp-1 mt-0.5 mb-2"
                    title={staff.departments}
                  >
                    {staff.departments}
                  </p>

                  <div className="flex gap-2 justify-center mt-auto text-[10px] text-gray-500 font-medium">
                    <span
                      className="flex items-center gap-0.5"
                      title="Uploads/Papers"
                    >
                      <FileText className="w-3 h-3 text-green-500" />{" "}
                      {staff.totalUploads}
                    </span>
                  </div>
                </div>
              ))}
              {Object.keys(staffInsights).length === 0 && (
                <div className="col-span-full py-6 text-center text-xs text-gray-500 italic">
                  No staff members found.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
