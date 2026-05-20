import React, { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getCachedCollection } from "../lib/cache";
import { PYQ } from "../types";
import { Input, Button } from "../components/ui";
import {
  Loader2,
  Search,
  Download,
  BookOpen,
  Layers,
  ArrowLeft,
  FileText,
  Briefcase,
  Folder,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function AdminSubjectPYQs() {
  const { isAdmin, adminRole, assignedDepartments } = useAuth();
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    fetchPyqs();
  }, [adminRole, assignedDepartments]);

  const fetchPyqs = async () => {
    if (!adminRole) return;
    setLoading(true);
    try {
      let data = await getCachedCollection("pyqs");

      if (adminRole === "department") {
        data = data.filter(
          (p) =>
            assignedDepartments.some((ad) => ad === p.department || ad.endsWith(`::${p.department}`)),
        );
      }

      setPyqs(data);
    } catch (e) {
      console.error("Error fetching PYQs", e);
    }
    setLoading(false);
  };

  const filteredPyqs = pyqs.filter(
    (p) =>
      (p.subjectCode || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.subjectName || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.semester || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.department || "").toLowerCase().includes(search.toLowerCase()),
  );

  if (!isAdmin) return null;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 lg:px-5 lg:py-4 rounded-xl shadow-sm border bg-white border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-gray-900">
              Subject-wise View (All Documents)
            </h1>
          </div>
          <p className="mt-1 text-xs font-medium text-gray-500 max-w-lg">
            A flat view of all uploaded documents. Search to instantly find PDFs.
          </p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
          <Input
            placeholder="Search code, subject, dept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm font-medium text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl shadow-md border border-gray-300">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredPyqs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-300 p-12 text-center text-gray-500">
          No matching PDFs found. Try adjusting your search query.
        </div>
      ) : (
        <div className="space-y-8">
          {(() => {
            const groupedByType: Record<string, typeof filteredPyqs> = {};
            filteredPyqs.forEach(pyq => {
              let type = pyq.documentType || "Previous Year Question (PYQ)";
              if (type === "PYQ") type = "Previous Year Question (PYQ)";
              if (type === "Notes") type = "Handwritten Notes";
              if (type === "Syllabus") type = "Course Syllabus";
              if (!groupedByType[type]) groupedByType[type] = [];
              groupedByType[type].push(pyq);
            });

            const types = Object.keys(groupedByType).sort();

            if (!selectedType && search === "") {
               return (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                   {types.map(type => {
                     let Icon = FileText;
                     let colorClass = "text-indigo-600 bg-indigo-50 border-indigo-100";
                     if (type.includes("PYQ") || type.includes("Question")) {
                       colorClass = "text-indigo-600 bg-indigo-50 border-indigo-100";
                     } else if (type.includes("Notes")) {
                       colorClass = "text-amber-600 bg-amber-50 border-amber-100";
                     } else if (type.includes("Syllabus")) {
                       colorClass = "text-emerald-600 bg-emerald-50 border-emerald-100";
                     } else if (type.includes("Internship")) {
                       Icon = Briefcase;
                       colorClass = "text-rose-600 bg-rose-50 border-rose-100";
                     } else {
                       Icon = Folder;
                       colorClass = "text-blue-600 bg-blue-50 border-blue-100";
                     }

                     return (
                       <div 
                         key={type} 
                         onClick={() => setSelectedType(type)}
                         className="cursor-pointer bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group flex items-center justify-between"
                       >
                         <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClass} group-hover:scale-105 transition-transform`}>
                             <Icon className="w-5 h-5" />
                           </div>
                           <div>
                             <h3 className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">{type}</h3>
                             <p className="text-xs font-medium text-gray-500 mt-0.5">{groupedByType[type].length} documents</p>
                           </div>
                         </div>
                         <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                           <Layers className="w-3.5 h-3.5" />
                         </div>
                       </div>
                     );
                   })}
                 </div>
               );
            }

            
            let pyqsToRender = (selectedType && search === "") ? (groupedByType[selectedType] || []) : filteredPyqs;
            
            if (selectedType && search === "") {
              if (selectedYear && selectedYear !== "Internships") pyqsToRender = pyqsToRender.filter(p => p.year === selectedYear);
              if (selectedSemester) pyqsToRender = pyqsToRender.filter(p => p.semester === selectedSemester);
              if (selectedSubject) pyqsToRender = pyqsToRender.filter(p => p.subjectName === selectedSubject);
            }

            return (
              <div className="space-y-4">
                {(selectedType && search === "") && (
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                    <button 
                      onClick={() => {
                        if (selectedSubject) {
                          setSelectedSubject(null);
                        } else if (selectedSemester) {
                          setSelectedSemester(null);
                        } else if (selectedYear) {
                          setSelectedYear(null);
                        } else {
                          setSelectedType(null);
                        }
                      }} 
                      className="text-gray-500 hover:text-indigo-600 flex items-center gap-1.5 font-medium text-sm transition-colors bg-gray-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-200"
                    >
                      <ArrowLeft className="w-4 h-4" /> 
                      {selectedSubject ? "Back to Subjects" : selectedSemester ? "Back to Semesters" : selectedYear === "Internships" ? "Back to Categories" : selectedYear ? "Back to Years" : "Back to Categories"}
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 flex flex-wrap items-center gap-2">
                      {selectedType} 
                      {selectedYear && <span className="text-indigo-400 font-medium"> / {selectedYear}</span>}
                      {selectedSemester && <span className="text-indigo-300 font-medium"> / {selectedSemester}</span>}
                      <span className="text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                        {pyqsToRender.length} documents
                      </span>
                    </h2>
                  </div>
                )}
                
                {selectedType && !selectedYear && search === "" && selectedType !== "Internship Information" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((year) => {
                      const count = (groupedByType[selectedType] || []).filter(p => p.year === year).length;
                      return (
                        <div
                          key={year}
                          onClick={() => setSelectedYear(year)}
                          className="p-4 bg-gray-50/80 hover:bg-indigo-50 border border-gray-100 rounded-xl cursor-pointer transition-all hover:shadow-md text-center group flex flex-col items-center"
                        >
                          <div className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
                            <Folder className="w-5 h-5 text-indigo-500" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 leading-tight">
                            {year}
                          </h3>
                          <span className="mt-2 text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                            {count} Docs
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : selectedType && selectedYear && selectedSemester && !selectedSubject && selectedType !== "Internship Information" && search === "" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {Array.from(new Set((groupedByType[selectedType] || []).filter(p => p.year === selectedYear && p.semester === selectedSemester).map(p => p.subjectName))).map((subName) => {
                      const count = (groupedByType[selectedType] || []).filter(p => p.year === selectedYear && p.semester === selectedSemester && p.subjectName === subName).length;
                      const titleName = subName || "Unknown Subject";
                      return (
                        <div
                          key={titleName}
                          onClick={() => setSelectedSubject(titleName)}
                          className="p-4 bg-gray-50/80 hover:bg-indigo-50 border border-gray-100 rounded-xl cursor-pointer transition-all hover:shadow-md text-center group flex flex-col items-center"
                          title={titleName}
                        >
                          <div className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
                            <Folder className="w-5 h-5 text-indigo-500" />
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
                    {Array.from(new Set((groupedByType[selectedType] || []).filter(p => p.year === selectedYear && p.semester === selectedSemester).map(p => p.subjectName))).length === 0 && (
                      <div className="col-span-full py-12 text-center text-xs text-gray-500">
                        No subjects found in {selectedSemester}.
                      </div>
                    )}
                  </div>
                ) : selectedType && selectedYear && !selectedSemester && selectedType !== "Internship Information" && search === "" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {(
                      selectedYear === "1st Year" ? ["Sem 1", "Sem 2"] :
                      selectedYear === "2nd Year" ? ["Sem 3", "Sem 4"] :
                      selectedYear === "3rd Year" ? ["Sem 5", "Sem 6"] :
                      ["Sem 7", "Sem 8"]
                    ).map((sem) => {
                      const count = (groupedByType[selectedType] || []).filter(p => p.year === selectedYear && p.semester === sem).length;
                      return (
                        <div
                          key={sem}
                          onClick={() => setSelectedSemester(sem)}
                          className="p-4 bg-gray-50/80 hover:bg-indigo-50 border border-gray-100 rounded-xl cursor-pointer transition-all hover:shadow-md text-center group flex flex-col items-center"
                        >
                          <div className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
                            <Folder className="w-5 h-5 text-indigo-500" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 leading-tight">
                            {sem}
                          </h3>
                          <span className="mt-2 text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                            {count} Docs
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {pyqsToRender.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
                        No documents found.
                      </div>
                    ) : pyqsToRender.map(pyq => {
                     let type = pyq.documentType || "Previous Year Question (PYQ)";
                     if (type === "PYQ") type = "Previous Year Question (PYQ)";
                     if (type === "Notes") type = "Handwritten Notes";
                     if (type === "Syllabus") type = "Course Syllabus";

                     let badgeColor = "bg-gray-100 text-gray-800 border-gray-200";
                     let cardBgColor = "bg-white border-gray-200";
                     let cardHoverClass = "hover:border-indigo-300 hover:shadow-md";

                     if (type.includes("PYQ") || type.includes("Question")) {
                       badgeColor = "bg-indigo-100 text-indigo-800 border-indigo-200";
                       cardBgColor = "bg-indigo-50/40 border-indigo-100";
                       cardHoverClass = "hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100";
                     } else if (type.includes("Notes")) {
                       badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
                       cardBgColor = "bg-amber-50/40 border-amber-100";
                       cardHoverClass = "hover:border-amber-300 hover:shadow-md hover:shadow-amber-100";
                     } else if (type.includes("Syllabus")) {
                       badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                       cardBgColor = "bg-emerald-50/40 border-emerald-100";
                       cardHoverClass = "hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100";
                     }
                     
                     return (
                      <a
                        href={pyq.fileUrl || "#"} download={pyq.fileName || "document.pdf"}
                        target="_blank"
                        rel="noopener noreferrer"
                        key={pyq.id}
                        className={`${cardBgColor} border rounded-lg p-3.5 transition-all flex flex-col group h-full cursor-pointer relative ${cardHoverClass}`}
                      >
                        <div className="flex justify-between items-start mb-2.5">
                           <div className="flex flex-wrap gap-2 items-center">
                             <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black border ${badgeColor} uppercase tracking-wider`}>
                               {type}
                             </span>
                             {pyq.status === "Verified" && (
                               <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-green-100 text-green-800 border border-green-200 shrink-0">
                                  Verified
                               </span>
                             )}
                           </div>
                           <span className="text-[10px] font-bold text-gray-400 bg-white/60 px-1.5 py-0.5 rounded border border-gray-100 shrink-0">
                             {(pyq.fileSize / 1024).toFixed(0)} KB
                           </span>
                        </div>

                        <div className="mb-3 pr-6 relative">
                          <h3 className="font-bold text-gray-900 text-[13px] line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors" title={pyq.fileName}>
                            {pyq.examYear ? `${pyq.examYear} ${pyq.examType || ""}` : pyq.fileName}
                          </h3>
                          <Download className="w-3.5 h-3.5 text-gray-300 absolute -right-2 top-0 group-hover:text-indigo-500 transition-colors" />
                          {pyq.description && (
                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-1" title={pyq.description}>
                              {pyq.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-auto pt-2 flex flex-wrap gap-1.5 border-t border-gray-200/50">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 max-w-full" title={pyq.subjectName}>
                            <BookOpen className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{pyq.subjectCode === "ALL_SUBJECTS" ? "All Subjects" : `${pyq.subjectCode} - ${pyq.subjectName}`}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            <Layers className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{pyq.department}</span>
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 shrink-0">
                            {pyq.semester}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 shrink-0">
                            {pyq.year}
                          </span>
                        </div>
                      </a>
                     );
                  })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}