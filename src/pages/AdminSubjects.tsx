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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (loginLoading || configLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  // Allow all admins to manage subjects for now, or just superadmin if we want to restrict.
  // The user said "they can add their subject... directly linked to upload"
  // So maybe department admins can add subjects as well.
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectCode.trim() || !newSubjectName.trim()) {
      setError("Subject code and name are required.");
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
      const updatedSubjects = [...subjects, { code, name: newSubjectName.trim() }];
      // Sort alphabetically by code
      updatedSubjects.sort((a, b) => a.code.localeCompare(b.code));
      
      await updateSubjects(updatedSubjects);
      setNewSubjectCode('');
      setNewSubjectName('');
    } catch (err: any) {
      setError("Failed to add subject: " + err.message);
    }
    setSaving(false);
  };

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
          <form onSubmit={handleAddSubject} className="flex flex-col md:flex-row gap-4 items-end">
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
            <Button type="submit" disabled={saving || !newSubjectCode.trim() || !newSubjectName.trim()} className="w-full md:w-auto">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Subject
            </Button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">Existing Subjects ({subjects.length})</h3>
        </div>
        {subjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Subject Code</th>
                  <th className="px-6 py-4">Subject Name</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjects.map((sub) => (
                  <tr key={sub.code} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-indigo-600">{sub.code}</td>
                    <td className="px-6 py-4 text-gray-900">{sub.name}</td>
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
