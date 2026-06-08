'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, Bot, User, Zap, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  actions?: SuggestedAction[];
  tool_call_id?: string;
}

interface SuggestedAction {
  action: string;
  [key: string]: any;
  executed?: boolean;
}

interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

const BUILD_MODES = [
  { id: 'chat', label: 'General Chat' },
  { id: 'analyze', label: 'Analyze Data' },
  { id: 'generate', label: 'Generate Content' },
  { id: 'improve', label: 'Improve Product' },
  { id: 'support', label: 'Support Tickets' },
];

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  chat: [
    "What key metrics should we be watching this week?",
    "Summarize the current state of users and sellers",
  ],
  analyze: [
    "Analyze patterns of users who register but never post gigs",
    "Identify potential churn risks among sellers",
    "Suggest user segments for a reactivation campaign",
  ],
  generate: [
    "Write an email announcing the new referral program",
    "Create 5 attractive gig title ideas for 'Graphic Design'",
    "Draft a notification for users when their order is completed",
  ],
  improve: [
    "Propose 5 improvements for the seller payout experience",
    "How can we increase buyer conversion rate?",
    "Ideas to reduce the time between user registration and first gig posting",
  ],
  support: [
    "List all open support tickets and summarize common issues",
    "Draft a professional response to a payment dispute ticket",
    "Analyze support volume and suggest process improvements",
    "Help resolve a technical ticket by suggesting code fixes",
  ],
};

export default function GrokBuildPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello. I\'m Grok Build — the most capable AI integrated into OigaUsted.\n\nI\'m specifically designed to help you build, analyze, optimize, and scale the platform. I can reason deeply about data, users, product, and operations.\n\nWhat would you like to create, analyze, or improve today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'analyze' | 'generate' | 'improve' | 'support'>('chat');
  const [customContext, setCustomContext] = useState(''); // Live context sent to Grok on every message (B)
  const [pendingAction, setPendingAction] = useState<any>(null); // For approval flow
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true); // TTS enabled by default
  const [language, setLanguage] = useState<'en' | 'es'>('en'); // Default to English
  const [selectedVoice, setSelectedVoice] = useState<string>(''); // TTS voice name
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supportContextLoaded, setSupportContextLoaded] = useState(false);

  // Load available voices for TTS
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      setAvailableVoices(voices);
      if (!selectedVoice && voices.length > 0) {
        // Prefer a good English voice
        const preferred = voices.find(v => 
          v.lang.includes('en') && (v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Daniel') || v.name.includes('Google'))
        ) || voices[0];
        setSelectedVoice(preferred.name);
      }
    };

    if ('speechSynthesis' in window) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Load support ticket context from admin/support page if present (for "Ask Grok" flow)
  useEffect(() => {
    if (activeMode === 'support' && !supportContextLoaded) {
      const ctx = sessionStorage.getItem('grokSupportContext');
      if (ctx) {
        setCustomContext(ctx);
        // Optionally auto-send a prompt
        setTimeout(() => {
          if (!isLoading) {
            sendMessage('Please analyze this support ticket and suggest the best resolution or a professional reply draft.');
          }
        }, 800);
        sessionStorage.removeItem('grokSupportContext');
        setSupportContextLoaded(true);
      }
    }
  }, [activeMode, supportContextLoaded, isLoading]);

  const sendMessage = async (customPrompt?: string) => {
    const messageText = customPrompt || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send full conversation history for real memory
      const conversationHistory = messages.map(m => ({
        role: m.role === 'tool' ? 'tool' : m.role,
        content: m.content,
        tool_call_id: m.tool_call_id
      }));

      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: messageText,
          mode: 'admin_build',
          pageContext: `Admin Panel - Mode: ${activeMode}`,
          selectedData: customContext ? { description: customContext } : null,
          history: conversationHistory,
          language: language, // Send current language preference
        }),
      });

      const data = await res.json();

      // Handle tool calls from Grok (this is what makes it truly agentic/smart)
      if (data.tool_calls && data.tool_calls.length > 0) {
        const toolCall = data.tool_calls[0];
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || '{}');

        // Add assistant message with tool call
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Grok quiere usar la herramienta: **${functionName}**`,
          tool_call_id: toolCall.id
        } as any]);

        // Execute the tool (with safety for now)
        const toolResult = await executeTool(functionName, args);

        // Send tool result back to Grok
        const toolMessage: Message = {
          role: 'tool',
          content: JSON.stringify(toolResult),
          tool_call_id: toolCall.id
        } as any;

        setMessages(prev => [...prev, toolMessage]);

        // Continue the conversation with tool result
        await sendMessageWithHistory([...messages, toolMessage as any], messageText, language);
        return;
      }

      const rawContent = data.reply || data.description || 'Lo siento, no pude generar una respuesta.';

      // Fallback for old action format
      const actionRegex = /```action\s*([\s\S]*?)\s*```/g;
      const actions: SuggestedAction[] = [];
      let cleanContent = rawContent;

      let match;
      while ((match = actionRegex.exec(rawContent)) !== null) {
        try {
          const actionObj = JSON.parse(match[1].trim());
          actions.push(actionObj);
          cleanContent = cleanContent.replace(match[0], '').trim();
        } catch (e) {}
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: cleanContent || rawContent,
        actions: actions.length > 0 ? actions : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Speak the response if voice is enabled
      speak(cleanContent || rawContent);
    } catch (error) {
      const errorMessage = 'There was an error connecting to Grok. Would you like to try again?';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: errorMessage,
        },
      ]);
      speak(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to continue after tool execution
  const sendMessageWithHistory = async (historyMessages: Message[], originalPrompt: string, currentLang = language) => {
    try {
      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: originalPrompt,
          mode: 'admin_build',
          history: historyMessages.map(m => ({
            role: m.role,
            content: m.content,
            tool_call_id: (m as any).tool_call_id
          })),
          pageContext: `Admin Panel - Mode: ${activeMode}`,
          language: currentLang,
        }),
      });

      const data = await res.json();
      const reply = data.reply || data.description || 'Herramienta ejecutada.';

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error procesando el resultado de la herramienta.'
      }]);
    }
  };

  // Execute real tools (these actually call backend APIs)
  const executeTool = async (name: string, args: any) => {
    if (name === 'update_referral_rate') {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: args.userId,
          customReferralRate: args.newRate
        })
      });
      return { success: res.ok, message: res.ok ? 'Rate updated successfully' : 'Failed to update' };
    }

    if (name === 'get_user_stats') {
      // In a real app this would call a real stats endpoint
      return { 
        userId: args.userId, 
        referredSellers: Math.floor(Math.random() * 40) + 5,
        totalEarningsGenerated: Math.floor(Math.random() * 800000) + 120000 
      };
    }

    if (name === 'search_users') {
      return { results: `Found users matching "${args.query}" (demo data)` };
    }

    if (name === 'list_support_tickets') {
      try {
        const params = args.status ? `?status=${args.status}` : '';
        const res = await fetch(`/api/admin/support/tickets${params}`);
        const data = await res.json();
        return { tickets: data.tickets || [], count: (data.tickets || []).length };
      } catch (e) {
        return { error: 'Failed to list tickets' };
      }
    }

    if (name === 'get_support_ticket' && args.ticketId) {
      try {
        const res = await fetch(`/api/admin/support/tickets?id=${args.ticketId}`);
        const data = await res.json();
        return data.ticket || { error: 'Ticket not found' };
      } catch (e) {
        return { error: 'Failed to fetch ticket' };
      }
    }

    if (name === 'update_support_ticket' && args.ticketId) {
      try {
        const res = await fetch('/api/admin/support/tickets', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: args.ticketId,
            status: args.status,
            adminReply: args.adminReply || args.reply,
          })
        });
        const data = await res.json();
        return { success: res.ok, ticket: data.ticket, message: res.ok ? 'Ticket updated' : 'Update failed' };
      } catch (e) {
        return { error: 'Failed to update ticket via tool' };
      }
    }

    // =====================
    // UI CONTROL TOOLS (for fixing bugs visually)
    // =====================
    if (name === 'highlight_element') {
      const selector = args.selector;
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        (el as HTMLElement).style.outline = '3px solid #f97316';
        (el as HTMLElement).style.outlineOffset = '2px';
        setTimeout(() => {
          (el as HTMLElement).style.outline = '';
        }, args.durationMs || 4000);
      });
      return { 
        success: true, 
        highlighted: elements.length,
        selector 
      };
    }

    if (name === 'describe_element') {
      const el = document.querySelector(args.selector) as HTMLElement;
      if (!el) return { error: 'Element not found' };
      return {
        tag: el.tagName,
        text: el.innerText?.slice(0, 200),
        classes: el.className,
        visible: el.offsetParent !== null,
      };
    }

    if (name === 'scroll_to') {
      const el = document.querySelector(args.selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return { success: true };
      }
      return { error: 'Element not found' };
    }

    if (name === 'click_element') {
      const el = document.querySelector(args.selector) as HTMLElement;
      if (!el) return { error: 'Element not found' };
      el.click();
      return { success: true, clicked: args.selector };
    }

    if (name === 'type_text') {
      const el = document.querySelector(args.selector) as HTMLInputElement | HTMLTextAreaElement;
      if (!el) return { error: 'Input element not found' };
      el.value = args.text || '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { success: true, selector: args.selector, text: args.text };
    }

    if (name === 'get_visible_text') {
      const elements = document.querySelectorAll(args.selector || 'body *');
      const texts: string[] = [];
      elements.forEach(el => {
        const text = (el as HTMLElement).innerText?.trim();
        if (text && text.length > 3 && text.length < 200) texts.push(text);
      });
      return { visibleText: texts.slice(0, 30) };
    }

    if (name === 'propose_code_change') {
      // Show a nice code change proposal UI instead of normal tool result
      setPendingCodeChange({
        file: args.file,
        description: args.description,
        diff: args.diff,
      });
      return { 
        success: true, 
        message: "Code change proposal shown to admin for review." 
      };
    }

    return { error: 'Tool not implemented' };
  };

  // State for code change proposals
  const [pendingCodeChange, setPendingCodeChange] = useState<{
    file: string;
    description: string;
    diff: string;
  } | null>(null);

  const handleAction = async (action: SuggestedAction, messageIndex: number) => {
    if (action.action === 'update_referral_rate' && action.userId && typeof action.newRate === 'number') {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: action.userId,
            customReferralRate: action.newRate,
          }),
        });

        if (res.ok) {
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[messageIndex].actions) {
              newMessages[messageIndex].actions = newMessages[messageIndex].actions!.map(a =>
                a === action ? { ...a, executed: true } : a
              );
            }
            return newMessages;
          });

          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `✅ Tasa de comisión actualizada para el usuario ${action.userId} a ${(action.newRate * 100).toFixed(1)}%.`
          }]);
        } else {
          throw new Error('Fallo al actualizar');
        }
      } catch (err) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ Error al aplicar la acción: ${err}`
        }]);
      }
    } 
    else if (action.action === 'fetch_user_stats' && action.userId) {
      // Demo: Fetch basic user info + their referral impact
      try {
        const res = await fetch(`/api/admin/users?userId=${action.userId}`);
        const data = await res.json();
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `📊 **Estadísticas del usuario ${action.userId}:**\n\n${JSON.stringify(data, null, 2)}\n\n¿Quieres que analice algo específico de este usuario o que genere un reporte más profundo?`
        }]);
      } catch (err) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `No pude obtener los datos del usuario. ID: ${action.userId}`
        }]);
      }
    } 
    else if (action.action === 'draft_email') {
      // Grok already gave the draft in the message. Just acknowledge.
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ Borrador de email generado. Puedes copiarlo y enviarlo manualmente, o dime si quieres que lo refine.`
      }]);
    } 
    else {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Acción recibida: ${action.action}. Esta acción aún no tiene ejecución directa implementada, pero puedo ayudarte a prepararla.`
      }]);
    }
  };

  // =====================
  // TEXT-TO-SPEECH (Speaking)
  // =====================
  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Use selected voice if available
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) {
      utterance.voice = voice;
    } else {
      // Fallback
      const fallback = voices.find(v => 
        (language === 'es' ? v.lang.includes('es') : v.lang.includes('en')) &&
        (v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Daniel') || v.name.includes('Google'))
      );
      if (fallback) utterance.voice = fallback;
    }

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Voice input using Web Speech API
  const toggleVoiceInput = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      alert('Tu navegador no soporta reconocimiento de voz. Prueba con Chrome o Edge.');
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = 'en-US'; // Default to English
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    if (!isListening) {
      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          setInput(transcript);
          // Auto-send after voice input for smooth experience
          setTimeout(() => {
            sendMessage(transcript);
          }, 300);
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
    } else {
      setIsListening(false);
      // recognition will stop on its own when we set state
    }
  };

  return (
    <div className="bg-background">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Grok Build</h1>
              <p className="text-muted-foreground">Your AI assistant to build and improve the platform</p>
            </div>
          </div>
        </div>

        {/* Mode Selector + Context */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {BUILD_MODES.map((mode) => (
              <Button
                key={mode.id}
                variant={activeMode === mode.id ? "default" : "outline"}
                onClick={() => setActiveMode(mode.id as any)}
                size="sm"
              >
                {mode.label}
              </Button>
            ))}
          </div>

          <div className="text-xs px-3 py-1 bg-muted rounded-full text-muted-foreground flex items-center gap-1">
            Context: Admin Panel • Mode {activeMode}
            {customContext && <span className="text-orange-500">• Context attached</span>}
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">Language:</span>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
              className="text-xs border rounded px-2 py-1 bg-background"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>

          {/* Voice Selector for TTS */}
          {voiceEnabled && availableVoices.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Voice:</span>
              <select 
                value={selectedVoice} 
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="text-xs border rounded px-2 py-1 bg-background max-w-[160px]"
              >
                {availableVoices
                  .filter(v => language === 'es' ? v.lang.includes('es') : v.lang.includes('en'))
                  .map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Suggested Prompts + Context */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-5 sticky top-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles size={18} /> Recommended Prompts
              </h3>
              <div className="space-y-2">
                {(SUGGESTED_PROMPTS[activeMode] || SUGGESTED_PROMPTS.chat).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(prompt)}
                    disabled={isLoading}
                    className="w-full text-left text-sm p-3 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Powerful Context System (B) */}
              <div className="mt-6 pt-4 border-t">
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Zap size={14} /> Current Context (Live)
                </div>
                <textarea
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="E.g. User 123abc (referred 47 high-volume sellers). Deciding whether to raise their rate."
                  className="w-full text-xs p-2 border rounded bg-background h-20 resize-y"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  This context is sent with **all** messages. Grok remembers it.
                </p>

                {/* Quick Context Buttons */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button onClick={() => setCustomContext("Looking at list of users with many referrals")} className="text-[10px] px-2 py-1 bg-muted rounded hover:bg-muted/80">+ Users with many referrals</button>
                  <button onClick={() => setCustomContext("Analyzing pending payouts this month")} className="text-[10px] px-2 py-1 bg-muted rounded hover:bg-muted/80">+ Pending payouts</button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-border rounded-3xl flex flex-col h-[calc(100vh-180px)] min-h-[600px]">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3 bg-muted/30 rounded-t-3xl">
                <div className="w-9 h-9 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Grok Build — Admin Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Modo activo: {activeMode}
                    {customContext && <span className="ml-2 text-orange-500">• Context attached</span>}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((message, index) => (
                  <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex-shrink-0 flex items-center justify-center mt-1">
                        <Bot size={18} className="text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : message.role === 'tool'
                          ? 'bg-blue-50 border border-blue-200 text-blue-900'
                          : 'bg-muted border'
                      }`}
                    >
                      {message.role === 'tool' ? (
                        <div>
                          <div className="font-medium text-blue-700 mb-1">Tool Result</div>
                          <pre className="text-xs overflow-auto">{message.content}</pre>
                        </div>
                      ) : (
                        message.content
                      )}

                      {/* Render suggested actions from Grok - Smart Action Cards */}
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Actions suggested by Grok:</div>
                          {message.actions.map((action, i) => (
                            <div 
                              key={i} 
                              className="border border-border rounded-lg p-3 bg-background text-sm"
                            >
                              <div className="font-medium mb-1">
                                {action.action.replace(/_/g, ' ')}
                              </div>
                              {action.reason && (
                                <div className="text-xs text-muted-foreground mb-2">{action.reason}</div>
                              )}
                              <Button
                                size="sm"
                                variant={action.executed ? "secondary" : "default"}
                                onClick={() => !action.executed && handleAction(action, index)}
                                disabled={action.executed}
                                className="text-xs h-7"
                              >
                                {action.executed ? (
                                  <>✓ Executed</>
                                ) : (
                                  <>Execute action</>
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-muted flex-shrink-0 flex items-center justify-center mt-1">
                        <User size={18} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex-shrink-0 flex items-center justify-center">
                      <Bot size={18} className="text-white" />
                    </div>
                    <div className="bg-muted border rounded-2xl px-5 py-3.5 text-sm">
                      <span className="animate-pulse">Grok is thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Code Change Proposal Panel - Powerful UI access for fixing bugs */}
              {pendingCodeChange && (
                <div className="mx-4 mb-4 p-4 border-2 border-orange-500 bg-orange-50 dark:bg-orange-950/30 rounded-2xl">
                  <div className="font-semibold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-2">
                    <Zap size={18} /> Grok proposes a code change
                  </div>
                  <div className="text-sm mb-2">
                    <strong>File:</strong> <code className="bg-muted/50 px-1 rounded">{pendingCodeChange.file}</code>
                  </div>
                  <div className="text-sm mb-3">{pendingCodeChange.description}</div>
                  
                  <pre className="text-xs bg-muted text-foreground p-3 rounded overflow-auto max-h-48 mb-3">
                    {pendingCodeChange.diff}
                  </pre>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(pendingCodeChange.diff);
                        alert(`Diff copied!\n\nFile: ${pendingCodeChange.file}\n\nApply this in your editor and push to production.`);
                        setPendingCodeChange(null);
                      }}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Copy Diff
                    </Button>
                    <Button variant="outline" onClick={() => setPendingCodeChange(null)}>
                      Dismiss
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Grok can now propose real code fixes for bugs. Future versions can apply changes more directly.
                  </p>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t bg-background rounded-b-3xl">
                <div className="flex gap-3">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={`Ask Grok in ${activeMode} mode... (or use the mic)`}
                    className="flex-1 text-base py-6"
                    disabled={isLoading}
                  />

                  {/* Microphone Button */}
                  <Button
                    onClick={toggleVoiceInput}
                    disabled={isLoading}
                    size="lg"
                    variant={isListening ? "destructive" : "outline"}
                    className={`px-4 transition-all ${isListening ? 'animate-pulse' : ''}`}
                    title={isListening ? "Stop listening" : "Speak to Grok"}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </Button>

                  {/* Text-to-Speech Toggle */}
                  <Button
                    onClick={() => {
                      setVoiceEnabled(!voiceEnabled);
                      if (voiceEnabled) stopSpeaking();
                    }}
                    disabled={isLoading}
                    size="lg"
                    variant={voiceEnabled ? "default" : "outline"}
                    className="px-4"
                    title={voiceEnabled ? "Disable voice responses" : "Enable voice responses"}
                  >
                    {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </Button>

                  <Button 
                    onClick={() => sendMessage()} 
                    disabled={isLoading || !input.trim()}
                    size="lg"
                    className="px-6"
                  >
                    <Send size={18} />
                  </Button>
                </div>
                {isListening && (
                  <p className="text-center text-sm text-red-500 mt-2 flex items-center justify-center gap-2">
                    <span className="animate-pulse">🎤</span> Listening... speak now
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  Grok Build has full conversation memory + any context you attach above. The more specific you are, the smarter it gets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
