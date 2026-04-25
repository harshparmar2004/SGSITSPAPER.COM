import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { PYQ } from '../types';
import { Button, Input } from '../components/ui';
import { Loader2, Search, Trash2, Edit, FileText, UploadCloud, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AdminAllPYQs() {
  const { isAdmin } = useAuth();
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Replace Modal State
  const [replacingPyq, setReplacingPyq] = useState<PYQ | null>(null);
  const [replaceMethod, setReplaceMethod] = useState<'link' | 'storage'>('link');
  const [externalLink, setExternalLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPyqs();
  }, []);

  const fetchPyqs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "pyqs"), orderBy("uploadedAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PYQ));
      setPyqs(data);
    } catch (e) {
      console.error("Error fetching PYQs", e);
    }
    setLoading(false);
  };

  const handleDelete = async (pyq: PYQ) => {
    if (!window.confirm(`Are you sure you want to delete ${pyq.subjectCode} - ${pyq.subjectName}?`)) return;
    try {
      if (pyq.fileSize && pyq.fileSize > 0) {
        // Assume it's from storage
        const storagePath = `pyqs/${pyq.department}/${pyq.semester}/${pyq.fileName}`;
        const pRef = ref(storage, storagePath);
        await deleteObject(pRef).catch(e => console.log('Storage delete error', e)); // Ignore if not found
      }
      await deleteDoc(doc(db, "pyqs", pyq.id));
      setPyqs(prev => prev.filter(p => p.id !== pyq.id));
    } catch (e) {
      console.error("Error deleting PYQ", e);
      alert("Error deleting PYQ");
    }
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

  const submitReplace = async () => {
    if (!replacingPyq) return;
    if (replaceMethod === 'storage' && !file) {
      setError('Please select a file.');
      return;
    }
    if (replaceMethod === 'link' && !externalLink) {
      setError('Please provide a link.');
      return;
    }

    setReplaceLoading(true);
    setError('');

    try {
      let fileUrl = '';
      let fileName = '';
      let fileSize = 0;

      if (replaceMethod === 'storage' && file) {
        if (replacingPyq.documentType === 'Notes') {
          fileName = `${replacingPyq.subjectCode}_Notes_${Date.now()}.pdf`.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        } else {
          fileName = `${replacingPyq.subjectCode}_${replacingPyq.examType || 'Exam'}_${replacingPyq.examYear || '0000'}.pdf`.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        }
        const storagePath = `pyqs/${replacingPyq.department}/${replacingPyq.semester}/${fileName}`;
        const storageRef = ref(storage, storagePath);
        
        const uploadTask = await uploadBytesResumable(storageRef, file);
        fileUrl = await getDownloadURL(uploadTask.ref);
        fileName = file.name;
        fileSize = file.size;
      } else {
        fileUrl = externalLink;
        fileName = `${replacingPyq.subjectCode}_External_Link_${replacingPyq.examYear}`;
        fileSize = 0;
      }

      await updateDoc(doc(db, 'pyqs', replacingPyq.id), {
        fileUrl,
        fileName,
        fileSize
      });

      // Update local state
      setPyqs(prev => prev.map(p => {
        if (p.id === replacingPyq.id) {
          return { ...p, fileUrl, fileName, fileSize };
        }
        return p;
      }));

      closeReplaceModal();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to replace");
    }
    setReplaceLoading(false);
  };

  const closeReplaceModal = () => {
    setReplacingPyq(null);
    setFile(null);
    setExternalLink('');
    setError('');
  };

  const filteredPyqs = pyqs.filter(p => 
    p.subjectCode.toLowerCase().includes(search.toLowerCase()) || 
    p.subjectName.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manage PYQs</h1>
          <p className="mt-2 text-sm text-gray-500">View, search, replace, and delete all uploaded papers.</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search code or subject..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-9 w-full bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Title / Code</th>
                  <th className="px-6 py-4">Department / Program</th>
                  <th className="px-6 py-4">Session / Semester</th>
                  <th className="px-6 py-4">Type / Year</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPyqs.map(pyq => (
                  <tr key={pyq.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{pyq.subjectName}</div>
                      <div className="text-gray-500 text-xs mt-0.5 font-mono">{pyq.subjectCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{pyq.department}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{pyq.course}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{pyq.session}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{pyq.semester}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">
                        {pyq.documentType === 'Notes' ? (
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                             Notes
                           </span>
                        ) : pyq.examType ? (
                           pyq.examType
                        ) : 'PYQ'}
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">{pyq.documentType === 'Notes' ? '' : `${pyq.month || ''} ${pyq.examYear || ''}`}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setReplacingPyq(pyq)}
                          className="h-8 shadow-sm flex items-center justify-center gap-1.5"
                          title="Replace PDF"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span className="sr-only sm:not-sr-only text-xs">Replace</span>
                        </Button>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => handleDelete(pyq)}
                          className="h-8 shadow-sm bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPyqs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      No PYQs found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Replace PDF Modal */}
      {replacingPyq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Replace PDF</h3>
              <button onClick={closeReplaceModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-indigo-50/50 p-4 rounded-lg flex items-start gap-3 border border-indigo-100">
                 <FileText className="w-5 h-5 text-indigo-500 mt-0.5" />
                 <div>
                   <h4 className="font-medium text-sm text-indigo-900">{replacingPyq.subjectCode}: {replacingPyq.subjectName}</h4>
                   <p className="text-xs text-indigo-700 mt-1">Replacing this will overwrite the existing PDF while keeping all metadata.</p>
                 </div>
              </div>

              {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <label className="block text-sm font-medium text-gray-900">New File Source</label>
                   <div className="flex space-x-1.5 bg-gray-100 p-1 rounded-lg">
                     <button
                       type="button"
                       onClick={() => setReplaceMethod('link')}
                       className={`text-xs px-3 py-1.5 rounded-md transition-colors ${replaceMethod === 'link' ? 'bg-white shadow-sm text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
                     >
                       External Link
                     </button>
                     <button
                       type="button"
                       onClick={() => setReplaceMethod('storage')}
                       className={`text-xs px-3 py-1.5 rounded-md transition-colors ${replaceMethod === 'storage' ? 'bg-white shadow-sm text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
                     >
                       Upload File
                     </button>
                   </div>
                 </div>

                 {replaceMethod === 'link' ? (
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
                       <div className="mt-3 flex flex-col items-center text-sm text-gray-600">
                         <label className="cursor-pointer font-medium text-indigo-600 hover:text-indigo-500">
                           <span>Select new PDF</span>
                           <input type="file" accept="application/pdf" className="sr-only" onChange={handleFileChange} />
                         </label>
                       </div>
                       {file && <p className="text-sm font-medium text-indigo-600 mt-2">{file.name}</p>}
                     </div>
                   </div>
                 )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
              <Button variant="outline" onClick={closeReplaceModal} disabled={replaceLoading}>Cancel</Button>
              <Button onClick={submitReplace} disabled={replaceLoading || (replaceMethod === 'storage' && !file) || (replaceMethod === 'link' && !externalLink)}>
                {replaceLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {replaceLoading ? 'Replacing...' : 'Confirm Replace'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
