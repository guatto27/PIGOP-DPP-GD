
import React, { useCallback, useRef } from 'react';
import { UploadCloud, Folder } from 'lucide-react';
import { COLORS } from '../constants';

interface FileUploaderProps {
  onFileSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelected, isProcessing }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(Array.from(e.dataTransfer.files));
    }
  }, [onFileSelected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(Array.from(e.target.files));
    }
  };

  const handleClick = () => {
    if (inputRef.current) inputRef.current.click();
  };

  return (
    <div className="max-w-2xl mx-auto my-8">
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 cursor-pointer ${isProcessing ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'}`}
        style={{ borderColor: COLORS.wine }}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={handleClick}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          // @ts-ignore
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleChange}
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center animate-pulse">
            <Folder size={64} color={COLORS.wine} />
            <p className="mt-4 text-lg font-semibold text-gray-600">Procesando Carpeta...</p>
            <p className="text-sm text-gray-400">Analizando documentos y validando normativa con IA</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <UploadCloud size={64} color={COLORS.textGrey} />
            <h3 className="mt-4 text-xl font-bold text-gray-700">Cargar Expediente Digital</h3>
            <p className="text-gray-500 mt-2 mb-6">
              Haz clic para seleccionar la <strong>Carpeta del Expediente</strong><br />
              o arrástrala aquí.
            </p>
            <button
              className="px-6 py-2 text-white rounded shadow transition-colors flex items-center gap-2"
              style={{ backgroundColor: COLORS.wine }}
            >
              <Folder size={18} />
              Seleccionar Carpeta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
