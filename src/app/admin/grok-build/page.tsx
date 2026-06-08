'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, Bot, User, Zap, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { ProposalCard, Proposal } from '@/components/admin/ProposalCard';

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

// Web Speech API types (not always included in TS lib for all targets)
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult extends Array<SpeechRecognitionAlternative> {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList extends Array<SpeechRecognitionResult> {
  length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

const BUILD_MODES = [
  { id: 'chat', label: 'General Chat' },
  { id: 'analyze', label: 'Analyze Data' },
  { id: 'generate', label: 'Generate Content' },
  { id: 'improve', label: 'Improve Product' },
  { id: 'support', label: 'Support Tickets' },
  { id: 'scan', label: 'System Scan / Bug Hunt' },
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
  scan: [
    "Run full system scan (typecheck + lint + searches). Then propose concrete fixes AND upgrades for everything important.",
    "Perform a complete bug hunt + modernization pass: find issues, propose fixes, and suggest upgrades to keep the app advanced.",
    "Run typecheck + lint. For every error and warning, immediately propose a precise fix using old/new strings.",
    "Full system scan: find all 'as any', unhandled errors, risky casts, and bad patterns — then propose fixes + better modern alternatives.",
    "Security + robustness scan: identify risks and propose hardening upgrades (auth, validation, error handling, logging).",
    "Architecture & DX scan: find outdated patterns or pain points and propose upgrades to make the app more maintainable and advanced.",
    "Performance & scalability scan: locate bottlenecks and propose concrete improvements + modern best practices.",
    "Scan for TODO/FIXME and technical debt, then turn the highest-value items into ready-to-apply fixes and refactors.",
    "Grok self-scan + upgrade: review the /admin/grok-build and scan tools code. Propose fixes for any issues and upgrades to make the in-app agent even more powerful.",
    "Do a full scan, group findings, propose 6-10 high-impact fixes + upgrades, then offer to verify with run_check after I apply some.",
  ],
};

export default function GrokBuildPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello. I\'m Grok Build — the most capable AI integrated into OigaUsted.\n\nMy specialty: **Scan → Diagnose → Propose Fixes + Upgrades → One-click Apply**.\n\nIn dev/Codespaces I can:\n• Run real typecheck, lint, build, prisma diagnostics\n• Deep search the entire codebase for bugs and smells\n• Read any source file\n• Propose precise fixes (and forward-looking upgrades) that you can apply instantly\n\nAfter any scan I will not just list problems — I will immediately suggest concrete fixes *and* upgrades to keep this app advanced and modern.\n\nSwitch to **System Scan / Bug Hunt** mode or say "full system scan and propose upgrades".\n\nWhat should we scan and improve today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'analyze' | 'generate' | 'improve' | 'support' | 'scan'>('chat');
  const [customContext, setCustomContext] = useState(''); // Live context sent to Grok on every message (B)
  const [pendingAction, setPendingAction] = useState<SuggestedAction | null>(null); // For approval flow
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true); // TTS enabled by default
  const [language] = useState<'en' | 'es'>('en'); // Forced to English for admin Grok Build panel
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
          language: 'en', // Force English for admin Grok Build
        }),
      });

      const data = await res.json();

      // Handle tool calls from Grok (upgraded for richer multi-tool scans: process sequentially)
      if (data.tool_calls && data.tool_calls.length > 0) {
        for (const toolCall of data.tool_calls) {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments || '{}');

          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Grok wants to use tool: **${functionName}**`,
            tool_call_id: toolCall.id
          } as Message]);

          const toolResult = await executeTool(functionName, args);

          const toolMessage: Message = {
            role: 'tool',
            content: JSON.stringify(toolResult),
            tool_call_id: toolCall.id
          };

          setMessages(prev => [...prev, toolMessage]);

          // For proposal-heavy scans, let UI accumulate; otherwise continue
          if (!['propose_code_change', 'search_code', 'run_check', 'list_files', 'read_file'].includes(functionName)) {
            await sendMessageWithHistory([...messages, toolMessage], messageText, 'en');
          }
        }
        // After batch of scan tools, one final continuation if needed
        const lastTool = data.tool_calls[data.tool_calls.length - 1].function.name;
        if (['propose_code_change'].includes(lastTool)) {
          return; // UI has the proposals; admin can review/apply
        }
        await sendMessageWithHistory(messages, messageText, 'en');
        return;
      }

      const rawContent = data.reply || data.description || 'Sorry, I could not generate a response.';

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
  // Upgraded with basic streaming support for long replies after scans (B)
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
          language: 'en', // Force English for admin Grok Build
          stream: true,
        }),
      });

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        const streamMsgId = 'stream-' + Date.now();

        // Add a temporary streaming message
        setMessages(prev => [...prev, { role: 'assistant', content: 'Thinking...', id: streamMsgId } as any]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          // Simple accumulation (raw chunks will show progress; in practice xAI deltas are inside)
          setMessages(prev => {
            const updated = [...prev];
            const idx = updated.findIndex((m: any) => m.id === streamMsgId);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], content: accumulated || '...' };
            }
            return updated;
          });
        }

        // Finalize: replace the stream msg with clean reply if possible
        setMessages(prev => {
          const updated = [...prev];
          const idx = updated.findIndex((m: any) => m.id === streamMsgId);
          if (idx !== -1) {
            // Try to extract content if it looks like JSON stream, else use accumulated
            let final = accumulated.trim();
            try {
              // naive: if last line has content
              const lines = final.split('\n').filter(Boolean);
              const last = lines[lines.length-1];
              if (last.includes('"content"')) {
                const parsed = JSON.parse(last.replace(/^data: /, ''));
                final = parsed.choices?.[0]?.delta?.content || final;
              }
            } catch {}
            updated[idx] = { role: 'assistant', content: final || 'Done.' };
          }
          return updated;
        });
      } else {
        const data = await res.json();
        const reply = data.reply || data.description || 'Response received.';
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error processing the tool result.'
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
      // Accumulate proposals so after a scan Grok can suggest many fixes + upgrades at once
      const newProposal = {
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file: args.file,
        description: args.description,
        diff: args.diff,
        old_string: args.old_string,
        new_string: args.new_string,
        lowRisk: /low.?risk|safe|minor|improvement|upgrade|modern|best practice/i.test(args.description || ''),
        createdAt: Date.now(),
      };
      setPendingProposals(prev => [...prev, newProposal]);
      return { 
        success: true, 
        message: "Code change proposal added. Review and apply fixes or upgrades directly." 
      };
    }

    return { error: 'Tool not implemented' };
  };

  // State for code change proposals
  // Support multiple proposals so Grok can suggest several fixes + upgrades after a scan
  const [pendingProposals, setPendingProposals] = useState<Proposal[]>([]);

  const [isApplying, setIsApplying] = useState(false);
  const [applyingIds, setApplyingIds] = useState<Set<string>>(new Set());

  // Persistence for proposals across refreshes (dev convenience)
  useEffect(() => {
    const saved = localStorage.getItem('grok-pending-proposals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setPendingProposals(parsed);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('grok-pending-proposals', JSON.stringify(pendingProposals));
  }, [pendingProposals]);

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
            content: `✅ Commission rate updated for user ${action.userId} to ${(action.newRate * 100).toFixed(1)}%.`
          }]);
        } else {
          throw new Error('Failed to update');
        }
      } catch (err) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ Error applying the action: ${err}`
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
          content: `📊 **Stats for user ${action.userId}:**\n\n${JSON.stringify(data, null, 2)}\n\nWant me to analyze something specific or generate a deeper report?`
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
        content: `✅ Email draft generated. You can copy and send it manually, or ask me to refine it.`
      }]);
    } 
    else {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Action received: ${action.action}. This action does not have direct execution yet, but I can help prepare it.`
      }]);
    }
  };

  // Apply a single proposal
  const applyProposal = async (proposal: any) => {
    const hasPrecise = !!(proposal.old_string && proposal.new_string);

    if (!hasPrecise && !proposal.diff) {
      alert('This proposal does not contain enough information to apply safely (needs old_string + new_string).');
      return;
    }

    const confirmed = window.confirm(
      `Apply this change to the filesystem?\n\nFile: ${proposal.file}\n\n${proposal.description}\n\nA backup will be created automatically. This only works in development/Codespaces.`
    );
    if (!confirmed) return;

    setIsApplying(true);
    setApplyingIds(prev => new Set(prev).add(proposal.id));

    try {
      const payload: any = {
        file: proposal.file,
        description: proposal.description,
      };

      if (hasPrecise) {
        payload.old_string = proposal.old_string;
        payload.new_string = proposal.new_string;
      }
      if (proposal.diff) payload.diff = proposal.diff;

      const res = await fetch('/api/grok/apply-code-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.result?.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ **Change applied successfully!**\n\nFile: \`${proposal.file}\`\n\n${data.result.message}\n\nNext.js should hot-reload most changes automatically.`
        }]);
        // Upgrade E: auto-suggest verification
        setTimeout(() => {
          sendMessage(`Run run_check("typecheck") or "full" to verify the changes to ${proposal.file} and propose any follow-up fixes or tests.`);
        }, 800);
        // Remove this proposal
        setPendingProposals(prev => prev.filter(p => p.id !== proposal.id));
      } else {
        throw new Error(data.error || 'Apply failed');
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Failed to apply change to ${proposal.file}: ${err.message || err}\n\nYou can copy the proposal and apply manually.`
      }]);
    } finally {
      setIsApplying(false);
      setApplyingIds(prev => {
        const next = new Set(prev);
        next.delete(proposal.id);
        return next;
      });
    }
  };

  // Bulk apply low-risk / safe upgrades with extra confirmation
  const applySafeLowRiskUpgrades = async () => {
    const lowRiskOnes = pendingProposals.filter(p => p.lowRisk);
    if (lowRiskOnes.length === 0) {
      alert('No proposals are currently marked as low-risk. You can mark some using the checkboxes.');
      return;
    }

    const summary = lowRiskOnes.map(p => `• ${p.file}: ${p.description.slice(0, 80)}`).join('\n');

    const confirmed = window.confirm(
      `Apply ${lowRiskOnes.length} LOW-RISK upgrades?\n\nThis will write multiple changes to disk (each creates its own backup).\n\n${summary}\n\nDouble-check the list. Continue?`
    );
    if (!confirmed) return;

    // Second confirmation for safety
    const really = window.confirm(`Final confirmation: Apply these ${lowRiskOnes.length} changes now?`);
    if (!really) return;

    setIsApplying(true);

    const results: string[] = [];

    for (const proposal of lowRiskOnes) {
      setApplyingIds(prev => new Set(prev).add(proposal.id));
      try {
        const payload: any = {
          file: proposal.file,
          description: proposal.description,
        };
        if (proposal.old_string && proposal.new_string) {
          payload.old_string = proposal.old_string;
          payload.new_string = proposal.new_string;
        }
        if (proposal.diff) payload.diff = proposal.diff;

        const res = await fetch('/api/grok/apply-code-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (data.success && data.result?.success) {
          results.push(`✅ ${proposal.file}`);
          setPendingProposals(prev => prev.filter(p => p.id !== proposal.id));
        } else {
          results.push(`❌ ${proposal.file}: ${data.error || 'failed'}`);
        }
      } catch (e: any) {
        results.push(`❌ ${proposal.file}: ${e.message}`);
      } finally {
        setApplyingIds(prev => {
          const next = new Set(prev);
          next.delete(proposal.id);
          return next;
        });
      }
      // small delay between writes
      await new Promise(r => setTimeout(r, 250));
    }

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `**Bulk low-risk upgrade apply complete**\n\n${results.join('\n')}\n\nRun a follow-up check (typecheck / lint) to verify everything is still healthy.`
    }]);

    setIsApplying(false);
  };

  // Mark/unmark a proposal as low-risk (for bulk safe apply)
  const toggleLowRisk = (id: string) => {
    setPendingProposals(prev =>
      prev.map(p => p.id === id ? { ...p, lowRisk: !p.lowRisk } : p)
    );
  };

  // Remove a proposal without applying
  const dismissProposal = (id: string) => {
    setPendingProposals(prev => prev.filter(p => p.id !== id));
  };

  // Clear all proposals
  const clearAllProposals = () => {
    if (pendingProposals.length === 0) return;
    if (window.confirm(`Dismiss all ${pendingProposals.length} pending proposals?`)) {
      setPendingProposals([]);
    }
  };

  // Upgrade: Simple undo using the .grok-bak files created on apply
  const undoLastApply = async (file?: string) => {
    const targetFile = file || prompt('Enter relative path of file to restore (e.g. src/app/admin/grok-build/page.tsx):');
    if (!targetFile) return;

    if (!window.confirm(`Restore ${targetFile} from its most recent .grok-bak backup? This will overwrite the current file.`)) return;

    try {
      const res = await fetch('/api/grok/apply-code-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'undo',
          file: targetFile,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ Undo successful for ${targetFile}. ${data.message || 'Backup restored.'}`
        }]);
      } else {
        throw new Error(data.error || 'Undo failed (backend undo not fully implemented yet — use git or manual restore for now)');
      }
    } catch (e: any) {
      alert(`Undo failed: ${e.message}. For now, look for the .grok-bak file next to the original and restore manually.`);
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

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = (event.results[0] as any)[0]?.transcript || '';
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

          {/* Master "Scan + Propose Fixes & Upgrades" button - prominent for quick bug fixing + advancement */}
          <Button
            onClick={() => {
              const masterPrompt = `Perform a comprehensive system scan right now:
1. Call run_check("full") or run_check("typecheck") + run_check("lint").
2. Use search_code multiple times for bugs (as any, error handling, casts, unhandled promises, security issues, outdated patterns) and upgrade opportunities.
3. Use list_files and read_file on key areas as needed.
4. Then systematically propose concrete, high-value fixes AND forward-looking upgrades using propose_code_change (with old_string + new_string).
Prioritize changes that make the app more robust, faster, more maintainable, and more advanced. Group by category (Type Errors, Security, DX, Performance, Architecture, Modern Patterns). Start the scan and begin proposing changes.`;
              sendMessage(masterPrompt);
            }}
            disabled={isLoading}
            size="sm"
            className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white shadow"
          >
            🚀 Full Scan + Propose Fixes &amp; Upgrades
          </Button>

          <div className="text-xs px-3 py-1 bg-muted rounded-full text-muted-foreground flex items-center gap-1">
            Context: Admin Panel • Mode {activeMode}
            {pendingProposals.length > 0 && <span className="text-orange-600 font-medium">• {pendingProposals.length} proposal{pendingProposals.length > 1 ? 's' : ''} ready</span>}
            {customContext && <span className="text-orange-500">• Context attached</span>}
          </div>

          {/* Language is forced to English for the admin Grok Build panel */}
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

              {/* Explicit "After Scan → Suggest Fixes + Upgrades" quick actions */}
              {activeMode === 'scan' && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs font-medium mb-2 text-orange-600 flex items-center gap-1">
                    <Zap size={12} /> After scan: Propose Fixes + Upgrades
                  </div>
                  <div className="space-y-1.5">
                    {[
                      "Now that you've scanned, propose the top 5-8 fixes and upgrades with ready-to-apply changes.",
                      "Turn the scan results into concrete propose_code_change calls for both bug fixes and modern upgrades.",
                      "For every issue found, suggest a fix. Also propose 3-4 proactive upgrades to keep the app advanced.",
                      "Verify the proposed fixes by suggesting a follow-up run_check after I apply them."
                    ].map((p, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(p)}
                        disabled={isLoading}
                        className="w-full text-left text-[11px] p-2 rounded-lg border border-orange-200 bg-orange-50/50 hover:bg-orange-100 dark:bg-orange-950/20 text-orange-800 dark:text-orange-200 transition-colors disabled:opacity-50"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upgrade Categories picker - focused scans that lead to fixes + upgrades to keep app advanced */}
              {activeMode === 'scan' && (
                <div className="mt-4 pt-3 border-t">
                  <div className="text-xs font-medium mb-1.5 text-orange-600">Upgrade Categories (scan + propose upgrades)</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Performance', 
                      'DX / Developer Experience', 
                      'Security & Hardening', 
                      'Architecture & Structure', 
                      'Observability & Logging', 
                      'Modern Patterns & DX', 
                      'Code Quality & Maintainability'
                    ].map(cat => (
                      <button
                        key={cat}
                        onClick={() => sendMessage(
                          `Focus a scan on the "${cat}" category. Use search_code, read_file and run_check as needed. Then propose specific, high-value upgrades and fixes for this area using propose_code_change with old_string/new_string. Make the app more advanced in this dimension.`
                        )}
                        disabled={isLoading}
                        className="text-[10px] px-2 py-0.5 rounded-full border border-orange-200 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 transition"
                      >
                        {cat}
                      </button>
                    ))}
                    <button
                      onClick={() => sendMessage(
                        `Do a comprehensive cross-category modernization scan (Performance + DX + Security + Architecture + Observability + Modern Patterns). Propose the best upgrades and fixes across areas to keep this app advanced and future-proof. Use tools then propose_code_change.`
                      )}
                      disabled={isLoading}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-orange-400 bg-orange-100 hover:bg-orange-200 font-medium text-orange-800 dark:text-orange-200"
                    >
                      All Categories (Full Modernization)
                    </button>
                  </div>

                  {/* Self-upgrade / meta button (C) */}
                  <button
                    onClick={() => sendMessage(
                      "Use the analyze_own_code tool (focus on 'all') to review the Grok Build in-app implementation. Then propose concrete self-upgrades to make the tool itself more powerful, usable, and advanced (UI, tools, robustness, self-analysis). Use propose_code_change for the best ideas."
                    )}
                    disabled={isLoading}
                    className="mt-2 w-full text-[10px] px-2 py-1 rounded border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/30"
                  >
                    🧠 Improve the Tool Itself (self-meta scan)
                  </button>

                  {/* Handoff to local CLI (F) */}
                  <button
                    onClick={() => {
                      const prompt = `Continue this admin Grok Build session as the standalone CLI agent. The in-app tool has proposed several changes for fixes and upgrades in the current scan. Review the pending proposals in the UI if open, then use full tools (including shell/git) to implement deeper upgrades, run tests, or push. Focus on making the Grok Build tool and the overall app more advanced.`;
                      navigator.clipboard.writeText(prompt);
                      alert('Handoff prompt copied! Open terminal and run: grok -p "paste the prompt" --yolo (or without yolo for review)');
                    }}
                    disabled={isLoading}
                    className="mt-1 w-full text-[10px] px-2 py-1 rounded border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/30"
                  >
                    📤 Handoff to Local grok CLI
                  </button>
                </div>
              )}

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

              {/* Local powerful agent integration note (Codespaces) */}
              <div className="mt-6 pt-4 border-t text-[10px] text-muted-foreground">
                <div className="font-medium mb-1">Need bigger upgrades or complex refactors?</div>
                In the terminal run:
                <code className="block mt-1 p-1 bg-muted rounded text-[9px] break-all">
                  grok -p "full system scan + propose modern upgrades and fixes" --yolo
                </code>
                The local Grok agent has full power (shell, git, multi-file refactors) and is great for large "keep the app advanced" work.
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
                    Modo activo: {activeMode === 'scan' ? 'System Scan / Bug Hunt' : activeMode}
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

              {/* Multi-Proposal Panel: Fixes + Upgrades after scans */}
              {pendingProposals.length > 0 && (
                <div className="mx-4 mb-4 p-4 border-2 border-orange-500 bg-orange-50 dark:bg-orange-950/30 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2">
                      <Zap size={18} /> Grok proposed {pendingProposals.length} change{pendingProposals.length > 1 ? 's' : ''} (fixes + upgrades)
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={applySafeLowRiskUpgrades} 
                        disabled={isApplying || pendingProposals.filter(p => p.lowRisk).length === 0}
                        className="text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
                      >
                        Apply Safe Low-Risk Upgrades ({pendingProposals.filter(p => p.lowRisk).length})
                      </Button>
                      <Button size="sm" variant="ghost" onClick={clearAllProposals} disabled={isApplying}>
                        Clear All
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => undoLastApply()} 
                        disabled={isApplying}
                        title="Restore a file from its latest .grok-bak backup (upgrade)"
                      >
                        Undo Last Apply
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                    {pendingProposals.map((proposal) => {
                      const isThisApplying = applyingIds.has(proposal.id);
                      return (
                        <ProposalCard
                          key={proposal.id}
                          proposal={proposal}
                          isApplying={isApplying}
                          isThisApplying={isThisApplying}
                          onApply={applyProposal}
                          onCopy={(p) => {
                            const text = p.diff || 
                              (p.old_string && p.new_string ? `// ${p.file}\n// ${p.description}\n\nOLD:\n${p.old_string}\n\nNEW:\n${p.new_string}` : '');
                            navigator.clipboard.writeText(text);
                            alert(`Proposal copied.\n\n${p.file}`);
                          }}
                          onDismiss={dismissProposal}
                          onToggleLowRisk={toggleLowRisk}
                          onUndo={(file) => undoLastApply(file)}
                        />
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-muted-foreground mt-3">
                    <strong>In Codespaces / dev:</strong> Each "Apply" writes the file with backup + audit. 
                    Use "Apply Safe Low-Risk Upgrades" for bulk (extra confirmation). Disabled in production.
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
