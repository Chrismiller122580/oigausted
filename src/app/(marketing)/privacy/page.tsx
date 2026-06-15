import Link from 'next/link';
import { PublicPageShell } from '@/components/marketing/PublicPageShell';
import {
  buildPublicPageMetadata,
  getPublicSiteInfo,
} from '@/lib/public-site';

export const metadata = buildPublicPageMetadata({
  title: 'Política de privacidad • OigaGig',
  description:
    'Política de privacidad de OigaGig: cómo recopilamos, usamos y protegemos tus datos personales en Colombia.',
  path: '/privacy',
  keywords: [
    'privacidad oigagig',
    'protección de datos',
    'política de privacidad colombia',
    'datos personales',
  ],
});

const LAST_UPDATED = '15 de junio de 2026';

export default async function PrivacyPage() {
  const site = await getPublicSiteInfo();

  return (
    <PublicPageShell
      siteName={site.siteName}
      title="Política de privacidad"
      subtitle="Cómo tratamos y protegemos tu información en OigaGig."
    >
      <p className="text-sm text-muted-foreground mb-8">Última actualización: {LAST_UPDATED}</p>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-zinc-600 dark:text-zinc-400">
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">1. Responsable</h2>
          <p>
            {site.siteName} (&quot;nosotros&quot;) opera el sitio web y la plataforma de servicios
            locales en Colombia. Para consultas sobre privacidad puedes escribir a{' '}
            <a href={`mailto:${site.supportEmail}`} className="text-orange-600 hover:underline">
              {site.supportEmail}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            2. Datos que recopilamos
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Registro:</strong> nombre, correo electrónico, contraseña (cifrada), rol
              (comprador/vendedor).
            </li>
            <li>
              <strong>Perfil:</strong> foto, teléfono, WhatsApp, ciudad, biografía, datos de negocio
              (NIT, nombre comercial) si los proporcionas.
            </li>
            <li>
              <strong>Transacciones:</strong> pedidos, pagos procesados vía Wompi, historial de
              gigs y reseñas.
            </li>
            <li>
              <strong>Uso:</strong> logs técnicos, dirección IP, tipo de dispositivo y páginas
              visitadas para seguridad y mejora del servicio.
            </li>
            <li>
              <strong>Comunicaciones:</strong> mensajes en la plataforma, tickets de soporte y
              preferencias de notificaciones.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            3. Cómo usamos tus datos
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Crear y administrar tu cuenta.</li>
            <li>Facilitar la conexión entre compradores y vendedores.</li>
            <li>Procesar pagos y prevenir fraude.</li>
            <li>Enviar notificaciones sobre pedidos, mensajes y actualizaciones del servicio.</li>
            <li>Cumplir obligaciones legales y resolver disputas.</li>
            <li>Mejorar la plataforma y la experiencia de usuario.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            4. Compartición con terceros
          </h2>
          <p>
            Compartimos datos solo cuando es necesario para operar el servicio: procesadores de
            pago (Wompi), proveedores de hosting (Vercel), base de datos (Prisma/PostgreSQL),
            correo transaccional (Resend) y herramientas de análisis. No vendemos tus datos
            personales a terceros para marketing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">5. Tus derechos</h2>
          <p>
            Puedes solicitar acceso, corrección o eliminación de tus datos escribiendo a{' '}
            <a href={`mailto:${site.supportEmail}`} className="text-orange-600 hover:underline">
              {site.supportEmail}
            </a>
            . Si tienes pedidos activos, podemos desactivar tu cuenta en lugar de borrarla para
            mantener registros de transacciones exigidos por ley o por seguridad de la comunidad.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">6. Seguridad</h2>
          <p>
            Aplicamos medidas técnicas y organizativas razonables: conexiones cifradas (HTTPS),
            contraseñas hasheadas, acceso restringido a datos sensibles y monitoreo de la
            plataforma. Ningún sistema es 100% infalible; te recomendamos usar contraseñas fuertes y
            únicas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">7. Cookies</h2>
          <p>
            Usamos cookies y almacenamiento local para mantener tu sesión, recordar preferencias
            (tema, tutoriales) y medir uso anónimo del sitio. Puedes gestionar cookies desde tu
            navegador.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">8. Cambios</h2>
          <p>
            Podemos actualizar esta política. Publicaremos la fecha de revisión en esta página. El
            uso continuado de {site.siteName} después de cambios importantes implica tu aceptación.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        También consulta nuestros{' '}
        <Link href="/terms" className="text-orange-600 hover:underline">
          Términos de uso
        </Link>{' '}
        y las{' '}
        <Link href="/faq" className="text-orange-600 hover:underline">
          preguntas frecuentes
        </Link>
        .
      </p>
    </PublicPageShell>
  );
}