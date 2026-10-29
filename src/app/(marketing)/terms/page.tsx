import Link from 'next/link';
import { PublicPageShell } from '@/components/marketing/PublicPageShell';
import {
  buildPublicPageMetadata,
  getPublicSiteInfo,
} from '@/lib/public-site';

export const metadata = buildPublicPageMetadata({
  title: 'Términos de uso • OigaGIG',
  description:
    'Términos y Condiciones de Uso de OigaGIG: reglas para compradores y vendedores, pagos, comisiones, cancelaciones, garantías y responsabilidades en Colombia.',
  path: '/terms',
  keywords: [
    'términos oigagig',
    'condiciones de uso',
    'reglas marketplace colombia',
    'términos vendedores',
    'ley 1480',
  ],
});

const LAST_UPDATED = '28 de octubre de 2026';

export default async function TermsPage() {
  const site = await getPublicSiteInfo();

  return (
    <PublicPageShell
      siteName={site.siteName}
      title="Términos y Condiciones de Uso"
      subtitle="Reglas para usar OigaGIG como comprador o vendedor."
    >
      <p className="text-sm text-muted-foreground mb-8">Última actualización: {LAST_UPDATED}</p>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-zinc-600 dark:text-zinc-400">
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Aceptación</h2>
          <p>
            Al crear una cuenta o usar OigaGIG aceptas estos Términos y la Política de Tratamiento de Datos Personales. Si no estás de acuerdo, no uses la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Naturaleza del servicio</h2>
          <p>
            OigaGIG es un marketplace que conecta compradores con vendedores independientes. No somos parte del contrato de prestación del servicio entre ellos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Cuentas</h2>
          <p>
            Debes proporcionar información veraz. Eres responsable de mantener la confidencialidad de tu cuenta y de las actividades que se realicen con ella.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Pagos y comisiones</h2>
          <p>
            Los pagos se procesan a través de Wompi. OigaGIG retiene una comisión sobre cada transacción exitosa, según las tarifas publicadas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Contacto</h2>
          <p>
            Para consultas sobre estos términos escribe a{' '}
            <a href={`mailto:${site.supportEmail}`} className="text-orange-600 hover:underline">{site.supportEmail}</a>.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Lee también nuestra{' '}
        <Link href="/privacy" className="text-orange-600 hover:underline">Política de privacidad</Link>
        {' '}y{' '}
        <Link href="/faq" className="text-orange-600 hover:underline">FAQ</Link>.
      </p>
    </PublicPageShell>
  );
}
