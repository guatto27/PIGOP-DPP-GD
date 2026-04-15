
import { GoogleGenAI, Type } from "@google/genai";
import type { Chat } from "@google/genai";
import type { DocumentAnalysisResult, DeppMetadata, ValidationReport } from "../types";

let chatSession: Chat | null = null;
let aiClient: GoogleGenAI | null = null;

const GEMINI_MODEL = 'gemini-2.0-flash';

const getApiKey = (): string => import.meta.env.VITE_GEMINI_API_KEY || '';

const SYSTEM_INSTRUCTION = `
Eres un Revisor Institucional de Coherencia Documental de la Secretaría de Finanzas y Administración de Michoacán (SFA). Tu rigor técnico debe ser absoluto.

**REGLA DE ORO DE CLASIFICACIÓN (MANDATORIA):**
- **DEPP:** ÚNICAMENTE la solicitud de pago principal (Documento de Ejecución Presupuestaria y Pago).
- **OTR (Otros):** Documentos de soporte como Sentencias, Estados de Cuenta, Certificados de Avance de Obra (CAO), Pasajes Locales (DCPL), etc.
- **ADVERTENCIA CRÍTICA:** Bajo ninguna circunstancia clasifiques un Estado de Cuenta o Sentencia como DEPP. Esto invalida el dictamen.

**REGLAS DE EXTRACCIÓN DE METADATA (ESTRICTO - SOLO DEL ARCHIVO DEPP):**

1. **Estatus de Pago (EXTRACCIÓN QUIRÚRGICA):**
   - Localiza en la ESQUINA SUPERIOR DERECHA del documento DEPP la leyenda.
   - Si la leyenda es "PAGO", el valor es "PAGO".
   - Si la leyenda indica algo distinto o no genera flujo de efectivo, "NO GENERA PAGO".

2. **Solicitud Número:** Los 13 dígitos exactos que aparecen en el recuadro "SOLICITUD NUMERO".

3. **Unidad Responsable (UR / UE):** EXTRAE EXCLUSIVAMENTE el texto que sigue a la etiqueta "UE:".

4. **Clave Presupuestaria (Cargo):** Cadena numérica completa de la estructura programática. Exacta dígito por dígito.

5. **Partida (Clave + Nombre):** Clave de 5 dígitos concatenada con el texto del campo "Concepto". Ej: "37501 VIATICOS NACIONALES".

6. **Importe del Cargo, Deducciones y Líquido:** Solo cifras numéricas limpias.

7. **Beneficiario:** Nombre completo.

**DICTAMEN TÉCNICO:**
Analiza cada documento y fundamenta legalmente según el Manual de Lineamientos para el Ejercicio del Gasto del Estado de Michoacán.
`;

export const initializeChat = async (contextReport?: ValidationReport) => {
  const apiKey = getApiKey();
  if (!apiKey) return;
  aiClient = new GoogleGenAI({ apiKey });

  let instruction = SYSTEM_INSTRUCTION;

  if (contextReport) {
    instruction = `Eres el Asistente Técnico de la SFA Michoacán.
    Tu objetivo es responder dudas ÚNICAMENTE sobre el dictamen de validación que se acaba de generar.

    DATOS DEL EXPEDIENTE ACTUAL:
    - Folio: ${contextReport.fullExpedienteId}
    - UPP: ${contextReport.upp} (${contextReport.metadata?.uppTipo})
    - DEPP: ${contextReport.metadata?.solicitudNumero} - ${contextReport.metadata?.tipoPago}
    - Beneficiario: ${contextReport.metadata?.beneficiario}
    - Importe Líquido: ${contextReport.metadata?.montoLiquido}

    RESULTADOS DEL ANÁLISIS:
    ${contextReport.results.map(r => `- ${r.docType} (${r.fileName}): Estatus ${r.status}. Observación: ${r.observation}. Fundamento: ${r.legalBasis}`).join('\n')}

    REGLA ESTRICTA: Solo puedes hablar de este expediente y su normativa asociada.`;
  }

  chatSession = aiClient.chats.create({
    model: GEMINI_MODEL,
    config: { systemInstruction: instruction },
  });
};

export const sendMessageToGemini = async (message: string, contextReport?: ValidationReport): Promise<string> => {
  if (contextReport || !chatSession) {
    await initializeChat(contextReport);
  }

  if (!chatSession) return "Error: API Key de Gemini no configurada. Contacte al administrador.";
  try {
    const response = await chatSession.sendMessage({ message });
    return response.text || "Sin respuesta.";
  } catch (error) {
    return "Error al consultar la normativa.";
  }
};

export interface DocAnalysisInput {
  fileName: string;
  type: string;
  content: string;
  images?: string[];
  isPrimary?: boolean;
}

interface AIResponse {
  metadata: DeppMetadata;
  documents: DocumentAnalysisResult[];
}

const DEFAULT_METADATA: DeppMetadata = {
  beneficiario: '-',
  notas: '-',
  ur: '-',
  periodo: '-',
  partida: '-',
  fondo: '-',
  cargo: '-',
  importeCargo: '0.00',
  deducciones: '0.00',
  montoLiquido: '0.00',
  solicitudNumero: '-',
  tipoPago: 'No detectado',
  uppTipo: 'Desconocido'
};

export const analyzeDocumentsContent = async (
  uppCode: string,
  year: string,
  documents: DocAnalysisInput[]
): Promise<AIResponse> => {
  const apiKey = getApiKey();
  if (!apiKey) return { metadata: DEFAULT_METADATA, documents: [] };

  const ai = new GoogleGenAI({ apiKey });

  const parts: any[] = [];
  parts.push({ text: `ANÁLISIS DE EXTREMA PRECISIÓN - EXPEDIENTE UPP ${uppCode} AÑO ${year}.
    - ESTATUS DE PAGO: Extraer estrictamente de la esquina superior derecha del DEPP (PAGO / NO GENERA PAGO).
    - SOLICITUD: 13 dígitos exactos del recuadro de Solicitud.` });

  for (const doc of documents) {
    const label = doc.isPrimary ? "--- FUENTE PRIMARIA (DEPP): " : "--- SOPORTE: ";
    parts.push({ text: `\n${label}${doc.fileName} | TIPO: ${doc.type} ---\n` });
    if (doc.images?.length) {
      doc.images.forEach(img => parts.push({ inlineData: { mimeType: "image/jpeg", data: img } }));
    } else {
      parts.push({ text: doc.content });
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            metadata: {
              type: Type.OBJECT,
              properties: {
                beneficiario: { type: Type.STRING },
                notas: { type: Type.STRING },
                ur: { type: Type.STRING },
                periodo: { type: Type.STRING },
                partida: { type: Type.STRING },
                fondo: { type: Type.STRING },
                cargo: { type: Type.STRING },
                importeCargo: { type: Type.STRING },
                deducciones: { type: Type.STRING },
                montoLiquido: { type: Type.STRING },
                solicitudNumero: { type: Type.STRING },
                tipoPago: { type: Type.STRING }
              }
            },
            documents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  docType: { type: Type.STRING },
                  fileName: { type: Type.STRING },
                  analysisSummary: { type: Type.STRING },
                  observation: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["CORRECTO", "INCORRECTO", "INCOMPLETO"] },
                  legalBasis: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    return response.text ? JSON.parse(response.text) : { metadata: DEFAULT_METADATA, documents: [] };
  } catch (e) {
    return { metadata: DEFAULT_METADATA, documents: [] };
  }
};

export const analyzeNormativaDocument = async (
  fileName: string,
  text: string,
  images: string[]
): Promise<{ title?: string; publicationDate?: string; vigencyDate?: string }> => {
  const apiKey = getApiKey();
  if (!apiKey) return {};

  const ai = new GoogleGenAI({ apiKey });
  const parts: any[] = [{ text: `Analiza el documento normativo: ${fileName}` }];
  if (images.length > 0) {
    images.forEach(img => parts.push({ inlineData: { mimeType: "image/jpeg", data: img } }));
  } else {
    parts.push({ text: text.substring(0, 30000) });
  }
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            publicationDate: { type: Type.STRING },
            vigencyDate: { type: Type.STRING }
          }
        }
      }
    });
    return response.text ? JSON.parse(response.text) : {};
  } catch (e) {
    return {};
  }
};
