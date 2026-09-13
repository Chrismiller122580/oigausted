'use client';

import { useStudio } from './studio-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles, Clock, TrendingUp, RefreshCw, Lightbulb, Loader2
} from 'lucide-react';
import { COLOMBIA_CITIES } from '@/lib/colombia-cities';
import { PLAYBOOK_ICONS, type PlaybookSummary } from './studio-constants';

export default function StudioPlaybooksPanel() {
  const s = useStudio();
  return <Inner {...s} />;
}

function Inner(props: any) {
  const {
    analyticsViewOnly,
    playbooks,
    playbooksLoading,
    selectedPlaybookId,
    generatingPlaybookId,
    lifecycleDryRun,
    lifecycleLoading,
    sellerBlastResult,
    buyerBlastResult,
    playbookCityFilter, setPlaybookCityFilter,
    buyerFunnel,
    AUTOMATED_PLAYBOOK_IDS,
    fetchPlaybooks,
    selectPlaybook,
    runLifecycleDryRun,
    generatePlaybookCopy,
  } = props;

  return (
    <div className="space-y-6">
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
            {!analyticsViewOnly && (
              <Button variant="outline" size="sm" onClick={runLifecycleDryRun} disabled={lifecycleLoading}>
                {lifecycleLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
                Vista previa cron
              </Button>
            )}
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
              const sectionPlaybooks: PlaybookSummary[] = (Array.isArray(playbooks) ? playbooks : []).filter(filter);
              if (sectionPlaybooks.length === 0) return null;
              return (
                <div key={title}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">{title}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    {sectionPlaybooks.map((pb: PlaybookSummary) => {
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
                          {!analyticsViewOnly && (
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
                          )}
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

      {!analyticsViewOnly && (sellerBlastResult || buyerBlastResult) && (
        <div className="space-y-3">
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
          {buyerBlastResult && (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
              <div className="font-medium mb-1">Último envío masivo compradores</div>
              <div className="text-muted-foreground">
                Elegibles: <strong>{String(buyerBlastResult.eligible ?? buyerBlastResult.recipientCount ?? '—')}</strong>
                {' · '}
                Enviados: <strong>{String(buyerBlastResult.sent ?? '—')}</strong>
                {buyerBlastResult.alreadySentBefore != null && (
                  <> · Ya habían recibido: <strong>{String(buyerBlastResult.alreadySentBefore)}</strong></>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
