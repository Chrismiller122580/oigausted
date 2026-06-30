import Link from 'next/link';
import { PublicPageShell } from '@/components/marketing/PublicPageShell';
import {
  buildPublicPageMetadata,
  getPublicSiteInfo,
} from '@/lib/public-site';

export const metadata = buildPublicPageMetadata({
  title: 'Términos de uso • OigaGIG',
  description:
    'Términos y condiciones de uso de OigaGIG: reglas para compradores y vendedores, pagos, comisiones y responsabilidades.',
  path: '/terms',
  keywords: [
    'términos oigagig',
    'condiciones de uso',
    'reglas marketplace colombia',
    'términos vendedores',
  ],
});

const LAST_UPDATED = '15 de junio de 2026';

export default async function TermsPage() {
  const site = await getPublicSiteInfo();

  return (
    <PublicPageShell
      siteName={site.siteName}
      title="Términos de uso"
      subtitle="Reglas claras para usar OigaGIG como comprador o vendedor en Colombia."
    >
      <p className="text-sm text-muted-foreground mb-8">Última actualización: {LAST_UPDATED}</p>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-zinc-600 dark:text-zinc-400">
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            1. Aceptación de los términos
          </h2>
          <p>
            Al registrarte o usar {site.siteName}, aceptas estos Términos de uso y nuestra{' '}
            <Link href="/privacy" className="text-orange-600 hover:underline">
              Política de privacidad
            </Link>
            . Si no estás de acuerdo, no uses la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            2. Naturaleza del servicio
          </h2>
          <p>
            {site.siteName} es un marketplace que facilita la conexión entre personas que ofrecen
            servicios (&quot;vendedores&quot;) y personas que los contratan (&quot;compradores&quot;).
            No somos empleador de los vendedores ni parte directa del contrato de servicio entre
            usuarios, salvo donde la ley exija lo contrario.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            3. Cuentas y elegibilidad
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Debes ser mayor de 18 años y proporcionar información veraz.</li>
            <li>Eres responsable de la seguridad de tu cuenta y contraseña.</li>
            <li>No puedes crear cuentas falsas, suplantar identidades ni usar la plataforma con fines ilegales.</li>
            <li>Podemos suspender o desactivar cuentas que violen estas reglas.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            4. Publicación de gigs (vendedores)
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Los gigs deben describir servicios reales, legales y que puedas prestar.</li>
            <li>No se permiten contenido engañoso, ofensivo, discriminatorio o que infrinja derechos de terceros.</li>
            <li>Los precios publicados deben ser claros; los cambios se acuerdan con el comprador en el chat.</li>
            <li>Eres responsable de cumplir con impuestos, permisos y regulaciones de tu actividad.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            5. Pedidos y pagos (compradores)
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Al hacer un pedido, acuerdas pagar el precio indicado según el flujo de la plataforma.</li>
            <li>Los pagos se procesan a través de Wompi u otros proveedores autorizados.</li>
            <li>Las disputas sobre calidad del servicio deben resolverse primero entre las partes; {site.siteName} puede mediar de buena fe cuando sea posible.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">6. Comisiones</h2>
          <p>
            {site.siteName} puede cobrar una comisión sobre transacciones completadas. El porcentaje
            vigente se comunica en la plataforma. Las comisiones cubren operación, pagos, soporte y
            desarrollo continuo del servicio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            7. Reseñas y conducta
          </h2>
          <p>
            Las reseñas deben ser honestas y basadas en experiencias reales. Está prohibido el
            acoso, spam, fraude, evasión de pagos de la plataforma o manipulación de calificaciones.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            8. Limitación de responsabilidad
          </h2>
          <p>
            La plataforma se ofrece &quot;tal cual&quot;. No garantizamos resultados específicos de
            ningún servicio contratado entre usuarios. En la medida permitida por la ley colombiana,
            nuestra responsabilidad se limita al monto de comisiones pagadas a {site.siteName} en
            los últimos tres meses relacionados con la disputa.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">9. Modificaciones</h2>
          <p>
            Podemos actualizar estos términos. Los cambios importantes se publicarán en esta página.
            El uso continuado después de la actualización constituye aceptación.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            10. Contacto y ley aplicable
          </h2>
          <p>
            Para preguntas legales o de soporte:{' '}
            <a href={`mailto:${site.supportEmail}`} className="text-orange-600 hover:underline">
              {site.supportEmail}
            </a>
            . Estos términos se rigen por las leyes de la República de Colombia.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Lee también nuestra{' '}
        <Link href="/privacy" className="text-orange-600 hover:underline">
          Política de privacidad
        </Link>{' '}
        y{' '}
        <Link href="/faq" className="text-orange-600 hover:underline">
          FAQ
        </Link>
        .
      </p>
    </PublicPageShell>
  );
}