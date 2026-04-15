import { useState } from 'react'
import { ScanSearch, BookOpen } from 'lucide-react'
import FileUploader from '../revision-documental/components/FileUploader'
import AnalysisReport from '../revision-documental/components/AnalysisReport'
import GeminiAssistant from '../revision-documental/components/GeminiAssistant'
import NormativaPage from '../revision-documental/components/NormativaPage'
import { processExpediente } from '../revision-documental/services/validationService'
import type { ValidationReport, NormativaDocument } from '../revision-documental/types'
import { COLORS } from '../revision-documental/constants'

const GUINDA = '#911A3A'

export default function RevisionDocumental() {
  const [currentView, setCurrentView] = useState<'revision' | 'normativa'>('revision')
  const [report, setReport] = useState<ValidationReport | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [normativaDocuments, setNormativaDocuments] = useState<NormativaDocument[]>([])

  const handleFileSelected = async (files: File[]) => {
    setIsProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const result = await processExpediente(files)
      setReport(result)
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setReport(null)
  }

  return (
    <div className="min-h-full flex flex-col font-sans">
      {/* Sub-navegación del módulo */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 flex gap-1 py-2">
          <button
            onClick={() => setCurrentView('revision')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              currentView === 'revision'
                ? 'text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={currentView === 'revision' ? { backgroundColor: GUINDA } : {}}
          >
            <ScanSearch size={16} />
            Revisión Documental
          </button>
          <button
            onClick={() => setCurrentView('normativa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              currentView === 'normativa'
                ? 'text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={currentView === 'normativa' ? { backgroundColor: GUINDA } : {}}
          >
            <BookOpen size={16} />
            Normativa
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 container mx-auto px-4 py-8">
        {currentView === 'revision' ? (
          !report ? (
            <>
              <div className="text-center mb-10 space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Revisión Institucional de Coherencia Documental
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Herramienta automatizada para la validación de DEPPs y anexos conforme a la normativa
                  vigente del Estado de Michoacán — Validación de Gasto Público.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 max-w-4xl mx-auto mb-8">
                <h3 className="text-sm font-bold uppercase mb-4" style={{ color: COLORS.wine }}>
                  Instrucciones
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                  <li>
                    Seleccione la <strong>Carpeta</strong> que contiene el expediente digital.
                  </li>
                  <li>
                    El nombre de la carpeta debe tener el formato: <strong>AAAAUUUCCCCCCCCCC</strong>
                    <span className="text-gray-400 ml-2">(4 dígitos año + 3 código UPP + 10 dígitos DEPP)</span>
                  </li>
                  <li>Asegúrese de incluir todos los documentos requeridos según la clasificación del gasto.</li>
                  <li>El análisis utiliza Inteligencia Artificial (Google Gemini) para validar la coherencia documental.</li>
                </ul>
              </div>

              <FileUploader onFileSelected={handleFileSelected} isProcessing={isProcessing} />
            </>
          ) : (
            <AnalysisReport report={report} onReset={handleReset} />
          )
        ) : (
          <NormativaPage documents={normativaDocuments} setDocuments={setNormativaDocuments} />
        )}
      </div>

      {/* Asistente IA flotante */}
      <GeminiAssistant report={report} />
    </div>
  )
}
