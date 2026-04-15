
import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini } from '../services/geminiService';
import { COLORS } from '../constants';
import { MessageSquare, Send, X, ShieldAlert } from 'lucide-react';
import type { ValidationReport } from '../types';

interface GeminiAssistantProps {
  report: ValidationReport | null;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ report }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (report) {
      setMessages([{
        role: 'model',
        text: `Hola. He analizado el expediente ${report.fullExpedienteId}. ¿Tienes alguna duda técnica sobre las observaciones encontradas o los requisitos de este expediente?`
      }]);
    } else {
      setMessages([{
        role: 'model',
        text: 'Hola. Soy tu Asistente Normativo de la SFA. Por favor, carga un expediente para asistirte con el análisis.'
      }]);
    }
  }, [report]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    const response = await sendMessageToGemini(userMsg, report || undefined);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 text-white flex justify-between items-center shadow-lg" style={{ backgroundColor: COLORS.wine }}>
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-yellow-400" />
              <div className="flex flex-col">
                <span className="font-black text-[11px] uppercase tracking-widest">Asistente Técnico</span>
                <span className="text-[9px] font-bold opacity-70 uppercase">Solo Información del Expediente</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1.5 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-[12px] shadow-sm ${
                  m.role === 'user'
                    ? 'bg-gray-800 text-white rounded-tr-none'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none font-medium'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2.5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t bg-white flex gap-2">
            <input
              type="text"
              className="flex-1 text-[13px] border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 transition-all font-medium"
              style={{ '--tw-ring-color': COLORS.wine + '33' } as React.CSSProperties}
              placeholder={report ? "Pregunta sobre el dictamen..." : "Carga un expediente primero..."}
              value={input}
              disabled={!report || loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={loading || !report || !input.trim()}
              className="p-2.5 rounded-full text-white disabled:opacity-30 disabled:grayscale transition-all shadow-md active:scale-95"
              style={{ backgroundColor: COLORS.wine }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full text-white shadow-2xl transition-all hover:scale-110 active:scale-90 flex items-center gap-2 group ${report ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: COLORS.wine }}
      >
        <MessageSquare size={26} />
        {report && !isOpen && (
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap text-[10px] font-black uppercase tracking-widest mr-1">
            Consultar Dictamen
          </span>
        )}
      </button>
    </div>
  );
};

export default GeminiAssistant;
