import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  collection,
  query,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Report } from "../types";

export default function AdminReports() {
  const { adminRole, assignedDepartments } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    step: 1 | 2;
    type: "single" | "all";
    targetId?: string;
  }>({ isOpen: false, step: 1, type: "single" });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const qReports = query(
          collection(db, "reports"),
          orderBy("reportedAt", "desc"),
        );
        const pyqSnap = await getDocs(qReports);
        const allReports = pyqSnap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Report,
        );
        setReports(allReports);
      } catch (err) {
        console.error("Error fetching admin data", err);
        if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg("Failed to load records. Check console.");
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [adminRole]);

  const handleMarkResolved = async (reportId: string) => {
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: "resolved",
      });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r)),
      );
    } catch (err) {
      console.error("Error marking as resolved", err);
      setErrorMsg("Failed to mark report as resolved.");
    }
  };

  const initDeleteReport = (reportId: string) => {
    setConfirmModal({
      isOpen: true,
      step: 1,
      type: "single",
      targetId: reportId,
    });
  };

  const initDeleteAllResolved = (filteredReportsList: Report[]) => {
    const resolvedReports = filteredReportsList.filter(
      (r) => r.status === "resolved",
    );
    if (resolvedReports.length === 0) {
      setErrorMsg("No resolved reports to delete.");
      return;
    }
    setConfirmModal({ isOpen: true, step: 1, type: "all" });
  };

  const executeDelete = async () => {
    const { type, targetId } = confirmModal;
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      if (type === "single" && targetId) {
        await deleteDoc(doc(db, "reports", targetId));
        setReports((prev) => prev.filter((r) => r.id !== targetId));
      } else if (type === "all") {
        const resolvedReports = reports.filter(
          (r) =>
            r.status === "resolved" &&
            (adminRole === "superadmin" ||
              assignedDepartments.some((d) => d.includes(r.department))),
        );
        const batch = writeBatch(db);
        resolvedReports.forEach((report) => {
          if (report.id) {
            batch.delete(doc(db, "reports", report.id));
          }
        });
        await batch.commit();
        setReports((prev) =>
          prev.filter((r) => !resolvedReports.find((rr) => rr.id === r.id)),
        );
      }
      setConfirmModal({ isOpen: false, step: 1, type: "single" });
    } catch (err) {
      console.error("Error deleting report", err);
      setErrorMsg("Failed to delete report.");
      setConfirmModal({ isOpen: false, step: 1, type: "single" });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (adminRole === "superadmin") return true;
    return assignedDepartments.some((d) => d.includes(r.department));
  });

  const pendingReports = filteredReports.filter((r) => r.status === "pending");

  // Group pending reports by subjectCode to find high volume reports
  const subjectReportCounts: Record<
    string,
    { count: number; reports: Report[] }
  > = {};
  pendingReports.forEach((r) => {
    const code = r.subjectCode || "Unknown";
    if (!subjectReportCounts[code]) {
      subjectReportCounts[code] = { count: 0, reports: [] };
    }
    subjectReportCounts[code].count += 1;
    subjectReportCounts[code].reports.push(r);
  });

  const highVolumeSubjects = Object.entries(subjectReportCounts)
    .filter(([_, data]) => data.count >= 2)
    .sort((a, b) => b[1].count - a[1].count);

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">Loading reports...</div>
    );
  }

  return (
    <div className="space-y-3 max-w-full px-4 sm:px-6 mx-auto pb-8">
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between shadow-sm border border-red-100 mb-4">
          <span className="text-sm font-medium">{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-red-600 font-bold px-2 py-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center \${confirmModal.step === 2 ? 'bg-red-100' : 'bg-amber-100'}`}
                >
                  <ShieldAlert
                    className={`w-6 h-6 \${confirmModal.step === 2 ? 'text-red-600' : 'text-amber-600'}`}
                  />
                </div>
              </div>
              <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
                {confirmModal.step === 1 ? "Are you sure?" : "Final Warning"}
              </h3>
              <p className="text-center text-sm text-gray-600 mb-6">
                {confirmModal.step === 1
                  ? confirmModal.type === "single"
                    ? "Do you really want to delete this report?"
                    : `Are you sure you want to delete ${reports.filter((r) => r.status === "resolved").length} resolved report(s)?`
                  : "This action is irreversible. All selected data will be permanently deleted. Do you want to proceed?"}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setConfirmModal({ isOpen: false, step: 1, type: "single" })
                  }
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                {confirmModal.step === 1 ? (
                  <button
                    onClick={() =>
                      setConfirmModal((prev) => ({ ...prev, step: 2 }))
                    }
                    className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    Yes, Proceed
                  </button>
                ) : (
                  <button
                    onClick={executeDelete}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    Permanently Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Flagged Content
        </h1>
        <p className="mt-2 text-[11px] text-gray-500">
          Review and resolve issues reported by students for your assigned
          departments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-amber-50 rounded-lg shadow-sm border border-amber-200 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Needs Review
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-amber-900 tracking-tight">
              {pendingReports.length}
            </span>
          </div>
        </div>
      </div>

      {highVolumeSubjects.length > 0 && (
        <div className="mb-4 bg-red-50/50 border border-red-100 rounded-lg p-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5 whitespace-nowrap mr-2">
              <AlertTriangle className="w-3.5 h-3.5" /> High Volume:
            </h2>
            {highVolumeSubjects.map(([subjectCode, data]) => (
              <div
                key={subjectCode}
                className="inline-flex items-center gap-1.5 bg-white border border-red-100 px-2 py-1 rounded text-[11px] shadow-sm"
              >
                <span className="font-bold text-gray-900">{subjectCode}</span>
                <span className="bg-red-100 text-red-700 px-1 rounded-sm font-semibold">
                  {data.count}
                </span>
                {data.reports[0].fileUrl && (
                  <a
                    href={data.reports[0].fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-red-600 hover:text-red-800 underline"
                  >
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-white shadow-sm border border-indigo-100">
              <ShieldAlert className="w-4 h-4 text-indigo-700" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
              All Reports Log
            </h2>
          </div>
          {filteredReports.filter((r) => r.status === "resolved").length > 0 &&
            adminRole === "superadmin" && (
              <button
                onClick={() => initDeleteAllResolved(filteredReports)}
                disabled={isDeleting}
                className="flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? "Deleting..." : "Delete All Resolved"}
              </button>
            )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-3 py-2 w-12 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  S.No.
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Issue Description
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Target Resource
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Reported By
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No reports found for your departments.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report, index) => (
                  <tr
                    key={report.id}
                    className={`hover:bg-gray-50/50 transition-colors ${report.status === "resolved" ? "opacity-60 bg-gray-50" : ""}`}
                  >
                    <td className="px-3 py-2 text-center text-gray-500 font-medium whitespace-nowrap">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-full shrink-0 ${report.status === "pending" ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"}`}
                        >
                          {report.status === "pending" ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium ${report.status === "pending" ? "text-amber-700" : "text-green-700"}`}
                        >
                          {report.status === "pending" ? "Pending" : "Resolved"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 min-w-[150px] max-w-sm">
                      {report.issueCategory && (
                        <span className="text-[9px] font-bold uppercase tracking-widest bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200 mb-1 inline-block">
                          {report.issueCategory}
                        </span>
                      )}
                      <p className="text-xs font-medium text-gray-900 line-clamp-2">
                        {report.issue}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {report.reportedAt
                          ? typeof report.reportedAt === "string"
                            ? new Date(report.reportedAt).toLocaleString()
                            : new Date(
                                report.reportedAt.seconds * 1000,
                              ).toLocaleString()
                          : "Unknown Date"}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-[200px]">
                      <div
                        className="text-xs font-medium text-gray-800 line-clamp-2"
                        title={report.pyqDetails}
                      >
                        {report.pyqDetails || "Unknown Resource"}
                      </div>
                      <div className="flex items-center flex-wrap gap-1 mt-1">
                        <span className="font-mono bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-[10px]">
                          {report.subjectCode}
                        </span>
                        {report.fileUrl && (
                          <a
                            href={report.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 hover:underline text-[10px] font-medium ml-1"
                          >
                            [View PDF]
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs">
                        <span className="font-semibold text-gray-900 block">
                          {report.reporterName || "Unknown"}
                        </span>
                        {report.reporterId && (
                          <span className="text-gray-500 font-mono text-[10px] block">
                            {report.reporterId}
                          </span>
                        )}
                        {report.reporterBranch && (
                          <span className="text-gray-500 text-[10px] inline-block bg-gray-100 px-1 rounded mt-0.5">
                            {report.reporterBranch}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {report.status === "pending" && (
                          <button
                            onClick={() => handleMarkResolved(report.id!)}
                            className="text-xs font-semibold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-100 px-3 py-1.5 rounded transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Resolve
                          </button>
                        )}
                        {adminRole === "superadmin" && (
                          <button
                            onClick={() => initDeleteReport(report.id!)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
