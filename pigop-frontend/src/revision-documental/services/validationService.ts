
import JSZip from 'jszip';
import { DocType, Classification } from '../types';
import type { ValidationReport, DocumentAnalysisResult, DeppMetadata } from '../types';
import { VALID_UPPS, getUppTipo } from '../constants';
import { extractTextFromPDF, extractTextFromXML } from './fileParsingService';
import type { ParsedDocument } from './fileParsingService';
import { analyzeDocumentsContent } from './geminiService';
import type { DocAnalysisInput } from './geminiService';

const getDocType = (filename: string): DocType => {
  const upper = filename.toUpperCase();

  if (upper.includes('SENTENCIA') ||
    upper.includes('CAO') ||
    upper.includes('AVANCE DE OBRA') ||
    upper.includes('ESTADO DE CUENTA') ||
    upper.includes('CUENTA BANCARIA') ||
    upper.includes('CG-F') ||
    upper.includes('GASTO-FINANCIAMIENTO') ||
    upper.includes('DCPL') ||
    upper.includes('PASAJES LOCALES') ||
    upper.includes('PROVISIONAL')) {
    return DocType.OTR;
  }

  if (upper.includes('CFDI') || upper.endsWith('.XML') || upper.includes('FACTURA')) return DocType.F;
  if (upper.includes('CONTRATO') || upper.includes('CONVENIO') || upper.includes('CTT')) return DocType.C;
  if (upper.includes('POLIZA') || upper.includes('CHEQUE') || upper.includes('PCH') || upper.includes('TRANSFERENCIA') || upper.includes('SPEI') || upper.includes('TRA')) return DocType.PCH;
  if (upper.includes('ACUERDO') || upper.includes('REASIGNACION') || upper.includes('AUR')) return DocType.AUR;
  if (upper.includes('COMISION') || upper.includes('FUC')) return DocType.FUC;
  if (upper.includes('MANIFIESTO') || upper.includes('MCL')) return DocType.MCL;
  if (upper.includes('DEPP')) return DocType.DEPP;

  return DocType.OTR;
};

const DOC_TYPE_ORDER_MAP: Record<string, number> = {
  'DEPP': 0,
  'CFDI': 1,
  'MCL': 2,
  'AUR': 3,
  'CTT': 4,
  'PCH': 5,
  'FUC': 6,
  'OTR': 7
};

export const getDocTypeName = (type: DocType, filename?: string): string => {
  const upper = filename?.toUpperCase() || "";
  switch (type) {
    case DocType.DEPP: return "DEPP - Documento de Ejecución Presupuestaria y Pago";
    case DocType.F: return "CFDI - Comprobante Fiscal Digital por Internet";
    case DocType.MCL: return "MCL - Manifiesto de Cumplimiento Legal";
    case DocType.AUR: return "AUR - Acuerdo Único de Reasignación";
    case DocType.C: return "CTT - Contrato o Convenio";
    case DocType.PCH: return "PCH - Póliza Cheque o Transferencia";
    case DocType.FUC: return "FUC - Formato Único de Comisión Oficial";
    case DocType.OTR:
      if (upper.includes('SENTENCIA')) return "OTR - Sentencia";
      if (upper.includes('CAO') || upper.includes('AVANCE DE OBRA')) return "OTR - Certificados de Avance de Obra (CAO)";
      if (upper.includes('ESTADO DE CUENTA')) return "OTR - Estado de Cuenta";
      if (upper.includes('CG-F') || upper.includes('GASTO-FINANCIAMIENTO')) return "OTR - Acuerdo de la Comisión Gasto-Financiamiento";
      if (upper.includes('DCPL') || upper.includes('PASAJES LOCALES')) return "OTR - Documento de comprobación de pasajes locales";
      if (upper.includes('PROVISIONAL')) return "OTR - Documento provisional de ejecución presupuestaria y pago";
      return "OTR - Documentación de soporte";
    default: return type;
  }
};

const determineClassification = (docs: DocType[], _upp: string): Classification => {
  const has = (t: DocType) => docs.includes(t);
  if (has(DocType.AUR)) return Classification.II_1;
  if (has(DocType.FUC)) return Classification.II_2;
  if ((has(DocType.PCH) || has(DocType.TRA)) && !has(DocType.FUC) && !has(DocType.C)) return Classification.II_3;
  if (has(DocType.F) && has(DocType.C) && has(DocType.MCL)) return Classification.I_1;
  if (has(DocType.F) && has(DocType.MCL) && !has(DocType.C)) return Classification.II_4;
  return Classification.UNKNOWN;
};

interface ProcessedFile {
  fileName: string;
  type: DocType;
  contentPromise: () => Promise<ArrayBuffer>;
}

export const processExpediente = async (files: File[]): Promise<ValidationReport> => {
  let filesFound: string[] = [];
  const documentsForAI: DocAnalysisInput[] = [];
  let finalResults: DocumentAnalysisResult[] = [];

  let metadata: DeppMetadata = {
    beneficiario: '', ur: '', periodo: '', partida: '', fondo: '',
    cargo: '', importeCargo: '0.00', deducciones: '0.00', montoLiquido: '0.00',
    solicitudNumero: '', notas: '', uppTipo: ''
  };

  let expedienteName = "";
  let processedFiles: ProcessedFile[] = [];

  const isZip = files.length === 1 && (files[0].name.toLowerCase().endsWith('.zip') || files[0].name.toLowerCase().endsWith('.rar'));

  try {
    if (isZip) {
      expedienteName = files[0].name;
      const zip = new JSZip();
      const contents = await zip.loadAsync(files[0]);
      for (const [relativePath, rawZipEntry] of Object.entries(contents.files)) {
        const zipEntry = rawZipEntry as any;
        if (!zipEntry.dir && !relativePath.includes('__MACOSX')) {
          const fileName = relativePath.split('/').pop() || '';
          processedFiles.push({
            fileName,
            type: getDocType(fileName),
            contentPromise: () => zipEntry.async('arraybuffer')
          });
          filesFound.push(relativePath);
        }
      }
    } else {
      const firstFile = files.find(f => f.webkitRelativePath && !f.name.startsWith('.'));
      expedienteName = firstFile?.webkitRelativePath?.split('/')[0] || "EXPEDIENTE_CARGADO";

      for (const file of files) {
        if (file.name.startsWith('.') || (file.webkitRelativePath && file.webkitRelativePath.includes('__MACOSX'))) continue;
        processedFiles.push({
          fileName: file.name,
          type: getDocType(file.name),
          contentPromise: () => file.arrayBuffer()
        });
        filesFound.push(file.webkitRelativePath || file.name);
      }
    }

    const cleanName = expedienteName.replace(/\.(zip|rar)$/i, '');
    const nameRegex = /^(\d{4})([A-Z0-9]{3})(\d{10})/;
    const match = cleanName.match(nameRegex);

    if (!match) {
      return {
        deppNumber: 'N/A', year: 'N/A', fullExpedienteId: cleanName, upp: 'N/A',
        classification: Classification.UNKNOWN,
        results: [{
          docType: 'ERROR - Formato de Carpeta', fileName: cleanName,
          analysisSummary: 'Nombre de Carpeta inválido',
          observation: 'Debe seguir el formato AAAAUUUCCCCCCCCCC',
          status: 'INCORRECTO',
          legalBasis: 'Manual de Lineamientos para el Ejercicio del Gasto del Estado de Michoacán, Art. 4'
        }],
        filesFound: [], isValid: false,
      };
    }

    const [fullId, year, upp, deppNumber] = match;
    metadata.uppTipo = getUppTipo(upp);

    for (const pFile of processedFiles) {
      try {
        const arrayBuffer = await pFile.contentPromise();
        let parsedResult: ParsedDocument = { text: "", isScanned: false };
        if (pFile.fileName.toLowerCase().endsWith('.xml')) {
          const textDecoder = new TextDecoder("utf-8");
          parsedResult = extractTextFromXML(textDecoder.decode(arrayBuffer));
        } else if (pFile.fileName.toLowerCase().endsWith('.pdf')) {
          parsedResult = await extractTextFromPDF(arrayBuffer);
        }

        const isPrimary = pFile.fileName.replace(/\.[^/.]+$/, "") === cleanName;

        if (parsedResult.text || (parsedResult.images && parsedResult.images.length > 0)) {
          documentsForAI.push({
            fileName: pFile.fileName,
            type: getDocTypeName(pFile.type, pFile.fileName),
            content: parsedResult.text,
            images: parsedResult.images,
            isPrimary
          });
        }
      } catch (_err) { /* ignorar archivos con error */ }
    }

    if (documentsForAI.length > 0) {
      const aiResponse = await analyzeDocumentsContent(upp, year, documentsForAI);
      const uppTipo = metadata.uppTipo;
      metadata = { ...aiResponse.metadata, uppTipo };
      finalResults = aiResponse.documents;
    }

    finalResults.sort((a, b) => {
      const prefixA = a.docType.split(' - ')[0].trim();
      const prefixB = b.docType.split(' - ')[0].trim();
      const orderA = DOC_TYPE_ORDER_MAP[prefixA] ?? 99;
      const orderB = DOC_TYPE_ORDER_MAP[prefixB] ?? 99;
      return orderA - orderB;
    });

    const docTypesPresent = processedFiles.map(e => e.type);
    const classification = determineClassification(docTypesPresent, upp);
    const hasErrors = finalResults.some(r => r.status === 'INCORRECTO' || r.status === 'INCOMPLETO');

    return {
      deppNumber, year, fullExpedienteId: fullId,
      upp: VALID_UPPS[upp] ? `${upp} - ${VALID_UPPS[upp]}` : upp,
      classification, results: finalResults, filesFound, metadata,
      isValid: !hasErrors
    };

  } catch (error) {
    return {
      deppNumber: 'Error', year: 'Error', fullExpedienteId: 'Error', upp: 'Error',
      classification: Classification.UNKNOWN,
      results: [{ docType: 'Error', fileName: '-', analysisSummary: 'Error de proceso', observation: 'Revisar archivos', status: 'INCORRECTO' }],
      filesFound: [], isValid: false,
    };
  }
};
