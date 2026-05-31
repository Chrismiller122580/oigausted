'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bot, Send, Mic, MicOff, X, Volume2, VolumeX, 
  Maximize2, MessageCircle 
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function FloatingGrokChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Grok. How can I help you with the platform today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-floating-grok-chat');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.messages?.length) setMessages(parsed.messages);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.voiceEnabled !== undefined) setVoiceEnabled(parsed.voiceEnabled);
      } catch {}
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('admin-floating-grok-chat', JSON.stringify({
      messages,
      language,
      voiceEnabled,
    }));
  }, [messages, language, voiceEnabled]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      setAvailableVoices(voices);
      if (!selectedVoice && voices.length > 0) {
        const preferred = voices.find(v => 
          v.lang.includes(language === 'es' ? 'es' : 'en') &&
          (v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Google'))
        ) || voices[0];
        setSelectedVoice(preferred.name);
      }
    };

    if ('speechSynthesis' in window) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const sendMessage = async (customPrompt?: string) => {
    const messageText = customPrompt || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: messageText,
          mode: 'admin_build',
          pageContext: 'Admin Panel (Floating Chat)',
          history: conversationHistory,
          language,
        }),
      });

      const data = await res.json();
      const reply = data.reply || data.description || 'Sorry, I had trouble responding.';

      const assistantMessage: Message = { role: 'assistant', content: reply };
      setMessages(prev => [...prev, assistantMessage]);

      // Speak if enabled
      if (voiceEnabled) {
        speak(reply);
      }
    } catch (error) {
      const errorMsg = "Sorry, there was an error connecting to Grok.";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice input
  const toggleVoiceInput = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    recognition.lang = language === 'es' ? 'es-ES' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        setInput(transcript);
        setTimeout(() => {
          sendMessage(transcript);
        }, 200);
      }
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-2xl hover:scale-105 transition-transform"
          title="Chat with Grok"
        >
          <div className="relative">
            <Bot className="h-7 w-7" />
            {isListening && (
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[380px] h-[520px] flex flex-col rounded-3xl border bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-yellow-500 to-orange-600 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <p className="font-semibold">Grok Build</p>
                <p className="text-xs text-white/80">Admin Assistant (Floating)</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link href="/admin/grok-build" className="p-1.5 hover:bg-white/20 rounded-lg" title="Open full Grok Build">
                <Maximize2 size={16} />
              </Link>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30 text-sm">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : ''}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex-shrink-0" />
                <div className="bg-card border rounded-2xl px-4 py-2 text-sm">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="p-3 border-t bg-background">
            <div className="flex items-center gap-2 mb-2">
              {/* Language */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                className="text-xs border rounded px-2 py-1 bg-background flex-1"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>

              {/* Voice Toggle */}
              <Button
                size="sm"
                variant={voiceEnabled ? "default" : "outline"}
                onClick={() => {
                  const newValue = !voiceEnabled;
                  setVoiceEnabled(newValue);
                  if (!newValue) window.speechSynthesis?.cancel();
                }}
                className="h-8 w-8 p-0"
              >
                {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </Button>

              {/* Mic */}
              <Button
                size="sm"
                variant={isListening ? "destructive" : "outline"}
                onClick={toggleVoiceInput}
                className={`h-8 w-8 p-0 ${isListening ? 'animate-pulse' : ''}`}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </Button>
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask Grok anything..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} size="sm">
                <Send size={16} />
              </Button>
            </div>

            <div className="text-[10px] text-center text-muted-foreground mt-2">
              Conversations are saved locally • <Link href="/admin/grok-build" className="underline">Open full view</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
