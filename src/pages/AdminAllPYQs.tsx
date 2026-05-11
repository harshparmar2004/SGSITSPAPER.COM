import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { PYQ } from "../types";
import { Button, Input } from "../components/ui";
import {
  Loader2,
  Search,
  Trash2,
  Edit,
  FileText,
  UploadCloud,
  X,
  Download,
  FolderOpen,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getCachedCollection, clearCache } from "../lib/cache";

const DOC_TYPES = [
  "All",
  "PYQ",
  "Notes",
  "Syllabus",
  "Lab Manual",
  "Books & Resources",
];

export default function AdminAllPYQs() {
  const { isAdmin, adminRole, assignedDepartments } = useAuth();
  const [pyqsByDept, setPyqsByDept] = useState<Record<string, PYQ[]>>({});
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Replace Modal State
  const [replacingPyq, setReplacingPyq] = useState<PYQ | null>(null);
  const [replaceMethod, setReplaceMethod] = useState<"link" | "storage">(
    "link",
  );
  const [externalLink, setExternalLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    pyq: PYQ;
    step: 1 | 2;
  } | null>(null);

  useEffect(() => {
    fetchPyqs();
  }, [adminRole, assignedDepartments]); // Re-fetch if role or assignments change

  const fetchPyqs = async (forceRefresh = false) => {
    if (!adminRole) return;
    setLoading(true);
    try {
      let data = await getCachedCollection("pyqs", forceRefresh);

      // Filter by department if not superadmin
      if (adminRole === "department") {
        data = data.filter(
          (p) =>
            assignedDepartments.includes(p.department) ||
            assignedDepartments.includes(`${p.course}::${p.department}`),
        );
      }

      const grouped: Record<string, PYQ[]> = {};
      data.forEach((p) => {
        const dept = p.department || "Other";
        if (!grouped[dept]) grouped[dept] = [];
        grouped[dept].push(p);
      });

      setPyqsByDept(grouped);
    } catch (e) {
      console.error("Error fetching PYQs", e);
    }
    setLoading(false);
  };

  const handleDeleteClick = (pyq: PYQ) => {
    setDeleteModal({ isOpen: true, pyq, step: 1 });
  };

  const executeDelete = async () => {
    if (!deleteModal) return;
    const { pyq } = deleteModal;

    try {
      if (pyq.fileSize && pyq.fileSize > 0) {
        // Assume it's from storage
        const storagePath = `pyqs/${pyq.department}/${pyq.semester}/${pyq.fileName}`;
        const pRef = ref(storage, storagePath);
        await deleteObject(pRef).catch((e) =>
          console.log("Storage delete error", e),
        ); // Ignore if not found
      }
      await deleteDoc(doc(db, "pyqs", pyq.id));
      clearCache("pyqs");

      setPyqsByDept((prev) => {
        const next = { ...prev };
        if (next[pyq.department]) {
          next[pyq.department] = next[pyq.department].filter(
            (p) => p.id !== pyq.id,
          );
          if (next[pyq.department].length === 0) {
            delete next[pyq.department];
          }
        }
        return next;
      });

      setDeleteModal(null);
      setSuccessMsg(`Successfully deleted document for ${pyq.subjectCode}`);
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (e) {
      console.error("Error deleting PYQ", e);
      setError("Error deleting PYQ");
      setDeleteModal(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are allowed.");
        return;
      }
      if (selectedFile.size > 700 * 1024) {
        setError(
          "File size must be less than 700KB to fit in Firestore limit.",
        );
        return;
      }
      setError("");
      setFile(selectedFile);
    }
  };

  const submitReplace = async () => {
    if (!replacingPyq) return;
    if (replaceMethod === "storage" && !file) {
      setError("Please select a file.");
      return;
    }
    if (replaceMethod === "link" && !externalLink) {
      setError("Please provide a link.");
      return;
    }

    setReplaceLoading(true);
    setError("");

    try {
      let fileUrl = "";
      let fileName = "";
      let fileSize = 0;

      if (replaceMethod === "storage" && file) {
        if (replacingPyq.documentType === "Notes") {
          fileName =
            `${replacingPyq.subjectCode}_Notes_${Date.now()}.pdf`.replace(
              /[^a-zA-Z0-9.\-_]/g,
              "_",
            );
        } else if (replacingPyq.documentType === "Syllabus") {
          fileName =
            `${replacingPyq.subjectCode}_Syllabus_${Date.now()}.pdf`.replace(
              /[^a-zA-Z0-9.\-_]/g,
              "_",
            );
        } else if (replacingPyq.documentType === "Lab Manual") {
          fileName =
            `${replacingPyq.subjectCode}_Lab_Manual_${Date.now()}.pdf`.replace(
              /[^a-zA-Z0-9.\-_]/g,
              "_",
            );
        } else {
          fileName =
            `${replacingPyq.subjectCode}_${replacingPyq.examType || "Exam"}_${replacingPyq.examYear || "0000"}.pdf`.replace(
              /[^a-zA-Z0-9.\-_]/g,
              "_",
            );
        }

        const readFileAsDataUrl = (f: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(f);
          });
        };

        try {
          fileUrl = await readFileAsDataUrl(file);
        } catch (err: any) {
          throw new Error("Failed to read file: " + err.message);
        }

        fileName = file.name;
        fileSize = file.size;
      } else {
        fileUrl = externalLink;
        fileName = `${replacingPyq.subjectCode}_External_Link_${replacingPyq.examYear || "0000"}`;
        fileSize = 0;
      }

      await updateDoc(doc(db, "pyqs", replacingPyq.id), {
        fileUrl,
        fileName,
        fileSize,
      });
      clearCache("pyqs");

      setPyqsByDept((prev) => {
        const next = { ...prev };
        if (next[replacingPyq.department]) {
          next[replacingPyq.department] = next[replacingPyq.department].map(
            (p) => {
              if (p.id === replacingPyq.id) {
                return { ...p, fileUrl, fileName, fileSize };
              }
              return p;
            },
          );
        }
        return next;
      });

      closeReplaceModal();
      setSuccessMsg(
        `Successfully updated document for ${replacingPyq.subjectCode} to "${fileName}"`,
      );
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to replace");
    }
    setReplaceLoading(false);
  };

  const closeReplaceModal = () => {
    setReplacingPyq(null);
    setFile(null);
    setExternalLink("");
    setError("");
  };

  const currentList = selectedDept ? pyqsByDept[selectedDept] || [] : [];

  const filteredPyqs = currentList.filter((p) => {
    const dType = p.documentType || "PYQ";
    const matchesTab = selectedDocType === "All" || dType === selectedDocType;
    const matchesSearch =
      p.subjectCode.toLowerCase().includes(search.toLowerCase()) ||
      p.subjectName.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const exportToCsv = () => {
    // Export all data, not just current tab/department
    const allDocs = Object.values(pyqsByDept).flat() as PYQ[];
    if (allDocs.length === 0) return;

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
    ];

    const rows = allDocs.map((p) => [
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
      `all_resources_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-8">
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {deleteModal.step === 1 ? "Confirm Deletion" : "DOUBLE CHECK!"}
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              {deleteModal.step === 1 ? (
                <>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-900">
                    "{deleteModal.pyq.subjectCode} -{" "}
                    {deleteModal.pyq.subjectName}"
                  </span>
                  ?
                </>
              ) : (
                <>
                  Deleting this item is permanent and cannot be undone. Are you
                  absolutely sure?
                </>
              )}
            </p>
            <div className="flex justify-end gap-3 mt-6">
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
                  I am absolutely sure, Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Replace PDF Modal */}
      {replacingPyq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Replace Document</h3>
              <button
                onClick={closeReplaceModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-indigo-50/50 p-3 rounded-lg flex items-start gap-3 border border-indigo-100">
                <FileText className="w-5 h-5 text-indigo-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-xs text-indigo-900">
                    {replacingPyq.subjectCode}: {replacingPyq.subjectName}
                  </h4>
                  <p className="text-[11px] text-indigo-700 mt-1">
                    Replacing this will overwrite the existing PDF while keeping
                    all metadata.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-900">
                    New File Source
                  </label>
                  <div className="flex space-x-1.5 bg-gray-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setReplaceMethod("link")}
                      className={`text-[11px] px-3 py-1.5 rounded-md transition-colors ${replaceMethod === "link" ? "bg-white shadow-sm text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      External Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplaceMethod("storage")}
                      className={`text-[11px] px-3 py-1.5 rounded-md transition-colors ${replaceMethod === "storage" ? "bg-white shadow-sm text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                {replaceMethod === "link" ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="e.g. https://drive.google.com/file/d/..."
                      value={externalLink}
                      onChange={(e) => setExternalLink(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-8 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="text-center">
                      <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-3 flex flex-col items-center text-xs text-gray-600">
                        <label className="cursor-pointer font-medium text-indigo-600 hover:text-indigo-500">
                          <span>Select new PDF</span>
                          <input
                            type="file"
                            accept="application/pdf"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                      {file && (
                        <p className="text-[11px] font-medium text-indigo-600 mt-2">
                          {file.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
              <Button
                variant="outline"
                size="sm"
                onClick={closeReplaceModal}
                disabled={replaceLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={submitReplace}
                disabled={
                  replaceLoading ||
                  (replaceMethod === "storage" && !file) ||
                  (replaceMethod === "link" && !externalLink)
                }
              >
                {replaceLoading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {replaceLoading ? "Replacing..." : "Confirm Replace"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            {!selectedDept ? (
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                Manage Documents
              </h1>
            ) : (
              <div className="flex flex-col">
                <button
                  onClick={() => {
                    setSelectedDept(null);
                    setSearch("");
                    setSelectedDocType("All");
                  }}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-700 mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Departments
                </button>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">
                  {selectedDept}
                </h1>
              </div>
            )}
          </div>
          <p className="mt-2 text-[11px] text-gray-500 max-w-sm">
            {!selectedDept
              ? "Select a department to view and manage all its documents, including PYQs, Notes, and Syllabus."
              : "View, search, replace, and delete uploaded papers for this department."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
          {!selectedDept && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCsv}
              className="w-full sm:w-auto text-[11px] whitespace-nowrap h-8"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export All CSV
            </Button>
          )}
          {selectedDept && (
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by Subject Code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 w-full bg-white border-gray-300 focus:border-indigo-500 shadow-sm font-medium text-[11px]"
              />
            </div>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 text-green-800 rounded-lg border border-green-200 text-sm flex items-center gap-2 animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-xl shadow-sm border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : !selectedDept ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Object.keys(pyqsByDept)
              .sort()
              .map((dept) => (
                <div
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className="p-4 bg-gray-50/80 hover:bg-indigo-50 border border-gray-100 rounded-xl cursor-pointer transition-all hover:shadow-sm text-center group flex flex-col items-center"
                >
                  <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform">
                    <FolderOpen className="w-5 h-5 text-indigo-500" />
                  </div>
                  <h3
                    className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight"
                    title={dept}
                  >
                    {dept}
                  </h3>
                  <span className="mt-2 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                    {pyqsByDept[dept].length} Docs
                  </span>
                </div>
              ))}
            {Object.keys(pyqsByDept).length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-gray-500">
                No documents found.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col animate-in fade-in duration-200">
          <div className="border-b border-gray-200 bg-gray-50/50 px-2 pt-2 overflow-x-auto hide-scrollbar">
            <div className="flex gap-2">
              {DOC_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedDocType(type)}
                  className={`px-4 py-2 text-[11px] font-bold whitespace-nowrap transition-colors border-b-2 ${
                    selectedDocType === type
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                  } rounded-t-lg`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-center w-12">S.No.</th>
                  <th className="px-4 py-3">Title / Code</th>
                  <th className="px-4 py-3">Course Info</th>
                  <th className="px-4 py-3">Type Details</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPyqs.map((pyq, index) => (
                  <tr
                    key={pyq.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-4 py-3 text-center text-gray-400 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-indigo-700 font-mono text-[11px]">
                        {pyq.subjectCode === "ALL_SUBJECTS"
                          ? "All Subjects"
                          : pyq.subjectCode}
                      </div>
                      <div
                        className="text-gray-600 font-medium text-[10px] mt-1 truncate max-w-[200px]"
                        title={pyq.subjectName}
                      >
                        {pyq.subjectName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800 font-medium text-[11px]">
                        {pyq.course}
                      </div>
                      <div className="text-gray-500 text-[10px] mt-1">
                        {pyq.semester} • {pyq.year}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 font-medium">
                        {pyq.documentType === "Notes" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Notes
                          </span>
                        ) : pyq.documentType === "Syllabus" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Syllabus
                          </span>
                        ) : pyq.documentType === "Lab Manual" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                            Lab Manual
                          </span>
                        ) : pyq.documentType === "Books & Resources" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200">
                            Books & Resources
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-widest">
                            PYQ
                          </span>
                        )}
                      </div>
                      {(pyq.documentType === "PYQ" || !pyq.documentType) && (
                        <div className="text-gray-500 text-[10px] mt-1 font-medium">
                          {pyq.examType || "N/A"} • {pyq.examYear || "N/A"}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReplacingPyq(pyq)}
                          className="h-7 px-2 text-[10px] shadow-sm flex items-center justify-center gap-1 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                          title="Replace PDF"
                        >
                          <Edit className="w-3 h-3" />
                          <span className="sr-only sm:not-sr-only">
                            Replace
                          </span>
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDeleteClick(pyq)}
                          className="h-7 px-2 shadow-sm bg-red-50 text-red-700 hover:bg-red-100 border-red-200 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPyqs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-gray-500 text-[11px] italic"
                    >
                      No documents found for{" "}
                      {selectedDocType === "All"
                        ? "this department"
                        : selectedDocType}
                      .
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
