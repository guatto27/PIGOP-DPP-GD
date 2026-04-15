
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertCircle } from 'lucide-react';

// @ts-ignore
const pdfjs = window.pdfjsLib;

interface PdfViewerProps {
  file: File;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ file }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        const buffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: buffer });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setPageNum(1);
        setLoading(false);
      } catch (err) {
        setError("No se pudo renderizar el documento. El archivo podría estar dañado o protegido.");
        setLoading(false);
      }
    };
    if (file) loadPdf();
  }, [file]);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
      } catch (err) {
        console.error("Error rendering page:", err);
      }
    };
    renderPage();
  }, [pdfDoc, pageNum, scale]);

  const changePage = (offset: number) => {
    setPageNum(prev => Math.min(Math.max(1, prev + offset), numPages));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p>Cargando visor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 p-8 text-center">
        <AlertCircle size={48} className="mb-4" />
        <p className="font-bold">Error de Visualización</p>
        <p className="text-sm mt-2">{error}</p>
        <a
          href={URL.createObjectURL(file)}
          download={file.name}
          className="mt-6 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
        >
          Intentar descargar archivo
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => changePage(-1)} disabled={pageNum <= 1}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors" title="Anterior">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-gray-600 min-w-[80px] text-center">
            {pageNum} / {numPages}
          </span>
          <button onClick={() => changePage(1)} disabled={pageNum >= numPages}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors" title="Siguiente">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600" title="Reducir Zoom">
            <ZoomOut size={18} />
          </button>
          <span className="text-xs font-mono text-gray-500 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600" title="Aumentar Zoom">
            <ZoomIn size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto flex justify-center p-8 bg-gray-500/10">
        <div className="shadow-lg">
          <canvas ref={canvasRef} className="bg-white block" />
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
