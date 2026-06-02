'use client';

export default function AdminReports() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold">Reportes</h1>
        <div className="mt-8 bg-card border border-border p-12 rounded-3xl text-center">
          <p className="text-xl text-muted-foreground">Reportes avanzados (ventas por categoría, retención, etc.)</p>
          <p className="mt-4 text-sm text-muted-foreground">Disponible en la siguiente iteración del panel admin.</p>
        </div>
      </div>
    </div>
  );
}
