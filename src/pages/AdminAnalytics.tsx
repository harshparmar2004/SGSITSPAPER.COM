import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Loader2,
  Download,
  TrendingUp,
  Users,
  FolderOpen,
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays } from "date-fns";
import { useAuth } from "../hooks/useAuth";

const COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
];

export default function AdminAnalytics() {
  const { adminRole, assignedDepartments } = useAuth();
  const [loading, setLoading] = useState(true);
  const [downloadTrends, setDownloadTrends] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [examTypeData, setExamTypeData] = useState<any[]>([]);
  const [topPapers, setTopPapers] = useState<any[]>([]);
  const [totalDownloads, setTotalDownloads] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, [adminRole, assignedDepartments]);

  const fetchAnalytics = async () => {
    if (!adminRole) return;
    setLoading(true);
    try {
      const downQuery = query(
        collection(db, "downloads"),
        orderBy("downloadedAt", "desc"),
      );
      const snap = await getDocs(downQuery);

      const pyqQuery = query(
        collection(db, "pyqs"),
        orderBy("uploadedAt", "desc"),
      );
      const pyqSnap = await getDocs(pyqQuery);

      let docs: any[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      let pyqDocs: any[] = pyqSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (adminRole === "department") {
        docs = docs.filter(
          (d) =>
            assignedDepartments.includes(d.department) ||
            assignedDepartments.includes(`${d.course}::${d.department}`),
        );
      }

      setTotalDownloads(docs.length);

      // Calculate trends
      const trendsRaw: Record<string, number> = {};
      for (let i = 0; i < 30; i++)
        trendsRaw[format(subDays(new Date(), 29 - i), "MMM dd")] = 0;

      const deptRaw: Record<string, number> = {};
      const typeRaw: Record<string, number> = {};
      const papersRaw: Record<string, any> = {};

      docs.forEach((doc: any) => {
        if (doc.downloadedAt) {
          const dStr = format(
            new Date(doc.downloadedAt.seconds * 1000),
            "MMM dd",
          );
          if (trendsRaw[dStr] !== undefined) trendsRaw[dStr]++;
        }
        if (doc.department)
          deptRaw[doc.department] = (deptRaw[doc.department] || 0) + 1;
        if (doc.examType)
          typeRaw[doc.examType] = (typeRaw[doc.examType] || 0) + 1;

        if (doc.pyqId) {
          if (!papersRaw[doc.pyqId]) {
            papersRaw[doc.pyqId] = {
              name: doc.subjectName || "Unknown",
              code: doc.subjectCode || "UNK",
              dept: doc.department || "-",
              type: doc.examType || "-",
              downloads: 0,
            };
          }
          papersRaw[doc.pyqId].downloads += 1;
        }
      });

      setDownloadTrends(
        Object.entries(trendsRaw).map(([date, downloads]) => ({
          date,
          downloads,
        })),
      );
      setDeptData(
        Object.entries(deptRaw)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
      );
      setExamTypeData(
        Object.entries(typeRaw)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
      );

      const sortedPapers = Object.values(papersRaw)
        .sort((a: any, b: any) => b.downloads - a.downloads)
        .slice(0, 8);
      setTopPapers(sortedPapers);
    } catch (e) {
      console.error(e);
      // Ensure we don't crash on error, just display empty
      setTotalDownloads(0);
      setDownloadTrends([]);
      setDeptData([]);
      setExamTypeData([]);
      setTopPapers([]);
    }
    setLoading(false);
  };

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );

  return (
    <div className="space-y-3 max-w-6xl mx-auto pb-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Download Analytics
          </h1>
        </div>
        <p className="mt-2 text-[11px] text-gray-500">
          Track student engagement, view the most popular papers, and see
          download distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Downloads
            </span>
            <Download className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold text-gray-900 mt-3">
            {totalDownloads}
          </span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-green-600">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Peak Download Day
            </span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold text-gray-900 mt-3">
            {downloadTrends.length > 0
              ? downloadTrends.reduce((max, obj) =>
                  obj.downloads > max.downloads ? obj : max,
                ).date
              : "-"}
          </span>
        </div>
      </div>

      {/* Graphical Section */}
      <div className="flex flex-col gap-5">
        {/* Download Activity Area Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-4">
            Student Download Trends (Last 30 Days)
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={downloadTrends}
                margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                  dataKey="downloads"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorDown)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exam Type Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-4">
            Downloads by Exam Type
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={examTypeData}
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
                  dataKey="value"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-4">
            Downloads by Department
          </h2>
          <div className="flex flex-col sm:flex-row w-full min-h-[300px] gap-6">
            {/* Left side: Circle */}
            <div className="w-full sm:w-1/3 lg:w-1/4 h-72 border-b sm:border-b-0 sm:border-r border-gray-100 pb-4 sm:pb-0 sm:pr-4 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deptData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Right side: Legend */}
            <div className="w-full sm:w-2/3 lg:w-3/4 pt-4 sm:pt-0 overflow-y-auto h-72 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-3 p-2">
                {deptData.map((d, i) => (
                  <div
                    key={d.name}
                    className="flex text-[11px] text-gray-600 justify-between items-center bg-gray-50/50 p-2 rounded border border-gray-100"
                  >
                    <div className="flex items-center truncate min-w-0 pr-2">
                      <span
                        className="w-2 h-2 rounded-full mr-2 shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      ></span>
                      <span className="truncate font-medium" title={d.name}>
                        {d.name}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-100">
                      {d.value}
                    </span>
                  </div>
                ))}
                {deptData.length === 0 && (
                  <div className="text-gray-500 text-[11px] italic col-span-full mt-4">
                    No department data
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Extracted Leaderboard Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
              Highest Engagement Papers
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-12 text-center">S.No.</th>
                  <th className="px-3 py-2">Paper Details</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2 text-right">Total Downloads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topPapers.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-2 text-center text-gray-500 font-medium">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-gray-900">
                        {p.name}
                      </div>
                      <div className="text-gray-500 text-xs font-mono mt-0.5">
                        {p.code}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-600 font-medium">
                      {p.dept}
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs">
                      {p.type}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-indigo-700 bg-indigo-50 font-bold text-xs ring-1 ring-indigo-200">
                        {p.downloads}
                      </span>
                    </td>
                  </tr>
                ))}
                {topPapers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No downloads recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
