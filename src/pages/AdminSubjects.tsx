import React, { useState } from 'react';
import { useAcademicConfig, Subject } from '../hooks/useAcademicConfig';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router';
import { Button, Input, Select } from '../components/ui';
import { BookOpen, Plus, Trash2, Loader2, Save } from 'lucide-react';

export default function AdminSubjects() {
  const { isAdmin, adminRole, assignedDepartments, loginLoading } = useAuth();
  const { programs, subjects, loading: configLoading, updateSubjects } = useAcademicConfig();

  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDepartments, setNewSubjectDepartments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const availablePrograms = React.useMemo(() => {
    return adminRole === 'superadmin' 
      ? programs 
      : programs.map(p => ({
          ...p,
          departments: p.departments.filter(d => assignedDepartments.includes(`${p.course}::${d}`) || assignedDepartments.includes(d))
        })).filter(p => p.departments.length > 0);
  }, [adminRole, programs, assignedDepartments]);

  React.useEffect(() => {
    // Auto-select if there is exactly 1 department available
    const totalDepts = availablePrograms.reduce((acc, p) => acc + p.departments.length, 0);
    if (totalDepts === 1) {
      const prog = availablePrograms[0];
      setNewSubjectDepartments([`${prog.course}::${prog.departments[0]}`]);
    }
  }, [availablePrograms]);

  if (loginLoading || configLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectCode.trim() || !newSubjectName.trim()) {
      setError("Subject code and name are required.");
      return;
    }
    
    if (newSubjectDepartments.length === 0) {
      setError("Please select at least one department.");
      return;
    }

    const code = newSubjectCode.trim().toUpperCase();
    if (subjects.some(s => s.code.toUpperCase() === code)) {
      setError("A subject with this code already exists.");
      return;
    }

    setError('');
    setSaving(true);
    try {
      const updatedSubjects = [...subjects, { code, name: newSubjectName.trim(), departments: newSubjectDepartments }];
      // Sort alphabetically by code
      updatedSubjects.sort((a, b) => a.code.localeCompare(b.code));
      
      await updateSubjects(updatedSubjects);
      setNewSubjectCode('');
      setNewSubjectName('');
      
      const totalDepts = availablePrograms.reduce((acc, p) => acc + p.departments.length, 0);
      if (totalDepts !== 1) {
        setNewSubjectDepartments([]);
      }
    } catch (err: any) {
      setError("Failed to add subject: " + err.message);
    }
    setSaving(false);
  };

  const toggleDept = (deptValue: string) => {
    setNewSubjectDepartments(prev => 
      prev.includes(deptValue) ? prev.filter(d => d !== deptValue) : [...prev, deptValue]
    );
  };

  const displayedSubjects = subjects.filter(s => {
    if (adminRole === 'superadmin') return true;
    if (!s.departments || s.departments.length === 0) return true; // Legacy global subjects visible to all
    return s.departments.some(d => {
      const parts = d.split('::');
      const deptName = parts.length > 1 ? parts[1] : d;
      return assignedDepartments.includes(d) || assignedDepartments.includes(deptName);
    });
  });

  const handleRemoveSubject = async (code: string) => {
    if (!window.confirm(`Are you sure you want to remove ${code}?`)) return;
    
    setSaving(true);
    try {
      const updatedSubjects = subjects.filter(s => s.code !== code);
      await updateSubjects(updatedSubjects);
    } catch (err: any) {
      setError("Failed to remove subject: " + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manage Subjects</h1>
        <p className="mt-2 text-sm text-gray-500">
          Create subjects with their codes to easily select them during material upload.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Add New Subject</h3>
        </div>
        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">{error}</div>}
          <form onSubmit={handleAddSubject} className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-sm font-medium text-gray-900">Subject Code *</label>
                <Input 
                  placeholder="e.g. CS101" 
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                />
              </div>
              <div className="flex-[2] space-y-2 w-full">
                <label className="text-sm font-medium text-gray-900">Subject Name *</label>
                <Input 
                  placeholder="e.g. Data Structures & Algorithms" 
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-gray-900">Assign to Departments *</label>
              <div className="max-h-48 overflow-y-auto space-y-3 p-3 bg-white border border-gray-200 rounded-md">
                {availablePrograms.map(prog => (
                  <div key={prog.course}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{prog.course}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {prog.departments.map(dept => {
                        const deptValue = `${prog.course}::${dept}`;
                        return (
                          <label key={deptValue} className="flex items-start gap-2 text-sm cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={newSubjectDepartments.includes(deptValue)}
                              onChange={() => toggleDept(deptValue)}
                              className="w-4 h-4 text-indigo-600 rounded border-gray-300 mt-0.5"
                            />
                            <span className="leading-tight text-gray-700">{dept}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving || !newSubjectCode.trim() || !newSubjectName.trim() || newSubjectDepartments.length === 0} className="w-full md:w-auto">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Subject
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">Existing Subjects ({displayedSubjects.length})</h3>
        </div>
        {displayedSubjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Subject Code</th>
                  <th className="px-6 py-4">Subject Name</th>
                  <th className="px-6 py-4">Departments</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedSubjects.map((sub) => (
                  <tr key={sub.code} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-indigo-600">{sub.code}</td>
                    <td className="px-6 py-4 text-gray-900">{sub.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {(!sub.departments || sub.departments.length === 0) ? (
                           <span className="text-xs text-gray-400 italic">All Departments (Legacy)</span>
                        ) : (
                           sub.departments.map(d => {
                             const displayLabel = d.includes('::') ? d.split('::').join(' - ') : d;
                             return (
                               <span key={d} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs truncate max-w-[200px]" title={displayLabel}>
                                 {displayLabel}
                               </span>
                             );
                           })
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleRemoveSubject(sub.code)}
                        disabled={saving}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Remove Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No subjects added yet. Add your first subject above.
          </div>
        )}
      </div>
    </div>
  );
}
