"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

export default function GrokAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "¡Hola! Soy Grok, tu asistente en OigaUsted. ¿En qué te puedo ayudar hoy? (errores, gigs, pagos, etc.)" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/grok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          context: window.location.pathname
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error al conectar con Grok. Inténtalo de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center shadow-2xl transition-all"
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 bg-white rounded-3xl shadow-2xl border flex flex-col h-[500px]">
          <div className="p-4 border-b flex justify-between items-center bg-yellow-600 text-white rounded-t-3xl">
            <div className="font-semibold">Grok AI Assistant</div>
            <button onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-yellow-600 text-white"
                      : "bg-white border"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-center text-gray-500 text-sm">Grok está pensando...</div>
            )}
          </div>

          <div className="p-4 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Pregúntame cualquier cosa..."
              className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-yellow-600"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-yellow-600 text-white p-3 rounded-full hover:bg-yellow-700 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
