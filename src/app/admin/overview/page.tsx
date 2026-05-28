'use client';

import Link from 'next/link';

export default function AdminOverview() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-6">Overview Detallado</h1>
        <p className="text-xl text-zinc-400 mb-8">Para estadísticas completas usa el panel principal.</p>

        <Link href="/admin" className="text-orange-400 hover:underline">← Volver al Panel Principal</Link>
      </div>
    </div>
  );
}
