
import React, { useMemo, useState } from 'react';
import type { ValidationReport, AnalysisStatus } from '../types';
import { COLORS, VALIDATION_MATRIX } from '../constants';
import {
  CheckCircle, XCircle, AlertCircle, HelpCircle, RefreshCw,
  FileText, ChevronLeft, ChevronRight, FileSearch, Gavel, ClipboardList, Info, X
} from 'lucide-react';

interface AnalysisReportProps {
  report: ValidationReport;
  onReset: () => void;
}

const ITEMS_PER_PAGE = 5;

const STATUS_BUCKETS = [
  { id: 'DEPP', label: 'DEPP', match: 'DEPP' },
  { id: 'CFDI', label: 'CFDI', match: 'CFDI' },
  { id: 'MCL', label: 'MCL', match: 'MCL' },
  { id: 'AUR', label: 'AUR', match: 'AUR' },
  { id: 'CTT', label: 'CTT', match: 'CTT' },
  { id: 'PCH', label: 'PCH', match: 'PCH' },
  { id: 'FUC', label: 'FUC', match: 'FUC' },
  { id: 'OTR', label: 'OTR', match: 'OTR' },
];

const AnalysisReport: React.FC<AnalysisReportProps> = ({ report, onReset }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const currentRule = useMemo(() => {
    return VALIDATION_MATRIX.find(r => r.classification === report.classification);
  }, [report.classification]);

  const formatCurrency = (val: string | undefined): string => {
    if (!val || val === '-' || val.trim() === '') return '0.00';
    try {
      const cleanValue = val.replace(/[^0-9.-]+/g, "");
      const numberValue = parseFloat(cleanValue);
      if (isNaN(numberValue)) return val;
      return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numberValue);
    } catch (_e) { return val; }
  };

  const filteredResults = useMemo(() => {
    if (!activeFilter) return [];
    const bucket = STATUS_BUCKETS.find(b => b.id === activeFilter);
    if (!bucket) return [];
    return (report.results || []).filter(r =>
      r.docType.toUpperCase().trim().startsWith(bucket.match.toUpperCase().trim())
    );
  }, [report.results, activeFilter]);

  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredResults.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredResults, currentPage]);

  const getStatusIcon = (status: AnalysisStatus | 'NO_APLICA' | 'PENDIENTE') => {
    const baseClass = "w-8 h-8 rounded-full flex items-center justify-center border shadow-sm transition-all";
    switch (status) {
      case 'CORRECTO': return <div className={`${baseClass} bg-green-100 border-green-300`}><CheckCircle size={18} className="text-green-600" /></div>;
      case 'INCORRECTO': return <div className={`${baseClass} bg-red-100 border-red-300`}><XCircle size={18} className="text-red-600" /></div>;
      case 'INCOMPLETO': return <div className={`${baseClass} bg-amber-100 border-amber-300`}><HelpCircle size={18} className="text-amber-500" /></div>;
      default: return <div className={`${baseClass} bg-gray-50 border-gray-100 opacity-30`}><div className="w-1.5 h-1.5 rounded-full bg-gray-300" /></div>;
    }
  };

  const handleFilterClick = (bucketId: string) => {
    if (activeFilter === bucketId) {
      setActiveFilter(null);
    } else {
      setActiveFilter(bucketId);
      setCurrentPage(1);
      setTimeout(() => {
        document.getElementById('breakdown-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="max-w-full mx-auto space-y-6 pb-32">
      {/* HEADER DE DICTAMEN */}
      <div className={`w-full py-4 px-6 rounded-xl border-b-2 flex items-center justify-between shadow-lg ${report.isValid ? 'bg-green-600 border-green-800' : 'bg-red-700 border-red-900'} text-white`}>
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/20 rounded-xl">
            {report.isValid ? <CheckCircle size={28} /> : <AlertCircle size={28} />}
          </div>
          <div>
            <h2 className="text-xl font-black uppercase leading-none tracking-tight">Dictamen de Validación</h2>
            <p className="text-[8px] uppercase font-bold tracking-[0.3em] opacity-80 mt-1">SFA Michoacán - DPP · Validación de Gasto Público</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-[9px] opacity-70 uppercase font-black block mb-0.5">Folio de Expediente y Estatus</span>
          <span className="text-lg font-mono font-bold bg-black/20 px-3 py-1 rounded-lg border border-white/10 tracking-tighter">
            {report.fullExpedienteId} - <span className="text-yellow-400 font-black uppercase">{report.metadata?.tipoPago || 'PENDIENTE'}</span>
          </span>
        </div>
      </div>

      {/* RESUMEN DE METADATA */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
          <Info size={18} className="text-gray-400" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Resumen de Datos Extraídos (Fuente: DEPP)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y divide-gray-100">
          <div className="p-4 bg-gray-50/20">
            <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">DEPP (Solicitud)</label>
            <span className="text-[10px] font-mono font-black text-gray-800 tracking-tighter uppercase leading-tight">
              {report.metadata?.solicitudNumero || 'N/A'} - <span className="font-black" style={{ color: COLORS.wine }}>{report.metadata?.tipoPago || 'SIN ESTATUS'}</span>
            </span>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">UPP</label>
              <span className="text-[10px] text-gray-600 font-black block leading-snug break-words uppercase whitespace-normal">{report.upp}</span>
              {report.metadata?.uppTipo && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 mt-1 inline-block">
                  {report.metadata.uppTipo}
                </span>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">UR (Unidad Responsable)</label>
              <span className="text-[9px] text-gray-700 font-black block leading-tight uppercase break-words">{report.metadata?.ur || 'N/A'}</span>
            </div>
          </div>

          <div className="p-4 lg:col-span-1 flex flex-col">
            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Beneficiario</label>
            <span className="text-[10px] font-black text-gray-900 uppercase leading-snug break-words whitespace-normal">{report.metadata?.beneficiario || 'No identificado'}</span>
            <div className="mt-3 pt-2 border-t border-gray-100">
              <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Clave Presupuestaria (Cargo)</label>
              <span className="text-[9px] font-mono font-bold text-gray-500 break-all leading-tight">{report.metadata?.cargo || 'N/A'}</span>
            </div>
          </div>

          <div className="p-4">
            <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Fondo / Financiamiento</label>
            <span className="text-[9px] font-bold text-gray-800 block mb-2 break-words uppercase">{report.metadata?.fondo || 'N/A'}</span>
            <div className="pt-2 border-t border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Partida (Clave + Nombre)</label>
              <span className="text-[10px] font-black block leading-tight uppercase whitespace-normal" style={{ color: COLORS.wine }}>{report.metadata?.partida || 'N/A'}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Periodo Presupuestal</label>
              <span className="text-[10px] font-black text-gray-800 uppercase block leading-tight">{report.metadata?.periodo || 'N/A'}</span>
            </div>
          </div>

          <div className="p-4 lg:col-span-1">
            <label className="text-[10px] font-black text-gray-400 uppercase block mb-1.5">Notas y/o aclaraciones</label>
            <div className="bg-gray-50 p-3 rounded-lg text-[10px] font-bold text-gray-600 border border-gray-100 leading-snug min-h-[60px] break-words">
              {report.metadata?.notas || 'Sin notas adicionales registradas'}
            </div>
          </div>

          <div className="p-4" style={{ backgroundColor: COLORS.wine + '0D' }}>
            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Cálculo de Finanzas</label>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] text-gray-500">
                <span>Importe del Cargo:</span>
                <span className="font-bold text-gray-700">${formatCurrency(report.metadata?.importeCargo)}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-500">
                <span>Deducciones:</span>
                <span className="font-bold text-gray-700">${formatCurrency(report.metadata?.deducciones)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                <span className="text-gray-900 font-black text-[10px] uppercase">Líquido:</span>
                <span className="text-gray-900 font-black text-[13px] tracking-tighter">
                  ${formatCurrency(report.metadata?.montoLiquido)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-col justify-center text-center">
            <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Clasificación</label>
            <span className="text-[11px] font-black leading-tight" style={{ color: COLORS.wine }}>{report.classification}</span>
            <p className="text-[8px] text-gray-400 font-bold uppercase mt-1 leading-tight line-clamp-2">
              {currentRule?.description.split('.').slice(1).join('.').trim()}
            </p>
          </div>
        </div>
      </div>

      {/* CÍRCULOS DE ESTATUS */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-gray-400" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Estatus de comprobación (Auditoría Técnica)</span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-600" /><span className="text-[8px] font-black text-gray-400 uppercase">CORRECTO</span></div>
            <div className="flex items-center gap-1.5"><XCircle size={14} className="text-red-600" /><span className="text-[8px] font-black text-gray-400 uppercase">INCORRECTO</span></div>
          </div>
        </div>
        <div className="flex divide-x divide-gray-100 overflow-x-auto">
          {STATUS_BUCKETS.map((bucket) => {
            const resultsForType = (report.results || []).filter(r =>
              r.docType.toUpperCase().trim().startsWith(bucket.match.toUpperCase().trim())
            );

            let status: AnalysisStatus | 'NO_APLICA' | 'PENDIENTE' = 'NO_APLICA';
            if (resultsForType.length > 0) {
              if (resultsForType.some(r => r.status === 'INCORRECTO')) status = 'INCORRECTO';
              else if (resultsForType.some(r => r.status === 'INCOMPLETO')) status = 'INCOMPLETO';
              else status = 'CORRECTO';
            }

            const isSelected = activeFilter === bucket.id;

            return (
              <button
                key={bucket.id}
                onClick={() => handleFilterClick(bucket.id)}
                className={`flex-1 min-w-[125px] p-4 text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${isSelected ? 'ring-1 ring-inset' : 'hover:bg-gray-50'}`}
                style={isSelected ? { backgroundColor: COLORS.wine + '0D', outlineColor: COLORS.wine + '33' } : {}}
              >
                <span className={`text-[9px] font-black uppercase tracking-widest`}
                  style={{ color: isSelected ? COLORS.wine : '#9CA3AF' }}>
                  {bucket.label}
                </span>
                {getStatusIcon(status)}
                <span className={`text-[8px] font-black uppercase tracking-tight px-2 py-0.5 rounded-full ${status === 'CORRECTO' ? 'bg-green-100 text-green-700' :
                  status === 'INCORRECTO' ? 'bg-red-100 text-red-700' :
                    status === 'INCOMPLETO' ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-300'}`}>
                  {status === 'INCOMPLETO' ? 'INCONGRUENTE' : status === 'NO_APLICA' ? 'N/A' : status}
                </span>
                {isSelected && <div className="mt-1 w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: COLORS.wine }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* DESGLOSE TÉCNICO */}
      {activeFilter && (
        <div id="breakdown-section" className="bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gray-800 px-8 py-5 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <FileSearch size={22} className="text-yellow-500" />
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Desglose Técnico y Normativo</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Análisis de: <span className="text-yellow-500">{STATUS_BUCKETS.find(b => b.id === activeFilter)?.label}</span></p>
              </div>
            </div>
            <button onClick={() => setActiveFilter(null)} className="p-2 hover:bg-white/10 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="hidden lg:grid grid-cols-12 bg-gray-50 border-b border-gray-200 px-8 py-4">
            <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">1. Tipo Documento</div>
            <div className="col-span-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">2. Revisión de Datos</div>
            <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">3. Motivo de Devolución</div>
            <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">4. Fundamento Legal</div>
          </div>

          <div className="divide-y divide-gray-100">
            {paginatedResults.length > 0 ? paginatedResults.map((res, i) => (
              <div key={i} className="grid grid-cols-1 lg:grid-cols-12 items-stretch hover:bg-gray-50/70 transition-colors">
                <div className="col-span-2 p-7 flex flex-col justify-center border-r border-gray-100 bg-gray-50/10">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText size={20} className="text-gray-400" />
                    <span className="text-[11px] font-black text-gray-800 uppercase leading-snug">{res.docType}</span>
                  </div>
                  <p className="text-[9px] font-mono text-gray-400 truncate mb-3" title={res.fileName}>{res.fileName}</p>
                  <div className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border w-fit shadow-sm ${res.status === 'CORRECTO' ? 'bg-green-100 text-green-700 border-green-200' :
                    res.status === 'INCORRECTO' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                    {res.status === 'INCOMPLETO' ? 'INCONGRUENTE' : res.status}
                  </div>
                </div>
                <div className="col-span-4 p-7 border-r border-gray-100 space-y-2">
                  {(res.analysisSummary || "Análisis no disponible").split('\n').map((line, idx) => (
                    <p key={idx} className="text-[12px] text-gray-700 leading-relaxed font-medium">
                      {line.includes(':') ? (
                        <><span className="text-[10px] font-black text-gray-400 uppercase mr-2">{line.split(':')[0]}:</span>
                          <span className="font-bold text-gray-900">{line.split(':').slice(1).join(':')}</span></>
                      ) : line}
                    </p>
                  ))}
                </div>
                <div className="col-span-3 p-7 border-r border-gray-100">
                  <div className="flex gap-3">
                    {res.status !== 'CORRECTO' ? (
                      <>
                        <AlertCircle size={18} className="text-red-500 shrink-0" />
                        <div className="space-y-1">
                          <p className="text-[11px] font-black text-red-800 uppercase">Motivo:</p>
                          <p className="text-[12px] font-medium text-red-900">{res.observation}</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={16} />
                        <p className="text-[12px] font-medium">Documentación validada.</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-3 p-7 bg-gray-50/40">
                  <div className="flex gap-3">
                    <Gavel size={18} className="text-gray-400 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-500 uppercase">Fundamento Legal:</p>
                      <p className="text-[11px] font-bold text-gray-600 italic">{res.legalBasis}</p>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-20 text-center bg-gray-50 flex flex-col items-center justify-center">
                <XCircle size={48} className="text-gray-200 mb-4" />
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                  No se detectaron archivos de tipo {activeFilter} en este expediente.
                </p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-500 font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* BOTÓN FLOTANTE */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center pointer-events-none z-30">
        <button
          onClick={onReset}
          className="pointer-events-auto flex items-center gap-4 px-12 py-5 text-white rounded-full shadow-2xl hover:scale-105 transition-all font-black uppercase ring-4 ring-white"
          style={{ backgroundColor: COLORS.wine }}
        >
          <RefreshCw size={26} /> Nueva Auditoría
        </button>
      </div>
    </div>
  );
};

export default AnalysisReport;
