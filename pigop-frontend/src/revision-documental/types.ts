export const DocType = {
  DEPP: 'DEPP',
  F: 'F',
  C: 'C',
  PCH: 'PCH',
  TRA: 'TRA',
  AUR: 'AUR',
  FUC: 'FUC',
  MCL: 'MCL',
  OTR: 'OTR',
  UNKNOWN: 'UNKNOWN',
} as const;
export type DocType = typeof DocType[keyof typeof DocType];

export const Classification = {
  I_1: 'I.1',
  II_1: 'II.1',
  II_2: 'II.2',
  II_3: 'II.3',
  II_4: 'II.4',
  III_1: 'III.1',
  III_2: 'III.2',
  IV_1: 'IV.1',
  V: 'V',
  UNKNOWN: 'Desconocida',
} as const;
export type Classification = typeof Classification[keyof typeof Classification];

export interface FileEntry {
  name: string;
  type: DocType;
  content?: string | ArrayBuffer;
}

export type AnalysisStatus = 'CORRECTO' | 'INCORRECTO' | 'INCOMPLETO';

export interface DocumentAnalysisResult {
  docType: string;
  fileName: string;
  analysisSummary: string;
  observation: string;
  status: AnalysisStatus;
  legalBasis?: string;
  legibility?: 'ALTA' | 'MEDIA' | 'BAJA';
  recommendation?: string;
}

export interface DeppMetadata {
  beneficiario: string;
  notas: string;
  periodo: string;
  partida: string;
  fondo: string;
  cargo: string;
  importeCargo: string;
  deducciones: string;
  montoLiquido: string;
  ur: string;
  solicitudNumero: string;
  tipoPago?: string;
  uppTipo?: string;
}

export interface ValidationReport {
  deppNumber: string;
  year: string;
  fullExpedienteId: string;
  upp: string;
  classification: Classification;
  results: DocumentAnalysisResult[];
  metadata?: DeppMetadata;
  filesFound: string[];
  isValid: boolean;
}

export interface MatrixRule {
  classification: Classification;
  description: string;
  required: DocType[];
  optional: DocType[];
}

export interface NormativaDocument {
  id: string;
  name: string;
  type: 'pdf' | 'word' | 'image' | 'unknown';
  size: number;
  uploadDate: Date;
  publicationDate: string;
  vigencyDate: string;
  fileObject: File;
  thumbnail?: string;
}
