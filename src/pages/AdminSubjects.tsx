import React, { useState } from 'react';
import { useAcademicConfig, Subject } from '../hooks/useAcademicConfig';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router';
import { Button, Input, Select } from '../components/ui';
import { BookOpen, Plus, Trash2, Loader2, Save, Edit, X, UploadCloud, Download } from 'lucide-react';
import { YEARS, SEMESTERS } from '../types';

export default function AdminSubjects() {
  const { isAdmin, adminRole, assignedDepartments, loginLoading } = useAuth();
  const { programs, subjects, loading: configLoading, updateSubjects } = useAcademicConfig();

  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectYear, setNewSubjectYear] = useState('');
  const [newSubjectSemester, setNewSubjectSemester] = useState('');
  const [newSubjectDepartments, setNewSubjectDepartments] = useState<string[]>([]);
  const [editingSubjectCode, setEditingSubjectCode] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const availablePrograms = React.useMemo(() => {
    return adminRole === 'superadmin' 
      ? programs 
      : programs.map(p => ({
          ...p,
          departments: p.departments.filter(d => assignedDepartments.includes(`${p.course}::${d}`) || assignedDepartments.includes(d))
        })).filter(p => p.departments.length > 0);
  }, [adminRole, programs, assignedDepartments]);

  const filterOptions = React.useMemo(() => {
    const opts = ['All'];
    availablePrograms.forEach(p => {
      p.departments.forEach(d => {
        opts.push(`${p.course}::${d}`);
      });
    });
    return opts;
  }, [availablePrograms]);

  React.useEffect(() => {
    if (editingSubjectCode) return;
    // Auto-select if there is exactly 1 department available
    const totalDepts = availablePrograms.reduce((acc, p) => acc + p.departments.length, 0);
    if (totalDepts === 1) {
      const prog = availablePrograms[0];
      setNewSubjectDepartments([`${prog.course}::${prog.departments[0]}`]);
    }
  }, [availablePrograms, editingSubjectCode]);

  if (loginLoading || configLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  const resetForm = () => {
    setNewSubjectCode('');
    setNewSubjectName('');
    setNewSubjectYear('');
    setNewSubjectSemester('');
    setEditingSubjectCode(null);
    setError('');
    
    const totalDepts = availablePrograms.reduce((acc, p) => acc + p.departments.length, 0);
    if (totalDepts !== 1) {
      setNewSubjectDepartments([]);
    } else {
      const prog = availablePrograms[0];
      setNewSubjectDepartments([`${prog.course}::${prog.departments[0]}`]);
    }
  };

  const handleEditSubject = (sub: Subject) => {
    setEditingSubjectCode(sub.code);
    setNewSubjectCode(sub.code);
    setNewSubjectName(sub.name);
    setNewSubjectYear(sub.year || '');
    setNewSubjectSemester(sub.semester || '');
    setNewSubjectDepartments(sub.departments || []);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitSubject = async (e: React.FormEvent) => {
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
    
    if (editingSubjectCode !== code && subjects.some(s => s.code.toUpperCase() === code)) {
      setError("A subject with this code already exists.");
      return;
    }

    setError('');
    setSaving(true);
    try {
      let updatedSubjects = [...subjects];
      
      const subjectData: Subject = { 
        code, 
        name: newSubjectName.trim(), 
        year: newSubjectYear.trim(),
        semester: newSubjectSemester.trim(),
        departments: newSubjectDepartments 
      };

      if (editingSubjectCode) {
        updatedSubjects = updatedSubjects.map(s => s.code === editingSubjectCode ? subjectData : s);
      } else {
        updatedSubjects.push(subjectData);
      }
      
      // Sort alphabetically by code
      updatedSubjects.sort((a, b) => a.code.localeCompare(b.code));
      
      await updateSubjects(updatedSubjects);
      resetForm();
    } catch (err: any) {
      setError(`Failed to ${editingSubjectCode ? 'update' : 'add'} subject: ` + err.message);
    }
    setSaving(false);
  };

  const toggleDept = (deptValue: string) => {
    setNewSubjectDepartments(prev => 
      prev.includes(deptValue) ? prev.filter(d => d !== deptValue) : [...prev, deptValue]
    );
  };

  const displayedSubjects = subjects.filter(s => {
    let isVisible = false;
    if (adminRole === 'superadmin') {
      isVisible = true;
    } else if (!s.departments || s.departments.length === 0) {
      isVisible = true; // Legacy global subjects visible to all
    } else {
      isVisible = s.departments.some(d => {
        const parts = d.split('::');
        const deptName = parts.length > 1 ? parts[1] : d;
        return assignedDepartments.includes(d) || assignedDepartments.includes(deptName);
      });
    }

    if (!isVisible) return false;

    if (departmentFilter !== 'All') {
      if (!s.departments || s.departments.length === 0) {
        return false;
      }
      return s.departments.includes(departmentFilter);
    }

    return true;
  });

  const handleRemoveSubject = async (code: string) => {
    if (!window.confirm(`Are you sure you want to remove ${code}?`)) return;
    
    setSaving(true);
    try {
      const updatedSubjects = subjects.filter(s => s.code !== code);
      await updateSubjects(updatedSubjects);
      if (editingSubjectCode === code) {
        resetForm();
      }
    } catch (err: any) {
      setError("Failed to remove subject: " + err.message);
    }
    setSaving(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    setError('');
    
    try {
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      const newSubjectsMap: Record<string, Subject> = {};
      
      let skipped = 0;
      let added = 0;
      
      for (let i = 1; i < lines.length; i++) { // Skip header
        const columns = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (columns.length < 2) continue;
        
        const [code, name, year, semester, deptsStr] = columns;
        
        if (!code || !name) continue;
        
        const depts = deptsStr ? deptsStr.split(';').map(d => d.trim()).filter(Boolean) : [];
        
        newSubjectsMap[code.toUpperCase()] = {
          code: code.toUpperCase(),
          name,
          year: year || '',
          semester: semester || '',
          departments: depts
        };
        added++;
      }
      
      let updatedSubjects = [...subjects];
      
      Object.keys(newSubjectsMap).forEach(code => {
        const existingIndex = updatedSubjects.findIndex(s => s.code === code);
        if (existingIndex >= 0) {
          updatedSubjects[existingIndex] = newSubjectsMap[code];
        } else {
          updatedSubjects.push(newSubjectsMap[code]);
        }
      });
      
      updatedSubjects.sort((a, b) => a.code.localeCompare(b.code));
      
      await updateSubjects(updatedSubjects);
      
      alert(`CSV Upload Processed. ${added} subjects processed.`);
    } catch (err: any) {
      setError("Failed to parse CSV: " + err.message);
    }
    setSaving(false);
    
    // Reset file input
    e.target.value = '';
  };

  const downloadCsvTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + "Code,Name,Year,Semester,Departments(separated by ;)\nCS101,Computer Science,1,1,B.Tech::Computer Science;B.Tech::IT";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "subject_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSubjectsCsv = () => {
    if (subjects.length === 0) return;
    
    const dataToExport = displayedSubjects.length > 0 ? displayedSubjects : subjects;
    
    const headers = ["S.No.", "Subject Code", "Subject Name", "Year", "Semester", "Departments"];
    const rows = dataToExport.map((sub, index) => {
      const depts = (!sub.departments || sub.departments.length === 0) 
        ? "All Departments" 
        : sub.departments.join(';');
        
      return [
        index + 1,
        `"${sub.code}"`,
        `"${sub.name}"`,
        `"${sub.year || ''}"`,
        `"${sub.semester || ''}"`,
        `"${depts}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Subjects_List_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Manage Subjects</h1>
          <p className="mt-2 text-[11px] text-gray-500">
            Create and manage subjects, assign them to departments, year, and semester.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportSubjectsCsv} disabled={configLoading || displayedSubjects.length === 0} className="w-full sm:w-auto text-xs whitespace-nowrap">
          <Download className="w-4 h-4 mr-2" /> Export Subjects to CSV
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
        <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {editingSubjectCode ? <Edit className="w-5 h-5 text-indigo-600" /> : <BookOpen className="w-5 h-5 text-indigo-600" />}
            <h3 className="font-semibold text-gray-900">{editingSubjectCode ? 'Edit Subject' : 'Add New Subject'}</h3>
          </div>
          {editingSubjectCode && (
            <Button variant="ghost" size="sm" onClick={resetForm} className="text-gray-500 hover:text-gray-900">
              <X className="w-4 h-4 mr-1" /> Cancel Edit
            </Button>
          )}
        </div>
        <div className="p-3">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">{error}</div>}
          <form onSubmit={handleSubmitSubject} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-900">Subject Code *</label>
                <Input 
                  placeholder="e.g. CS101" 
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-900">Subject Name *</label>
                <Input 
                  placeholder="e.g. Data Structures & Algorithms" 
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-900">Year (Optional)</label>
                <Select value={newSubjectYear} onChange={(e) => setNewSubjectYear(e.target.value)}>
                  <option value="">Select Year...</option>
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                  <option value="Other">Other</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-900">Semester (Optional)</label>
                <Select value={newSubjectSemester} onChange={(e) => setNewSubjectSemester(e.target.value)}>
                  <option value="">Select Semester...</option>
                  {SEMESTERS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="Other">Other</option>
                </Select>
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <label className="text-xs font-medium text-gray-900">Assign to Departments *</label>
              <div className="max-h-48 overflow-y-auto space-y-3 p-3 bg-white border border-gray-200 rounded-md">
                {availablePrograms.map(prog => (
                  <div key={prog.course}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{prog.course}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {prog.departments.map(dept => {
                        const deptValue = `${prog.course}::${dept}`;
                        return (
                          <label key={deptValue} className="flex items-start gap-2 text-xs cursor-pointer select-none">
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

            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer text-xs flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors disabled:opacity-50 min-w-[120px]">
                   {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                   {saving ? 'Processing...' : 'Bulk CSV Upload'}
                   <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={saving} />
                </label>
                <button type="button" onClick={downloadCsvTemplate} className="text-[11px] text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1">
                  <Download className="w-3 h-3" /> Template
                </button>
              </div>

              <Button type="submit" disabled={saving || !newSubjectCode.trim() || !newSubjectName.trim() || newSubjectDepartments.length === 0} className="w-full md:w-auto">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (editingSubjectCode ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />)}
                {editingSubjectCode ? 'Save Changes' : 'Add Subject'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-900">Existing Subjects ({displayedSubjects.length})</h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 whitespace-nowrap">Filter by Department:</span>
            <Select 
              value={departmentFilter} 
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full sm:w-64"
            >
              <option value="All">All Departments</option>
              {filterOptions.filter(o => o !== 'All').map(o => {
                const label = o.includes('::') ? o.split('::').join(' - ') : o;
                return <option key={o} value={o}>{label}</option>
              })}
            </Select>
          </div>
        </div>
        {displayedSubjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-12 text-center">S.No.</th>
                  <th className="px-3 py-2">Subject Code</th>
                  <th className="px-3 py-2">Subject Name</th>
                  <th className="px-3 py-2">Year / Sem</th>
                  <th className="px-3 py-2">Departments</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedSubjects.map((sub, index) => (
                  <tr key={sub.code} className={`hover:bg-gray-50/50 transition-colors ${editingSubjectCode === sub.code ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-3 py-2 text-center text-gray-500 font-medium">{index + 1}</td>
                    <td className="px-3 py-2 font-mono font-medium text-indigo-600">{sub.code}</td>
                    <td className="px-3 py-2 text-gray-900">{sub.name}</td>
                    <td className="px-3 py-2 text-gray-500">{sub.year || '-'} / {sub.semester || '-'}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {(!sub.departments || sub.departments.length === 0) ? (
                           <span className="text-[11px] text-gray-400 italic">All Departments (Legacy)</span>
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
                    <td className="px-3 py-2 text-right space-x-2">
                      <button 
                        onClick={() => handleEditSubject(sub)}
                        disabled={saving}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
                        title="Edit Subject"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
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
            {departmentFilter !== 'All' 
               ? 'No subjects match the selected department filter.' 
               : 'No subjects added yet. Add your first subject above.'}
          </div>
        )}
      </div>
    </div>
  );
}
