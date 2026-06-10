'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Sparkles, Copy, Send, Target, Users, Instagram, Facebook, 
  Twitter, MessageCircle, Image as ImageIcon, Clock, TrendingUp,
  RefreshCw, Check, Megaphone
} from 'lucide-react';

interface AudienceUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  businessName: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Campaign {
  id: string;
  subject: string;
  segment: string;
  recipientCount: number;
  sentBy: string;
  createdAt: string;
}

// AI Generated Campaign (from /api/admin/marketing/ai-generate)
interface GeneratedCampaign {
  campaignName: string;
  objective: string;
  recommendedSegment: string;
  segmentReason: string;
  email: {
    subject: string;
    previewText?: string;
    body: string;
    cta?: string;
  };
  social: {
    instagram: string;
    facebook: string;
    x: string;
    whatsapp: string;
    general: string;
  };
  adCopies: Array<{ headline: string; body: string; cta: string }>;
  visualPrompts: string[];
  hashtags: string[];
  bestTimes: string;
  strategyNotes: string;
  complianceTips?: string;
}

const QUICK_GOALS = [
  "Adquirir más compradores activos en Bucaramanga",
  "Promocionar vendedores nuevos / reactivar sellers",
  "Lanzar nueva categoría (ej: plomería, belleza, mudanzas)",
  "Re-enganchar usuarios inactivos últimos 60 días",
  "Campaña de referidos y crecimiento orgánico",
  "Anunciar mejoras importantes de la plataforma",
  "Promoción estacional o de temporada (vacaciones, fin de año)",
];

const CHANNEL_OPTIONS = [
  { key: 'email', label: 'Email + In-app', icon: Send },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'facebook', label: 'Facebook Ads', icon: Facebook },
  { key: 'x', label: 'X / Twitter', icon: Twitter },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

const TONES = ['cercano y confiable', 'profesional', 'urgente pero honesto', 'amigable y local', 'inspirador', 'directo y claro'];

const SEGMENTS = [
  { value: 'all', label: 'All active users' },
  { value: 'buyers', label: 'Buyers only' },
  { value: 'sellers', label: 'Sellers only' },
  { value: 'active', label: 'Active accounts only' },
  { value: 'inactive', label: 'Inactive accounts' },
];

export default function AdminMarketingPage() {
  // Compose state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [segment, setSegment] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // Audience / mailing list
  const [audience, setAudience] = useState<AudienceUser[]>([]);
  const [audienceTotal, setAudienceTotal] = useState(0);
  const [audienceReachable, setAudienceReachable] = useState(0);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [audienceSearch, setAudienceSearch] = useState('');

  // History
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsTotal, setCampaignsTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Dry run preview
  const [dryRunResult, setDryRunResult] = useState<any>(null);

  // ========== AI MARKETING STUDIO STATE ==========
  const [aiGoal, setAiGoal] = useState('');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiChannels, setAiChannels] = useState<string[]>(['email', 'instagram', 'facebook']);
  const [aiTone, setAiTone] = useState('cercano y confiable');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCampaign, setGeneratedCampaign] = useState<GeneratedCampaign | null>(null);
  const [activeAiTab, setActiveAiTab] = useState<'email' | 'social' | 'ads' | 'visuals'>('email');
  const [refining, setRefining] = useState(false);

  // ========== AI GENERATION ==========
  const generateWithAI = async (extraPrompt?: string) => {
    setIsGenerating(true);
    try {
      const payload = {
        goal: aiGoal || aiCustomPrompt || "Promocionar OigaUsted y conectar más usuarios con servicios locales en Colombia",
        prompt: extraPrompt || aiCustomPrompt,
        channels: aiChannels,
        segmentHint: segment,
        tone: aiTone,
        language: 'es',
        variations: 4,
      };

      const res = await fetch('/api/admin/marketing/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.campaign) {
        setGeneratedCampaign(data.campaign);
        setActiveAiTab('email');
        toast.success('Campaña generada con IA');
        
        // Auto-suggest the recommended segment if it's sensible
        if (data.campaign.recommendedSegment) {
          // We don't auto-change the main segment, but we can show it prominently
        }
      } else {
        toast.error('No se pudo generar la campaña');
      }
    } catch (e) {
      toast.error('Error conectando con el generador de IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const quickGenerate = (goal: string) => {
    setAiGoal(goal);
    setAiCustomPrompt('');
    // Trigger generation shortly after state update
    setTimeout(() => generateWithAI(), 50);
  };

  const loadAiIntoComposer = () => {
    if (!generatedCampaign) return;
    setSubject(generatedCampaign.email.subject);
    setMessage(generatedCampaign.email.body);
    toast.success('Email cargado en el compositor');
    // Scroll to composer
    document.getElementById('broadcast-composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const copyText = (text: string, label = 'Texto') => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copiado al portapapeles`);
    });
  };

  const useAdCopy = (copy: { headline: string; body: string; cta: string }) => {
    const combined = `${copy.headline}\n\n${copy.body}\n\n${copy.cta}`;
    setSubject(copy.headline);
    setMessage(combined);
    toast.success('Variación de anuncio cargada');
    document.getElementById('broadcast-composer')?.scrollIntoView({ behavior: 'smooth' });
  };

  const refineCampaign = async (instruction: string) => {
    if (!generatedCampaign) return;
    setRefining(true);
    try {
      // Re-generate with refinement instruction appended
      const refinementPrompt = `Mejora la campaña anterior siguiendo esta instrucción: ${instruction}. Mantén el mismo objetivo pero hazlo más efectivo.`;
      await generateWithAI(refinementPrompt);
    } finally {
      setRefining(false);
    }
  };

  const toggleChannel = (key: string) => {
    setAiChannels(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key) 
        : [...prev, key]
    );
  };

  const fetchAudience = async (reset = true) => {
    setAudienceLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('segment', segment);
      if (cityFilter) params.set('city', cityFilter);
      if (audienceSearch) params.set('search', audienceSearch);
      params.set('limit', '80');

      const res = await fetch(`/api/admin/marketing/audience?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAudience(data.sample || []);
        setAudienceTotal(data.total || 0);
        setAudienceReachable(data.reachable || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAudienceLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/admin/marketing/campaigns?limit=30');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        setCampaignsTotal(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Refresh audience when filters change
  useEffect(() => {
    const t = setTimeout(() => {
      fetchAudience(true);
    }, 300);
    return () => clearTimeout(t);
  }, [segment, cityFilter, audienceSearch]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const runDryRun = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Add a subject and message first');
      return;
    }
    try {
      const res = await fetch('/api/admin/marketing/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          segment,
          city: cityFilter || undefined,
          dryRun: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDryRunResult(data);
        toast.success(`Dry run: ${data.recipientCount} recipients would receive this`);
      } else {
        toast.error(data.error || 'Dry run failed');
      }
    } catch (e) {
      toast.error('Request failed');
    }
  };

  const sendTest = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message required');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/admin/marketing/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          testOnly: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Test email sent to you');
        setLastResult(data);
        fetchHistory();
      } else {
        toast.error(data.error || 'Test send failed');
      }
    } catch (e) {
      toast.error('Send failed');
    } finally {
      setSending(false);
    }
  };

  const sendBroadcast = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required');
      return;
    }

    const targetCount = dryRunResult?.recipientCount ?? audienceReachable ?? audienceTotal;

    if (!confirm(`Send this message to approximately ${targetCount} users?\n\nSegment: ${segment}${cityFilter ? ' • City: ' + cityFilter : ''}\n\nThis action is logged and respects user email + marketing preferences.`)) {
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/marketing/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          segment,
          city: cityFilter || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Broadcast sent to ${data.sent} users`);
        setLastResult(data);
        setSubject('');
        setMessage('');
        setDryRunResult(null);
        fetchHistory();
        fetchAudience(true);
      } else {
        toast.error(data.error || 'Broadcast failed');
      }
    } catch (e) {
      toast.error('Network error while sending');
    } finally {
      setSending(false);
    }
  };

  const exportAudienceCSV = () => {
    if (audience.length === 0) {
      toast.error('No audience data to export');
      return;
    }
    const headers = ['ID', 'Name', 'Email', 'Role', 'Business', 'City', 'Active', 'Joined'];
    const rows = audience.map(u => [
      u.id,
      u.name || '',
      u.email || '',
      u.role,
      u.businessName || '',
      u.city || '',
      u.isActive ? 'yes' : 'no',
      new Date(u.createdAt).toISOString().slice(0, 10),
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(r => {
      csv += r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-audience-${segment}${cityFilter ? '-' + cityFilter : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported audience CSV');
  };

  const presetMessage = (type: string) => {
    if (type === 'update') {
      setSubject('Actualización importante en OigaUsted');
      setMessage('Hola,\n\nEstamos realizando mejoras en la plataforma para ofrecerte una mejor experiencia.\n\nLos principales cambios incluyen:\n• Mejor rendimiento en búsqueda y carga de gigs\n• Nueva sección de notificaciones\n• Correcciones en el flujo de pagos\n\nGracias por ser parte de OigaUsted. Si tienes preguntas, responde a este correo o visita nuestro centro de soporte.\n\n— El equipo de OigaUsted');
    }
    if (type === 'promo') {
      setSubject('¡Promoción especial esta semana en OigaUsted!');
      setMessage('Hola,\n\nEsta semana tenemos una promoción para usuarios activos:\n\n• 10% de descuento en tu próxima comisión de servicio (aplica para órdenes completadas esta semana).\n\nExplora nuevos gigs o publica los tuyos con mayor visibilidad.\n\n¡No dejes pasar esta oportunidad!\n\n— OigaUsted');
    }
    if (type === 'info') {
      setSubject('Actualización de información de tu cuenta');
      setMessage('Hola,\n\nTe recordamos que puedes actualizar tu información de perfil, número de WhatsApp y datos de negocio en cualquier momento desde tu configuración de cuenta.\n\nMantener tus datos actualizados ayuda a que compradores y vendedores puedan contactarte fácilmente.\n\nSi necesitas ayuda, escríbenos a support@support.oigagig.com.\n\n— Equipo OigaUsted');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* HERO HEADER */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">AI Marketing Studio</h1>
              <p className="text-lg text-muted-foreground">El centro de comando más inteligente para promocionar OigaUsted</p>
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground max-w-xs">
          Genera contenido publicitario de alto rendimiento • Email + Social Ads • Envíos inteligentes • Todo en un solo lugar
        </div>
      </div>

      {/* ========== AI CAMPAIGN GENERATOR - THE STAR OF THE SHOW ========== */}
      <div className="bg-card border-2 border-orange-500/30 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="h-6 w-6 text-orange-500" />
          <div>
            <h2 className="text-2xl font-semibold">Generador de Campañas con IA</h2>
            <p className="text-sm text-muted-foreground">Crea en segundos copy para email, Instagram, Facebook, WhatsApp, X y más — optimizado para servicios locales en Colombia</p>
          </div>
        </div>

        {/* Quick Goals */}
        <div className="mb-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">Objetivos rápidos</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_GOALS.map((g, i) => (
              <button
                key={i}
                onClick={() => quickGenerate(g)}
                disabled={isGenerating}
                className="text-sm px-3 py-1.5 rounded-full border border-border hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition active:scale-[0.985]"
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Goal + Prompt */}
          <div className="lg:col-span-7 space-y-3">
            <div>
              <label className="text-sm font-medium">Objetivo de la campaña</label>
              <Input 
                value={aiGoal} 
                onChange={(e) => setAiGoal(e.target.value)} 
                placeholder="Ej: Reactivar compradores que no han pedido en 45 días" 
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Instrucciones adicionales (opcional)</label>
              <Textarea 
                value={aiCustomPrompt} 
                onChange={(e) => setAiCustomPrompt(e.target.value)} 
                rows={2} 
                placeholder="Enfocarse en plomeros y electricistas, tono de urgencia honesta, mencionar reseñas reales..." 
              />
            </div>
          </div>

          {/* Channels + Tone */}
          <div className="lg:col-span-5 space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Canales objetivo</label>
              <div className="flex flex-wrap gap-2">
                {CHANNEL_OPTIONS.map(ch => {
                  const Icon = ch.icon;
                  const active = aiChannels.includes(ch.key);
                  return (
                    <button
                      key={ch.key}
                      onClick={() => toggleChannel(ch.key)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${active ? 'bg-orange-600 text-white border-orange-600' : 'border-border hover:bg-muted'}`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {ch.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Tono</label>
              <select 
                value={aiTone} 
                onChange={(e) => setAiTone(e.target.value)}
                className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm"
              >
                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button 
            onClick={() => generateWithAI()} 
            disabled={isGenerating || (!aiGoal && !aiCustomPrompt)} 
            size="lg"
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8"
          >
            {isGenerating ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Generando con Grok...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generar Campaña Inteligente</>
            )}
          </Button>

          {generatedCampaign && (
            <>
              <Button variant="outline" onClick={() => generateWithAI()} disabled={isGenerating}>
                <RefreshCw className="h-4 w-4 mr-1.5" /> Regenerar
              </Button>
              <Button variant="outline" onClick={loadAiIntoComposer}>
                <Send className="h-4 w-4 mr-1.5" /> Cargar email en Broadcast
              </Button>
            </>
          )}
        </div>

        {/* GENERATED CAMPAIGN RESULTS - VERY RICH UI */}
        {generatedCampaign && (
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="uppercase text-[10px] tracking-[2px] text-orange-600 font-semibold">Campaña generada por IA</div>
                <h3 className="text-2xl font-semibold">{generatedCampaign.campaignName}</h3>
                <p className="text-sm text-muted-foreground">{generatedCampaign.objective}</p>
              </div>
              <div className="text-right text-xs">
                <div className="font-medium">Segmento recomendado</div>
                <div className="text-orange-600 font-semibold">{generatedCampaign.recommendedSegment}</div>
              </div>
            </div>

            <div className="text-xs bg-muted/70 rounded p-2 mb-4 text-muted-foreground">
              {generatedCampaign.segmentReason}
            </div>

            {/* Tabs for the generated content */}
            <div className="flex border-b mb-4 text-sm">
              {(['email', 'social', 'ads', 'visuals'] as const).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveAiTab(tab)}
                  className={`px-4 py-2 border-b-2 transition ${activeAiTab === tab ? 'border-orange-600 text-orange-600 font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  {tab === 'email' && 'Email / In-app'}
                  {tab === 'social' && 'Redes Sociales'}
                  {tab === 'ads' && 'Variaciones de Anuncios'}
                  {tab === 'visuals' && 'Prompts Visuales + Estrategia'}
                </button>
              ))}
            </div>

            {/* EMAIL TAB */}
            {activeAiTab === 'email' && (
              <div className="space-y-4">
                <div className="bg-background border rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xs text-muted-foreground">ASUNTO</div>
                      <div className="font-semibold text-lg">{generatedCampaign.email.subject}</div>
                      {generatedCampaign.email.previewText && <div className="text-xs text-muted-foreground">Preview: {generatedCampaign.email.previewText}</div>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyText(generatedCampaign.email.subject, 'Asunto')}><Copy className="h-3.5 w-3.5 mr-1" /> Copiar</Button>
                      <Button size="sm" onClick={loadAiIntoComposer}><Send className="h-3.5 w-3.5 mr-1" /> Usar en Broadcast</Button>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap border-t pt-3 mt-2 text-foreground/90">
                    {generatedCampaign.email.body}
                  </div>
                  {generatedCampaign.email.cta && <div className="mt-3 text-xs font-medium">CTA sugerido: <span className="text-orange-600">{generatedCampaign.email.cta}</span></div>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => refineCampaign("Haz el asunto más intrigante y con mayor tasa de apertura")}>Mejorar asunto</Button>
                  <Button size="sm" variant="outline" onClick={() => refineCampaign("Haz el cuerpo más corto, directo y con urgencia honesta")}>Versión más corta</Button>
                  <Button size="sm" variant="outline" onClick={() => refineCampaign("Agrega más énfasis en confianza, reseñas reales y profesionales locales")}>Más énfasis en confianza</Button>
                </div>
              </div>
            )}

            {/* SOCIAL TAB */}
            {activeAiTab === 'social' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(generatedCampaign.social).map(([platform, text]) => (
                  <div key={platform} className="bg-background border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold capitalize flex items-center gap-2">
                        {platform === 'instagram' && <Instagram className="h-4 w-4" />}
                        {platform === 'facebook' && <Facebook className="h-4 w-4" />}
                        {platform === 'x' && <Twitter className="h-4 w-4" />}
                        {platform === 'whatsapp' && <MessageCircle className="h-4 w-4" />}
                        {platform}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => copyText(text as string, platform)}><Copy className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="text-sm whitespace-pre-wrap text-foreground/90">{text as string}</div>
                  </div>
                ))}
                <div className="md:col-span-2 text-xs flex flex-wrap gap-1.5 items-center">
                  {generatedCampaign.hashtags.map((h, i) => (
                    <span key={i} className="px-2 py-0.5 bg-muted rounded text-[11px]">{h}</span>
                  ))}
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => copyText(generatedCampaign.hashtags.join(' '), 'Hashtags')}>Copiar hashtags</Button>
                </div>
              </div>
            )}

            {/* ADS VARIATIONS TAB */}
            {activeAiTab === 'ads' && (
              <div className="space-y-3">
                {generatedCampaign.adCopies.map((copy, idx) => (
                  <div key={idx} className="border bg-background rounded-2xl p-4 flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1">
                      <div className="font-semibold">{copy.headline}</div>
                      <div className="text-sm mt-1 text-foreground/90">{copy.body}</div>
                      <div className="text-xs mt-1 text-orange-600 font-medium">{copy.cta}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => copyText(`${copy.headline}\n\n${copy.body}\n\n${copy.cta}`)}>Copiar</Button>
                      <Button size="sm" onClick={() => useAdCopy(copy)}>Usar en Broadcast</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VISUALS + STRATEGY */}
            {activeAiTab === 'visuals' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="font-medium mb-2 flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Prompts para imágenes / ads creativos</div>
                  <div className="space-y-2">
                    {generatedCampaign.visualPrompts.map((p, i) => (
                      <div key={i} className="text-xs bg-muted p-3 rounded-xl border font-mono">{p}</div>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => copyText(generatedCampaign.visualPrompts.join('\n\n'), 'Prompts visuales')}>Copiar todos los prompts</Button>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <div className="font-medium mb-1 flex items-center gap-2"><Clock className="h-4 w-4" /> Mejores momentos</div>
                    <div className="text-muted-foreground">{generatedCampaign.bestTimes}</div>
                  </div>
                  <div>
                    <div className="font-medium mb-1 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Notas de estrategia</div>
                    <div className="text-muted-foreground whitespace-pre-wrap">{generatedCampaign.strategyNotes}</div>
                  </div>
                  {generatedCampaign.complianceTips && (
                    <div className="text-xs border-l-4 border-orange-500 pl-3 text-muted-foreground">
                      {generatedCampaign.complianceTips}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 text-[10px] text-muted-foreground">Todo el contenido fue generado por Grok (xAI) y está optimizado para el mercado colombiano de servicios locales.</div>
          </div>
        )}
      </div>

      {/* ========== MANUAL BROADCAST + AUDIENCE (existing power, now enhanced) ========== */}
      <div id="broadcast-composer" className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">Envío Manual + Audiencia <span className="text-xs px-2 py-0.5 rounded bg-muted font-normal">Clásico</span></h2>
            <p className="text-sm text-muted-foreground">Control total. También puedes cargar contenido desde el generador de IA de arriba.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => presetMessage('update')}>Actualización sistema</Button>
            <Button variant="outline" size="sm" onClick={() => presetMessage('promo')}>Promo</Button>
            <Button variant="outline" size="sm" onClick={() => presetMessage('info')}>Info cuenta</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Composer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Segmento</label>
              {generatedCampaign && (
                <Button size="sm" variant="ghost" onClick={() => {
                  // Try to give a hint
                  toast.info(`IA recomienda: ${generatedCampaign.recommendedSegment}`);
                }}>Ver recomendación IA</Button>
              )}
            </div>
            <select value={segment} onChange={(e) => setSegment(e.target.value)} className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm">
              {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            <div>
              <label className="text-sm font-medium">Filtro por ciudad (opcional)</label>
              <Input value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="Bucaramanga, Floridablanca..." />
            </div>

            <div>
              <div className="flex justify-between">
                <label className="text-sm font-medium">Asunto</label>
                {subject && <Button size="sm" variant="ghost" onClick={() => refineCampaign(`Mejora este asunto actual: "${subject}"`)}><Sparkles className="h-3 w-3 mr-1" /> Pulir con IA</Button>}
              </div>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto potente..." />
            </div>

            <div>
              <div className="flex justify-between">
                <label className="text-sm font-medium">Mensaje</label>
                {message && <Button size="sm" variant="ghost" onClick={() => refineCampaign(`Reescribe y mejora este mensaje: "${message.slice(0,120)}..."`)}><Sparkles className="h-3 w-3 mr-1" /> Mejorar con IA</Button>}
              </div>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} placeholder="Cuerpo del mensaje..." />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={runDryRun} variant="outline" disabled={sending || !subject || !message}>Dry Run</Button>
              <Button onClick={sendTest} variant="outline" disabled={sending || !subject || !message}>Enviar prueba a mí</Button>
              <Button onClick={sendBroadcast} disabled={sending || !subject || !message} className="bg-orange-600 hover:bg-orange-700 flex-1 md:flex-none">
                {sending ? 'Enviando...' : 'Enviar Broadcast'}
              </Button>
            </div>

            {dryRunResult && <div className="text-xs p-3 bg-muted rounded border">Dry run: <strong>{dryRunResult.recipientCount}</strong> destinatarios para el segmento actual.</div>}
            {lastResult && <div className="text-xs text-green-600">Última acción: {lastResult.message}</div>}
          </div>

          {/* Audience summary */}
          <div className="border rounded-2xl p-5 bg-background text-sm">
            <div className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Audiencia actual (en vivo)</div>
            <div className="text-5xl font-semibold tabular-nums tracking-tighter">{audienceReachable.toLocaleString()}</div>
            <div className="text-muted-foreground">alcanzables (email + marketing activado)</div>
            <div className="text-xs mt-1">Total que coincide con filtros: {audienceTotal.toLocaleString()}</div>

            <div className="my-4 h-px bg-border" />

            <div className="text-xs space-y-1 text-muted-foreground">
              <div>• Respeta preferencias de email y marketingEmails</div>
              <div>• Los blasts de marketing omiten quiet hours intencionalmente</div>
              <div>• Todo queda registrado en Auditoría + MarketingCampaign</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAILING LIST */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-semibold">Lista de Correo / Audiencia Objetivo</h2>
            <p className="text-sm text-muted-foreground">{audienceTotal} coincidencias • {audienceReachable} con email marketing activo</p>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Buscar nombre, email..." value={audienceSearch} onChange={e => setAudienceSearch(e.target.value)} className="w-60" />
            <Button variant="outline" size="sm" onClick={exportAudienceCSV}>Exportar CSV</Button>
            <Button variant="outline" size="sm" onClick={() => fetchAudience(true)} disabled={audienceLoading}>Actualizar</Button>
          </div>
        </div>

        <div className="border rounded-2xl overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="p-3 text-left font-medium">Usuario</th>
                <th className="p-3 text-left font-medium">Email</th>
                <th className="p-3 text-left font-medium">Rol / Ciudad</th>
                <th className="p-3 text-left font-medium">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {audience.length === 0 && !audienceLoading && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No hay usuarios que coincidan.</td></tr>}
              {audience.map(u => (
                <tr key={u.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{u.name || '—'}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 text-xs">{u.role} {u.city ? `· ${u.city}` : ''}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* HISTORY */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Historial de Campañas ({campaignsTotal})</h2>
          <Button variant="outline" size="sm" onClick={fetchHistory} disabled={historyLoading}>Refrescar</Button>
        </div>
        <div className="border rounded-2xl overflow-hidden bg-card text-sm">
          <table className="w-full">
            <thead className="bg-muted/60">
              <tr>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Asunto</th>
                <th className="p-3 text-left">Segmento</th>
                <th className="p-3 text-right">Destinatarios</th>
                <th className="p-3 text-left">Enviado por</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aún no has enviado campañas.</td></tr>}
              {campaigns.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString('es-CO')}</td>
                  <td className="p-3 font-medium">{c.subject}</td>
                  <td className="p-3"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.segment}</code></td>
                  <td className="p-3 text-right font-semibold">{c.recipientCount}</td>
                  <td className="p-3 text-sm text-muted-foreground">{c.sentBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground pt-4">
        Todas las campañas quedan registradas. Los usuarios pueden darse de baja de marketing desde sus preferencias de notificaciones.
      </div>
    </div>
  );
}