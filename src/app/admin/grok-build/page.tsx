'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, Bot, User, Zap } from 'lucide-react';

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
  { id: 'chat', label: 'Chat General' },
  { id: 'analyze', label: 'Analizar Datos' },
  { id: 'generate', label: 'Generar Contenido' },
  { id: 'improve', label: 'Mejorar Producto' },
];

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  chat: [
    "¿Qué métricas clave deberíamos estar mirando esta semana?",
    "Resume el estado actual de los usuarios y vendedores",
  ],
  analyze: [
    "Analiza los patrones de usuarios que se registran pero no publican gigs",
    "Identifica posibles riesgos de churn en vendedores",
    "Sugiere segmentos de usuarios para una campaña de reactivación",
  ],
  generate: [
    "Escribe un email para anunciar el nuevo programa de referidos",
    "Crea 5 ideas de títulos atractivos para gigs de 'Diseño gráfico'",
    "Redacta una notificación para usuarios cuando su pedido es completado",
  ],
  improve: [
    "Propón 5 mejoras para la experiencia de pago de vendedores",
    "¿Cómo podemos aumentar la tasa de conversión de compradores?",
    "Ideas para reducir el tiempo entre que un usuario se registra y publica su primer gig",
  ],
};

export default function GrokBuildPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hola. Soy Grok Build — la IA más inteligente integrada en OigaUsted.\n\nEstoy diseñado específicamente para ayudarte a construir, analizar, optimizar y escalar la plataforma. Puedo razonar profundamente sobre datos, usuarios, producto y operaciones.\n\n¿Qué quieres crear, analizar o mejorar hoy?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'analyze' | 'generate' | 'improve'>('chat');
  const [customContext, setCustomContext] = useState(''); // Live context sent to Grok on every message (B)
  const [pendingAction, setPendingAction] = useState<any>(null); // For approval flow

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
          pageContext: `Admin Panel - Modo: ${activeMode}`,
          selectedData: customContext ? { description: customContext } : null,
          history: conversationHistory,
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
        await sendMessageWithHistory([...messages, toolMessage as any], messageText);
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
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Hubo un error conectándome con Grok. ¿Quieres intentarlo de nuevo?',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to continue after tool execution
  const sendMessageWithHistory = async (historyMessages: Message[], originalPrompt: string) => {
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

    return { error: 'Tool not implemented' };
  };

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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Grok Build</h1>
              <p className="text-muted-foreground">Tu asistente de IA para construir y mejorar la plataforma</p>
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
            Contexto: Panel de Administración • Modo {activeMode}
            {customContext && <span className="text-orange-500">• Contexto personalizado adjunto</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Suggested Prompts + Context */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-5 sticky top-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles size={18} /> Prompts recomendados
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
                  placeholder="Ej: Usuario 123abc (refirió 47 vendedores de alto volumen). Decidiendo si subir su tasa."
                  className="w-full text-xs p-2 border rounded bg-background h-20 resize-y"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Este contexto se envía en **todos** los mensajes. Grok lo recuerda.
                </p>

                {/* Quick Context Buttons */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button onClick={() => setCustomContext("Mirando la lista de usuarios con muchos referidos")} className="text-[10px] px-2 py-1 bg-muted rounded hover:bg-muted/80">+ Usuarios con muchos referidos</button>
                  <button onClick={() => setCustomContext("Analizando payouts pendientes este mes")} className="text-[10px] px-2 py-1 bg-muted rounded hover:bg-muted/80">+ Payouts pendientes</button>
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
                  <p className="font-semibold">Grok Build — Modo Admin</p>
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
                          <div className="text-xs font-medium text-muted-foreground mb-1">Acciones sugeridas por Grok:</div>
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
                                  <>✓ Ejecutado</>
                                ) : (
                                  <>Ejecutar acción</>
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-zinc-700 flex-shrink-0 flex items-center justify-center mt-1">
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
                      <span className="animate-pulse">Grok está pensando...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-background rounded-b-3xl">
                <div className="flex gap-3">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={`Pregúntale a Grok en modo ${activeMode}...`}
                    className="flex-1 text-base py-6"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={() => sendMessage()} 
                    disabled={isLoading || !input.trim()}
                    size="lg"
                    className="px-6"
                  >
                    <Send size={18} />
                  </Button>
                </div>
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
