'use client';

import { useStudio } from './studio-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, RefreshCw, Send, Copy, Instagram, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { COLOMBIA_NATIONAL_SCOPE } from '@/lib/colombia-cities';
import { QUICK_GOALS, SELLER_QUICK_GOAL, CHANNEL_OPTIONS, TONES } from './studio-constants';

export default function StudioAiPanel() {
  const {
    analyticsViewOnly,
    aiGoal, setAiGoal,
    aiCustomPrompt, setAiCustomPrompt,
    aiChannels,
    aiTone, setAiTone,
    isGenerating,
    generatedCampaign,
    activeAiTab, setActiveAiTab,
    apiWarning,
    aiTargetCity, setAiTargetCity,
    aiTargetScope, setAiTargetScope,
    aiBuyerFocus, setAiBuyerFocus,
    estimatedAudience,
    cityRegions,
    generateWithAI,
    applyQuickGoal,
    applySellerQuickGoal,
    applyAiSegment,
    loadAiIntoComposer,
    copyText,
    applyAdCopy,
    refineCampaign,
    toggleChannel,
    loadSellerToolkitCampaign,
  } = useStudio();

  return (
    <>
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div className="p-2 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shrink-0">
          <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
            {analyticsViewOnly ? 'Marketing Insights' : 'AI Marketing Studio'}
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground">
            {analyticsViewOnly
              ? 'Embudo de compradores, audiencias y historial de campañas (solo lectura)'
              : 'El centro de comando más inteligente para promocionar OigaGIG'}
          </p>
        </div>
      </div>

      {apiWarning && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm">
          {apiWarning}
        </div>
      )}

      {!analyticsViewOnly && (
        <div className="bg-card border-2 border-orange-500/30 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-orange-500" /> Generador de Campañas con IA
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <select value={aiTargetScope} onChange={(e) => { const scope = e.target.value as 'national' | 'city'; setAiTargetScope(scope); if (scope === 'national') setAiTargetCity(''); }} className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm">
              <option value="national">{COLOMBIA_NATIONAL_SCOPE}</option>
              <option value="city">Ciudad específica</option>
            </select>
            {aiTargetScope === 'city' && (
              <select value={aiTargetCity} onChange={(e) => setAiTargetCity(e.target.value)} className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm">
                <option value="">Seleccionar ciudad...</option>
                {Object.entries(cityRegions || {}).map(([region, cities]: [string, any]) => (
                  <optgroup key={region} label={region}>
                    {(cities as any[]).map((c) => <option key={c.id} value={c.slug}>{c.label}</option>)}
                  </optgroup>
                ))}
              </select>
            )}
            <select value={aiBuyerFocus} onChange={(e) => setAiBuyerFocus(e.target.value)} className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm">
              <option value="both">Adquisición + retención</option>
              <option value="acquisition">Nuevos compradores</option>
              <option value="retention">Re-compra</option>
            </select>
          </div>
          <Input value={aiGoal} onChange={(e) => setAiGoal(e.target.value)} placeholder="Objetivo de la campaña" />
          <Textarea value={aiCustomPrompt} onChange={(e) => setAiCustomPrompt(e.target.value)} rows={2} placeholder="Instrucciones adicionales (opcional)" />
          <div className="flex flex-wrap gap-2">
            {CHANNEL_OPTIONS.map((ch) => {
              const Icon = ch.icon;
              const active = aiChannels.includes(ch.key);
              return (
                <button key={ch.key} onClick={() => toggleChannel(ch.key)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${active ? 'bg-orange-600 text-white border-orange-600' : 'border-border'}`}>
                  <Icon className="h-3.5 w-3.5" /> {ch.label}
                </button>
              );
            })}
          </div>
          <select value={aiTone} onChange={(e) => setAiTone(e.target.value)} className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm">
            {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            {QUICK_GOALS.map((g, i) => (
              <button key={i} type="button" onClick={() => applyQuickGoal(g.goal, g.focus)} className="text-sm px-3 py-1.5 rounded-full border border-border">{g.goal}</button>
            ))}
            <button type="button" onClick={() => loadSellerToolkitCampaign('top')} className="text-sm px-3 py-1.5 rounded-full border border-blue-300">Guía vendedores</button>
            <button type="button" onClick={applySellerQuickGoal} className="text-sm px-3 py-1.5 rounded-full border border-border">{SELLER_QUICK_GOAL.goal}</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => generateWithAI()} disabled={isGenerating || (!aiGoal && !aiCustomPrompt)} className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
              {isGenerating ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Generando...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generar Campaña Inteligente</>}
            </Button>
            {generatedCampaign && (
              <>
                <Button variant="outline" onClick={() => generateWithAI()} disabled={isGenerating}>Regenerar</Button>
                <Button variant="outline" onClick={loadAiIntoComposer}><Send className="h-4 w-4 mr-1.5" /> Cargar en Broadcast</Button>
              </>
            )}
          </div>
          {generatedCampaign && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-xl font-semibold">{generatedCampaign.campaignName}</h3>
              <p className="text-sm text-muted-foreground">{generatedCampaign.objective}</p>
              <div className="text-xs">Segmento: <strong>{generatedCampaign.recommendedSegment}</strong>{estimatedAudience != null ? ` · ~${estimatedAudience}` : ''}</div>
              <Button size="sm" variant="outline" onClick={() => applyAiSegment()}>Aplicar segmento</Button>
              <div className="flex gap-3 text-sm">
                {(['email', 'social', 'ads'] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveAiTab(tab)} className={activeAiTab === tab ? 'font-medium text-orange-600' : 'text-muted-foreground'}>{tab}</button>
                ))}
              </div>
              {activeAiTab === 'email' && (
                <div className="space-y-2">
                  <div className="font-semibold">{generatedCampaign.email.subject}</div>
                  <div className="whitespace-pre-wrap text-sm">{generatedCampaign.email.body}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyText(generatedCampaign.email.subject, 'Asunto')}><Copy className="h-3.5 w-3.5 mr-1" /> Copiar</Button>
                    <Button size="sm" onClick={loadAiIntoComposer}>Usar en Broadcast</Button>
                    <Button size="sm" variant="outline" onClick={() => refineCampaign('Haz el asunto más intrigante')}>Mejorar asunto</Button>
                  </div>
                </div>
              )}
              {activeAiTab === 'social' && (
                <div className="grid md:grid-cols-2 gap-3">
                  {Object.entries(generatedCampaign.social || {}).map(([platform, text]) => (
                    <div key={platform} className="border rounded-xl p-3">
                      <div className="font-medium capitalize flex items-center gap-2 mb-1">
                        {platform === 'instagram' && <Instagram className="h-4 w-4" />}
                        {platform === 'facebook' && <Facebook className="h-4 w-4" />}
                        {platform === 'x' && <Twitter className="h-4 w-4" />}
                        {platform === 'whatsapp' && <MessageCircle className="h-4 w-4" />}
                        {platform}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{String(text)}</div>
                    </div>
                  ))}
                </div>
              )}
              {activeAiTab === 'ads' && (
                <div className="space-y-2">
                  {(generatedCampaign.adCopies || []).map((copy: any, idx: number) => (
                    <div key={idx} className="border rounded-xl p-3">
                      <div className="font-semibold">{copy.headline}</div>
                      <div className="text-sm">{copy.body}</div>
                      <Button size="sm" className="mt-2" onClick={() => applyAdCopy(copy)}>Usar en Broadcast</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
