'use client';

import { useState } from 'react';
import { ScanSearch, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserLensPanel from '@/components/admin/UserLensPanel';
import UserLensToolbox from '@/components/admin/UserLensToolbox';

type Tab = 'scan' | 'toolbox';

export default function UserLensAdmin() {
  const [tab, setTab] = useState<Tab>('scan');

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">UserLens</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scan UX quality, queue fixes for Composer, and approve what ships later.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        <Button
          variant={tab === 'scan' ? 'default' : 'outline'}
          onClick={() => setTab('scan')}
          className="gap-2"
        >
          <ScanSearch className="h-4 w-4" />
          Run scan
        </Button>
        <Button
          variant={tab === 'toolbox' ? 'default' : 'outline'}
          onClick={() => setTab('toolbox')}
          className="gap-2"
        >
          <Wrench className="h-4 w-4" />
          Fix toolbox
        </Button>
      </div>

      {tab === 'scan' ? <UserLensPanel embedded /> : <UserLensToolbox />}
    </div>
  );
}