import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  limit,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { PYQ, YEARS, SEMESTERS, EXAM_TYPES, MONTHS } from "../types";
import { Button, Input, Select } from "../components/ui";
import {
  ExternalLink,
  Loader2,
  FileDown,
  DownloadCloud,
  Search,
  Download,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAcademicConfig } from "../hooks/useAcademicConfig";
import { Navigate } from "react-router";
import JSZip from "jszip";

export default function StudentView() {
  const { user, loginLoading } = useAuth();
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Filters
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [examType, setExamType] = useState("");
  const [section, setSection] = useState("");

  // Report Modal State
  const [reportingPyq, setReportingPyq] = useState<PYQ | null>(null);
  const [reportIssue, setReportIssue] = useState("");
  const [reportCategory, setReportCategory] = useState("Broken Link");
  const [reporterName, setReporterName] = useState("");
  const [reporterBranch, setReporterBranch] = useState("");
  const [reporterId, setReporterId] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "PYQ" | "Notes" | "Syllabus" | "Lab Manual"
  >("PYQ");

  const { programs, loading: configLoading } = useAcademicConfig();

  // Dynamic lists based on selections
  const availableCourses = programs.map((p) => p.course);
  const selectedProgramObj = programs.find((p) => p.course === course);
  const availableDepartments = selectedProgramObj
    ? selectedProgramObj.departments
    : [];

  useEffect(() => {
    if (!user) return;
    fetchPYQs();
  }, [user]);

  const fetchPYQs = async () => {
    setLoading(true);
    try {
      // Fetch recent PYQs. For full complex filtering, we do it client-side
      // since Firestore requires custom composite indexes for many where clauses.
      const q = query(
        collection(db, "pyqs"),
        orderBy("uploadedAt", "desc"),
        limit(500),
      );

      const snapshot = await getDocs(q);
      const data: PYQ[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as PYQ);
      });
      setPyqs(data);
    } catch (error) {
      console.error("Error fetching PYQs:", error);
    }
    setLoading(false);
  };

  const filteredPyqs = pyqs.filter((p) => {
    // Filter by document type
    const docType = p.documentType || "PYQ";
    if (activeTab !== docType) return false;

    if (department && p.department !== department) return false;
    if (course && p.course !== course) return false;
    if (year && p.year !== year) return false;

    // Syllabus is for the whole year and department, so skip semester/subject filtering
    if (activeTab === "Syllabus") return true;

    if (semester && p.semester !== semester) return false;
    if (
      subjectCode &&
      !p.subjectCode.toLowerCase().includes(subjectCode.toLowerCase())
    )
      return false;
    if (
      subjectName &&
      !p.subjectName.toLowerCase().includes(subjectName.toLowerCase())
    )
      return false;

    // Some fields like examType might be undefined for Notes
    if (examType && p.examType !== examType) return false;
    if (section && p.section !== section) return false;
    return true;
  });

  const handleDownload = async (pyq: PYQ) => {
    if (user) {
      try {
        await addDoc(collection(db, "downloads"), {
          pyqId: pyq.id,
          userId: user.uid,
          userEmail: user.email,
          department: pyq.department,
          course: pyq.course || "B.Tech",
          subjectCode: pyq.subjectCode,
          subjectName: pyq.subjectName,
          examType: pyq.examType || pyq.documentType || "Unknown",
          downloadedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Error recording download analytics", err);
      }
    }

    try {
      const zip = new JSZip();
      const response = await fetch(pyq.fileUrl);
      if (response.ok) {
        const blob = await response.blob();
        const safeSubject = pyq.subjectName.replace(/[^a-zA-Z0-9]/g, "_");
        let filename = "";
        if (pyq.documentType === "Notes") {
          filename = `${pyq.subjectCode}_${safeSubject}_Notes_${pyq.id.substring(0, 5)}.pdf`;
        } else if (pyq.documentType === "Syllabus") {
          filename = `${pyq.subjectCode}_${safeSubject}_Syllabus_${pyq.id.substring(0, 5)}.pdf`;
        } else if (pyq.documentType === "Lab Manual") {
          filename = `${pyq.subjectCode}_${safeSubject}_Lab_Manual_${pyq.id.substring(0, 5)}.pdf`;
        } else if (pyq.documentType === "Books & Resources") {
          filename = `${pyq.subjectCode}_${safeSubject}_Books_Resources_${pyq.id.substring(0, 5)}.pdf`;
        } else {
          filename = `${pyq.subjectCode}_${safeSubject}_${pyq.examType || "Exam"}_${pyq.examYear || "0000"}_${pyq.id.substring(0, 5)}.pdf`;
        }
        zip.file(filename, blob);

        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename.replace(".pdf", "")}_Download.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        window.open(pyq.fileUrl, "_blank");
      }
    } catch (e) {
      console.error("Error creating zip", e);
      window.open(pyq.fileUrl, "_blank");
    }
  };

  const recordBulkDownloadAnalytics = async (items: PYQ[]) => {
    if (!user) return;
    try {
      const promises = items.map((pyq) =>
        addDoc(collection(db, "downloads"), {
          pyqId: pyq.id,
          userId: user.uid,
          userEmail: user.email,
          department: pyq.department,
          course: pyq.course || "B.Tech",
          subjectCode: pyq.subjectCode,
          subjectName: pyq.subjectName,
          examType: pyq.examType || pyq.documentType || "Unknown",
          downloadedAt: serverTimestamp(),
        }),
      );
      await Promise.all(promises);
    } catch (err) {
      console.error("Error logging bulk analytics", err);
    }
  };

  const handleBulkDownload = async () => {
    if (filteredPyqs.length === 0) return;
    setDownloadingZip(true);

    try {
      const zip = new JSZip();

      const downloadPromises = filteredPyqs.map(async (pyq) => {
        try {
          const response = await fetch(pyq.fileUrl);
          if (response.ok) {
            const blob = await response.blob();
            const safeSubject = pyq.subjectName.replace(/[^a-zA-Z0-9]/g, "_");
            let filename = "";
            if (pyq.documentType === "Notes") {
              filename = `${pyq.subjectCode}_${safeSubject}_Notes_${pyq.id.substring(0, 5)}.pdf`;
            } else if (pyq.documentType === "Syllabus") {
              filename = `${pyq.subjectCode}_${safeSubject}_Syllabus_${pyq.id.substring(0, 5)}.pdf`;
            } else if (pyq.documentType === "Lab Manual") {
              filename = `${pyq.subjectCode}_${safeSubject}_Lab_Manual_${pyq.id.substring(0, 5)}.pdf`;
            } else if (pyq.documentType === "Books & Resources") {
              filename = `${pyq.subjectCode}_${safeSubject}_Books_Resources_${pyq.id.substring(0, 5)}.pdf`;
            } else {
              filename = `${pyq.subjectCode}_${safeSubject}_${pyq.examType || "Exam"}_${pyq.examYear || "0000"}_${pyq.id.substring(0, 5)}.pdf`;
            }
            zip.file(filename, blob);
          }
        } catch (e) {
          console.error(`Failed to fetch ${pyq.subjectName}`, e);
        }
      });

      await Promise.all(downloadPromises);
      await recordBulkDownloadAnalytics(filteredPyqs);

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `PYQs_Bulk_Download_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating Zip file:", error);
      alert(
        "Failed to download ZIP file. Ensure CORS is configured locally or try opening PDFs individually.",
      );
    }

    setDownloadingZip(false);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !reportingPyq ||
      !reportIssue.trim() ||
      !user ||
      !reporterName.trim() ||
      !reporterBranch.trim() ||
      !reporterId.trim()
    )
      return;

    setSubmittingReport(true);
    try {
      await addDoc(collection(db, "reports"), {
        pyqId: reportingPyq.id || "",
        subjectCode: reportingPyq.subjectCode,
        department: reportingPyq.department,
        issue: reportIssue.trim(),
        issueCategory: reportCategory,
        reporterName: reporterName.trim(),
        reporterBranch: reporterBranch.trim(),
        reporterId: reporterId.trim(),
        reportedAt: serverTimestamp(),
        status: "pending",
        reportedBy: user.email || user.uid,
        pyqDetails:
          reportingPyq.documentType === "PYQ"
            ? `${reportingPyq.subjectName} (${reportingPyq.examType} ${reportingPyq.examYear})`
            : `${reportingPyq.subjectName} (${reportingPyq.documentType || "Document"})`,
        fileUrl: reportingPyq.fileUrl || "",
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportingPyq(null);
        setReportSuccess(false);
        setReportIssue("");
        setReportCategory("Broken Link");
        setReporterName("");
        setReporterBranch("");
        setReporterId("");
      }, 2000);
    } catch (err) {
      console.error("Error submitting report", err);
      alert("Failed to submit report. Please try again.");
    }
    setSubmittingReport(false);
  };

  if (loginLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  const studentName =
    user.displayName || user.email?.split("@")[0] || "Student";

  return (
    <div className="space-y-3">
      <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-xl lg:text-2xl font-bold tracking-tight text-gray-900 leading-tight">
            Welcome, {studentName}! 👋
          </h1>
          <p className="mt-1 text-xs md:text-xs text-gray-500">
            Find and download previous year question papers and handwritten
            notes instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-row flex-wrap bg-gray-100 p-1 rounded-lg w-full max-w-4xl mb-4 gap-1">
        <button
          onClick={() => setActiveTab("PYQ")}
          className={`flex-1 flex items-center justify-center px-2 py-2 md:py-2.5 text-xs md:text-xs font-medium rounded-md transition-all ${activeTab === "PYQ" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Previous Year Questions
        </button>
        <button
          onClick={() => setActiveTab("Notes")}
          className={`flex-1 flex items-center justify-center px-2 py-2 md:py-2.5 text-xs md:text-xs font-medium rounded-md transition-all ${activeTab === "Notes" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Handwritten Notes
        </button>
        <button
          onClick={() => setActiveTab("Syllabus")}
          className={`flex-1 flex items-center justify-center px-2 py-2 md:py-2.5 text-xs md:text-xs font-medium rounded-md transition-all ${activeTab === "Syllabus" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Course Syllabus
        </button>
        <button
          onClick={() => setActiveTab("Lab Manual")}
          className={`flex-1 flex items-center justify-center px-2 py-2 md:py-2.5 text-xs md:text-xs font-medium rounded-md transition-all ${activeTab === "Lab Manual" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Lab Manuals
        </button>
        <button
          onClick={() => setActiveTab("Books & Resources")}
          className={`flex-1 flex items-center justify-center px-2 py-2 md:py-2.5 text-xs md:text-xs font-medium rounded-md transition-all border-none ${activeTab === "Books & Resources" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Books & Resources
        </button>
      </div>

      {/* Advanced Filter Form */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-indigo-500" />
          Search Criteria
        </h2>

        <div className="flex flex-col gap-3">
          {activeTab !== "Syllabus" && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by Subject Code (e.g. CS101) - Highest Priority"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                className="pl-9 w-full text-sm h-10 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg shadow-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-3 gap-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Course / Program
              </label>
              <Select
                value={course}
                onChange={(e) => {
                  setCourse(e.target.value);
                  setDepartment("");
                }}
                className="w-full text-xs py-1.5 h-8"
              >
                <option value="">All Courses</option>
                {availableCourses.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Department
              </label>
              <Select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs py-1.5 h-8"
                disabled={!course}
              >
                <option value="">
                  {course ? "All Depts" : "Select Course"}
                </option>
                {availableDepartments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Year
              </label>
              <Select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full text-xs py-1.5 h-8"
              >
                <option value="">All Years</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
            {activeTab !== "Syllabus" && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <Select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full text-xs py-1.5 h-8"
                >
                  <option value="">All Semesters</option>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {activeTab !== "Syllabus" && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Subject Name
                </label>
                <Input
                  placeholder="Data Structures"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full text-xs h-8"
                />
              </div>
            )}

            {activeTab === "PYQ" ? (
              <div className="sm:col-span-2 lg:col-span-5">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Exam Type
                </label>
                <Select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full text-xs py-1.5 h-8 sm:w-1/2 lg:w-1/5"
                >
                  <option value="">All Types</option>
                  {EXAM_TYPES.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div className="sm:col-span-2 lg:col-span-5">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Section (Optional)
                </label>
                <Input
                  placeholder="e.g. A"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full text-xs h-8 sm:w-1/2 lg:w-1/5"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row justify-end">
          <Button
            onClick={handleBulkDownload}
            disabled={downloadingZip || filteredPyqs.length === 0}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {downloadingZip ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <DownloadCloud className="w-4 h-4" />
            )}
            {downloadingZip
              ? "Zipping Files..."
              : `Download ${filteredPyqs.length} Result(s) as ZIP`}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : filteredPyqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FileDown className="w-8 h-8 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No PYQs found</h3>
            <p className="mt-1 text-gray-500">
              Try adjusting your filters to find existing records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 w-12 text-center">S.No.</th>
                  <th className="px-3 py-2">Title / Code</th>
                  <th className="px-3 py-2">Program / Sem</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">
                    {activeTab === "PYQ" ? "Exam Type" : "Type"}
                  </th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPyqs.map((pyq, index) => (
                  <tr
                    key={pyq.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-3 py-2 text-center text-gray-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 max-w-xs truncate">
                      <div
                        className="font-bold text-indigo-700 font-mono text-sm truncate"
                        title={pyq.subjectCode}
                      >
                        {pyq.subjectCode === "ALL_SUBJECTS"
                          ? "All Subjects"
                          : pyq.subjectCode}
                      </div>
                      <div
                        className="text-gray-600 font-medium text-xs mt-0.5 truncate"
                        title={pyq.subjectName}
                      >
                        {pyq.subjectName}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-gray-900 font-medium">
                        {pyq.course}
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        {pyq.semester}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-gray-900 text-xs font-medium">
                        {pyq.department}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-gray-900 font-medium">
                        {pyq.documentType === "Notes" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Notes
                          </span>
                        ) : pyq.documentType === "Syllabus" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Syllabus
                          </span>
                        ) : pyq.documentType === "Lab Manual" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                            Lab Manual
                          </span>
                        ) : pyq.documentType === "Books & Resources" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-fuchsia-100 text-fuchsia-800">
                            Books & Resources
                          </span>
                        ) : pyq.examType ? (
                          pyq.examType
                        ) : (
                          "PYQ"
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReportingPyq(pyq);
                            setReportSuccess(false);
                            setReportIssue("");
                          }}
                          className="flex space-x-1.5 shadow-sm text-amber-700 bg-amber-50 border-amber-100 hover:bg-amber-100"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Report</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(pyq)}
                          className="flex space-x-1.5 shadow-sm text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportingPyq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Report Issue
              </h3>
              <button
                onClick={() => setReportingPyq(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={submittingReport || reportSuccess}
              >
                ✕
              </button>
            </div>

            <div className="p-3">
              {reportSuccess ? (
                <div className="text-center py-6">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
                    ✓
                  </div>
                  <h4 className="text-lg font-medium text-gray-900">
                    Report Submitted
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Thank you for helping us improve our resources.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Resource:{" "}
                      <span className="font-semibold text-gray-900">
                        {reportingPyq.subjectName} ({reportingPyq.subjectCode})
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        College ID / Reg No *
                      </label>
                      <input
                        type="text"
                        required
                        value={reporterId}
                        onChange={(e) => setReporterId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        placeholder="0801CS201..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Branch/Dept *
                      </label>
                      <input
                        type="text"
                        required
                        value={reporterBranch}
                        onChange={(e) => setReporterBranch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        placeholder="Computer Science"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Issue Category *
                      </label>
                      <select
                        required
                        value={reportCategory}
                        onChange={(e) => setReportCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                      >
                        <option value="Broken Link">Broken Link / PDF</option>
                        <option value="Wrong Info">Wrong Information</option>
                        <option value="Missing Pages">Missing Pages</option>
                        <option value="Inappropriate Content">
                          Inappropriate Content
                        </option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Describe the issue *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={reportIssue}
                      onChange={(e) => setReportIssue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                      placeholder="e.g. Missing page 4, Wrong semester marked, Broken link..."
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReportingPyq(null)}
                      disabled={submittingReport}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      disabled={
                        submittingReport ||
                        !reportIssue.trim() ||
                        !reporterName.trim() ||
                        !reporterBranch.trim() ||
                        !reporterId.trim()
                      }
                    >
                      {submittingReport ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {submittingReport ? "Submitting..." : "Submit Report"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
