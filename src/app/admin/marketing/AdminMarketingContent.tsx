'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { GeneratedCampaign } from '@/lib/marketing-campaign-types';
import { normalizeGeneratedCampaign } from '@/lib/marketing-campaign-types';
import { mapRecommendedSegment } from '@/lib/marketing-segment-map';
import { citiesByRegion } from '@/lib/colombia-cities';
import { SELLER_BUYER_TOOLKIT_CAMPAIGN, sellerToolkitAsGeneratedCampaign } from '@/lib/seller-buyer-toolkit-campaign';
import { SELLER_GIG_INTEREST_CAMPAIGN, sellerGigInterestAsGeneratedCampaign } from '@/lib/gig-interest-launch-campaign';
import { useAnalyticsViewOnly } from '@/hooks/useAnalyticsViewOnly';
import { copyToClipboard } from '@/lib/share';
import { StudioCtx } from './studio-context';
import StudioAiPanel from './StudioAiPanel';
import StudioPlaybooksPanel from './StudioPlaybooksPanel';
import StudioBroadcastPanel from './StudioBroadcastPanel';

export default function AdminMarketingContent() {
  const analyticsViewOnly = useAnalyticsViewOnly();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [segment, setSegment] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [broadcastMode, setBroadcastMode] = useState<'marketing' | 'ops'>('marketing');
  const [geoScope, setGeoScope] = useState<'colombia' | 'all'>('colombia');
  const [recipientMode, setRecipientMode] = useState<'segment' | 'user'>('segment');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerResults, setPickerResults] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [audience, setAudience] = useState<any[]>([]);
  const [audienceTotal, setAudienceTotal] = useState(0);
  const [audienceReachable, setAudienceReachable] = useState(0);
  const [audienceLoading, setAudienceLoading] = useState(true);
  const [audienceSearch, setAudienceSearch] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignsTotal, setCampaignsTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [aiGoal, setAiGoal] = useState('');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiChannels, setAiChannels] = useState(['email', 'instagram', 'facebook']);
  const [aiTone, setAiTone] = useState('cercano y confiable');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCampaign, setGeneratedCampaign] = useState<GeneratedCampaign | null>(null);
  const [activeAiTab, setActiveAiTab] = useState<'email' | 'social' | 'ads' | 'visuals'>('email');
  const [apiWarning, setApiWarning] = useState<string | null>(null);
  const [, startCampaignTransition] = useTransition();
  const generateRequestId = useRef(0);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [playbooksLoading, setPlaybooksLoading] = useState(true);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(null);
  const [generatingPlaybookId, setGeneratingPlaybookId] = useState<string | null>(null);
  const [lifecycleDryRun, setLifecycleDryRun] = useState<any>(null);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [sellerBlastLoading, setSellerBlastLoading] = useState(false);
  const [sellerBlastResult, setSellerBlastResult] = useState<any>(null);
  const [buyerBlastLoading, setBuyerBlastLoading] = useState(false);
  const [buyerBlastResult, setBuyerBlastResult] = useState<any>(null);
  const [interestBlastLoading, setInterestBlastLoading] = useState(false);
  const [interestBlastResult, setInterestBlastResult] = useState<any>(null);
  const [aiTargetCity, setAiTargetCity] = useState('');
  const [aiTargetScope, setAiTargetScope] = useState<'national' | 'city'>('national');
  const [aiBuyerFocus, setAiBuyerFocus] = useState('both');
  const [playbookCityFilter, setPlaybookCityFilter] = useState('');
  const [buyerFunnel, setBuyerFunnel] = useState<any>(null);
  const [estimatedAudience, setEstimatedAudience] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const cityRegions = useMemo(() => citiesByRegion(), []);
  const AUTOMATED_PLAYBOOK_IDS = useMemo(() => new Set(['buyers-new-signup','buyers-no-orders','buyers-abandoned-checkout','buyers-one-order-lapsed','sellers-new-no-gig','sellers-get-buyers-toolkit']), []);

  useEffect(() => { const id = requestAnimationFrame(() => setReady(true)); return () => cancelAnimationFrame(id); }, []);

  const generateWithAI = async (extraPrompt?: string) => {
    const requestId = ++generateRequestId.current;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/marketing/ai-generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: aiGoal || aiCustomPrompt || 'Promocionar OigaGIG', prompt: extraPrompt || aiCustomPrompt, channels: aiChannels, segmentHint: segment, tone: aiTone, language: 'es', variations: 4, targetCity: aiTargetScope === 'city' ? aiTargetCity : undefined, targetScope: aiTargetScope, buyerFocus: aiBuyerFocus }) });
      const data = await res.json().catch(() => ({}));
      if (requestId !== generateRequestId.current) return;
      if (data.success && data.campaign) {
        const normalized = normalizeGeneratedCampaign(data.campaign, aiGoal || 'Promocionar OigaGIG');
        startCampaignTransition(() => { setGeneratedCampaign(normalized); setActiveAiTab('email'); });
        if (data.fallback) setApiWarning(data.message || 'Campaña de respaldo');
        toast.success(data.fallback ? 'Campaña de respaldo generada' : 'Campaña generada con IA');
      } else toast.error(data.error || 'No se pudo generar');
    } catch { toast.error('Error de IA'); } finally { setIsGenerating(false); }
  };

  const applyQuickGoal = (goal: string, focus: any = 'both') => { setAiGoal(goal); setAiCustomPrompt(''); setAiBuyerFocus(focus); toast.success('Objetivo cargado'); };
  const applySellerQuickGoal = () => applyQuickGoal('Enseñar a vendedores cómo conseguir compradores con todas las herramientas OigaGIG');
  const applyAiSegment = (recommended?: string, silent = false) => {
    const text = recommended ?? generatedCampaign?.recommendedSegment; if (!text) return;
    if (text.startsWith('playbook:')) { setSegment(text); setSelectedPlaybookId(text.replace('playbook:', '')); if (!silent) toast.success('Playbook aplicado'); return; }
    const mapped = mapRecommendedSegment(text); setSegment(mapped.segment); setSelectedPlaybookId(null); if (mapped.city) setCityFilter(mapped.city); if (!silent) toast.success('Segmento aplicado');
  };
  const loadAiIntoComposer = () => { if (!generatedCampaign) return; setSubject(generatedCampaign.email.subject); setMessage(generatedCampaign.email.body); applyAiSegment(generatedCampaign.recommendedSegment, true); setRecipientMode('segment'); toast.success('Cargado en Broadcast'); };
  const selectUserForSend = (user: any) => { setSelectedUser(user); setRecipientMode('user'); setPickerSearch(''); setPickerResults([]); toast.success(`Destinatario: ${user.name || user.email}`); };
  const buildBody = (extra: any = {}) => {
    const base = { subject: subject.trim(), message: message.trim(), mode: broadcastMode, geoScope, ...extra };
    if (extra.testOnly) return base;
    if (recipientMode === 'user' && selectedUser) return { ...base, userIds: [selectedUser.id] };
    return { ...base, segment, city: cityFilter || undefined, playbookId: selectedPlaybookId || undefined };
  };
  const fetchPlaybooks = async () => { setPlaybooksLoading(true); try { const q = playbookCityFilter ? `?city=${encodeURIComponent(playbookCityFilter)}` : ''; const res = await fetch(`/api/admin/marketing/playbooks${q}`); const data = await res.json().catch(() => ({})); if (res.ok) { setPlaybooks(data.playbooks || []); setBuyerFunnel(data.buyerFunnel || null); } } finally { setPlaybooksLoading(false); } };
  const selectPlaybook = (pb: any) => { setSelectedPlaybookId(pb.id); setSegment(pb.segment); setRecipientMode('segment'); setSelectedUser(null); toast.success(`Playbook: ${pb.label}`); };
  const runBlast = async (path: string, dry: boolean, msg: string, setL: any, setR: any) => { if (!dry && !confirm(msg)) return; setL(true); try { const res = await fetch(`${path}?dryRun=${dry}`, { method: 'POST' }); const data = await res.json().catch(() => ({})); if (res.ok) { setR(data); toast.success(data.message || (dry ? 'Vista previa lista' : 'Campaña enviada')); } else toast.error(data.error || 'Error'); } catch { toast.error('Error de red'); } finally { setL(false); } };
  const runSellerToolkitBlast = (d = false) => runBlast('/api/admin/marketing/seller-toolkit-blast', d, '¿Enviar la guía a todos los vendedores que aún no la recibieron?', setSellerBlastLoading, setSellerBlastResult);
  const runBuyerPurchaseGuideBlast = (d = false) => runBlast('/api/admin/marketing/buyer-purchase-guide-blast', d, '¿Enviar la gía de compra a los compradores que aún no la recibieron?', setBuyerBlastLoading, setBuyerBlastResult);
  const runGigInterestLaunchBlast = (d = false) => runBlast('/api/admin/marketing/gig-interest-launch-blast', d, '¿Enviar el aviso de la herramienta nueva (me gusta, visitas y Ver gig) a vendedores y compradores que aún no lo recibieron?', setInterestBlastLoading, setInterestBlastResult);
  const runLifecycleDryRun = async () => { setLifecycleLoading(true); try { const res = await fetch('/api/notifications/lifecycle?dryRun=true', { method: 'POST' }); const data = await res.json().catch(() => ({})); if (res.ok) { setLifecycleDryRun(data); toast.success(data.message || 'Vista previa lista'); } } finally { setLifecycleLoading(false); } };
  const generatePlaybookCopy = async (pb: any) => { setGeneratingPlaybookId(pb.id); setSelectedPlaybookId(pb.id); setSegment(pb.segment); try { const res = await fetch('/api/admin/marketing/ai-generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: pb.label, channels: ['email'], playbookId: pb.id, tone: 'cercano y confiable', language: 'es', variations: 1 }) }); const data = await res.json(); if (data.success && data.campaign?.email) { setSubject(data.campaign.email.subject); setMessage(data.campaign.email.body); toast.success('Copy generado'); } else toast.error('No se pudo generar'); } finally { setGeneratingPlaybookId(null); } };
  const copyText = async (text: string, label = 'Texto') => { const ok = await copyToClipboard(text); toast[ok ? 'success' : 'error'](ok ? `${label} copiado` : 'No se pudo copiar'); };
  const applyAdCopy = (copy: any) => { setSubject(copy.headline); setMessage(`${copy.headline}\n\n${copy.body}\n\n${copy.cta}`); toast.success('Anuncio cargado'); };
  const refineCampaign = async (instruction: string) => { if (generatedCampaign) await generateWithAI(`Mejora: ${instruction}`); };
  const polishComposerWithAI = async (field: 'subject' | 'message', instruction: string) => { setPolishing(true); try { const res = await fetch('/api/admin/marketing/ai-generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: 'Mejorar copy', prompt: `${instruction}\n\n${subject}\n\n${message}`, channels: ['email'], tone: aiTone, language: 'es', variations: 1 }) }); const data = await res.json(); if (data.success && data.campaign?.email) { if (field === 'subject') setSubject(data.campaign.email.subject); else setMessage(data.campaign.email.body); toast.success('Mejorado'); } } finally { setPolishing(false); } };
  const toggleChannel = (key: string) => setAiChannels((p) => p.includes(key) ? p.filter((k) => k !== key) : [...p, key]);
  const fetchAudience = async () => { setAudienceLoading(true); try { const params = new URLSearchParams({ segment, geoScope, mode: broadcastMode, limit: '80' }); if (cityFilter) params.set('city', cityFilter); if (audienceSearch) params.set('search', audienceSearch); const res = await fetch(`/api/admin/marketing/audience?${params}`); const data = await res.json().catch(() => ({})); if (res.ok) { setAudience(data.sample || []); setAudienceTotal(data.total || 0); setAudienceReachable(data.reachable || 0); } } finally { setAudienceLoading(false); } };
  const fetchHistory = async () => { setHistoryLoading(true); try { const res = await fetch('/api/admin/marketing/campaigns?limit=30'); const data = await res.json().catch(() => ({})); if (res.ok) { setCampaigns(data.campaigns || []); setCampaignsTotal(data.total || 0); } } finally { setHistoryLoading(false); } };
  useEffect(() => { if (!ready) return; const t = setTimeout(fetchAudience, 300); return () => clearTimeout(t); }, [ready, segment, cityFilter, audienceSearch, geoScope, broadcastMode]);
  useEffect(() => { if (recipientMode !== 'user' || !pickerSearch.trim()) { setPickerResults([]); return; } const t = setTimeout(async () => { setPickerLoading(true); try { const params = new URLSearchParams({ segment: 'all', search: pickerSearch.trim(), geoScope: 'all', mode: broadcastMode, limit: '10' }); const res = await fetch(`/api/admin/marketing/audience?${params}`); const data = await res.json().catch(() => ({})); if (res.ok) setPickerResults(data.sample || []); } finally { setPickerLoading(false); } }, 300); return () => clearTimeout(t); }, [pickerSearch, recipientMode, broadcastMode]);
  useEffect(() => { if (ready) fetchHistory(); }, [ready]);
  useEffect(() => { if (ready) fetchPlaybooks(); }, [ready, playbookCityFilter]);
  const post = async (body: any) => { const res = await fetch('/api/admin/marketing/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const data = await res.json(); if (res.ok) { toast.success(data.message || 'OK'); setLastResult(data); fetchHistory(); } else toast.error(data.error || 'Falló'); return { res, data }; };
  const runDryRun = async () => { if (!subject.trim() || !message.trim()) return toast.error('Agrega asunto y mensaje'); const { res, data } = await post(buildBody({ dryRun: true })); if (res.ok) { setDryRunResult(data); toast.success(`Simulación: ${data.recipientCount ?? 0}`); } };
  const sendTest = async () => { if (!subject.trim() || !message.trim()) return; setSending(true); try { await post(buildBody({ testOnly: true })); } finally { setSending(false); } };
  const sendBroadcast = async () => { if (!subject.trim() || !message.trim()) return; if (recipientMode === 'user' && !selectedUser) return toast.error('Selecciona un usuario'); if (!confirm('¿Enviar este mensaje?')) return; setSending(true); try { await post(buildBody()); } finally { setSending(false); } };
  const exportAudienceCSV = () => { if (!audience.length) return toast.error('No hay datos'); const csv = ['ID,Name,Email,Role', ...audience.map((u) => `${u.id},"${u.name || ''}",${u.email || ''},${u.role}`)].join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'audience.csv'; a.click(); };
  const loadSellerToolkitCampaign = (scrollTo: 'broadcast' | 'social' | 'top' = 'broadcast') => { const c = SELLER_BUYER_TOOLKIT_CAMPAIGN; setSubject(c.subject); setMessage(c.body); setSegment('playbook:sellers-get-buyers-toolkit'); setSelectedPlaybookId('sellers-get-buyers-toolkit'); setRecipientMode('segment'); setSelectedUser(null); setAiGoal(c.objective); startCampaignTransition(() => { setGeneratedCampaign(sellerToolkitAsGeneratedCampaign()); setActiveAiTab(scrollTo === 'social' ? 'social' : 'email'); }); toast.success('Campaña vendedores cargada'); };
  const loadGigInterestCampaign = (scrollTo: 'broadcast' | 'social' | 'top' = 'broadcast') => { const c = SELLER_GIG_INTEREST_CAMPAIGN; setSubject(c.subject); setMessage(c.body); setSegment('playbook:sellers-gig-interest-tools'); setSelectedPlaybookId('sellers-gig-interest-tools'); setRecipientMode('segment'); setSelectedUser(null); setAiGoal(c.objective); startCampaignTransition(() => { setGeneratedCampaign(sellerGigInterestAsGeneratedCampaign()); setActiveAiTab(scrollTo === 'social' ? 'social' : 'email'); }); toast.success('Campaña de la herramienta nueva cargada'); };
  const presetMessage = (type: string) => { if (type === 'update') { setSubject('Actualización importante en OigaGIG'); setMessage('Hola,\n\nEstamos realizando mejoras en la plataforma.\n\n— OigaGIG'); } if (type === 'promo') { setSubject('¡Promoción especial esta semana en OigaGIG!'); setMessage('Hola,\n\nEsta semana tenemos una promoción.\n\n— OigaGIG'); } };

  const studio = { analyticsViewOnly, subject, setSubject, message, setMessage, segment, setSegment, cityFilter, setCityFilter, broadcastMode, setBroadcastMode, geoScope, setGeoScope, recipientMode, setRecipientMode, selectedUser, setSelectedUser, pickerSearch, setPickerSearch, pickerResults, pickerLoading, sending, polishing, lastResult, audience, audienceTotal, audienceReachable, audienceLoading, audienceSearch, setAudienceSearch, campaigns, campaignsTotal, historyLoading, dryRunResult, aiGoal, setAiGoal, aiCustomPrompt, setAiCustomPrompt, aiChannels, aiTone, setAiTone, isGenerating, generatedCampaign, activeAiTab, setActiveAiTab, apiWarning, playbooks, playbooksLoading, selectedPlaybookId, setSelectedPlaybookId, generatingPlaybookId, lifecycleDryRun, lifecycleLoading, sellerBlastLoading, sellerBlastResult, buyerBlastLoading, buyerBlastResult, interestBlastLoading, interestBlastResult, aiTargetCity, setAiTargetCity, aiTargetScope, setAiTargetScope, aiBuyerFocus, setAiBuyerFocus, playbookCityFilter, setPlaybookCityFilter, buyerFunnel, estimatedAudience, cityRegions, AUTOMATED_PLAYBOOK_IDS, generateWithAI, applyQuickGoal, applySellerQuickGoal, applyAiSegment, loadAiIntoComposer, selectUserForSend, fetchPlaybooks, selectPlaybook, runSellerToolkitBlast, runBuyerPurchaseGuideBlast, runGigInterestLaunchBlast, runLifecycleDryRun, generatePlaybookCopy, copyText, applyAdCopy, refineCampaign, polishComposerWithAI, toggleChannel, fetchAudience, fetchHistory, runDryRun, sendTest, sendBroadcast, exportAudienceCSV, loadSellerToolkitCampaign, loadGigInterestCampaign, presetMessage };

  return (
    <StudioCtx.Provider value={studio}>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12 overflow-x-hidden">
        <StudioAiPanel />
        <StudioPlaybooksPanel />
        <StudioBroadcastPanel />
      </div>
    </StudioCtx.Provider>
  );
}
