'use client';

import { useStudio } from './studio-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Users, Mail, X, Sparkles, Loader2 } from 'lucide-react';
import { COLOMBIA_CITIES, COLOMBIA_NATIONAL_SCOPE } from '@/lib/colombia-cities';
import { SEGMENTS } from './studio-constants';

export default function StudioBroadcastPanel() {
  const {
    analyticsViewOnly,
    subject, setSubject,
    message, setMessage,
    segment, setSegment,
    cityFilter, setCityFilter,
    broadcastMode, setBroadcastMode,
    geoScope, setGeoScope,
    recipientMode, setRecipientMode,
    selectedUser, setSelectedUser,
    pickerSearch, setPickerSearch,
    pickerResults,
    pickerLoading,
    sending,
    polishing,
    lastResult,
    audience,
    audienceTotal,
    audienceReachable,
    audienceLoading,
    audienceSearch, setAudienceSearch,
    campaigns,
    campaignsTotal,
    historyLoading,
    dryRunResult,
    playbooks,
    setSelectedPlaybookId,
    sellerBlastLoading,
    buyerBlastLoading,
    generatedCampaign,
    selectUserForSend,
    applyAiSegment,
    runSellerToolkitBlast,
    runBuyerPurchaseGuideBlast,
    polishComposerWithAI,
    fetchAudience,
    fetchHistory,
    runDryRun,
    sendTest,
    sendBroadcast,
    exportAudienceCSV,
    loadSellerToolkitCampaign,
    presetMessage,
  } = useStudio();

  return (
    <>
      {!analyticsViewOnly && (
        <div id="broadcast-composer" className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-xl sm:text-2xl font-semibold">Envío Manual + Audiencia</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border p-3 space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Plantillas</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => loadSellerToolkitCampaign('broadcast')}>Guía vendedores</Button>
                <Button variant="outline" size="sm" onClick={() => loadSellerToolkitCampaign('social')}>IG + WhatsApp</Button>
                <Button variant="outline" size="sm" onClick={() => presetMessage('update')}>Actualización</Button>
                <Button variant="outline" size="sm" onClick={() => presetMessage('promo')}>Promo</Button>
              </div>
            </div>
            <div className="rounded-xl border border-orange-200/60 bg-orange-50/30 p-3 space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Envío masivo vendedores</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled={sellerBlastLoading} onClick={() => runSellerToolkitBlast(true)}>Vista previa</Button>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700" disabled={sellerBlastLoading} onClick={() => runSellerToolkitBlast(false)}>
                  {sellerBlastLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />} Enviar a vendedores
                </Button>
              </div>
            </div>
            <div className="rounded-xl border p-3 space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Envío masivo compradores</p>
              <p className="text-xs text-muted-foreground">Buscar gig, chat in-app, Wompi y reseña. Respeta idioma (es/en).</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled={buyerBlastLoading} onClick={() => runBuyerPurchaseGuideBlast(true)}>Vista previa</Button>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700" disabled={buyerBlastLoading} onClick={() => runBuyerPurchaseGuideBlast(false)}>
                  {buyerBlastLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />} Enviar a compradores
                </Button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setRecipientMode('segment'); setSelectedUser(null); }} className={`text-sm px-4 py-2 rounded-full border ${recipientMode === 'segment' ? 'bg-orange-600 text-white border-orange-600' : 'border-border'}`}>Por segmento</button>
            <button type="button" onClick={() => setRecipientMode('user')} className={`text-sm px-4 py-2 rounded-full border ${recipientMode === 'user' ? 'bg-orange-600 text-white border-orange-600' : 'border-border'}`}>Usuario específico</button>
            <button type="button" onClick={() => setBroadcastMode('marketing')} className={`text-sm px-3 py-1.5 rounded-full border ${broadcastMode === 'marketing' ? 'bg-orange-600 text-white border-orange-600' : 'border-border'}`}>Marketing</button>
            <button type="button" onClick={() => setBroadcastMode('ops')} className={`text-sm px-3 py-1.5 rounded-full border ${broadcastMode === 'ops' ? 'bg-slate-800 text-white' : 'border-border'}`}>Ops</button>
            <button type="button" onClick={() => setGeoScope('colombia')} className={`text-sm px-3 py-1.5 rounded-full border ${geoScope === 'colombia' ? 'bg-orange-600 text-white border-orange-600' : 'border-border'}`}>Colombia</button>
            <button type="button" onClick={() => setGeoScope('all')} className={`text-sm px-3 py-1.5 rounded-full border ${geoScope === 'all' ? 'bg-orange-600 text-white border-orange-600' : 'border-border'}`}>Todos los países</button>
          </div>
          {recipientMode === 'segment' ? (
            <div className="grid sm:grid-cols-2 gap-3">
              <select value={segment} onChange={(e) => { setSegment(e.target.value); setSelectedPlaybookId(e.target.value.startsWith('playbook:') ? e.target.value.replace('playbook:', '') : null); }} className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm">
                <optgroup label="Clásico">{SEGMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</optgroup>
                <optgroup label="Playbooks">{playbooks.map((pb: any) => <option key={pb.id} value={pb.segment}>{pb.label} ({pb.reachable})</option>)}</optgroup>
              </select>
              <Input value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder={COLOMBIA_NATIONAL_SCOPE} list="broadcast-colombia-cities" />
              <datalist id="broadcast-colombia-cities">{COLOMBIA_CITIES.map((c) => <option key={c.id} value={c.slug} />)}</datalist>
              {generatedCampaign && <Button size="sm" variant="ghost" onClick={() => applyAiSegment()}>Aplicar segmento IA</Button>}
            </div>
          ) : (
            <div className="space-y-2">
              <Input value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} placeholder="email o nombre..." />
              {pickerLoading && <div className="text-xs text-muted-foreground">Buscando...</div>}
              {pickerResults.map((u: any) => (
                <button key={u.id} type="button" onClick={() => selectUserForSend(u)} className="w-full text-left px-3 py-2 text-sm border-b">
                  <div className="font-medium">{u.name || '—'}</div>
                  <div className="text-xs text-muted-foreground">{u.email} · {u.role}</div>
                </button>
              ))}
              {selectedUser && (
                <div className="flex items-center gap-2 p-3 rounded-lg border">
                  <Mail className="h-4 w-4 text-orange-600" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{selectedUser.name || selectedUser.email}</div>
                    <div className="text-xs text-muted-foreground truncate">{selectedUser.email}</div>
                  </div>
                  <button type="button" onClick={() => setSelectedUser(null)}><X className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          )}
          <div>
            <div className="flex justify-between"><label className="text-sm font-medium">Asunto</label>{subject && <Button size="sm" variant="ghost" disabled={polishing} onClick={() => polishComposerWithAI('subject', 'Mejora este asunto')}><Sparkles className="h-3 w-3 mr-1" /> Pulir</Button>}</div>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <div className="flex justify-between"><label className="text-sm font-medium">Mensaje</label>{message && <Button size="sm" variant="ghost" disabled={polishing} onClick={() => polishComposerWithAI('message', 'Reescribe y mejora este mensaje')}><Sparkles className="h-3 w-3 mr-1" /> Mejorar</Button>}</div>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={runDryRun} variant="outline" disabled={sending || !subject || !message}>Simulación</Button>
            <Button onClick={sendTest} variant="outline" disabled={sending || !subject || !message}>Enviar prueba a mí</Button>
            <Button onClick={sendBroadcast} disabled={sending || !subject || !message} className="bg-orange-600 hover:bg-orange-700">{sending ? 'Enviando...' : 'Enviar broadcast'}</Button>
          </div>
          {dryRunResult && <div className="text-xs p-3 bg-muted rounded">Simulación: <strong>{String(dryRunResult.recipientCount ?? 0)}</strong></div>}
          {lastResult && <div className="text-xs text-green-600">Última acción: {String(lastResult.message ?? '')}</div>}
          <div className="text-sm"><Users className="h-4 w-4 inline mr-1" />{audienceReachable.toLocaleString()} alcanzables · {audienceTotal.toLocaleString()} coincidencias</div>
        </div>
      )}
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-semibold">Lista de Correo / Audiencia</h2>
            <p className="text-sm text-muted-foreground">{audienceTotal} coincidencias · {audienceReachable} alcanzables</p>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Buscar..." value={audienceSearch} onChange={(e) => setAudienceSearch(e.target.value)} className="w-48" />
            <Button variant="outline" size="sm" onClick={exportAudienceCSV}>CSV</Button>
            <Button variant="outline" size="sm" onClick={() => fetchAudience(true)} disabled={audienceLoading}>Actualizar</Button>
          </div>
        </div>
        <div className="border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/60"><tr><th className="p-3 text-left">Usuario</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Rol</th><th className="p-3 text-left">Estado</th></tr></thead>
            <tbody>
              {audience.length === 0 && !audienceLoading && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No hay usuarios que coincidan.</td></tr>}
              {audience.map((u: any) => (
                <tr key={u.id} className="border-t"><td className="p-3">{u.name || '—'}</td><td className="p-3">{u.email}</td><td className="p-3 text-xs">{u.role} {u.city ? `· ${u.city}` : ''}</td><td className="p-3">{u.emailReachable === false ? 'Opt-out' : 'Alcanzable'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Historial de Campañas ({campaignsTotal})</h2>
          <Button variant="outline" size="sm" onClick={fetchHistory} disabled={historyLoading}>Refrescar</Button>
        </div>
        <div className="border rounded-2xl overflow-x-auto text-sm">
          <table className="w-full min-w-[640px]">
            <thead className="bg-muted/60"><tr><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Asunto</th><th className="p-3 text-left">Segmento</th><th className="p-3 text-right">Dest.</th></tr></thead>
            <tbody>
              {campaigns.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Aún no has enviado campañas.</td></tr>}
              {campaigns.map((c: any) => (
                <tr key={c.id} className="border-t"><td className="p-3 text-xs">{new Date(c.createdAt).toLocaleString('es-CO')}</td><td className="p-3 font-medium">{c.subject}</td><td className="p-3"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.segment}</code></td><td className="p-3 text-right">{c.recipientCount}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
