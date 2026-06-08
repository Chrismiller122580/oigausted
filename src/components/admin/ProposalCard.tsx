'use client';

import { Button } from '@/components/ui/button';

export interface Proposal {
  id: string;
  file: string;
  description: string;
  diff?: string;
  old_string?: string;
  new_string?: string;
  lowRisk?: boolean;
  createdAt?: number;
}

interface ProposalCardProps {
  proposal: Proposal;
  isApplying: boolean;
  isThisApplying: boolean;
  onApply: (p: Proposal) => void;
  onCopy: (p: Proposal) => void;
  onDismiss: (id: string) => void;
  onToggleLowRisk: (id: string) => void;
  onUndo: (file: string) => void;
}

export function ProposalCard({
  proposal,
  isApplying,
  isThisApplying,
  onApply,
  onCopy,
  onDismiss,
  onToggleLowRisk,
  onUndo,
}: ProposalCardProps) {
  const hasPrecise = !!(proposal.old_string && proposal.new_string);

  return (
    <div className="border border-orange-200 dark:border-orange-800 bg-white/70 dark:bg-black/20 rounded-xl p-3">
      <div className="flex items-start gap-2 mb-1.5">
        <input 
          type="checkbox" 
          checked={!!proposal.lowRisk} 
          onChange={() => onToggleLowRisk(proposal.id)}
          className="mt-1 accent-orange-600"
          title="Mark as low-risk / safe upgrade for bulk apply"
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono text-muted-foreground mb-0.5 flex justify-between">
            <span>{proposal.file}</span>
            {proposal.createdAt && (
              <span className="text-[9px] opacity-60">{new Date(proposal.createdAt).toLocaleTimeString()}</span>
            )}
          </div>
          <div className="text-sm font-medium mb-1">{proposal.description}</div>
        </div>
        {proposal.lowRisk && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 self-start">low-risk</span>
        )}
      </div>

      <div className="text-[9px] mb-1 text-muted-foreground">Preview (better diff on apply success)</div>
      {hasPrecise ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-2">
          <pre className="text-[9px] bg-red-50 dark:bg-red-950/30 p-1 rounded overflow-auto max-h-24">OLD:\n{proposal.old_string!.slice(0, 300)}</pre>
          <pre className="text-[9px] bg-green-50 dark:bg-green-950/30 p-1 rounded overflow-auto max-h-24">NEW:\n{proposal.new_string!.slice(0, 300)}</pre>
        </div>
      ) : (
        <pre className="text-[10px] bg-muted/60 p-2 rounded overflow-auto max-h-32 mb-2 whitespace-pre-wrap">
          {proposal.diff || '(preview not available — will use exact strings on apply)'}
        </pre>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button 
          size="sm"
          onClick={() => onApply(proposal)}
          disabled={isApplying || isThisApplying}
          className="bg-orange-600 hover:bg-orange-700 h-7 text-xs"
        >
          {isThisApplying ? 'Applying...' : 'Apply to Codebase'}
        </Button>

        <Button 
          size="sm"
          variant="outline"
          onClick={() => onCopy(proposal)}
          className="h-7 text-xs"
        >
          Copy
        </Button>

        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => onDismiss(proposal.id)} 
          disabled={isApplying || isThisApplying}
          className="h-7 text-xs"
        >
          Dismiss
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onUndo(proposal.file)} 
          disabled={isApplying || isThisApplying}
          title="Undo/restore this file from its latest backup"
          className="h-7 text-xs"
        >
          Undo
        </Button>
      </div>
    </div>
  );
}
