import firebaseConfig from "../../firebase-applet-config.json";
import React, { useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db, storage } from "../lib/firebase";
import { ref, uploadBytesResumable, uploadBytes, getDownloadURL } from "firebase/storage";
import { clearCache } from "../lib/cache";
import { YEARS, SEMESTERS, EXAM_TYPES, MONTHS, DOCUMENT_TYPES } from "../types";
import { Button, Input, Select } from "../components/ui";
import { UploadCloud, Loader2, ArrowLeft, CheckCircle2, X } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useAcademicConfig } from "../hooks/useAcademicConfig";

export default function AdminUpload() {
  const { user, isAdmin, adminRole, assignedDepartments, loginLoading } =
    useAuth();
  const { programs, subjects } = useAcademicConfig();

  const [formData, setFormData] = useState({
    documentType: DOCUMENT_TYPES[0],
    department: "",
    course: "",
    year: YEARS[0],
    semester: SEMESTERS[0],
    subjectCode: "",
    subjectName: "",
    examType: EXAM_TYPES[0],
    examYear: new Date().getFullYear().toString(),
    section: "",
    status: "Verified", // Default status
    description: "",
  });

  const [isCustomSubject, setIsCustomSubject] = useState(false);

  // Filter subjects based on assigned departments for this teacher
  const availableSubjects = subjects.filter((s) => {
    if (adminRole === "superadmin") return true;
    if (!s.departments || s.departments.length === 0) return true; // Legacy global subjects
    return s.departments.some((d) => {
      const parts = d.split("::");
      const deptName = parts.length > 1 ? parts[1] : d;
      return (
        assignedDepartments.includes(d) ||
        assignedDepartments.includes(deptName)
      );
    });
  });

  const handleSubjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    if (code === "") {
      setIsCustomSubject(false);
      setFormData((prev) => ({ ...prev, subjectCode: "", subjectName: "" }));
      return;
    }
    if (code === "custom") {
      setIsCustomSubject(true);
      setFormData((prev) => ({ ...prev, subjectCode: "", subjectName: "" }));
      return;
    }

    setIsCustomSubject(false);
    const selectedSub = subjects.find((s) => s.code === code);
    if (selectedSub) {
      setFormData((prev) => {
        let newCourse = prev.course;
        let newDepartment = prev.department;

        if (selectedSub.departments && selectedSub.departments.length > 0) {
          // Try to pick one assigned to current user, else just pick first
          let d =
            selectedSub.departments.find(
              (dep) =>
                adminRole === "superadmin" ||
                assignedDepartments.includes(dep) ||
                assignedDepartments.includes(dep.split("::")[1]),
            ) || selectedSub.departments[0];
          const parts = d.split("::");
          if (parts.length > 1) {
            newCourse = parts[0];
            newDepartment = parts[1];
          } else {
            newDepartment = d;
          }
        }

        return {
          ...prev,
          subjectCode: selectedSub.code,
          subjectName: selectedSub.name,
          course: newCourse,
          department: newDepartment,
          ...(selectedSub.year ? { year: selectedSub.year } : {}),
          ...(selectedSub.semester ? { semester: selectedSub.semester } : {}),
        };
      });
    } else {
      setFormData((prev) => ({ ...prev, subjectCode: code, subjectName: "" })); // Fallback
    }
  };

  // Dynamic config based on selections
  const availableCourses = programs
    .filter(
      (p) =>
        adminRole === "superadmin" ||
        p.departments.some(
          (d) =>
            assignedDepartments.includes(d) ||
            assignedDepartments.includes(`${p.course}::${d}`),
        ),
    )
    .map((p) => p.course);

  const selectedProgramObj = programs.find((p) => p.course === formData.course);
  const availableDepartments = selectedProgramObj
    ? selectedProgramObj.departments.filter(
        (d) =>
          adminRole === "superadmin" ||
          assignedDepartments.includes(d) ||
          assignedDepartments.includes(`${selectedProgramObj.course}::${d}`),
      )
    : [];

  const allAvailableDepartments = Array.from(new Set(programs.flatMap(p => 
    p.departments.filter((d) =>
      adminRole === "superadmin" ||
      assignedDepartments.includes(d) ||
      assignedDepartments.includes(`${p.course}::${d}`)
    )
  )));

  const isInternship = formData.documentType === "Internship Information";

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCourse = e.target.value;
    setFormData((prev) => ({
      ...prev,
      course: newCourse,
      department: "",
    }));
  };

  const [file, setFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"link" | "storage">(
    "storage",
  );
  const [externalLink, setExternalLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are allowed.");
        return;
      }

      setError("");
      setFile(selectedFile);
    }
  };

  const checkDuplicate = async () => {
    // We query just by subjectCode to avoid needing a composite index immediately,
    // then filter the rest locally since the dataset per subject is small.
    const q = query(
      collection(db, "pyqs"),
      where("subjectCode", "==", formData.subjectCode),
    );
    const snapshot = await getDocs(q);
    let isDuplicate = false;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (
        data.examYear === formData.examYear &&
        data.examType === formData.examType
      ) {
        isDuplicate = true;
      }
    });
    return isDuplicate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadMethod === "storage" && !file) {
      setError("Please select a PDF file to upload.");
      return;
    }
    if (uploadMethod === "link" && !externalLink) {
      setError("Please provide an external link to the PDF.");
      return;
    }

    setError("");
    setUploadProgress(0);
    setUploading(true);
    setSuccess("");

    try {
      // 1. Check duplicate
      if (formData.documentType === "PYQ") {
        const isDupe = await checkDuplicate();
        if (isDupe) {
          setError(
            "A PYQ for this Subject Code, Exam Year, and Exam Type already exists.",
          );
          setUploading(false);
          return;
        }
      }

      let fileUrl = "";
      console.log("Before upload Method check");
      let fileName = "";
      let fileSize = 0;

      // 2. Upload file or use link
      if (uploadMethod === "storage" && file) {
        if (formData.documentType === "PYQ") {
          fileName =
            `${formData.subjectCode}_${formData.examType}_${formData.examYear}.pdf`.replace(
              /[^a-zA-Z0-9.\-_]/g,
              "_",
            );
        } else if (formData.documentType === "Syllabus") {
          const sCode =
            formData.subjectCode ||
            formData.department.substring(0, 10).toUpperCase();
          fileName = `${sCode}_Syllabus_${Date.now()}.pdf`.replace(
            /[^a-zA-Z0-9.\-_]/g,
            "_",
          );
        } else if (formData.documentType === "Lab Manual") {
          fileName =
            `${formData.subjectCode}_Lab_Manual_${Date.now()}.pdf`.replace(
              /[^a-zA-Z0-9.\-_]/g,
              "_",
            );
        } else if (formData.documentType === "Books & Resources") {
          fileName =
            `${formData.subjectCode}_Books_Resources_${Date.now()}.pdf`.replace(
              /[^a-zA-Z0-9.\-_]/g,
              "_",
            );
        } else if (formData.documentType === "Internship Information") {
          fileName = `${formData.department.substring(0, 15).toUpperCase()}_Internship_${Date.now()}.pdf`.replace(
            /[^a-zA-Z0-9.\-_]/g,
            "_",
          );
        } else {
          fileName = `${formData.subjectCode}_Notes_${Date.now()}.pdf`.replace(
            /[^a-zA-Z0-9.\-_]/g,
            "_",
          );
        }

        console.log("Uploading via proxy...", fileName);
        const storagePath = `pyqs/${formData.department || "Other"}/${formData.semester || "All"}/${fileName}`;
        
        setUploadProgress(50); // Fake progress for non-resumable
        
        // Grab the bucket name from config (requires default import or require. Use inline fetch or generic bucket config)
        // Since we import firebaseConfig in lib/firebase.ts, but let us just read it
        
        const bucketMatch = firebaseConfig.storageBucket;
        
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("storagePath", storagePath);
        uploadFormData.append("bucket", bucketMatch);
        
        const response = await fetch("/api/upload-proxy", {
          method: "POST",
          body: uploadFormData
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error("Upload proxy failed: " + (errData?.error || response.statusText));
        }
        
        const data = await response.json();
        
        setUploadProgress(100);
        fileUrl = data.fileUrl;
        console.log("Uploaded successfully via proxy");
        
        fileName = fileName; // Keep our generated descriptive filename
        fileSize = file.size;
      } else {
        fileUrl = externalLink;
        fileName = `${formData.subjectCode}_External_Link_${formData.examYear || "Notes"}`;
        fileSize = 0; // External links don't have predictable sizes initially
      }

      // Prepare payload to omit PYQ fields if it's Notes
      const payload: any = {
        documentType: formData.documentType,
        department: formData.department,
        course: formData.documentType === "Internship Information" ? "" : formData.course,
        year: formData.documentType === "Internship Information" ? "" : formData.year,
        semester: formData.documentType === "Internship Information" ? "" : formData.semester,
        subjectCode:
          formData.subjectCode ||
          (formData.documentType === "Syllabus" ? "ALL_SUBJECTS" : "") ||
          (formData.documentType === "Internship Information" ? "INTERNSHIP" : ""),
        subjectName:
          formData.subjectName ||
          (formData.documentType === "Syllabus" ? "Full Syllabus" : "") ||
          (formData.documentType === "Internship Information" ? "Internship Information" : ""),
        section: formData.section || "",
        status: formData.status,
        description: formData.description,
        fileUrl,
        fileName,
        fileSize,
        uploadedAt: serverTimestamp(),
        uploadedBy: user?.uid,
        uploaderEmail: user?.email,
      };

      if (formData.documentType === "PYQ") {
        payload.examType = formData.examType;
        payload.examYear = formData.examYear;
      }

      // 3. Save to Firestore
      try {
        const addDocPromise = addDoc(collection(db, "pyqs"), payload);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore addition timed out after 10s. Are you offline or is there a permission issue?")), 10000));
        const newDocRef = await Promise.race([addDocPromise, timeoutPromise]);
        
        // Log upload activity
        try {
          await addDoc(collection(db, "activity_logs"), {
            type: "UPLOAD",
            documentId: newDocRef.id || "Unknown",
            subjectCode: payload.subjectCode || "Unknown",
            subjectName: payload.subjectName || "Unknown",
            department: payload.department || "Unknown",
            course: payload.course || "",
            semester: payload.semester || "",
            documentType: payload.documentType || "PYQ",
            deletedBy: user?.uid || "Unknown",
            deletedByEmail: user?.email || "Unknown",
            deletedAt: serverTimestamp(),
            originalUploader: user?.email || "Unknown"
          });
        } catch (logErr) {
          console.error("Failed to log upload", logErr);
        }

        clearCache("pyqs");
      } catch (err: any) {
        if (err.message && err.message.includes("permission")) {
          const authInfo = {
            userId: user?.uid,
            email: user?.email,
          };
          const errInfo = {
            error: err.message,
            operationType: "create",
            path: "pyqs",
            authInfo,
          };
          console.error("Firestore Error: ", JSON.stringify(errInfo));
          throw new Error(JSON.stringify(errInfo));
        }
        throw err;
      }

      setSuccess(
        `Upload successful! "${fileName || "Link"}" has been uploaded.`,
      );
      setFile(null);
      setExternalLink("");
      // Reset some fields
      setIsCustomSubject(false);
      setFormData((prev) => ({
        ...prev,
        subjectCode: "",
        subjectName: "",
        section: "",
      }));
      if (uploadMethod === "storage") {
        const fileInput = document.getElementById(
          "file-upload",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
    } catch (err: any) {
      console.error("Upload failed", err);
      setError(err.message || "An error occurred during upload.");
    }
    setUploading(false);
  };

  if (loginLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden">
        <div className="bg-indigo-50 px-4 py-3 flex items-center justify-between border-b border-indigo-100 mb-4 sm:mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-white shadow-sm border border-indigo-100">
              <UploadCloud className="w-4 h-4 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
                Upload Study Material
              </h2>
              <p className="mt-0.5 text-[11px] text-indigo-500/80 font-medium">
                Fill in the metadata and upload a PDF.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 pt-0 sm:pt-0">
          {error && (
            <div className="mb-3 p-2 bg-red-50 text-red-700 rounded-md border border-red-200 text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg border border-green-200 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <span className="font-medium">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 mb-4">
              <label className="text-xs font-medium text-gray-900 block">
                Document Type *
              </label>
              <div className="flex flex-wrap gap-3">
                {DOCUMENT_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="documentType"
                      value={type}
                      checked={formData.documentType === type}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-gray-700">
                      {type === "PYQ"
                        ? "Previous Year Question (PYQ)"
                        : type === "Notes"
                          ? "Handwritten Notes"
                          : type === "Syllabus"
                            ? "Course Syllabus"
                            : type === "Lab Manual"
                              ? "Lab Manual"
                              : type}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {formData.documentType !== "Syllabus" && !isInternship && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-medium text-gray-900">
                    Select Subject *
                  </label>
                  {availableSubjects && availableSubjects.length > 0 ? (
                    <Select
                      value={
                        isCustomSubject
                          ? "custom"
                          : availableSubjects.some(
                                (s) => s.code === formData.subjectCode,
                              )
                            ? formData.subjectCode
                            : ""
                      }
                      onChange={handleSubjectSelect}
                      required={
                        !isCustomSubject &&
                        formData.subjectCode === "" &&
                        formData.documentType !== "Syllabus" &&
                        !isInternship
                      }
                    >
                      <option value="">
                        -- Choose from predefined subjects --
                      </option>
                      {availableSubjects.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code} - {s.name}{" "}
                          {s.year || s.semester
                            ? `(${s.year ? s.year : ""}${s.year && s.semester ? ", " : ""}${s.semester ? s.semester : ""})`
                            : ""}
                        </option>
                      ))}
                      <option value="custom">Other (Enter Manually)</option>
                    </Select>
                  ) : (
                    <div className="text-[11px] text-gray-500 mb-2 italic">
                      No predefined subjects available for this department. Add
                      them in the 'Manage Subjects' section, or create manually.
                    </div>
                  )}
                </div>

                {(isCustomSubject ||
                  availableSubjects.length === 0 ||
                  formData.subjectCode !== "") && (
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-medium text-gray-900">
                          Subject Code *
                        </label>
                        <Input
                          placeholder="e.g. CS101"
                          name="subjectCode"
                          value={formData.subjectCode}
                          onChange={handleChange}
                          disabled={
                            !isCustomSubject &&
                            availableSubjects.length > 0 &&
                            formData.subjectCode !== ""
                          }
                          required={formData.documentType !== "Syllabus" && !isInternship}
                        />
                      </div>
                      <div className="flex-[2] space-y-2">
                        <label className="text-xs font-medium text-gray-900">
                          Subject Name *
                        </label>
                        <Input
                          placeholder="e.g. Data Structures"
                          name="subjectName"
                          value={formData.subjectName}
                          onChange={handleChange}
                          disabled={
                            !isCustomSubject &&
                            availableSubjects.length > 0 &&
                            formData.subjectCode !== ""
                          }
                          required={formData.documentType !== "Syllabus" && !isInternship}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {!isInternship && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-900">
                    Course *
                  </label>
                  <Select
                    name="course"
                    value={formData.course}
                    onChange={handleCourseChange}
                    required={!isInternship}
                  >
                    <option value="">Select Course/Program</option>
                    {availableCourses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-900">
                  Department *
                </label>
                <Select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  disabled={!formData.course && !isInternship}
                >
                  <option value="">
                    {formData.course || isInternship
                      ? "Select Department"
                      : "Select Course First"}
                  </option>
                  {(isInternship ? allAvailableDepartments : availableDepartments).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>

              {!isInternship && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-900">
                    Year *
                  </label>
                  <Select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required={!isInternship}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              {formData.documentType !== "Syllabus" && !isInternship && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-900">
                    Semester *
                  </label>
                  <Select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required={!isInternship}
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {formData.documentType === "PYQ" && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-900">
                      Exam Type *
                    </label>
                    <Select
                      name="examType"
                      value={formData.examType}
                      onChange={handleChange}
                      required={formData.documentType === "PYQ"}
                    >
                      {EXAM_TYPES.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2 flex gap-3">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-medium text-gray-900">
                        Exam Year *
                      </label>
                      <Input
                        name="examYear"
                        value={formData.examYear}
                        onChange={handleChange}
                        required={formData.documentType === "PYQ"}
                      />
                    </div>
                  </div>
                </>
              )}

              {!isInternship && (
                <div
                  className={`space-y-2 ${formData.documentType !== "PYQ" ? "md:col-span-2" : ""}`}
                >
                  <label className="text-xs font-medium text-gray-900">
                    Section (Optional)
                  </label>
                  <Input
                    placeholder="e.g. A"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-900">
                  Status *
                </label>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="Verified">Verified</option>
                  <option value="Unverified">Unverified</option>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium text-gray-900">
                  Brief Description (Optional)
                </label>
                <Input
                  placeholder="e.g. Needs formatting / Excellent handwritten notes"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-xs font-medium text-gray-900">
                  File Source *
                </label>
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setUploadMethod("link")}
                    className={`text-xs px-3 py-1.5 rounded-md transition-colors ${uploadMethod === "link" ? "bg-white shadow-sm text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    External Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod("storage")}
                    className={`text-xs px-3 py-1.5 rounded-md transition-colors ${uploadMethod === "storage" ? "bg-white shadow-sm text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Upload File
                  </button>
                </div>
              </div>

              {uploadMethod === "link" ? (
                <div className="space-y-2">
                  <Input
                    placeholder="e.g. https://drive.google.com/file/d/..."
                    name="externalLink"
                    type="url"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                  />
                  <p className="text-[11px] text-gray-500">
                    Paste a public link to the PDF hosted on Google Drive,
                    Dropbox, or any other service. (Free and does not require
                    Storage setup).
                  </p>
                </div>
              ) : file ? (
                <div className="mt-2 flex flex-col items-center justify-center rounded-lg border border-indigo-200 px-6 py-10 bg-indigo-50/50">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-indigo-100 shadow-sm max-w-full">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-indigo-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-indigo-500 mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        const fileInput = document.getElementById(
                          "file-upload",
                        ) as HTMLInputElement;
                        if (fileInput) fileInput.value = "";
                        const replaceInput = document.getElementById(
                          "file-upload-replace",
                        ) as HTMLInputElement;
                        if (replaceInput) replaceInput.value = "";
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <label
                    htmlFor="file-upload-replace"
                    className="mt-4 cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    Replace file
                    <input
                      id="file-upload-replace"
                      name="file-upload-replace"
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              ) : (
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="text-center">
                    <UploadCloud
                      className="mx-auto h-12 w-12 text-gray-300"
                      aria-hidden="true"
                    />
                    <div className="mt-4 flex flex-col items-center text-xs leading-6 text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept="application/pdf"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1 mt-1">or drag and drop</p>
                    </div>
                    <p className="text-xs leading-5 text-gray-500 mt-2">
                      PDF document
                    </p>
                  </div>
                </div>
              )}
            </div>

            {uploading && uploadMethod === "storage" && uploadProgress > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-gray-700">Uploading PDF...</span>
                  <span className="text-indigo-600">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={
                  uploading ||
                  (uploadMethod === "storage" && !file) ||
                  (uploadMethod === "link" && !externalLink)
                }
                className="w-full md:w-auto min-w-[150px]"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4 mr-2" />
                )}
                {uploading ? (uploadProgress > 0 && uploadMethod === "storage" ? `Uploading... ${Math.round(uploadProgress)}%` : "Uploading...") : "Submit Material"}
              </Button>
            </div>
          </form>
        </div>

        {!isInternship && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mt-4 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-indigo-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-xs font-medium text-indigo-800">
                  Time-saving tip
                </h3>
                <p className="mt-1 text-xs text-indigo-700">
                  Selecting a predefined subject will automatically fill in the
                  Course, Department, Year, and Semester fields for you.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
