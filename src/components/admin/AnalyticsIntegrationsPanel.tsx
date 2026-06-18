import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import type { AnalyticsIntegration } from '@/lib/admin-analytics';

function statusBadge(status: AnalyticsIntegration['status']) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Active
      </span>
    );
  }
  if (status === 'configured') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Configured
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
      <AlertCircle className="h-3.5 w-3.5" /> Not configured
    </span>
  );
}

interface AnalyticsIntegrationsPanelProps {
  integrations: AnalyticsIntegration[];
  compact?: boolean;
}

export function AnalyticsIntegrationsPanel({
  integrations,
  compact = false,
}: AnalyticsIntegrationsPanelProps) {
  return (
    <div className={`grid gap-4 ${compact ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
      {integrations.map((integration) => (
        <Card key={integration.id} className="bg-card border-border">
          <CardContent className={`flex flex-col h-full ${compact ? 'p-4' : 'p-5'}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={`font-semibold ${compact ? 'text-sm' : ''}`}>{integration.name}</h3>
              {statusBadge(integration.status)}
            </div>
            <p className={`text-muted-foreground mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>
              {integration.description}
            </p>
            {integration.detail && (
              <p className="text-xs text-muted-foreground mb-2 break-all">{integration.detail}</p>
            )}
            {integration.notes && integration.notes.length > 0 && (
              <ul className={`text-muted-foreground space-y-1 mb-3 flex-1 ${compact ? 'text-[11px]' : 'text-xs'}`}>
                {integration.notes.map((note) => (
                  <li key={note} className="flex gap-1.5">
                    <span className="text-brand shrink-0">·</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            )}
            {integration.dashboardUrl && (
              <a
                href={integration.dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand/80 font-medium mt-auto"
              >
                Open dashboard
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}