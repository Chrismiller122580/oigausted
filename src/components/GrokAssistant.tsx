"use client"
import { useState } from "react"
import { Bot, X, Send } from "lucide-react"

export default function GrokAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: "assistant", content: "¡Hola! Soy Grok, tu asistente para gestionar tu negocio. ¿En qué te puedo ayudar hoy con tu perfil o gigs?" }
  ])
  const [input, setInput] = useState("")

  const sendMessage = () => {
    if (!input.trim()) return

    setMessages(prev => [...prev, { role: "user", content: input }])
    
    setTimeout(() => {
      const responses = [
        "Te recomiendo agregar una descripción clara y atractiva con palabras como 'profesional', 'rápido' y 'garantizado'.",
        "Una buena foto del negocio o de tus trabajos anteriores aumenta mucho la confianza de los clientes.",
        "¿Quieres que te ayude a mejorar el texto de tu perfil o a preparar un nuevo gig?",
        "Recuerda mantener tu teléfono y ubicación actualizados para que los clientes puedan contactarte fácilmente."
      ]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      setMessages(prev => [...prev, { role: "assistant", content: randomResponse }])
    }, 700)

    setInput("")
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50"
      >
        <Bot size={28} />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden z-50 flex flex-col" style={{ height: "480px" }}>
          <div className="bg-yellow-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">🤖</div>
              <div>
                <p className="font-medium">Grok AI Assistant</p>
                <p className="text-xs opacity-80">Ayuda con tu negocio</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-yellow-600 text-white" : "bg-white border"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Escribe tu pregunta..."
                className="flex-1 border border-gray-300 rounded-2xl px-5 py-3 focus:outline-none focus:border-yellow-600"
              />
              <button 
                onClick={sendMessage}
                className="bg-yellow-600 text-white p-3 rounded-2xl hover:bg-yellow-700"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
