import React, { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layers, FolderOpen, FileText, Loader2, BookMarked, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useAcademicConfig, AcademicProgram } from '../hooks/useAcademicConfig';
import { Button, Input } from '../components/ui';

// Define the aggregation structure
type CourseStats = {
  [courseName: string]: {
    total: number;
    departments: {
      [deptName: string]: number;
    }
  }
};

export default function AdminDepartments() {
  const { programs, loading: configLoading, updatePrograms } = useAcademicConfig();
  const [stats, setStats] = useState<CourseStats>({});
  const [statsLoading, setStatsLoading] = useState(true);
  
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  
  const [newProgramName, setNewProgramName] = useState('');
  const [newDepartmentNames, setNewDepartmentNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (programs.length > 0) {
      // Expand all by default initially
      const initialExpanded: Record<string, boolean> = {};
      programs.forEach(p => { initialExpanded[p.course] = true; });
      setExpandedCourses(prev => (Object.keys(prev).length === 0 ? initialExpanded : prev));
      fetchStats();
    }
  }, [programs]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const pyqSnapshot = await getDocs(collection(db, "pyqs"));
      
      const newStats: CourseStats = {};
      
      // Initialize structure based on dynamic config
      programs.forEach(prog => {
        newStats[prog.course] = { total: 0, departments: {} };
        prog.departments.forEach(dept => {
          newStats[prog.course].departments[dept] = 0;
        });
      });

      // Aggregate data
      pyqSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.course && data.department && newStats[data.course]) {
           newStats[data.course].total += 1;
           if (newStats[data.course].departments[data.department] !== undefined) {
              newStats[data.course].departments[data.department] += 1;
           } else {
              newStats[data.course].departments[data.department] = 1;
           }
        }
      });

      setStats(newStats);
    } catch (error) {
      console.error("Error fetching department stats:", error);
    }
    setStatsLoading(false);
  };

  const toggleCourse = (course: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [course]: !prev[course]
    }));
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName.trim()) return;
    
    const exists = programs.find(p => p.course.toLowerCase() === newProgramName.trim().toLowerCase());
    if (exists) {
      alert("This program already exists.");
      return;
    }

    const updated = [...programs, { course: newProgramName.trim(), departments: [] }];
    setNewProgramName('');
    await updatePrograms(updated);
  };

  const handleAddDepartment = async (courseName: string) => {
    const deptName = newDepartmentNames[courseName]?.trim();
    if (!deptName) return;

    const progIndex = programs.findIndex(p => p.course === courseName);
    if (progIndex === -1) return;

    const prog = programs[progIndex];
    if (prog.departments.find(d => d.toLowerCase() === deptName.toLowerCase())) {
       alert("This department already exists in this program.");
       return;
    }

    const updatedPrograms = [...programs];
    updatedPrograms[progIndex] = {
      ...prog,
      departments: [...prog.departments, deptName]
    };

    setNewDepartmentNames(prev => ({ ...prev, [courseName]: '' }));
    await updatePrograms(updatedPrograms);
  };

  const handleDeleteProgram = async (e: React.MouseEvent, courseName: string) => {
    e.stopPropagation(); // prevent toggling the block
    if (window.confirm(`Are you sure you want to delete the program "${courseName}"?`)) {
      if (window.confirm(`DOUBLE CHECK: Deleting "${courseName}" will remove it from the upload list. Existing uploaded PYQs will not be deleted, but they may be hidden from filters if this program is gone. Are you absolutely sure?`)) {
        const updated = programs.filter(p => p.course !== courseName);
        await updatePrograms(updated);
      }
    }
  };

  const handleDeleteDepartment = async (courseName: string, deptName: string) => {
    if (window.confirm(`Are you sure you want to delete department "${deptName}" from "${courseName}"?`)) {
       if (window.confirm(`DOUBLE CHECK: Deleting this department will remove it from the list. Existing PYQs will not be deleted. Proceed?`)) {
         const progIndex = programs.findIndex(p => p.course === courseName);
         if (progIndex !== -1) {
           const updatedPrograms = [...programs];
           updatedPrograms[progIndex] = {
             ...updatedPrograms[progIndex],
             departments: updatedPrograms[progIndex].departments.filter(d => d !== deptName)
           };
           await updatePrograms(updatedPrograms);
         }
       }
    }
  };

  if (configLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Programs & Departments</h1>
          <p className="mt-2 text-sm text-gray-500">Manage academic programs and their respective branches. These will be available when users upload PYQs.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 border border-indigo-100 shadow-sm w-fit">
           <Layers className="w-5 h-5" />
           <span>{Object.values(stats).reduce((acc, curr: any) => acc + curr.total, 0)} Total Indexed Papers</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1">
           <h3 className="text-lg font-semibold text-gray-900">Add New Program</h3>
           <p className="text-sm text-gray-500">Create a new core academic program (e.g., Ph.D, B.Sc).</p>
        </div>
        <form onSubmit={handleAddProgram} className="flex gap-3 w-full md:w-auto">
          <Input 
            placeholder="Program Name" 
            value={newProgramName}
            onChange={(e) => setNewProgramName(e.target.value)}
            className="w-full md:w-64"
          />
          <Button type="submit" className="whitespace-nowrap flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Program
          </Button>
        </form>
      </div>

      {statsLoading ? (
        <div className="flex items-center justify-center p-24">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {programs.map(prog => {
            const course = prog.course;
            const courseData = stats[course] || { total: 0, departments: {} };
            const isExpanded = !!expandedCourses[course];

            return (
              <div key={course} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
                {/* Course Header */}
                <div 
                  className="px-6 py-5 cursor-pointer select-none flex items-center justify-between bg-gray-50/50 hover:bg-indigo-50/30 transition-colors"
                  onClick={() => toggleCourse(course)}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white border border-gray-200 shadow-sm p-3 rounded-xl text-indigo-600">
                      <BookMarked className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{course}</h2>
                      <p className="text-sm text-gray-500 mt-1 capitalize font-medium">{courseData.total} PYQs Uploaded</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex text-sm text-gray-400 font-medium bg-white border border-gray-200 px-3 py-1 rounded-md shadow-sm">
                       {prog.departments.length} Active Branches
                    </div>
                    <button 
                      onClick={(e) => handleDeleteProgram(e, course)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Program"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className={`p-1.5 rounded-full transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Departments Grid */}
                {isExpanded && (
                  <div className="p-6 border-t border-gray-100 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {prog.departments.map(dept => {
                         const count = courseData.departments[dept] || 0;
                         const isActive = count > 0;
                         
                         return (
                           <div 
                             key={dept} 
                             className={`flex items-center justify-between p-4 rounded-lg border ${
                               isActive 
                                 ? 'border-indigo-100 bg-indigo-50/20 shadow-sm hover:border-indigo-300 transition-colors' 
                                 : 'border-gray-100 bg-gray-50/50 opacity-70'
                             }`}
                           >
                             <div className="flex items-start gap-3 overflow-hidden">
                               <FolderOpen className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                               <div className="truncate">
                                 <p className={`text-sm font-semibold truncate ${isActive ? 'text-gray-900' : 'text-gray-500'}`} title={dept}>
                                   {dept}
                                 </p>
                                 <span className={`text-xs mt-0.5 block font-medium ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                                   {count} Papers
                                 </span>
                               </div>
                             </div>
                             
                             <div className="flex items-center gap-2">
                               {isActive && (
                                 <div className="bg-white border border-indigo-100 w-8 h-8 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                                   <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                 </div>
                               )}
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleDeleteDepartment(course, dept);
                                 }}
                                 className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                 title="Delete Department"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </div>
                           </div>
                         );
                      })}
                    </div>
                    
                    {/* Add Department inside Course */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-4">
                      <Input
                        placeholder={`New department in ${course}`}
                        className="max-w-xs text-sm"
                        value={newDepartmentNames[course] || ''}
                        onChange={(e) => setNewDepartmentNames({...newDepartmentNames, [course]: e.target.value})}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddDepartment(course);
                        }}
                      />
                      <Button size="sm" variant="outline" onClick={() => handleAddDepartment(course)}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Department
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}