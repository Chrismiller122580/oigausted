import Link from 'next/link';
import { PublicFooter } from './PublicFooter';

interface PublicPageShellProps {
  title: string;
  subtitle?: string;
  siteName?: string;
  children: React.ReactNode;
}

export function PublicPageShell({
  title,
  subtitle,
  siteName = 'OigaGig',
  children,
}: PublicPageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-orange-600 to-orange-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <nav aria-label="Breadcrumb" className="text-sm text-white/80 mb-4">
            <Link href="/" className="hover:text-white transition-colors">
              Inicio
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">{title}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">{children}</div>

      <PublicFooter siteName={siteName} />
    </div>
  );
}