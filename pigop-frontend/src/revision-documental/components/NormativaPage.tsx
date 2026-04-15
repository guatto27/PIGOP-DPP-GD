
import React, { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, File as FileIcon, Trash2, Loader2, Eye, X } from 'lucide-react';
import { COLORS } from '../constants';
import type { NormativaDocument } from '../types';
import { extractTextFromPDF, generatePDFThumbnail } from '../services/fileParsingService';
import { analyzeNormativaDocument } from '../services/geminiService';
import PdfViewer from './PdfViewer';

interface NormativaPageProps {
  documents: NormativaDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<NormativaDocument[]>>;
}

const NormativaPage: React.FC<NormativaPageProps> = ({ documents, setDocuments }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<NormativaDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const allSelectedFiles: File[] = Array.from(e.target.files);
    const existingFileNames = new Set(documents.map(d => d.fileObject.name));
    const uniqueFiles: File[] = [];
    const duplicates: string[] = [];

    for (const file of allSelectedFiles) {
      if (existingFileNames.has(file.name)) {
        duplicates.push(file.name);
      } else {
        uniqueFiles.push(file);
      }
    }

    if (duplicates.length > 0) {
      alert(`Los siguientes archivos ya están en la lista y serán omitidos:\n${duplicates.join('\n')}`);
    }

    if (uniqueFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsAnalyzing(true);
    const newDocs: NormativaDocument[] = [];

    for (const file of uniqueFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let type: NormativaDocument['type'] = 'unknown';
      if (ext === 'pdf') type = 'pdf';
      else if (['doc', 'docx'].includes(ext || '')) type = 'word';
      else if (['jpg', 'jpeg', 'png'].includes(ext || '')) type = 'image';

      let extractedText = "";
      let extractedImages: string[] = [];
      let thumbnail = "";

      try {
        if (type === 'pdf') {
          const buffer = await file.arrayBuffer();
          const [parsed, thumb] = await Promise.all([
            extractTextFromPDF(buffer),
            generatePDFThumbnail(buffer)
          ]);
          extractedText = parsed.text;
          if (parsed.images) extractedImages = parsed.images;
          thumbnail = thumb;
        } else if (type === 'image') {
          const fullBase64 = await readFileAsBase64(file);
          thumbnail = fullBase64;
          extractedImages = [fullBase64.split(',')[1]];
        }

        const aiAnalysis = await analyzeNormativaDocument(file.name, extractedText, extractedImages);

        newDocs.push({
          id: crypto.randomUUID(),
          name: aiAnalysis.title || file.name,
          type,
          size: file.size,
          uploadDate: new Date(),
          publicationDate: aiAnalysis.publicationDate || '',
          vigencyDate: aiAnalysis.vigencyDate || '',
          fileObject: file,
          thumbnail
        });
      } catch (_err) {
        newDocs.push({
          id: crypto.randomUUID(),
          name: file.name,
          type,
          size: file.size,
          uploadDate: new Date(),
          publicationDate: '',
          vigencyDate: '',
          fileObject: file
        });
      }
    }

    setDocuments(prev => [...prev, ...newDocs]);
    setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="text-red-500" size={24} />;
      case 'word': return <FileText className="text-blue-600" size={24} />;
      case 'image': return <ImageIcon className="text-green-600" size={24} />;
      default: return <FileIcon className="text-gray-400" size={24} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Normativa Institucional</h2>
          <p className="text-gray-600 mt-1">Gestión de reglamentos y lineamientos de validación.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          {isAnalyzing && <Loader2 className="animate-spin" size={20} style={{ color: COLORS.wine }} />}
          <button
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 text-white rounded shadow hover:opacity-90 transition-opacity"
            style={{ backgroundColor: COLORS.wine }}
          >
            <Upload size={18} />
            {isAnalyzing ? 'Analizando...' : 'Cargar Archivo'}
          </button>
          <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {documents.length === 0 ? (
          <div className="p-12 text-center text-gray-400 italic">No hay documentos normativos cargados.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-xs font-bold text-gray-500 uppercase">
                <th className="px-6 py-3">Documento</th>
                <th className="px-6 py-3">Publicación</th>
                <th className="px-6 py-3">Vigencia</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                      {doc.thumbnail
                        ? <img src={doc.thumbnail} className="w-full h-full object-cover" alt={doc.name} />
                        : getIcon(doc.type)
                      }
                    </div>
                    <span className="text-sm font-medium text-gray-800 truncate max-w-xs">{doc.name}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{doc.publicationDate || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{doc.vigencyDate || 'N/A'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setSelectedDoc(doc)} className="p-1 text-gray-400 hover:text-gray-700">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => removeDocument(doc.id)} className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-lg shadow-xl flex flex-col overflow-hidden">
            <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
              <h3 className="font-bold truncate">{selectedDoc.name}</h3>
              <button onClick={() => setSelectedDoc(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-gray-100 overflow-auto">
              {selectedDoc.type === 'pdf'
                ? <PdfViewer file={selectedDoc.fileObject} />
                : <div className="p-8 text-center text-gray-500">Previsualización no disponible para este formato.</div>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NormativaPage;
