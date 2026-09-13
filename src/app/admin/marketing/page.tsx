'use client';

import '@/lib/dom-reconcile-guard';
import AdminMarketingContent from './AdminMarketingContent';

export default function AdminMarketingPage() {
  return (
    <div className="min-h-screen notranslate" translate="no" suppressHydrationWarning>
      <AdminMarketingContent />
    </div>
  );
}
