
import { Classification, DocType } from './types';
import type { MatrixRule } from './types';

export const COLORS = {
  wine: '#911A3A',
  wineLight: '#B02247',
  grey: '#E5E7EB',
  textGrey: '#4B5563',
  white: '#FFFFFF',
};

export const VALIDATION_MATRIX: MatrixRule[] = [
  {
    classification: Classification.I_1,
    description: 'I.1. Proveedor, contratista, prestador de servicios (Beneficiarios Directos)',
    required: [DocType.F, DocType.C, DocType.MCL],
    optional: [DocType.OTR]
  },
  {
    classification: Classification.II_1,
    description: 'II.1. Reasignación de Recursos (UPPs)',
    required: [DocType.F, DocType.AUR],
    optional: []
  },
  {
    classification: Classification.II_2,
    description: 'II.2. Pagos a través de comisiones oficiales',
    required: [DocType.F, DocType.FUC, DocType.MCL],
    optional: [DocType.PCH, DocType.TRA]
  },
  {
    classification: Classification.II_3,
    description: 'II.3. Regularización de gastos con fondo revolvente',
    required: [DocType.F, DocType.MCL, DocType.OTR],
    optional: [DocType.PCH, DocType.TRA]
  },
  {
    classification: Classification.II_4,
    description: 'II.4. Ministraciones de recursos (Subsidios)',
    required: [DocType.F, DocType.MCL],
    optional: []
  },
  {
    classification: Classification.III_1,
    description: 'III.1. Transferencias Fondos Federales/Estatales a Municipios',
    required: [DocType.MCL],
    optional: []
  },
  {
    classification: Classification.III_2,
    description: 'III.2. Asignaciones por convenios de colaboración específica',
    required: [DocType.F, DocType.C, DocType.MCL],
    optional: []
  },
  {
    classification: Classification.IV_1,
    description: 'IV.1. Deuda Pública (Amortización, intereses)',
    required: [DocType.F, DocType.MCL],
    optional: [DocType.OTR]
  },
  {
    classification: Classification.V,
    description: 'V. Adeudos de Ejercicios Fiscales Anteriores (ADEFAS)',
    required: [DocType.OTR],
    optional: []
  }
];

export const RFC_RECEIVER_REQUIRED = "GEM850101C99";
export const CP_RECEIVER_REQUIRED = "58000";

export const getUppTipo = (code: string): string => {
  const poderes = ["001", "002", "003"];
  const autonomos = ["041", "042", "075", "079", "A13"];
  const centralizadas = [
    "006", "007", "008", "009", "010", "011", "012", "014", "016", "017", "019", "020", "021",
    "022", "023", "024", "025", "080", "082", "104", "105", "106", "107", "111", "112", "114"
  ];

  if (poderes.includes(code)) return "PODER";
  if (autonomos.includes(code)) return "AUTÓNOMA";
  if (centralizadas.includes(code)) return "CENTRALIZADA";
  return "PARAESTATAL";
};

export const VALID_UPPS: Record<string, string> = {
  "001": "Congreso del Estado de Michoacán de Ocampo",
  "002": "Poder Judicial del Estado de Michoacán",
  "003": "Ejecutivo del Estado",
  "006": "Secretaría de Gobierno",
  "007": "Secretaría de Finanzas y Administración",
  "008": "Secretaría de Comunicaciones y Obras Públicas",
  "009": "Secretaría de Agricultura y Desarrollo Rural",
  "010": "Secretaría de Desarrollo Económico",
  "011": "Secretaría de Turismo",
  "012": "Secretaría de Educación",
  "014": "Secretaría del Migrante",
  "016": "Secretaría de Seguridad Pública",
  "017": "Servicios de Salud de Michoacán",
  "019": "Secretaría de Contraloría",
  "020": "Secretaría del Bienestar",
  "021": "Secretaría de Cultura",
  "022": "Inversión Municipal",
  "023": "Participaciones y Aportaciones a Municipios",
  "024": "Erogaciones Adicionales y Provisiones",
  "025": "Deuda Pública y Obligaciones Financieras",
  "031": "Casa de las Artesanías de Michoacán de Ocampo",
  "032": "Secretariado Ejecutivo del Sistema Estatal de Seguridad Pública",
  "033": "Comisión Estatal de Cultura Física y Deporte",
  "035": "Sistema Michoacano de Radio y Televisión",
  "036": "Centro de Convenciones de Morelia",
  "037": "Parque Zoológico Benito Juárez",
  "038": "Universidad Michoacana de San Nicolás de Hidalgo",
  "040": "Sistema para el Desarrollo Integral de la Familia, Michoacana",
  "041": "Instituto Electoral de Michoacán",
  "042": "Tribunal Electoral del Estado",
  "044": "Tribunal en Materia Anticorrupción y Administrativa del Estado de Michoacán de Ocampo",
  "045": "Universidad Virtual del Estado de Michoacán",
  "046": "Procuraduría de Protección al Ambiente del Estado de Michoacán de Ocampo",
  "047": "Telebachillerato Michoacán",
  "048": "Instituto de Vivienda del Estado de Michoacán de Ocampo",
  "049": "Comisión Forestal del Estado",
  "050": "Comisión de Pesca del Estado de Michoacán",
  "051": "Colegio de Bachilleres del Estado de Michoacán",
  "052": "Colegio de Educación Profesional Técnica del Estado de Michoacán",
  "053": "Universidad Tecnológica de Morelia",
  "054": "Colegio de Estudios Científicos y Tecnológicos del Estado de Michoacán",
  "055": "Instituto de Capacitación para el Trabajo del Estado de Michoacán",
  "060": "Universidad de la Ciénega del Estado de Michoacán de Ocampo",
  "063": "Centro Estatal de Certificación, Acreditación y Control de Confianza",
  "068": "Universidad Intercultural Indígena de Michoacán",
  "069": "Tribunal de Conciliación y Arbitraje",
  "070": "Comisión Estatal de Arbitraje Médico de Michoacán",
  "071": "Junta Local de Conciliación y Arbitraje",
  "074": "Junta de Asistencia Privada del Estado de Michoacán de Ocampo",
  "075": "Comisión Estatal de Derechos Humanos",
  "078": "Comisión Estatal para el Desarrollo de Pueblos Indígenas",
  "079": "Instituto Michoacano de Transparencia, Acceso a la Información y Protección de Datos Personales",
  "080": "Coordinación de Planeación para el Desarrollo del Estado de Michoacán de Ocampo",
  "081": "Comisión Estatal del Agua y Gestión de Cuencas",
  "082": "Comité de Adquisiciones del Poder Ejecutivo",
  "083": "Universidad Politécnica de Uruapan, Michoacán",
  "084": "Universidad Politécnica de Lázaro Cárdenas, Michoacán",
  "085": "Instituto de Defensoría Pública del Estado de Michoacán",
  "087": "Instituto Estatal de Estudios Superiores en Seguridad y Profesionalización Policial del Estado de Michoacán",
  "088": "Comisión Ejecutiva Estatal de Atención a Víctimas",
  "089": "Centro Estatal de Fomento Ganadero del Estado de Michoacán de Ocampo",
  "093": "Sistema Integral de Financiamiento para el Desarrollo de Michoacán",
  "094": "Instituto de la Juventud Michoacana",
  "095": "Secretaría de Igualdad Sustantiva y Desarrollo de las Mujeres Michoacanas",
  "096": "Instituto de Ciencia, Tecnología e Innovación del Estado de Michoacán de Ocampo",
  "098": "Secretaría Ejecutiva del Sistema Estatal de Protección Integral de Niñas, Niños y Adolescentes del Estado de Michoacán",
  "099": "Consejo Estatal para Prevenir y Eliminar la Discriminación y la Violencia",
  "100": "Coordinación del Sistema Penitenciario del Estado de Michoacán de Ocampo",
  "101": "Universidad Tecnológica del Oriente de Michoacán",
  "102": "Secretaría Ejecutiva del Sistema Estatal Anticorrupción",
  "103": "Casa del Adulto Mayor",
  "104": "Instituto Registral y Catastral del Estado de Michoacán de Ocampo",
  "105": "Secretaría de Desarrollo Urbano y Movilidad",
  "106": "Secretaría de Medio Ambiente",
  "107": "Centro Estatal para el Desarrollo Municipal",
  "108": "Instituto de Educación Media Superior y Superior del Estado de Michoacán",
  "109": "Centro de Conciliación Laboral del Estado de Michoacán de Ocampo",
  "110": "Consejo Económico y Social del Estado de Michoacán",
  "111": "Servicio de Administración Tributaria del Estado de Michoacán de Ocampo",
  "112": "Instituto del Transporte del Estado de Michoacán de Ocampo",
  "114": "Coordinación de Comunicación",
  "115": "Cuarta República. Editorial de Michoacán",
  "A13": "Fiscalía General del Estado de Michoacán"
};
