import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COURSES, DEPARTMENTS } from '../types';
import { Layers, FolderOpen, FileText, Loader2, BookMarked, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [stats, setStats] = useState<CourseStats>({});
  const [loading, setLoading] = useState(true);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({
    'B.Tech': true // Default expand B.Tech
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const pyqColl = collection(db, "pyqs");
      const pyqSnapshot = await getDocs(pyqColl);
      
      const newStats: CourseStats = {};
      
      // Initialize with empty structure based on constants to ensure everything shows up
      COURSES.forEach(course => {
        newStats[course] = { total: 0, departments: {} };
        DEPARTMENTS.forEach(dept => {
          newStats[course].departments[dept] = 0;
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
              // Handle legacy or malformed data
              newStats[data.course].departments[data.department] = 1;
           }
        }
      });

      setStats(newStats);
    } catch (error) {
      console.error("Error fetching department stats:", error);
    }
    setLoading(false);
  };

  const toggleCourse = (course: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [course]: !prev[course]
    }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Programs & Departments</h1>
          <p className="mt-2 text-sm text-gray-500">View PYQ coverage across all academic programs and their respective branches.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 border border-indigo-100 shadow-sm w-fit">
           <Layers className="w-5 h-5" />
           <span>{Object.values(stats).reduce((acc, curr: any) => acc + curr.total, 0)} Total Indexed Papers</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-24">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {COURSES.map(course => {
            const courseData = stats[course];
            if (!courseData) return null;
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
                       {Object.values(courseData.departments).filter((count: any) => count > 0).length} Active Branches
                    </div>
                    <div className={`p-1.5 rounded-full transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Departments Grid */}
                {isExpanded && (
                  <div className="p-6 border-t border-gray-100 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {DEPARTMENTS.map(dept => {
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
                           
                           {isActive && (
                             <div className="bg-white border border-indigo-100 w-8 h-8 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                               <FileText className="w-3.5 h-3.5 text-indigo-500" />
                             </div>
                           )}
                         </div>
                       );
                    })}
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