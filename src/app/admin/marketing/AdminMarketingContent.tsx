'use client';

import { useState, useEffect, useTransition, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Sparkles, Copy, Send, Users, Instagram, Facebook, 
  Twitter, MessageCircle, Image as ImageIcon, Clock, TrendingUp,
  RefreshCw, X, Mail, Lightbulb, Package, ShoppingCart, AlertCircle,
  BookOpen, CreditCard, Star, Loader2
} from 'lucide-react';
import type { GeneratedCampaign } from '@/lib/marketing-campaign-types';
import { normalizeGeneratedCampaign } from '@/lib/marketing-campaign-types';
import { mapRecommendedSegment } from '@/lib/marketing-segment-map';
import {
  COLOMBIA_CITIES,
  COLOMBIA_NATIONAL_SCOPE,
  citiesByRegion,
} from '@/lib/colombia-cities';
import {
  SELLER_BUYER_TOOLKIT_CAMPAIGN,
  sellerToolkitAsGeneratedCampaign,
} from '@/lib/seller-buyer-toolkit-campaign';

interface AudienceUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  businessName: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
  emailReachable?: boolean;
}

type RecipientMode = 'segment' | 'user';

interface Campaign {
  id: string;
  subject: string;
  segment: string;
  recipientCount: number;
  sentBy: string;
  createdAt: string;
}

interface PlaybookSummary {
  id: string;
  label: string;
  description: string;
  category?: 'acquisition' | 'retention' | 'seller';
  roleFilter?: 'seller' | 'buyer';
  segment: string;
  defaultCta: string;
  defaultCtaUrl: string;
  automatable?: boolean;
  total: number;
  reachable: number;
}

interface BuyerFunnel {
  totalBuyers: number;
  noOrders: number;
  onePlusOrders: number;
  repeatBuyers: number;
}

const PLAYBOOK_ICONS: Record<string, typeof Package> = {
  'buyers-new-signup': Users,
  'buyers-no-orders': ShoppingCart,
  'buyers-abandoned-checkout': CreditCard,
  'buyers-one-order-lapsed': Clock,
  'buyers-repeat-active': TrendingUp,
  'buyers-no-active-orders': Users,
  'buyers-pending-review': Star,
  'sellers-get-buyers-toolkit': Lightbulb,
  'sellers-no-gigs': Package,
  'sellers-new-no-gig': BookOpen,
  'sellers-paused-gigs': AlertCircle,
  'sellers-no-payout': CreditCard,
};

const SELLER_QUICK_GOAL = {
  goal: 'Enseñar a vendedores cómo conseguir compradores con todas las herramientas OigaGIG',
  focus: 'both' as const,
};

const QUICK_GOALS = [
  { goal: 'Adquirir compradores nuevos registrados sin primer pedido', focus: 'acquisition' as const },
  { goal: 'Convertir compradores registrados a su primer pedido', focus: 'acquisition' as const },
  { goal: 'Reactivar compradores con 1 pedido que no vuelven a comprar', focus: 'retention' as const },
  { goal: 'Impulsar segunda compra en compradores activos', focus: 'retention' as const },
  { goal: 'Campaña nacional: confianza y reseñas en todo Colombia', focus: 'both' as const },
  { goal: 'Recuperar checkouts abandonados en los últimos 7 días', focus: 'acquisition' as const },
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
  { value: 'all', label: 'Todos los usuarios activos' },
  { value: 'buyers', label: 'Solo compradores' },
  { value: 'sellers', label: 'Solo vendedores' },
  { value: 'active', label: 'Activos últimos 30 días' },
  { value: 'inactive', label: 'Cuentas inactivas' },
];

export default function AdminMarketingContent() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [segment, setSegment] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('segment');
  const [selectedUser, setSelectedUser] = useState<AudienceUser | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerResults, setPickerResults] = useState<AudienceUser[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);

  // Audience / mailing list
  const [audience, setAudience] = useState<AudienceUser[]>([]);
  const [audienceTotal, setAudienceTotal] = useState(0);
  const [audienceReachable, setAudienceReachable] = useState(0);
  const [audienceLoading, setAudienceLoading] = useState(true);
  const [audienceSearch, setAudienceSearch] = useState('');

  // History
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsTotal, setCampaignsTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Dry run preview
  const [dryRunResult, setDryRunResult] = useState<Record<string, unknown> | null>(null);

  // ========== AI MARKETING STUDIO STATE ==========
  const [aiGoal, setAiGoal] = useState('');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiChannels, setAiChannels] = useState<string[]>(['email', 'instagram', 'facebook']);
  const [aiTone, setAiTone] = useState('cercano y confiable');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCampaign, setGeneratedCampaign] = useState<GeneratedCampaign | null>(null);
  const [activeAiTab, setActiveAiTab] = useState<'email' | 'social' | 'ads' | 'visuals'>('email');
  const [refining, setRefining] = useState(false);
  const [apiWarning, setApiWarning] = useState<string | null>(null);
  const [, startCampaignTransition] = useTransition();
  const [, startDataTransition] = useTransition();
  const generateRequestId = useRef(0);

  // Playbooks
  const [playbooks, setPlaybooks] = useState<PlaybookSummary[]>([]);
  const [playbooksLoading, setPlaybooksLoading] = useState(true);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(null);
  const [generatingPlaybookId, setGeneratingPlaybookId] = useState<string | null>(null);
  const [lifecycleDryRun, setLifecycleDryRun] = useState<Record<string, unknown> | null>(null);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [sellerBlastLoading, setSellerBlastLoading] = useState(false);
  const [sellerBlastResult, setSellerBlastResult] = useState<Record<string, unknown> | null>(null);
  const [aiTargetCity, setAiTargetCity] = useState('');
  const [aiTargetScope, setAiTargetScope] = useState<'national' | 'city'>('national');
  const [aiBuyerFocus, setAiBuyerFocus] = useState<'acquisition' | 'retention' | 'both'>('both');
  const [playbookCityFilter, setPlaybookCityFilter] = useState('');
  const [buyerFunnel, setBuyerFunnel] = useState<BuyerFunnel | null>(null);
  const [estimatedAudience, setEstimatedAudience] = useState<number | null>(null);
  const [paintReady, setPaintReady] = useState(false);

  const cityRegions = useMemo(() => citiesByRegion(), []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPaintReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const AUTOMATED_PLAYBOOK_IDS = new Set([
    'buyers-new-signup',
    'buyers-no-orders',
    'buyers-abandoned-checkout',
    'buyers-one-order-lapsed',
    'sellers-new-no-gig',
    'sellers-get-buyers-toolkit',
  ]);

  // ========== AI GENERATION ==========
  const generateWithAI = async (extraPrompt?: string) => {
    const requestId = ++generateRequestId.current;
    setIsGenerating(true);
    try {
      const payload = {
        goal: aiGoal || aiCustomPrompt || "Promocionar OigaGIG y conectar más usuarios con servicios locales en Colombia",
        prompt: extraPrompt || aiCustomPrompt,
        channels: aiChannels,
        segmentHint: segment,
        tone: aiTone,
        language: 'es',
        variations: 4,
        targetCity: aiTargetScope === 'city' ? aiTargetCity : undefined,
        targetScope: aiTargetScope,
        buyerFocus: aiBuyerFocus,
      };

      const res = await fetch('/api/admin/marketing/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (requestId !== generateRequestId.current) return;

      if (data.success && data.campaign) {
        const normalized = normalizeGeneratedCampaign(
          data.campaign as Record<string, unknown>,
          aiGoal || aiCustomPrompt || 'Promocionar OigaGIG',
        );
        startCampaignTransition(() => {
          setGeneratedCampaign(normalized);
          setActiveAiTab('email');
        });
        void fetchEstimatedAudience(normalized.recommendedSegment);
        window.setTimeout(() => {
          toast.success(data.fallback ? 'Campaña de respaldo generada' : 'Campaña generada con IA');
        }, 0);
      } else {
        toast.error('No se pudo generar la campaña');
      }
    } catch (e) {
      toast.error('Error conectando con el generador de IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const applyQuickGoal = (goal: string, focus: 'acquisition' | 'retention' | 'both' = 'both') => {
    setAiGoal(goal);
    setAiCustomPrompt('');
    setAiBuyerFocus(focus);
    toast.success('Objetivo cargado — revisa alcance, canales y tono, luego pulsa Generar');
  };

  const applySellerQuickGoal = () => {
    setAiGoal(SELLER_QUICK_GOAL.goal);
    setAiCustomPrompt('');
    toast.success('Objetivo cargado — revisa alcance, canales y tono, luego pulsa Generar');
  };

  const fetchEstimatedAudience = async (recommendedSegment?: string) => {
    if (!recommendedSegment) {
      setEstimatedAudience(null);
      return;
    }
    try {
      const mapped = mapRecommendedSegment(recommendedSegment);
      const params = new URLSearchParams();
      params.set('segment', mapped.segment);
      const city = mapped.city || (aiTargetScope === 'city' ? aiTargetCity : '');
      if (city) params.set('city', city);
      params.set('limit', '1');
      const res = await fetch(`/api/admin/marketing/audience?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) setEstimatedAudience(data.reachable ?? null);
    } catch {
      setEstimatedAudience(null);
    }
  };

  const applyAiSegment = (recommendedSegment?: string, silent = false) => {
    const text = recommendedSegment ?? generatedCampaign?.recommendedSegment;
    if (!text) return;
    if (text.startsWith('playbook:')) {
      setSegment(text);
      setSelectedPlaybookId(text.replace('playbook:', ''));
      if (!silent) toast.success(`Playbook aplicado: ${text.replace('playbook:', '')}`);
      return;
    }
    const mapped = mapRecommendedSegment(text);
    setSegment(mapped.segment);
    setSelectedPlaybookId(null);
    const cityToApply = mapped.city || (aiTargetScope === 'city' ? aiTargetCity : '');
    if (cityToApply) setCityFilter(cityToApply);
    if (!silent) {
      toast.success(`Segmento aplicado: ${mapped.segment}${cityToApply ? ` · ${cityToApply}` : ''}`);
    }
  };

  const loadAiIntoComposer = () => {
    if (!generatedCampaign) return;
    setSubject(generatedCampaign.email.subject);
    setMessage(generatedCampaign.email.body);
    applyAiSegment(generatedCampaign.recommendedSegment, true);
    setRecipientMode('segment');
    document.getElementById('broadcast-composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast.success('Email y segmento cargados en el compositor');
  };

  const selectUserForSend = (user: AudienceUser) => {
    setSelectedUser(user);
    setRecipientMode('user');
    setPickerSearch('');
    setPickerResults([]);
    document.getElementById('broadcast-composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast.success(`Destinatario: ${user.name || user.email}`);
  };

  const buildBroadcastBody = (extra: { dryRun?: boolean; testOnly?: boolean } = {}) => {
    const base = {
      subject: subject.trim(),
      message: message.trim(),
      ...extra,
    };
    if (extra.testOnly) return base;
    if (recipientMode === 'user' && selectedUser) {
      return { ...base, userIds: [selectedUser.id] };
    }
    return {
      ...base,
      segment,
      city: cityFilter || undefined,
      playbookId: selectedPlaybookId || undefined,
    };
  };

  const fetchPlaybooks = async () => {
    setPlaybooksLoading(true);
    try {
      const params = new URLSearchParams();
      if (playbookCityFilter) params.set('city', playbookCityFilter);
      const qs = params.toString();
      const res = await fetch(`/api/admin/marketing/playbooks${qs ? `?${qs}` : ''}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        startDataTransition(() => {
          setPlaybooks(data.playbooks || []);
          setBuyerFunnel(data.buyerFunnel || null);
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPlaybooksLoading(false);
    }
  };

  const selectPlaybook = (playbook: PlaybookSummary) => {
    setSelectedPlaybookId(playbook.id);
    setSegment(playbook.segment);
    setRecipientMode('segment');
    setSelectedUser(null);
    document.getElementById('broadcast-composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast.success(`Playbook: ${playbook.label} (${playbook.reachable} alcanzables)`);
  };

  const runSellerToolkitBlast = async (dryRun = false) => {
    if (!dryRun && !confirm('¿Enviar la guía de compradores a TODOS los vendedores que aún no la recibieron?')) {
      return;
    }
    setSellerBlastLoading(true);
    try {
      const res = await fetch(`/api/admin/marketing/seller-toolkit-blast?dryRun=${dryRun}`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSellerBlastResult(data);
        toast.success(data.message || (dryRun ? 'Vista previa lista' : 'Campaña enviada'));
      } else {
        toast.error(data.error || 'No se pudo ejecutar el envío');
      }
    } catch {
      toast.error('Error al conectar con el envío masivo');
    } finally {
      setSellerBlastLoading(false);
    }
  };

  const runLifecycleDryRun = async () => {
    setLifecycleLoading(true);
    try {
      const res = await fetch('/api/notifications/lifecycle?dryRun=true', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setLifecycleDryRun(data);
        toast.success(data.message || 'Vista previa del cron listo');
      } else {
        toast.error(data.error || 'No se pudo ejecutar la vista previa');
      }
    } catch {
      toast.error('Error al conectar con el cron de nudges');
    } finally {
      setLifecycleLoading(false);
    }
  };

  const generatePlaybookCopy = async (playbook: PlaybookSummary) => {
    setGeneratingPlaybookId(playbook.id);
    setSelectedPlaybookId(playbook.id);
    setSegment(playbook.segment);
    setRecipientMode('segment');
    try {
      const res = await fetch('/api/admin/marketing/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: playbook.label,
          channels: ['email'],
          playbookId: playbook.id,
          tone: 'cercano y confiable',
          language: 'es',
          variations: 1,
        }),
      });
      const data = await res.json();
      if (data.success && data.campaign?.email) {
        setSubject(data.campaign.email.subject);
        setMessage(data.campaign.email.body);
        document.getElementById('broadcast-composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        toast.success(data.fallback ? 'Copy de respaldo cargado' : 'Copy educativo generado');
      } else {
        toast.error('No se pudo generar el copy');
      }
    } catch {
      toast.error('Error conectando con la IA');
    } finally {
      setGeneratingPlaybookId(null);
    }
  };

  const copyText = (text: string, label = 'Texto') => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copiado al portapapeles`);
    });
  };

  const applyAdCopy = (copy: { headline: string; body: string; cta: string }) => {
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
      const refinementPrompt = `Mejora la campaña anterior siguiendo esta instrucción: ${instruction}. Mantén el mismo objetivo pero hazlo más efectivo.`;
      await generateWithAI(refinementPrompt);
    } finally {
      setRefining(false);
    }
  };

  const polishComposerWithAI = async (field: 'subject' | 'message', instruction: string) => {
    if (!subject.trim() && !message.trim()) {
      toast.error('Escribe un asunto o mensaje primero');
      return;
    }
    setPolishing(true);
    try {
      const context = `Asunto actual: "${subject}"\n\nMensaje actual:\n${message}`;
      const payload = {
        goal: aiGoal || 'Mejorar copy de email de marketing',
        prompt: `${instruction}\n\n${context}`,
        channels: ['email'],
        segmentHint: segment,
        tone: aiTone,
        language: 'es',
        variations: 1,
      };

      const res = await fetch('/api/admin/marketing/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.campaign?.email) {
        if (field === 'subject' && data.campaign.email.subject) {
          setSubject(data.campaign.email.subject);
        }
        if (field === 'message' && data.campaign.email.body) {
          setMessage(data.campaign.email.body);
        }
        toast.success(field === 'subject' ? 'Asunto mejorado' : 'Mensaje mejorado');
      } else {
        toast.error('No se pudo mejorar el texto');
      }
    } catch {
      toast.error('Error conectando con la IA');
    } finally {
      setPolishing(false);
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
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        startDataTransition(() => {
          setAudience(data.sample || []);
          setAudienceTotal(data.total || 0);
          setAudienceReachable(data.reachable || 0);
          if (data.tableMissing) {
            setApiWarning('La tabla de audiencia aún no está sincronizada en producción. Los envíos seguirán funcionando.');
          }
        });
      } else {
        setApiWarning(data.error || 'No se pudo cargar la audiencia.');
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
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        startDataTransition(() => {
          setCampaigns(data.campaigns || []);
          setCampaignsTotal(data.total || 0);
          if (data.tableMissing) {
            setApiWarning('El historial de campañas aún no está disponible hasta que termine la migración de base de datos.');
          }
        });
      } else {
        setApiWarning(data.error || 'No se pudo cargar el historial de campañas.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!paintReady) return;
    const t = setTimeout(() => {
      fetchAudience(true);
    }, 300);
    return () => clearTimeout(t);
  }, [paintReady, segment, cityFilter, audienceSearch]);

  useEffect(() => {
    if (recipientMode !== 'user') return;
    if (!pickerSearch.trim()) {
      setPickerResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setPickerLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('segment', 'all');
        params.set('search', pickerSearch.trim());
        params.set('limit', '10');
        const res = await fetch(`/api/admin/marketing/audience?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok) setPickerResults(data.sample || []);
      } finally {
        setPickerLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [pickerSearch, recipientMode]);

  useEffect(() => {
    setDryRunResult(null);
  }, [segment, cityFilter, recipientMode, selectedUser?.id]);

  useEffect(() => {
    if (!paintReady) return;
    fetchHistory();
  }, [paintReady]);

  useEffect(() => {
    if (!paintReady) return;
    fetchPlaybooks();
  }, [paintReady, playbookCityFilter]);

  const runDryRun = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Agrega asunto y mensaje primero');
      return;
    }
    if (recipientMode === 'user' && !selectedUser) {
      toast.error('Selecciona un usuario destinatario');
      return;
    }
    try {
      const res = await fetch('/api/admin/marketing/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBroadcastBody({ dryRun: true })),
      });
      const data = await res.json();
      if (res.ok) {
        setDryRunResult(data);
        toast.success(`Simulación: ${data.recipientCount} destinatario(s)`);
      } else {
        toast.error(data.error || 'La simulación falló');
      }
    } catch {
      toast.error('Error en la solicitud');
    }
  };

  const sendTest = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Asunto y mensaje son obligatorios');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/admin/marketing/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBroadcastBody({ testOnly: true })),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Correo de prueba enviado');
        setLastResult(data);
        fetchHistory();
      } else {
        toast.error(data.error || 'El envío de prueba falló');
      }
    } catch {
      toast.error('Error al enviar');
    } finally {
      setSending(false);
    }
  };

  const sendBroadcast = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Asunto y mensaje son obligatorios');
      return;
    }
    if (recipientMode === 'user' && !selectedUser) {
      toast.error('Selecciona un usuario destinatario');
      return;
    }

    const isSingleUser = recipientMode === 'user' && selectedUser;
    const targetCount = isSingleUser
      ? (dryRunResult?.recipientCount ?? (selectedUser.emailReachable === false ? 0 : 1))
      : (dryRunResult?.recipientCount ?? audienceReachable ?? audienceTotal);

    const confirmMsg = isSingleUser
      ? `¿Enviar este mensaje a ${selectedUser.name || 'usuario'} (${selectedUser.email})?\n\nSe respeta preferencias de email y marketing.`
      : `¿Enviar este mensaje a aproximadamente ${targetCount} usuarios?\n\nSegmento: ${segment}${cityFilter ? ' · Ciudad: ' + cityFilter : ''}\n\nSe registra en auditoría y respeta preferencias de email.`;

    if (!confirm(confirmMsg)) return;

    setSending(true);
    try {
      const res = await fetch('/api/admin/marketing/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBroadcastBody()),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Enviado a ${data.sent} destinatario(s)`);
        setLastResult(data);
        if (!isSingleUser) {
          setSubject('');
          setMessage('');
        }
        setDryRunResult(null);
        fetchHistory();
        fetchAudience(true);
      } else {
        toast.error(data.error || 'El envío falló');
      }
    } catch {
      toast.error('Error de red al enviar');
    } finally {
      setSending(false);
    }
  };

  const exportAudienceCSV = () => {
    if (audience.length === 0) {
      toast.error('No hay datos de audiencia para exportar');
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
    toast.success('Muestra CSV exportada');
  };

  const loadSellerToolkitCampaign = (scrollTo: 'broadcast' | 'social' | 'top' = 'broadcast') => {
    const c = SELLER_BUYER_TOOLKIT_CAMPAIGN;
    setSubject(c.subject);
    setMessage(c.body);
    setSegment('playbook:sellers-get-buyers-toolkit');
    setSelectedPlaybookId('sellers-get-buyers-toolkit');
    setRecipientMode('segment');
    setSelectedUser(null);
    setAiGoal(c.objective);
    startCampaignTransition(() => {
      setGeneratedCampaign(sellerToolkitAsGeneratedCampaign());
      setActiveAiTab(scrollTo === 'social' ? 'social' : 'email');
    });
    if (scrollTo === 'social') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Copy Instagram + WhatsApp cargado — pestaña Redes Sociales');
    } else {
      document.getElementById('broadcast-composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast.success('Campaña vendedores cargada — email + redes en el generador');
    }
  };

  const presetMessage = (type: string) => {
    if (type === 'seller-toolkit') {
      loadSellerToolkitCampaign();
      return;
    }
    if (type === 'update') {
      setSubject('Actualización importante en OigaGIG');
      setMessage('Hola,\n\nEstamos realizando mejoras en la plataforma para ofrecerte una mejor experiencia.\n\nLos principales cambios incluyen:\n• Mejor rendimiento en búsqueda y carga de gigs\n• Nueva sección de notificaciones\n• Correcciones en el flujo de pagos\n\nGracias por ser parte de OigaGIG. Si tienes preguntas, responde a este correo o visita nuestro centro de soporte.\n\n— El equipo de OigaGIG');
    }
    if (type === 'promo') {
      setSubject('¡Promoción especial esta semana en OigaGIG!');
      setMessage('Hola,\n\nEsta semana tenemos una promoción para usuarios activos:\n\n• 10% de descuento en tu próxima comisión de servicio (aplica para órdenes completadas esta semana).\n\nExplora nuevos gigs o publica los tuyos con mayor visibilidad.\n\n¡No dejes pasar esta oportunidad!\n\n— OigaGIG');
    }
    if (type === 'info') {
      setSubject('Actualización de información de tu cuenta');
      setMessage('Hola,\n\nTe recordamos que puedes actualizar tu información de perfil, número de WhatsApp y datos de negocio en cualquier momento desde tu configuración de cuenta.\n\nMantener tus datos actualizados ayuda a que compradores y vendedores puedan contactarte fácilmente.\n\nSi necesitas ayuda, escríbenos a support@oigagig.com.\n\n— Equipo OigaGIG');
    }
  };

  if (!paintReady) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12 animate-pulse">
        <p className="text-sm text-muted-foreground">Preparando Marketing Studio…</p>
        <div className="h-72 rounded-2xl bg-muted/60" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12 overflow-x-hidden">
      {/* HERO HEADER */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shrink-0">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight">AI Marketing Studio</h1>
              <p className="text-sm sm:text-lg text-muted-foreground">El centro de comando más inteligente para promocionar OigaGIG</p>
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground max-w-xs">
          Genera contenido publicitario de alto rendimiento • Email + Social Ads • Envíos inteligentes • Todo en un solo lugar
        </div>
      </div>

      {apiWarning && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          {apiWarning}
        </div>
      )}

      {/* ========== AI CAMPAIGN GENERATOR - THE STAR OF THE SHOW ========== */}
      <div className="bg-card border-2 border-orange-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="flex items-start sm:items-center gap-3 mb-6">
          <Sparkles className="h-6 w-6 text-orange-500 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-semibold">Generador de Campañas con IA</h2>
            <p className="text-sm text-muted-foreground">Crea en segundos copy para email, Instagram, Facebook, WhatsApp, X y más — optimizado para servicios locales en Colombia</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          <div className="lg:col-span-4">
            <label className="text-sm font-medium">Alcance geográfico</label>
            <select
              value={aiTargetScope}
              onChange={(e) => {
                const scope = e.target.value as 'national' | 'city';
                setAiTargetScope(scope);
                if (scope === 'national') setAiTargetCity('');
              }}
              className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm mt-1"
            >
              <option value="national">{COLOMBIA_NATIONAL_SCOPE}</option>
              <option value="city">Ciudad específica</option>
            </select>
          </div>
          {aiTargetScope === 'city' && (
            <div className="lg:col-span-4">
              <label className="text-sm font-medium">Ciudad</label>
              <select
                value={aiTargetCity}
                onChange={(e) => setAiTargetCity(e.target.value)}
                className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm mt-1"
              >
                <option value="">Seleccionar ciudad...</option>
                {Object.entries(cityRegions).map(([region, cities]) => (
                  <optgroup key={region} label={region}>
                    {cities.map((c) => (
                      <option key={c.id} value={c.slug}>{c.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
          <div className="lg:col-span-4">
            <label className="text-sm font-medium">Enfoque compradores</label>
            <select
              value={aiBuyerFocus}
              onChange={(e) => setAiBuyerFocus(e.target.value as 'acquisition' | 'retention' | 'both')}
              className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm mt-1"
            >
              <option value="both">Adquisición + retención</option>
              <option value="acquisition">Nuevos compradores (sin pedido)</option>
              <option value="retention">Compradores activos (re-compra)</option>
            </select>
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

        {/* Quick goals — populate form only; generation requires explicit button click */}
        <div className="mt-5 pt-5 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">
            Los objetivos rápidos solo cargan el formulario. Ajusta alcance, canales y tono antes de generar.
          </p>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">Objetivos rápidos — compradores</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_GOALS.map((g, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyQuickGoal(g.goal, g.focus)}
                disabled={isGenerating}
                className="text-sm px-3 py-1.5 rounded-full border border-border hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition active:scale-[0.985]"
              >
                {g.goal}
              </button>
            ))}
          </div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-4 mb-2 font-medium">Vendedores</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadSellerToolkitCampaign('top')}
              className="text-sm px-3 py-1.5 rounded-full border border-blue-300 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
            >
              Guía completa: conseguir compradores (email + IG + WhatsApp)
            </button>
            <button
              type="button"
              onClick={applySellerQuickGoal}
              disabled={isGenerating}
              className="text-sm px-3 py-1.5 rounded-full border border-border hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition"
            >
              {SELLER_QUICK_GOAL.goal}
            </button>
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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="min-w-0">
                <div className="uppercase text-[10px] tracking-[2px] text-orange-600 font-semibold">Campaña generada por IA</div>
                <h3 className="text-xl sm:text-2xl font-semibold break-words">{generatedCampaign.campaignName}</h3>
                <p className="text-sm text-muted-foreground">{generatedCampaign.objective}</p>
              </div>
              <div className="text-left sm:text-right text-xs shrink-0 space-y-1">
                <div>
                  <div className="font-medium">Segmento recomendado</div>
                  <div className="text-orange-600 font-semibold">{generatedCampaign.recommendedSegment}</div>
                </div>
                {estimatedAudience != null && (
                  <div className="text-muted-foreground">
                    ~<strong className="text-foreground">{estimatedAudience}</strong> alcanzables
                  </div>
                )}
                <Button size="sm" variant="outline" className="mt-1" onClick={() => applyAiSegment()}>
                  Aplicar segmento + ciudad
                </Button>
              </div>
            </div>

            <div className="text-xs bg-muted/70 rounded p-2 mb-4 text-muted-foreground">
              {generatedCampaign.segmentReason}
            </div>

            {/* Tabs for the generated content */}
            <div className="flex overflow-x-auto border-b mb-4 text-sm -mx-1 px-1 scrollbar-none">
              {(['email', 'social', 'ads', 'visuals'] as const).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveAiTab(tab)}
                  className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-2 border-b-2 transition ${activeAiTab === tab ? 'border-orange-600 text-orange-600 font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  {tab === 'email' && <><span className="sm:hidden">Email</span><span className="hidden sm:inline">Email / In-app</span></>}
                  {tab === 'social' && <><span className="sm:hidden">Social</span><span className="hidden sm:inline">Redes Sociales</span></>}
                  {tab === 'ads' && <><span className="sm:hidden">Anuncios</span><span className="hidden sm:inline">Variaciones de Anuncios</span></>}
                  {tab === 'visuals' && <><span className="sm:hidden">Visuales</span><span className="hidden sm:inline">Prompts Visuales + Estrategia</span></>}
                </button>
              ))}
            </div>

            {/* EMAIL TAB */}
            <div className={activeAiTab === 'email' ? 'space-y-4' : 'hidden'}>
                <div className="bg-background border rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-2">
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">ASUNTO</div>
                      <div className="font-semibold text-base sm:text-lg break-words">{generatedCampaign.email.subject}</div>
                      {generatedCampaign.email.previewText && <div className="text-xs text-muted-foreground break-words">Preview: {generatedCampaign.email.previewText}</div>}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
                      <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => copyText(generatedCampaign.email.subject, 'Asunto')}><Copy className="h-3.5 w-3.5 mr-1" /> Copiar</Button>
                      <Button size="sm" className="w-full sm:w-auto" onClick={loadAiIntoComposer}><Send className="h-3.5 w-3.5 mr-1" /> Usar en Broadcast</Button>
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

            {/* SOCIAL TAB */}
            <div className={activeAiTab === 'social' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'hidden'}>
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

            {/* ADS VARIATIONS TAB */}
            <div className={activeAiTab === 'ads' ? 'space-y-3' : 'hidden'}>
                {generatedCampaign.adCopies.map((copy, idx) => (
                  <div key={idx} className="border bg-background rounded-2xl p-4 flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1">
                      <div className="font-semibold">{copy.headline}</div>
                      <div className="text-sm mt-1 text-foreground/90">{copy.body}</div>
                      <div className="text-xs mt-1 text-orange-600 font-medium">{copy.cta}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => copyText(`${copy.headline}\n\n${copy.body}\n\n${copy.cta}`)}>Copiar</Button>
                      <Button size="sm" onClick={() => applyAdCopy(copy)}>Usar en Broadcast</Button>
                    </div>
                  </div>
                ))}
            </div>

            {/* VISUALS + STRATEGY */}
            <div className={activeAiTab === 'visuals' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'hidden'}>
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

            <div className="mt-5 text-[10px] text-muted-foreground">Todo el contenido fue generado por Grok (xAI) y está optimizado para el mercado colombiano de servicios locales.</div>
          </div>
        )}
      </div>

      {/* ========== SMART PLAYBOOKS ========== */}
      <div className="bg-card border-2 border-orange-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-semibold flex flex-wrap items-center gap-2">
              <Lightbulb className="h-5 w-5 text-orange-500 shrink-0" />
              Playbooks Inteligentes
              <span className="text-xs px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-normal">Nuevo</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Audiencias por comportamiento real — adquisición de compradores nuevos y retención de quienes ya compraron. Un clic genera copy educativo.
            </p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Cron diario (9:00 AM Colombia): compradores día 1/7/checkout/45d · vendedor sin gig día 3 · guía conseguir compradores día 7+ (75/día)
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={runLifecycleDryRun} disabled={lifecycleLoading}>
              {lifecycleLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
              Vista previa cron
            </Button>
            <Button variant="outline" size="sm" onClick={fetchPlaybooks} disabled={playbooksLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${playbooksLoading ? 'animate-spin' : ''}`} />
              Actualizar conteos
            </Button>
          </div>
        </div>

        {buyerFunnel && (
          <div className="mb-4 rounded-xl border border-border bg-muted/20 px-4 py-3">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">
              Embudo compradores {playbookCityFilter ? `· ${playbookCityFilter}` : '· Colombia'}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span><strong>{buyerFunnel.totalBuyers}</strong> registrados</span>
              <span className="text-muted-foreground">→</span>
              <span><strong className="text-orange-600">{buyerFunnel.noOrders}</strong> sin pedido</span>
              <span className="text-muted-foreground">→</span>
              <span><strong>{buyerFunnel.onePlusOrders}</strong> con 1+ pedido</span>
              <span className="text-muted-foreground">→</span>
              <span><strong className="text-green-600">{buyerFunnel.repeatBuyers}</strong> repetidores</span>
            </div>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1 max-w-xs">
            <label className="text-xs font-medium text-muted-foreground">Filtrar playbooks por ciudad</label>
            <Input
              value={playbookCityFilter}
              onChange={(e) => setPlaybookCityFilter(e.target.value)}
              placeholder="Todo Colombia o nombre de ciudad..."
              list="marketing-colombia-cities"
              className="mt-1"
            />
            <datalist id="marketing-colombia-cities">
              {COLOMBIA_CITIES.map((c) => (
                <option key={c.id} value={c.slug} />
              ))}
            </datalist>
          </div>
        </div>

        {lifecycleDryRun && Array.isArray(lifecycleDryRun.rules) && (
          <div className="mb-4 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
            <div className="font-medium mb-2">Vista previa nudges automáticos (hoy)</div>
            <ul className="space-y-1 text-muted-foreground">
              {(lifecycleDryRun.rules as Array<{ label: string; eligible: number; playbookId: string }>).map((r) => (
                <li key={r.playbookId}>
                  {r.label}: <strong className="text-foreground">{r.eligible}</strong> usuarios elegibles
                  {AUTOMATED_PLAYBOOK_IDS.has(r.playbookId) && (
                    <span className="ml-1 text-xs text-orange-600">· automático</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {playbooksLoading && playbooks.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Cargando playbooks...
          </div>
        ) : (
          <div className="space-y-6">
            {([
              { title: 'Compradores — Adquisición', filter: (pb: PlaybookSummary) => pb.category === 'acquisition' },
              { title: 'Compradores — Retención', filter: (pb: PlaybookSummary) => pb.category === 'retention' },
              { title: 'Vendedores', filter: (pb: PlaybookSummary) => pb.category === 'seller' },
            ] as const).map(({ title, filter }) => {
              const sectionPlaybooks = playbooks.filter(filter);
              if (sectionPlaybooks.length === 0) return null;
              return (
                <div key={title}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">{title}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    {sectionPlaybooks.map((pb) => {
                      const Icon = PLAYBOOK_ICONS[pb.id] || Lightbulb;
                      const isSelected = selectedPlaybookId === pb.id;
                      const isGeneratingPb = generatingPlaybookId === pb.id;
                      return (
                        <div
                          key={pb.id}
                          className={`rounded-xl border p-4 transition ${isSelected ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20' : 'border-border hover:border-orange-300'}`}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <div className={`p-1.5 rounded-lg shrink-0 ${pb.roleFilter === 'seller' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600' : 'bg-green-100 dark:bg-green-950/40 text-green-600'}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm leading-tight flex flex-wrap items-center gap-1">
                                {pb.label}
                                {AUTOMATED_PLAYBOOK_IDS.has(pb.id) && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-normal">
                                    Auto diario
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{pb.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted">
                              {pb.reachable} alcanzables
                            </span>
                            <span className="text-xs text-muted-foreground">{pb.total} total</span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Button
                              size="sm"
                              className="w-full bg-orange-600 hover:bg-orange-700"
                              disabled={isGeneratingPb || pb.reachable === 0}
                              onClick={() => generatePlaybookCopy(pb)}
                            >
                              {isGeneratingPb ? (
                                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generando...</>
                              ) : (
                                <><Sparkles className="h-3 w-3 mr-1" /> Generar copy</>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              disabled={pb.reachable === 0}
                              onClick={() => selectPlaybook(pb)}
                            >
                              Cargar audiencia
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedPlaybookId && (
          <div className="mt-4 text-xs text-muted-foreground border-t pt-3">
            Playbook activo: <code className="bg-muted px-1.5 py-0.5 rounded">{selectedPlaybookId}</code>
            {' · '}
            Usa <code className="bg-muted px-1 py-0.5 rounded">{'{{name}}'}</code>, <code className="bg-muted px-1 py-0.5 rounded">{'{{city}}'}</code>, <code className="bg-muted px-1 py-0.5 rounded">{'{{ctaUrl}}'}</code> para personalizar cada envío.
          </div>
        )}
      </div>

      {sellerBlastResult && (
        <div className="rounded-xl border border-orange-300/50 bg-orange-50/30 dark:bg-orange-950/20 px-4 py-3 text-sm">
          <div className="font-medium mb-1">Último envío masivo vendedores</div>
          <div className="text-muted-foreground">
            Elegibles: <strong>{String(sellerBlastResult.eligible ?? sellerBlastResult.recipientCount ?? '—')}</strong>
            {' · '}
            Enviados: <strong>{String(sellerBlastResult.sent ?? '—')}</strong>
            {sellerBlastResult.alreadySentBefore != null && (
              <> · Ya habían recibido: <strong>{String(sellerBlastResult.alreadySentBefore)}</strong></>
            )}
          </div>
        </div>
      )}

      {/* ========== MANUAL BROADCAST + AUDIENCE (existing power, now enhanced) ========== */}
      <div id="broadcast-composer" className="bg-card border border-border rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-semibold flex flex-wrap items-center gap-2">Envío Manual + Audiencia <span className="text-xs px-2 py-0.5 rounded bg-muted font-normal">Clásico</span></h2>
            <p className="text-sm text-muted-foreground">Control total. También puedes cargar contenido desde el generador de IA de arriba.</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => loadSellerToolkitCampaign('broadcast')}>Guía vendedores (email)</Button>
            <Button variant="outline" size="sm" onClick={() => loadSellerToolkitCampaign('social')}>IG + WhatsApp</Button>
            <Button
              variant="outline"
              size="sm"
              disabled={sellerBlastLoading}
              onClick={() => runSellerToolkitBlast(true)}
            >
              {sellerBlastLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Vista previa envío masivo
            </Button>
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
              disabled={sellerBlastLoading}
              onClick={() => runSellerToolkitBlast(false)}
            >
              {sellerBlastLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Enviar a todos los vendedores hoy
            </Button>
            <Button variant="outline" size="sm" onClick={() => presetMessage('update')}>Actualización sistema</Button>
            <Button variant="outline" size="sm" onClick={() => presetMessage('promo')}>Promo</Button>
            <Button variant="outline" size="sm" onClick={() => presetMessage('info')}>Info cuenta</Button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setRecipientMode('segment'); setSelectedUser(null); }}
            className={`text-sm px-4 py-2 rounded-full border transition ${recipientMode === 'segment' ? 'bg-orange-600 text-white border-orange-600' : 'border-border hover:bg-muted'}`}
          >
            Por segmento
          </button>
          <button
            type="button"
            onClick={() => setRecipientMode('user')}
            className={`text-sm px-4 py-2 rounded-full border transition ${recipientMode === 'user' ? 'bg-orange-600 text-white border-orange-600' : 'border-border hover:bg-muted'}`}
          >
            Usuario específico
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {recipientMode === 'segment' ? (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Segmento</label>
                  {generatedCampaign && (
                    <Button size="sm" variant="ghost" onClick={() => applyAiSegment()}>
                      Aplicar segmento IA
                    </Button>
                  )}
                </div>
                <select
                  value={segment}
                  onChange={(e) => {
                    setSegment(e.target.value);
                    const pbId = e.target.value.replace('playbook:', '');
                    setSelectedPlaybookId(e.target.value.startsWith('playbook:') ? pbId : null);
                  }}
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm"
                >
                  <optgroup label="Clásico">
                    {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </optgroup>
                  <optgroup label="Playbooks inteligentes">
                    {playbooks.map(pb => (
                      <option key={pb.id} value={pb.segment}>
                        {pb.label} ({pb.reachable})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div>
                  <label className="text-sm font-medium">Ciudad (opcional)</label>
                  <Input
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    placeholder={COLOMBIA_NATIONAL_SCOPE}
                    list="broadcast-colombia-cities"
                  />
                  <datalist id="broadcast-colombia-cities">
                    {COLOMBIA_CITIES.map((c) => (
                      <option key={c.id} value={c.slug} />
                    ))}
                  </datalist>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar usuario por nombre o email</label>
                <Input
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="email@ejemplo.com o nombre..."
                />
                {pickerLoading && <div className="text-xs text-muted-foreground">Buscando...</div>}
                {pickerResults.length > 0 && !selectedUser && (
                  <div className="border rounded-lg overflow-hidden bg-background">
                    {pickerResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => selectUserForSend(u)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 border-b last:border-b-0"
                      >
                        <div className="font-medium">{u.name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{u.email} · {u.role}{u.city ? ` · ${u.city}` : ''}</div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedUser && (
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                    <Mail className="h-4 w-4 text-orange-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{selectedUser.name || selectedUser.email}</div>
                      <div className="text-xs text-muted-foreground truncate">{selectedUser.email}</div>
                    </div>
                    <button type="button" onClick={() => setSelectedUser(null)} className="p-1 hover:bg-muted rounded">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="flex justify-between">
                <label className="text-sm font-medium">Asunto</label>
                {subject && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={polishing}
                    onClick={() => polishComposerWithAI('subject', 'Mejora este asunto para mayor tasa de apertura')}
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> Pulir con IA
                  </Button>
                )}
              </div>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto potente..." />
            </div>

            <div>
              <div className="flex justify-between">
                <label className="text-sm font-medium">Mensaje</label>
                {message && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={polishing}
                    onClick={() => polishComposerWithAI('message', 'Reescribe y mejora este mensaje, más directo y persuasivo')}
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> Mejorar con IA
                  </Button>
                )}
              </div>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} placeholder="Cuerpo del mensaje..." />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={runDryRun}
                variant="outline"
                disabled={sending || polishing || !subject || !message || (recipientMode === 'user' && !selectedUser)}
              >
                Simulación
              </Button>
              <Button onClick={sendTest} variant="outline" disabled={sending || polishing || !subject || !message}>
                Enviar prueba a mí
              </Button>
              <Button
                onClick={sendBroadcast}
                disabled={sending || polishing || !subject || !message || (recipientMode === 'user' && !selectedUser)}
                className="bg-orange-600 hover:bg-orange-700 flex-1 md:flex-none"
              >
                {sending ? 'Enviando...' : recipientMode === 'user' ? 'Enviar a usuario' : 'Enviar broadcast'}
              </Button>
            </div>

            {dryRunResult && (
              <div className="text-xs p-3 bg-muted rounded border">
                Simulación: <strong>{String(dryRunResult.recipientCount ?? 0)}</strong> destinatario(s).
                {Array.isArray(dryRunResult.sample) && (dryRunResult.sample as Array<{ email?: string; name?: string }>).length === 1 && (
                  <span> → {(dryRunResult.sample as Array<{ email?: string; name?: string }>)[0].name || (dryRunResult.sample as Array<{ email?: string }>)[0].email}</span>
                )}
              </div>
            )}
            {lastResult && <div className="text-xs text-green-600">Última acción: {String(lastResult.message ?? '')}</div>}
          </div>

          <div className="border rounded-2xl p-5 bg-background text-sm">
            <div className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Audiencia actual (en vivo)</div>
            {recipientMode === 'user' && selectedUser ? (
              <>
                <div className="text-5xl font-semibold tabular-nums tracking-tighter">1</div>
                <div className="text-muted-foreground">destinatario seleccionado</div>
                <div className="text-xs mt-2 font-medium">{selectedUser.name || '—'}</div>
                <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                {selectedUser.emailReachable === false && (
                  <div className="text-xs mt-2 text-amber-600">Este usuario tiene el email desactivado en preferencias.</div>
                )}
              </>
            ) : (
              <>
                <div className="text-5xl font-semibold tabular-nums tracking-tighter">{audienceReachable.toLocaleString()}</div>
                <div className="text-muted-foreground">alcanzables (email + marketing activado)</div>
                <div className="text-xs mt-1">Total que coincide con filtros: {audienceTotal.toLocaleString()}</div>
              </>
            )}

            <div className="my-4 h-px bg-border" />

            <div className="text-xs space-y-1 text-muted-foreground">
              <div>• Respeta preferencias de email y marketing</div>
              <div>• Los envíos de marketing omiten quiet hours intencionalmente</div>
              <div>• Todo queda registrado en Auditoría + historial de campañas</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAILING LIST */}
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-3">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold">Lista de Correo / Audiencia Objetivo</h2>
            <p className="text-sm text-muted-foreground">{audienceTotal} coincidencias • {audienceReachable} con email marketing activo</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input placeholder="Buscar nombre, email..." value={audienceSearch} onChange={e => setAudienceSearch(e.target.value)} className="w-full sm:w-60" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={exportAudienceCSV}>Exportar muestra CSV</Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => fetchAudience(true)} disabled={audienceLoading}>Actualizar</Button>
            </div>
          </div>
        </div>

        <div className="border rounded-2xl overflow-x-auto bg-card">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-muted/60">
              <tr>
                <th className="p-3 text-left font-medium">Usuario</th>
                <th className="p-3 text-left font-medium">Email</th>
                <th className="p-3 text-left font-medium">Rol / Ciudad</th>
                <th className="p-3 text-left font-medium">Estado</th>
                <th className="p-3 text-left font-medium">Registrado</th>
                <th className="p-3 text-left font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {audience.length === 0 && !audienceLoading && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay usuarios que coincidan.</td></tr>}
              {audience.map(u => (
                <tr
                  key={u.id}
                  className={`border-t hover:bg-muted/30 ${selectedUser?.id === u.id ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''}`}
                >
                  <td className="p-3 font-medium">{u.name || '—'}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 text-xs">{u.role} {u.city ? `· ${u.city}` : ''}</td>
                  <td className="p-3">
                    {!u.email ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Sin email</span>
                    ) : u.emailReachable === false ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">Opt-out</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">Alcanzable</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('es-CO')}</td>
                  <td className="p-3">
                    <Button size="sm" variant="outline" onClick={() => selectUserForSend(u)}>
                      Seleccionar
                    </Button>
                  </td>
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
        <div className="border rounded-2xl overflow-x-auto bg-card text-sm">
          <table className="w-full min-w-[720px]">
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