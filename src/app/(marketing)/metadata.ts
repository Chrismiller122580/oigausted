import type { Metadata } from 'next';
import { BRAND_LOGO_PATH } from '@/lib/brand';

export const marketingHomeMetadata: Metadata = {
  title: 'OigaGIG — Conecta con profesionales locales en Colombia',
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
    title: 'OigaGIG — Conecta con profesionales locales en Colombia',
    description:
      'Encuentra plomeros, limpieza, diseño, catering y más. Gente de confianza cerca de ti.',
    images: [{ url: BRAND_LOGO_PATH, width: 832, height: 1248, alt: 'OigaGIG' }],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OigaGIG — Conecta con profesionales locales en Colombia',
    description:
      'Encuentra plomeros, limpieza, diseño, catering y más. Gente de confianza cerca de ti.',
    images: [BRAND_LOGO_PATH],
  },
};