import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OigaGIG — Conecta con profesionales locales',
  description:
    'El profesional que necesitas, con gente de confianza a un Oiga de distancia. Servicios locales en Bogotá, Medellín, Cali y toda Colombia. Pagos seguros con Wompi.',
  keywords: [
    'servicios locales colombia',
    'profesionales bogotá',
    'oigagig',
    'marketplace servicios',
    'wompi',
    'freelance colombia',
  ],
  openGraph: {
    title: 'OigaGIG — Conecta con profesionales locales',
    description:
      'Encuentra plomeros, limpieza, diseño, catering y más. Gente de confianza cerca de ti.',
    images: [{ url: '/logo.png', width: 1200, height: 630, alt: 'OigaGIG' }],
    locale: 'es_CO',
    type: 'website',
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-foreground dark:bg-slate-950">
      {children}
    </div>
  );
}