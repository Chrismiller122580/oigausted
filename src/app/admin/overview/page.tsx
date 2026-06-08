'use client';

import Link from 'next/link';

export default function AdminOverview() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-6">Detailed Overview</h1>
        <p className="text-xl text-muted-foreground mb-8">For complete stats use the main dashboard panel.</p>

        <Link href="/admin" className="text-orange-400 hover:underline">← Back to Main Panel</Link>
      </div>
    </div>
  );
}
