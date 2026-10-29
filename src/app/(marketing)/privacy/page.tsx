import Link from 'next/link';
import { PublicPageShell } from '@/components/marketing/PublicPageShell';
import {
  buildPublicPageMetadata,
  getPublicSiteInfo,
} from '@/lib/public-site';

export const metadata = buildPublicPageMetadata({
  title: 'Política de privacidad • OigaGIG',
  description:
    'Política de Tratamiento de Datos Personales de OigaGIG: cómo recolectamos, usamos, almacenamos y protegemos tus datos personales en Colombia, conforme a la Ley 1581 de 2012.',
  path: '/privacy',
  keywords: [
    'privacidad oigagig',
    'protección de datos',
    'política de privacidad colombia',
    'datos personales',
    'ley 1581',
  ],
});

const LAST_UPDATED = '28 de octubre de 2026';

export default async function PrivacyPage() {
  const site = await getPublicSiteInfo();

  return (
    <PublicPageShell
      siteName={site.siteName}
      title="Política de Tratamiento de Datos Personales"
      subtitle="Cómo OigaGIG recolecta, almacena, usa y protege tus datos personales."
    >
      <p className="text-sm text-muted-foreground mb-8">Última actualización: {LAST_UPDATED}</p>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-zinc-600 dark:text-zinc-400">
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Responsable del tratamiento</h2>
          <p>
            CORTLAND BLACKSTONE S.A.S. es la sociedad propietaria y operadora de la plataforma OigaGIG. En esa calidad actúa como Responsable del Tratamiento de los datos personales que se recolectan a través de la Plataforma.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Razón social:</strong> CORTLAND BLACKSTONE S.A.S.</li>
            <li><strong>NIT:</strong> 901915866-7</li>
            <li><strong>Correo para asuntos de protección de datos:</strong>{' '}
              <a href={`mailto:${site.supportEmail}`} className="text-orange-600 hover:underline">{site.supportEmail}</a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Datos que recolectamos</h2>
          <p>
            Recolectamos datos de identificación (nombre, correo, teléfono), datos de uso de la plataforma, información de pagos procesada por Wompi, y datos de ubicación aproximada cuando la utilizas para buscar servicios cercanos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Finalidades</h2>
          <p>
            Usamos tus datos para crear y administrar tu cuenta, conectar compradores y vendedores, procesar pagos, prevenir fraude, enviar notificaciones del servicio, y cumplir obligaciones legales.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Tus derechos</h2>
          <p>
            Puedes conocer, actualizar, rectificar y suprimir tus datos, y revocar la autorización de tratamiento. Para ejercer estos derechos escribe a{' '}
            <a href={`mailto:${site.supportEmail}`} className="text-orange-600 hover:underline">{site.supportEmail}</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Autorización</h2>
          <p>
            Al registrarte en OigaGIG autorizas el tratamiento de tus datos personales conforme a esta Política. La autorización es previa, expresa e informada.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        También consulta nuestros{' '}
        <Link href="/terms" className="text-orange-600 hover:underline">Términos de uso</Link>
        {' '}y las{' '}
        <Link href="/faq" className="text-orange-600 hover:underline">preguntas frecuentes</Link>.
      </p>
    </PublicPageShell>
  );
}
