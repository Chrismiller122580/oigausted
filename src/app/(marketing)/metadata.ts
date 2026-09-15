import type { Metadata } from 'next';
import { BRAND_LOGO_PATH } from '@/lib/brand';

export const marketingHomeMetadata: Metadata = {
  title: 'OigaGIG — Profesionales locales en Bucaramanga y Colombia',
  description:
    'Encuentre plomeros, técnicos, limpieza, belleza y más en Bucaramanga, Bogotá, Medellín y Cali. Chat en la app y pago seguro con Wompi.',
  keywords: [
    'servicios locales colombia',
    'servicios bucaramanga',
    'plomero bucaramanga',
    'limpieza bucaramanga',
    'técnico computadores bogotá',
    'profesionales medellín',
    'marketplace servicios colombia',
    'oigagig',
    'oiga gig',
    'wompi',
  ],
  alternates: { canonical: 'https://oigagig.com/' },
  openGraph: {
    title: 'OigaGIG — Profesionales locales en Bucaramanga y Colombia',
    description:
      'Encuentre plomeros, limpieza, técnicos y más cerca de usted. Ver el gig primero, comprar cuando esté listo.',
    url: 'https://oigagig.com/',
    images: [{ url: BRAND_LOGO_PATH, width: 832, height: 1248, alt: 'OigaGIG' }],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OigaGIG — Profesionales locales en Bucaramanga y Colombia',
    description:
      'Encuentre plomeros, limpieza, técnicos y más cerca de usted.',
    images: [BRAND_LOGO_PATH],
  },
};
