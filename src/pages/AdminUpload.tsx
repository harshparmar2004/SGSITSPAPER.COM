import React, { useState } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { DEPARTMENTS, COURSES, YEARS, SEMESTERS, EXAM_TYPES, MONTHS } from '../types';
import { Button, Input, Select } from '../components/ui';
import { UploadCloud, Loader2, ArrowLeft } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';

export default function AdminUpload() {
  const { user, isAdmin, loginLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    department: DEPARTMENTS[0],
    course: COURSES[0],
    year: YEARS[0],
    semester: SEMESTERS[0],
    subjectCode: '',
    subjectName: '',
    examType: EXAM_TYPES[0],
    month: MONTHS[0],
    examYear: new Date().getFullYear().toString(),
    session: '',
    section: ''
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF files are allowed.');
        return;
      }
      if (selectedFile.size > 2 * 1024 * 1024) {
        setError('File size must be less than 2MB.');
        return;
      }
      setError('');
      setFile(selectedFile);
    }
  };

  const checkDuplicate = async () => {
    // We query just by subjectCode to avoid needing a composite index immediately,
    // then filter the rest locally since the dataset per subject is small.
    const q = query(
      collection(db, "pyqs"),
      where("subjectCode", "==", formData.subjectCode)
    );
    const snapshot = await getDocs(q);
    let isDuplicate = false;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.examYear === formData.examYear && data.examType === formData.examType) {
        isDuplicate = true;
      }
    });
    return isDuplicate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file to upload.');
      return;
    }
    setError('');
    setUploading(true);
    setSuccess(false);

    try {
      // 1. Check duplicate
      const isDupe = await checkDuplicate();
      if (isDupe) {
        setError('A PYQ for this Subject Code, Exam Year, and Exam Type already exists.');
        setUploading(false);
        return;
      }

      // 2. Upload file
      const fileName = `${formData.subjectCode}_${formData.examType}_${formData.examYear}.pdf`.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const storagePath = `pyqs/${formData.department}/${formData.semester}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      const uploadTask = await uploadBytesResumable(storageRef, file);
      const fileUrl = await getDownloadURL(uploadTask.ref);

      // 3. Save to Firestore
      await addDoc(collection(db, "pyqs"), {
        ...formData,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: serverTimestamp(),
        uploadedBy: user?.uid || 'unknown'
      });

      setSuccess(true);
      setFile(null);
      // Reset some fields
      setFormData(prev => ({
        ...prev,
        subjectCode: '',
        subjectName: '',
        session: '',
        section: ''
      }));
      (document.getElementById('file-upload') as HTMLInputElement).value = "";
      
    } catch (err: any) {
      console.error("Upload failed", err);
      setError(err.message || 'An error occurred during upload.');
    }
    setUploading(false);
  };

  if (loginLoading) {
     return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!isAdmin) {
     return <Navigate to="/" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Upload New PYQ</h1>
        <p className="mt-2 text-lg text-gray-600">Fill in the metadata and upload a PDF. Max size 2MB.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm">{error}</div>}
        {success && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md border border-green-200 text-sm">Upload successful! You can upload another.</div>}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Department *</label>
              <Select name="department" value={formData.department} onChange={handleChange} required>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Course *</label>
              <Select name="course" value={formData.course} onChange={handleChange} required>
                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Year *</label>
              <Select name="year" value={formData.year} onChange={handleChange} required>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Semester *</label>
              <Select name="semester" value={formData.semester} onChange={handleChange} required>
                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Subject Code *</label>
              <Input placeholder="e.g. CS101" name="subjectCode" value={formData.subjectCode} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Subject Name *</label>
              <Input placeholder="e.g. Data Structures" name="subjectName" value={formData.subjectName} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Exam Type *</label>
              <Select name="examType" value={formData.examType} onChange={handleChange} required>
                {EXAM_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
              </Select>
            </div>
            <div className="space-y-2 flex gap-4">
               <div className="flex-1 space-y-2">
                 <label className="text-sm font-medium text-gray-900">Month *</label>
                 <Select name="month" value={formData.month} onChange={handleChange} required>
                   {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                 </Select>
               </div>
               <div className="flex-1 space-y-2">
                 <label className="text-sm font-medium text-gray-900">Exam Year *</label>
                 <Input name="examYear" value={formData.examYear} onChange={handleChange} required />
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Session *</label>
              <Input placeholder="e.g. 2023-2024" name="session" value={formData.session} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Section (Optional)</label>
              <Input placeholder="e.g. A" name="section" value={formData.section} onChange={handleChange} />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-900 mb-2">Upload PDF File *</label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                <div className="mt-4 flex flex-col items-center text-sm leading-6 text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" accept="application/pdf" className="sr-only" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1 mt-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-500 mt-2">PDF up to 2MB</p>
                {file && <p className="text-sm font-medium text-indigo-600 mt-4">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={uploading || !file} className="w-full md:w-auto min-w-[150px]">
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
              {uploading ? 'Uploading...' : 'Submit PYQ'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
