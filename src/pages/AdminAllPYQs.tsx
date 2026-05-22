import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import firebaseConfig from "../../firebase-applet-config.json";
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
  "Internship Information",
];

export default function AdminAllPYQs() {
  const { user, isAdmin, adminRole, assignedDepartments } = useAuth();
  const [pyqsByDept, setPyqsByDept] = useState<Record<string, PYQ[]>>({});
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

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
  const [deleteLoading, setDeleteLoading] = useState(false);

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
            assignedDepartments.some((ad) => ad === p.department || ad.endsWith(`::${p.department}`)),
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
    setDeleteLoading(true);

    try {
      if (pyq.fileSize && pyq.fileSize > 0) {
        // Assume it's from storage
        const storagePath = `pyqs/${pyq.department}/${pyq.semester}/${pyq.fileName}`;
        const pRef = ref(storage, storagePath);
        await Promise.race([
          deleteObject(pRef),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
        ]).catch((e) => console.log("Storage delete error", e)); // Ignore if not found
      }
      await deleteDoc(doc(db, "pyqs", pyq.id));
      
      // Log deletion activity
      try {
        await addDoc(collection(db, "activity_logs"), {
          type: "DELETE",
          documentId: pyq.id || "Unknown",
          subjectCode: pyq.subjectCode || "Unknown",
          subjectName: pyq.subjectName || "Unknown",
          department: pyq.department || "Unknown",
          course: pyq.course || "",
          semester: pyq.semester || "",
          documentType: pyq.documentType || "PYQ",
          deletedBy: user?.uid || "Unknown",
          deletedByEmail: user?.email || "Unknown",
          deletedAt: serverTimestamp(),
          originalUploader: pyq.uploadedBy || "Unknown"
        });
      } catch (logErr) {
        console.error("Failed to log deletion", logErr);
      }
      
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
      // // // setTimeout(() => setSuccessMsg(""), 5000);
    } catch (e) {
      console.error("Error deleting PYQ", e);
      setError("Error deleting PYQ");
      setDeleteModal(null);
    } finally {
      setDeleteLoading(false);
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
        } else if (replacingPyq.documentType === "Books & Resources") {
          fileName =
            `${replacingPyq.subjectCode}_Books_Resources_${Date.now()}.pdf`.replace(
              /[^a-zA-Z0-9.\-_]/g,
              "_",
            );
        } else if (replacingPyq.documentType === "Internship Information") {
          fileName =
            `${(replacingPyq.department||"").substring(0, 15).toUpperCase()}_Internship_${Date.now()}.pdf`.replace(
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

        const storagePath = "pyqs/" + (replacingPyq.department || "Other") + "/" + (replacingPyq.semester || "All") + "/" + fileName;
const bucketMatch = firebaseConfig.storageBucket;
const uploadFormData = new FormData();
uploadFormData.append("file", file);
uploadFormData.append("storagePath", storagePath);
uploadFormData.append("bucket", bucketMatch);
const response = await fetch("/api/upload-proxy", { method: "POST", body: uploadFormData });
if (!response.ok) { const errData = await response.json().catch(() => null); throw new Error("Upload failed: " + (errData?.error || response.statusText)); }
const data = await response.json();
fileUrl = data.fileUrl;
console.log("Uploaded successfully via proxy");

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
    if (selectedYear && !search) {
      if (selectedYear === "Internships") {
        if (p.documentType !== "Internship Information") return false;
      } else {
        if (p.year !== selectedYear) return false;
        if (selectedSemester && p.semester !== selectedSemester) return false;
        if (selectedSubject && p.subjectName !== selectedSubject) return false;
      }
    }
    const dType = p.documentType || "PYQ";
    const matchesTab = selectedDocType === "All" || dType === selectedDocType;
    const matchesSearch =
      (p.subjectCode || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.subjectName || "").toLowerCase().includes(search.toLowerCase());
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
            {deleteLoading ? (
              <div className="flex flex-col items-center justify-center p-6 space-y-4">
                <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-700 animate-pulse">Deleting document...</p>
              </div>
            ) : (
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setDeleteModal(null)} disabled={deleteLoading}>
                  Cancel
                </Button>
                {deleteModal.step === 1 ? (
                  <Button
                    variant="danger"
                    onClick={() => setDeleteModal({ ...deleteModal, step: 2 })}
                    disabled={deleteLoading}
                  >
                    Yes, continue
                  </Button>
                ) : (
                  <Button variant="danger" onClick={executeDelete} disabled={deleteLoading}>
                    I am absolutely sure, Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Replace PDF Modal */}
      {replacingPyq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-300">
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
                      className={`text-[11px] px-3 py-1.5 rounded-md transition-colors ${replaceMethod === "link" ? "bg-white shadow-md text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      External Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplaceMethod("storage")}
                      className={`text-[11px] px-3 py-1.5 rounded-md transition-colors ${replaceMethod === "storage" ? "bg-white shadow-md text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-700"}`}
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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6 pb-5 rounded-xl shadow-md border mb-4 ${selectedDept ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-gray-200'}`}>
        <div>
          <div className="flex items-center gap-3">
            {!selectedDept ? (
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Manage Documents
              </h1>
            ) : (
              <div className="flex flex-col">
                <button
                  onClick={() => {
                    if (selectedSubject) {
                      setSelectedSubject(null);
                    } else if (selectedSemester) {
                      setSelectedSemester(null);
                    } else if (selectedYear) {
                      setSelectedYear(null);
                    } else {
                      setSelectedDept(null);
                      setSearch("");
                    }
                    setSelectedDocType("All");
                  }}
                  className="flex items-center gap-1.5 text-sm text-indigo-700 font-bold hover:text-indigo-800 mb-2 transition-colors cursor-pointer w-fit"
                >
                  <ArrowLeft className="w-4 h-4" /> 
                  {selectedSubject ? "Back to Subjects" : 
                   selectedSemester ? "Back to Semesters" : 
                   selectedYear === "Internships" ? "Back to Departments" :
                   selectedYear ? "Back to Years" : 
                   "Back to Departments"}
                </button>
                <div className="flex flex-wrap items-center gap-2 text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
                  <span 
                    onClick={() => { setSelectedYear(null); setSelectedSemester(null); setSelectedSubject(null); }}
                    className={`cursor-pointer hover:text-indigo-600 transition-colors ${selectedYear ? 'text-gray-400' : 'text-gray-900'}`}
                  >
                    {selectedDept}
                  </span>
                  
                  {selectedYear && (
                    <>
                      <span className="text-gray-300 font-normal">/</span>
                      <span 
                        onClick={() => { setSelectedSemester(null); setSelectedSubject(null); }}
                        className={`cursor-pointer hover:text-indigo-600 transition-colors ${selectedSemester ? 'text-gray-400' : 'text-gray-800'}`}
                      >
                        {selectedYear}
                      </span>
                    </>
                  )}
                  
                  {selectedSemester && (
                    <>
                      <span className="text-gray-300 font-normal">/</span>
                      <span 
                        onClick={() => setSelectedSubject(null)}
                        className={`cursor-pointer hover:text-indigo-600 transition-colors ${selectedSubject ? 'text-gray-400' : 'text-gray-800'}`}
                      >
                        {selectedSemester}
                      </span>
                    </>
                  )}

                  {selectedSubject && (
                    <>
                      <span className="text-gray-300 font-normal">/</span>
                      <span className="text-indigo-600 truncate max-w-[200px] sm:max-w-xs" title={selectedSubject}>
                        {selectedSubject}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <p className={`mt-2 text-sm font-medium ${selectedDept ? 'text-indigo-800/80' : 'text-gray-500'} max-w-lg`}>
            {!selectedDept
              ? "Select a department to view and manage all its documents, including PYQs, Notes, and Syllabus."
              : "View, search, replace, and delete uploaded documents."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto mt-4 sm:mt-0">
          {!selectedDept && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCsv}
              className="w-full sm:w-auto text-sm whitespace-nowrap h-10 border-indigo-200 bg-white"
            >
              <Download className="w-4 h-4 mr-1.5" /> Export All CSV
            </Button>
          )}
          {selectedDept && (
            <div className="relative max-w-md w-full">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
              <Input
                placeholder="Search by Subject Code or Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 w-full bg-white border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-md font-medium text-sm text-indigo-900 placeholder:text-indigo-300"
              />
            </div>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-sm text-gray-600 mb-6">{successMsg}</p>
            <Button variant="primary" className="w-full" onClick={() => setSuccessMsg("")}>
              Done
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-xl shadow-md border border-gray-300">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : !selectedDept ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-300 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Object.keys(pyqsByDept)
              .sort()
              .map((dept) => (
                <div
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className="p-4 bg-gray-50/80 hover:bg-indigo-50 border border-gray-100 rounded-xl cursor-pointer transition-all hover:shadow-md text-center group flex flex-col items-center"
                >
                  <div className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
                    <FolderOpen className="w-5 h-5 text-indigo-500" />
                  </div>
                  <h3
                    className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight"
                    title={dept}
                  >
                    {dept}
                  </h3>
                  <span className="mt-2 text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
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
      ) : selectedDept && !selectedYear && !search ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-300 p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {["1st Year", "2nd Year", "3rd Year", "4th Year", "Internships"].map((year) => {
              // Count docs for this year
              const count = currentList.filter(p => year === "Internships" ? p.documentType === "Internship Information" : p.year === year).length;
              return (
                <div
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className="p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:border-indigo-300 group flex items-center gap-4 shadow-sm"
                >
                  <div className="w-10 h-10 shrink-0 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <FolderOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex flex-col text-left">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">
                      {year}
                    </h3>
                    <span className="mt-0.5 text-xs font-medium text-gray-500">
                      {count} Documents
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : selectedDept && selectedYear && !selectedSemester && selectedYear !== "Internships" && !search ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-300 p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {(
              selectedYear === "1st Year" ? ["Sem 1", "Sem 2"] :
              selectedYear === "2nd Year" ? ["Sem 3", "Sem 4"] :
              selectedYear === "3rd Year" ? ["Sem 5", "Sem 6"] :
              ["Sem 7", "Sem 8"]
            ).map((sem) => {
              const count = currentList.filter(p => p.year === selectedYear && p.semester === sem).length;
              return (
                <div
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className="p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:border-indigo-300 group flex items-center gap-4 shadow-sm"
                >
                  <div className="w-10 h-10 shrink-0 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <FolderOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex flex-col text-left">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">
                      {sem}
                    </h3>
                    <span className="mt-0.5 text-xs font-medium text-gray-500">
                      {count} Documents
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : selectedDept && selectedYear && selectedSemester && !selectedSubject && !search ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-300 p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from(new Set(currentList.filter(p => p.year === selectedYear && p.semester === selectedSemester).map(p => p.subjectName))).map((subName) => {
              const count = currentList.filter(p => p.year === selectedYear && p.semester === selectedSemester && p.subjectName === subName).length;
              const titleName = subName || "Unknown Subject";
              return (
                <div
                  key={titleName}
                  onClick={() => setSelectedSubject(titleName)}
                  className="p-4 bg-gray-50/80 hover:bg-indigo-50 border border-gray-100 rounded-xl cursor-pointer transition-all hover:shadow-md text-center group flex flex-col items-center"
                  title={titleName}
                >
                  <div className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
                    <FolderOpen className="w-5 h-5 text-indigo-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">
                    {titleName}
                  </h3>
                  <span className="mt-2 text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                    {count} Docs
                  </span>
                </div>
              );
            })}
            {Array.from(new Set(currentList.filter(p => p.year === selectedYear && p.semester === selectedSemester).map(p => p.subjectName))).length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-gray-500">
                No subjects found in {selectedSemester}.
              </div>
            )}
          </div>
        </div>
      ) : (

        <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden flex flex-col animate-in fade-in duration-200">
          <div className="border-b border-gray-200 bg-gray-50/50 px-2 pt-2 overflow-x-auto hide-scrollbar">
            <div className="flex gap-2">
              {DOC_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedDocType(type)}
                  className={`px-5 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
                    selectedDocType === type
                      ? "border-indigo-600 text-indigo-700 bg-indigo-50/30"
                      : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                  } rounded-t-lg`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-bold border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-center w-16">S.No.</th>
                  <th className="px-6 py-4">Title / Code</th>
                  <th className="px-6 py-4">Course Info</th>
                  <th className="px-6 py-4">Type Details</th>
                  <th className="px-6 py-4">Status & Info</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPyqs.map((pyq, index) => (
                  <tr
                    key={pyq.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 text-center text-gray-400 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-indigo-700 font-mono text-sm max-w-[200px] truncate">
                        {pyq.subjectCode === "ALL_SUBJECTS"
                          ? "All Subjects"
                          : pyq.subjectCode}
                      </div>
                      <div
                        className="text-gray-700 font-medium text-xs mt-1 truncate max-w-[250px]"
                        title={pyq.subjectName}
                      >
                        {pyq.subjectName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-bold text-sm">
                        {pyq.course}
                      </div>
                      <div className="text-gray-500 text-xs mt-1 font-medium">
                        {pyq.semester} • {pyq.year}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">
                        {pyq.documentType === "Notes" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Notes
                          </span>
                        ) : pyq.documentType === "Syllabus" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Syllabus
                          </span>
                        ) : pyq.documentType === "Lab Manual" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                            Lab Manual
                          </span>
                        ) : pyq.documentType === "Books & Resources" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200">
                            Books & Resources
                          </span>
                        ) : pyq.documentType === "Internship Information" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                            Internship
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-widest">
                            PYQ
                          </span>
                        )}
                      </div>
                      {(pyq.documentType === "PYQ" || !pyq.documentType) && (
                        <div className="text-gray-600 text-xs mt-1.5 font-medium">
                          {pyq.examType || "N/A"} • {pyq.examYear || "N/A"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-normal max-w-[200px]">
                      <div className="flex flex-col gap-1.5 items-start">
                        {pyq.status === "Verified" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                            Verified
                          </span>
                        ) : pyq.status === "Unverified" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                            Unverified
                          </span>
                        ) : null}
                        {pyq.description && (
                          <span
                            className="text-xs text-gray-600 line-clamp-2 font-medium bg-gray-50 p-1.5 rounded border border-gray-100"
                            title={pyq.description}
                          >
                            {pyq.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReplacingPyq(pyq)}
                          className="h-8 px-3 text-xs shadow-md flex items-center justify-center gap-1.5 border-gray-300 hover:bg-gray-50 hover:text-gray-900 font-semibold"
                          title="Replace PDF"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span className="sr-only sm:not-sr-only">
                            Replace
                          </span>
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDeleteClick(pyq)}
                          className="h-8 w-8 p-0 shadow-md bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border border-red-200 disabled:opacity-50 flex items-center justify-center rounded-md transition-colors"
                          title="Delete PDF"
                        >
                          <Trash2 className="w-4 h-4" />
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
