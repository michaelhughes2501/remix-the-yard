import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { AppDocument } from '../types';
import { FileText, Upload, Trash2, Download, File, FileImage, FileArchive } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';

export default function Vault() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ID');
  const [filterCategory, setFilterCategory] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<AppDocument | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [token]);

  const fetchDocuments = () => {
    fetch('/api/documents', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setDocuments);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({
            title: title || file.name,
            category,
            file_name: file.name,
            file_type: file.type,
            file_data: base64
          })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }

        setTitle('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchDocuments();
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadDocument = async (id: string, fileName: string) => {
    try {
      const res = await fetch(`/api/documents/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to download");
      const data = await res.json();
      
      const a = document.createElement('a');
      a.href = data.file_data;
      a.download = data.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteDocument = (doc: AppDocument) => {
    setDocumentToDelete(doc);
    setDeleteConfirmOpen(true);
  };

  const executeDeleteDocument = async () => {
    if (!documentToDelete) return;
    try {
      await fetch(`/api/documents/${documentToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDocuments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteConfirmOpen(false);
      setDocumentToDelete(null);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <FileImage size={24} className="opacity-60" />;
    if (type.includes('pdf')) return <FileText size={24} className="opacity-60" />;
    if (type.includes('zip') || type.includes('tar') || type.includes('rar')) return <FileArchive size={24} className="opacity-60" />;
    return <File size={24} className="opacity-60" />;
  };

  const filteredDocuments = filterCategory === 'All' 
    ? documents 
    : documents.filter(doc => doc.category === filterCategory);

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h2 className="text-6xl font-serif italic tracking-tighter">The Vault</h2>
        <p className="text-xl opacity-60 max-w-2xl">
          Securely store and access your important documents: IDs, court records, resumes, and certificates.
        </p>
      </header>

      <div className="bg-white border border-[#141414] p-6">
        <h3 className="text-xl font-serif italic mb-4">Upload Document</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-1">Title (Optional)</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. State ID"
              className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-1">Category</label>
            <select 
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 bg-white"
            >
              <option value="ID">Identification</option>
              <option value="Court">Court Documents</option>
              <option value="Resume">Resume / CV</option>
              <option value="Certificate">Certificates</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex items-end">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label 
              htmlFor="file-upload"
              className={`w-full flex items-center justify-center gap-2 p-3 uppercase tracking-widest text-xs font-bold transition-colors cursor-pointer ${
                isUploading ? 'bg-[#141414]/50 text-[#E4E3E0] cursor-not-allowed' : 'bg-[#141414] text-[#E4E3E0] hover:opacity-90'
              }`}
            >
              <Upload size={16} /> {isUploading ? 'Uploading...' : 'Select File'}
            </label>
          </div>
        </div>
        <p className="text-xs opacity-60">Max file size: 10MB. Files are stored securely.</p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xs uppercase tracking-widest font-bold flex items-center gap-2">
            <FileText size={16} /> Your Documents
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-widest font-bold opacity-60">Filter:</label>
            <select 
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="border border-[#141414] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414]/10 bg-white"
            >
              <option value="All">All Documents</option>
              <option value="ID">Identification</option>
              <option value="Court">Court Documents</option>
              <option value="Resume">Resume / CV</option>
              <option value="Certificate">Certificates</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        
        {filteredDocuments.length === 0 ? (
          <div className="p-12 border border-[#141414]/20 text-center opacity-60">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>{documents.length === 0 ? "Your vault is empty. Upload your first document above." : "No documents found in this category."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map(doc => (
              <div key={doc.id} className="bg-white border border-[#141414] p-4 flex flex-col">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-3 bg-[#E4E3E0] rounded-sm">
                    {getFileIcon(doc.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate" title={doc.title}>{doc.title}</h4>
                    <p className="text-xs opacity-60 truncate" title={doc.file_name}>{doc.file_name}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase tracking-widest bg-[#141414] text-[#E4E3E0] px-2 py-0.5">
                      {doc.category}
                    </span>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-[#141414]/10 flex justify-between items-center">
                  <span className="text-xs opacity-60">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => downloadDocument(doc.id, doc.file_name)}
                      className="p-1.5 hover:bg-[#141414]/5 rounded transition-colors"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      onClick={() => deleteDocument(doc)}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={deleteConfirmOpen}
        title="Delete Document"
        message={`Are you sure you want to delete "${documentToDelete?.title}"? This action cannot be undone.`}
        onConfirm={executeDeleteDocument}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDocumentToDelete(null);
        }}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
