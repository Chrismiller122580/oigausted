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
      subtitle="Reglas claras para usar OigaGIG como comprador o vendedor en Colombia."
    >
      <p className="text-sm text-muted-foreground mb-8">Última actualización: {LAST_UPDATED}</p>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-zinc-600 dark:text-zinc-400">
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título I. Disposiciones generales</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 1. Identificación del operador</h3>
          <p>
            La plataforma OigaGIG, compuesta por el sitio web https://oigagig.com y la aplicación móvil OigaGIG para Android e iOS (la "Plataforma"), es operada por CORTLAND BLACKSTONE S.A.S. ("OigaGIG"), en cumplimiento del artículo 50 de la Ley 1480 de 2011:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Razón social:</strong> CORTLAND BLACKSTONE S.A.S.</li>
            <li><strong>NIT:</strong> 901915866-7</li>
            <li><strong>Correo electrónico:</strong>{' '}
              <a href={`mailto:${site.supportEmail}`} className="text-orange-600 hover:underline">{site.supportEmail}</a>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 2. Aceptación</h3>
          <p>
            Estos Términos y Condiciones de Uso (los "Términos") regulan el acceso y uso de la Plataforma. Al registrarse, el Usuario manifiesta haberlos leído y aceptado de forma expresa mediante la casilla dispuesta para ese fin, que no estará marcada previamente. Esta aceptación electrónica tiene plena validez conforme a la Ley 527 de 1999.
          </p>
          <p>
            Los Términos se complementan con la{' '}
            <Link href="/privacy" className="text-orange-600 hover:underline">Política de Tratamiento de Datos Personales</Link>
            {' '}y con las condiciones particulares que se informen en cada Gig o Pedido. Quien no esté de acuerdo con los Términos debe abstenerse de usar la Plataforma.
          </p>
          <p>
            OigaGIG conservará la versión de los Términos aceptada por cada Usuario, con la fecha y hora de aceptación, y el Usuario podrá descargarla o solicitarla en cualquier momento.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 3. Definiciones</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Comprador:</strong> Usuario que busca, contrata y paga un servicio o producto a través de la Plataforma.</li>
            <li><strong>Vendedor:</strong> Usuario, persona natural o jurídica, que publica servicios o productos en la Plataforma.</li>
            <li><strong>Usuario:</strong> toda persona registrada, sea como Comprador, Vendedor o con ambos roles.</li>
            <li><strong>Gig:</strong> publicación en la que el Vendedor ofrece un servicio o producto, con su descripción, precio, condiciones, fotografías y zona de cobertura.</li>
            <li><strong>Pedido:</strong> solicitud de compra de un Gig, aceptada por el Vendedor, que da origen al contrato entre Comprador y Vendedor.</li>
            <li><strong>Pago protegido:</strong> mecanismo por el cual el valor pagado por el Comprador se recauda a través de la Pasarela de pagos y solo se libera al Vendedor cuando se cumplen las condiciones del Título V.</li>
            <li><strong>Pasarela de pagos:</strong> proveedor autorizado que procesa los pagos, actualmente Wompi.</li>
            <li><strong>Comisión:</strong> porcentaje que OigaGIG retiene sobre el valor de los Pedidos completados como remuneración por sus servicios.</li>
            <li><strong>Garantía OigaGIG:</strong> beneficio adicional y voluntario descrito en el artículo 30.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 4. Naturaleza del servicio</h3>
          <p>
            OigaGIG presta un servicio de intermediación tecnológica: pone a disposición de los Usuarios un espacio digital para que Vendedores y Compradores se encuentren, conversen, celebren contratos, paguen y califiquen la experiencia. En los términos del artículo 53 de la Ley 1480 de 2011, la Plataforma es un portal de contacto.
          </p>
          <p>En consecuencia:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>El contrato de prestación de servicios o de compraventa se celebra directamente entre el Comprador y el Vendedor. OigaGIG no es parte de ese contrato, no presta los servicios ni vende los productos publicados, y no actúa como empleador, agente ni representante del Vendedor.</li>
            <li>El Vendedor es el único responsable de la calidad, idoneidad, seguridad, legalidad y garantía de lo que ofrece.</li>
            <li>OigaGIG sí responde por el correcto funcionamiento de la Plataforma, por el manejo de los pagos que recauda, por la Garantía OigaGIG en los términos ofrecidos y por las obligaciones que la ley le impone como portal de contacto, entre ellas exigir a los Vendedores su información de identificación y ponerla a disposición de los Compradores cuando presenten una reclamación.</li>
          </ol>
          <p>
            Cuando el Vendedor actúe como proveedor profesional, es decir, ofrezca de forma habitual servicios o productos en el mercado, la relación con el Comprador se rige por el Estatuto del Consumidor. Cuando se trate de una transacción ocasional entre particulares, se aplicarán las normas civiles y comerciales generales.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 5. Capacidad y ámbito territorial</h3>
          <p>
            Solo pueden registrarse personas mayores de 18 años con plena capacidad legal y documento de identidad válido, así como personas jurídicas a través de su representante legal o de un apoderado debidamente facultado. Quien se registre en nombre de una persona jurídica declara contar con facultades suficientes para obligarla.
          </p>
          <p>
            La Plataforma opera en Colombia, con precios en pesos colombianos. El lanzamiento en otros países se regirá por condiciones particulares que se publicarán oportunamente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título II. Registro y cuentas</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 6. Registro</h3>
          <p>
            Para registrarse, el Usuario debe suministrar un correo electrónico válido, una contraseña y la información solicitada en el formulario, y aceptar estos Términos y la Política de Tratamiento de Datos Personales. El registro y la exploración de la Plataforma son gratuitos.
          </p>
          <p>
            El Usuario garantiza que la información suministrada es veraz, completa y actualizada, y se obliga a actualizarla cuando cambie. OigaGIG podrá abstenerse de activar o podrá suspender cuentas con información falsa, incompleta o que no pueda verificarse.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 7. Cuenta de Vendedor y verificación</h3>
          <p>
            Para publicar Gigs, el Usuario debe activar el rol de Vendedor y completar, como mínimo: nombre o razón social, tipo y número de documento de identidad o NIT, teléfono, ciudad, zona de cobertura y datos para recibir desembolsos. Esta información es exigida por el artículo 53 de la Ley 1480 de 2011.
          </p>
          <p>
            OigaGIG podrá verificar la identidad, el RUT, la titularidad de la cuenta bancaria y las certificaciones o licencias del Vendedor. La insignia de "Verificado" indica únicamente que OigaGIG validó los documentos señalados en la Plataforma al momento de la verificación. No constituye certificación de la calidad, idoneidad o resultado de los servicios del Vendedor.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 8. Seguridad de la cuenta</h3>
          <p>
            La cuenta es personal e intransferible. El Usuario es responsable de custodiar su contraseña y de todas las actividades realizadas desde su cuenta, salvo que demuestre que se originaron en una falla de seguridad imputable a OigaGIG.
          </p>
          <p>
            El Usuario debe informar de inmediato al correo {site.supportEmail} cualquier uso no autorizado de su cuenta. OigaGIG nunca solicitará la contraseña del Usuario, códigos de verificación ni claves bancarias por correo, chat, WhatsApp o llamada.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 9. Cuentas múltiples y suplantación</h3>
          <p>
            Cada persona puede tener una sola cuenta, que podrá usar con ambos roles. Está prohibido crear cuentas falsas, suplantar a otra persona, usar la identidad o los documentos de terceros, o crear nuevas cuentas para eludir una suspensión.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título III. Obligaciones de los Vendedores</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 10. Información mínima de cada Gig</h3>
          <p>
            El Vendedor debe publicar información veraz, suficiente, clara y verificable sobre lo que ofrece, conforme a los artículos 23 y 24 de la Ley 1480 de 2011. Cada Gig debe indicar, como mínimo:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Descripción del servicio o producto, su alcance y lo que no incluye.</li>
            <li>Precio total en pesos colombianos, con impuestos incluidos, y cualquier costo adicional (desplazamiento, materiales, domicilio), conforme al artículo 26 de la Ley 1480 de 2011.</li>
            <li>Ciudad y zona de cobertura, y tiempo estimado de entrega o ejecución.</li>
            <li>Condiciones y término de la garantía, cuando sea superior a la legal.</li>
            <li>Requisitos que el Comprador debe cumplir para que el servicio pueda prestarse.</li>
          </ol>
          <p>
            Las fotografías deben corresponder a trabajos propios o productos reales. Está prohibida la publicidad engañosa, en los términos de los artículos 29 y 30 de la Ley 1480 de 2011. Los cambios de precio o alcance solo serán válidos si el Comprador los acepta de forma expresa en la Plataforma antes del pago.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 11. Idoneidad y profesiones reguladas</h3>
          <p>
            El Vendedor declara contar con la capacidad, la experiencia, las herramientas y las autorizaciones necesarias para prestar el servicio ofrecido. Quien ofrezca servicios de profesiones u oficios regulados debe contar con el título, la tarjeta o matrícula profesional, la certificación de competencias o la habilitación exigidas por la ley, y presentarlos cuando OigaGIG o el Comprador lo soliciten. Esto incluye, entre otros:
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Actividad</th>
                  <th className="text-left p-2">Requisito habilitante</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="p-2">Asesoría y representación jurídica</td><td className="p-2">Tarjeta profesional de abogado vigente (Ley 1123 de 2007).</td></tr>
                <tr className="border-b"><td className="p-2">Contaduría y revisoría fiscal</td><td className="p-2">Tarjeta profesional de contador público (Ley 43 de 1990).</td></tr>
                <tr className="border-b"><td className="p-2">Instalaciones eléctricas</td><td className="p-2">Certificación de competencias exigida por el RETIE.</td></tr>
                <tr className="border-b"><td className="p-2">Instalaciones de gas</td><td className="p-2">Certificación de competencia laboral para instaladores de gas.</td></tr>
                <tr className="border-b"><td className="p-2">Ingeniería y arquitectura</td><td className="p-2">Matrícula profesional vigente (Leyes 842 de 2003 y 435 de 1998).</td></tr>
                <tr className="border-b"><td className="p-2">Servicios de salud y terapias</td><td className="p-2">Título y registro en el ReTHUS (Ley 1164 de 2007).</td></tr>
                <tr><td className="p-2">Transporte de pasajeros o carga</td><td className="p-2">Habilitación y documentos del vehículo exigidos por el Ministerio de Transporte.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 12. Bienes y servicios prohibidos o restringidos</h3>
          <p>Está prohibido ofrecer en la Plataforma:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Promesas de curación, diagnósticos o tratamientos de salud por quien no esté habilitado para ello.</li>
            <li>Alcohol y tabaco sin cumplir las restricciones legales de venta, armas, municiones, explosivos, sustancias psicoactivas y precursores químicos.</li>
            <li>Bienes de procedencia ilícita, falsificados o que infrinjan derechos de propiedad intelectual.</li>
            <li>Fauna y flora silvestre, y productos derivados de especies protegidas.</li>
            <li>Captación de dinero del público, préstamos no autorizados, inversiones con rendimientos garantizados, criptoactivos y juegos de suerte y azar no autorizados.</li>
            <li>Elaboración de documentos falsos, trámites irregulares o cualquier actividad ilegal.</li>
            <li>Contenido sexual, servicios de acompañamiento de carácter sexual y cualquier servicio que involucre la explotación de personas.</li>
            <li>Servicios dirigidos a menores de edad que no cumplan el artículo 19 de la Política de Tratamiento de Datos Personales.</li>
          </ul>
          <p>
            OigaGIG podrá retirar sin previo aviso los Gigs que infrinjan este artículo y, cuando corresponda, informar a las autoridades competentes.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 13. Obligaciones tributarias y de seguridad social</h3>
          <p>
            El Vendedor es el único responsable de cumplir sus obligaciones tributarias: inscripción en el RUT, facturación electrónica cuando esté obligado, declaración y pago de impuestos, y de las licencias o permisos de su actividad. Cuando la ley obligue a OigaGIG a practicar retenciones en la fuente u otros tributos sobre los pagos al Vendedor, los descontará del desembolso y expedirá los certificados correspondientes.
          </p>
          <p>
            El Vendedor que sea persona natural independiente es responsable de sus aportes al Sistema de Seguridad Social Integral.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 14. Garantía legal</h3>
          <p>
            El Vendedor que actúe como proveedor profesional responde por la garantía legal de lo que ofrece, conforme a los artículos 7 a 11 de la Ley 1480 de 2011. Para los servicios, la garantía consiste en prestarlos con la calidad y en las condiciones ofrecidas. Si no se cumplen, el Comprador podrá exigir que el servicio se preste nuevamente sin costo o la devolución de lo pagado. Para los productos, la garantía será la anunciada y, si no se indicó, de un año para productos nuevos.
          </p>
          <p>
            El Vendedor debe atender las reclamaciones de garantía dentro de los quince (15) días hábiles siguientes a su recibo.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 15. Ejecución del Pedido</h3>
          <p>El Vendedor se obliga a:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Responder las solicitudes y mensajes de los Compradores dentro de un plazo razonable.</li>
            <li>Prestar el servicio o entregar el producto en la fecha, el lugar y las condiciones acordadas.</li>
            <li>Cumplir las normas de seguridad y salud en el trabajo aplicables a su actividad y usar los elementos de protección necesarios.</li>
            <li>Tratar con respeto al Comprador y a las personas presentes en el lugar del servicio, y cuidar sus bienes.</li>
            <li>Usar los datos del Comprador solo para ejecutar el Pedido, conforme a la Política de Tratamiento de Datos Personales.</li>
            <li>Marcar el Pedido como completado en la Plataforma solo cuando lo haya ejecutado efectivamente.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título IV. Obligaciones de los Compradores</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 16. Proceso de compra</h3>
          <p>El Pedido se perfecciona así:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>El Comprador selecciona un Gig y revisa su descripción, precio, condiciones y reseñas.</li>
            <li>El Comprador y el Vendedor pueden acordar detalles por el chat de la Plataforma.</li>
            <li>Antes del pago, la Plataforma muestra un resumen con el servicio o producto, el precio total, los costos adicionales y las condiciones aplicables.</li>
            <li>El Comprador confirma el Pedido y paga a través de la Pasarela de pagos.</li>
            <li>La Plataforma envía al Comprador la confirmación del Pedido y el comprobante de pago.</li>
          </ol>
          <p>
            El contrato entre Comprador y Vendedor queda celebrado con la confirmación del pago, en las condiciones del resumen aceptado.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 17. Obligaciones del Comprador</h3>
          <p>El Comprador se obliga a:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Suministrar información veraz sobre lo que necesita, el lugar del servicio y las condiciones que puedan afectarlo.</li>
            <li>Pagar el precio acordado a través de la Plataforma.</li>
            <li>Permitir el acceso al lugar del servicio en la fecha y hora acordadas y brindar condiciones seguras para su ejecución.</li>
            <li>Tratar con respeto al Vendedor y a su personal.</li>
            <li>Confirmar la recepción del servicio o producto, o reportar cualquier inconformidad, dentro del plazo del artículo 21.</li>
            <li>Usar los datos del Vendedor solo para la ejecución del Pedido, conforme a la Política de Tratamiento de Datos Personales.</li>
            <li>Abstenerse de solicitar servicios ilegales o prohibidos por estos Términos.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título V. Pagos, comisiones y desembolsos</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 18. Mandato de recaudo</h3>
          <p>
            Al activar el rol de Vendedor, este confiere a OigaGIG un mandato sin representación para recaudar, a través de la Pasarela de pagos, el precio de los Pedidos, descontar la Comisión y las retenciones legales, y transferirle el saldo. El pago que el Comprador haga a través de la Plataforma extingue su obligación de pago frente al Vendedor.
          </p>
          <p>
            Los recursos recaudados pertenecen al Vendedor y permanecen en la Plataforma solo durante el tiempo necesario para verificar la ejecución del Pedido. OigaGIG no capta recursos del público, no reconoce intereses sobre esos saldos ni los usa para fines distintos a los previstos en este Título.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 19. Medios de pago</h3>
          <p>
            Los pagos se realizan en pesos colombianos a través de la Pasarela de pagos, con Nequi, PSE, tarjetas débito o crédito y los demás medios habilitados. Los datos del medio de pago son tratados por la Pasarela de pagos bajo sus propias condiciones. OigaGIG no almacena números completos de tarjetas ni claves bancarias.
          </p>
          <p>
            Está prohibido pagar o recibir pagos de Pedidos por fuera de la Plataforma (artículo 25).
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 20. Comisión</h3>
          <p>
            El registro y la publicación de Gigs son gratuitos. OigaGIG cobra al Vendedor una Comisión sobre el valor de cada Pedido completado. El porcentaje vigente se informa en la Plataforma antes de publicar cada Gig y en el detalle de cada venta. Ninguna modificación del porcentaje se aplicará a Pedidos ya confirmados.
          </p>
          <p>
            OigaGIG expedirá al Vendedor la factura electrónica de la Comisión, con los impuestos que correspondan. Los beneficios promocionales, como la promoción gratuita para los primeros Vendedores, se rigen por las condiciones que se publiquen en cada campaña.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 21. Pago protegido y liberación de fondos</h3>
          <p>El valor pagado por el Comprador se libera al Vendedor cuando ocurra primero alguno de estos eventos:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>El Comprador confirma en la Plataforma que recibió el servicio o producto a satisfacción.</li>
            <li>Transcurren setenta y dos (72) horas desde que el Vendedor marcó el Pedido como completado sin que el Comprador haya reportado una inconformidad.</li>
          </ol>
          <p>
            Si el Comprador reporta una inconformidad dentro de ese plazo, los fondos permanecerán retenidos mientras se tramita la controversia conforme al artículo 38.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 22. Desembolsos</h3>
          <p>
            OigaGIG transferirá al Vendedor el saldo liberado, descontada la Comisión y las retenciones legales, a la cuenta registrada a su nombre, dentro de los cinco (5) días hábiles siguientes a su liberación o según el calendario de retiros publicado en la Plataforma. La cuenta de destino debe estar a nombre del Vendedor.
          </p>
          <p>
            OigaGIG podrá suspender un desembolso cuando existan indicios razonables de fraude, suplantación, operaciones no reconocidas por el titular del medio de pago u orden de autoridad. En ese caso, informará al Vendedor el motivo y el término estimado de la verificación.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 23. Facturación al Comprador</h3>
          <p>
            El Vendedor que esté obligado a facturar debe expedir la factura electrónica al Comprador por el valor total del Pedido. OigaGIG factura únicamente su Comisión al Vendedor.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 24. Reversiones y contracargos</h3>
          <p>
            Si un pago es revertido por la Pasarela de pagos o por la entidad financiera del Comprador, OigaGIG descontará el valor revertido de los saldos pendientes del Vendedor cuando la reversión sea imputable a este. Si no hay saldos suficientes, el Vendedor deberá reintegrar el valor dentro de los cinco (5) días hábiles siguientes al requerimiento.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 25. Prohibición de evadir la Plataforma</h3>
          <p>
            Está prohibido usar la Plataforma para contactar a la contraparte y luego celebrar o pagar el Pedido por fuera de ella con el fin de evitar la Comisión. Los Pedidos pagados por fuera de la Plataforma no cuentan con el Pago protegido, la Garantía OigaGIG ni el apoyo de soporte.
          </p>
          <p>
            La evasión reiterada podrá dar lugar a la suspensión o cancelación de la cuenta, conforme al artículo 42.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título VI. Cancelaciones, retracto, reversión y garantías</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 26. Cancelaciones</h3>
          <p>
            Salvo que el Gig establezca condiciones más favorables para el Comprador, las cancelaciones se rigen por la siguiente tabla:
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Situación</th>
                  <th className="text-left p-2">Efecto</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="p-2">El Comprador cancela antes de que el Vendedor acepte el Pedido</td><td className="p-2">Devolución del 100 % de lo pagado.</td></tr>
                <tr className="border-b"><td className="p-2">El Comprador cancela con más de 24 horas de anticipación a la fecha acordada</td><td className="p-2">Devolución del 100 % de lo pagado.</td></tr>
                <tr className="border-b"><td className="p-2">El Comprador cancela con menos de 24 horas de anticipación</td><td className="p-2">El Vendedor podrá retener los gastos efectivamente incurridos y acreditados (desplazamiento, materiales), sin exceder el 20 % del precio.</td></tr>
                <tr className="border-b"><td className="p-2">El Vendedor cancela o no se presenta</td><td className="p-2">Devolución del 100 % de lo pagado. La reiteración afecta la reputación del Vendedor y puede dar lugar a la suspensión de su cuenta.</td></tr>
                <tr><td className="p-2">Fuerza mayor o caso fortuito acreditado</td><td className="p-2">Reprogramación de común acuerdo o devolución del 100 % de lo pagado.</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            Las devoluciones se realizan al mismo medio de pago usado por el Comprador, dentro de los treinta (30) días calendario siguientes a la cancelación.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 27. Derecho de retracto</h3>
          <p>
            Cuando el Vendedor actúe como proveedor profesional, el Comprador podrá ejercer el derecho de retracto previsto en el artículo 47 de la Ley 1480 de 2011, dentro de los cinco (5) días hábiles siguientes a la entrega del producto o a la celebración del contrato de servicios. El Vendedor reintegrará el valor pagado dentro de los treinta (30) días calendario siguientes. Los costos de devolución del producto corren por cuenta del Comprador.
          </p>
          <p>El retracto no procede, entre otros casos, en:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Servicios cuya prestación haya comenzado con el acuerdo del Comprador.</li>
            <li>Productos confeccionados conforme a las especificaciones del Comprador o claramente personalizados.</li>
            <li>Productos perecederos y productos de uso personal.</li>
            <li>Los demás casos previstos en el artículo 47 de la Ley 1480 de 2011.</li>
          </ul>
          <p>
            El Comprador podrá ejercer el retracto directamente ante el Vendedor, caso en el cual deberá poner la solicitud en conocimiento de OigaGIG en el mismo momento, a través del chat del Pedido o del correo {site.supportEmail}. También podrá presentarla directamente a OigaGIG por esos mismos canales. OigaGIG lo tramitará con el Vendedor y gestionará el reintegro con los fondos retenidos cuando aún no se hayan liberado.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 28. Reversión del pago</h3>
          <p>
            Conforme al artículo 51 de la Ley 1480 de 2011 y su reglamentación, cuando el Comprador haya pagado con tarjeta de crédito, débito o cualquier instrumento de pago electrónico, podrá solicitar la reversión del pago en los siguientes casos:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Fue objeto de fraude.</li>
            <li>La operación no fue solicitada.</li>
            <li>El producto adquirido no fue recibido.</li>
            <li>El producto entregado no corresponde a lo solicitado o es defectuoso.</li>
          </ol>
          <p>
            La solicitud debe presentarse dentro de los cinco (5) días hábiles siguientes a la fecha en que el Comprador tuvo noticia de la operación fraudulenta o no solicitada, o en que debió recibir el producto o lo recibió defectuoso o diferente. Debe radicarse ante OigaGIG, a través del correo {site.supportEmail} o del chat de soporte, y ante el emisor del medio de pago. Cuando proceda, la reversión se hará efectiva dentro del término legal.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 29. Efectividad de la garantía legal</h3>
          <p>
            El Comprador puede reclamar la garantía legal directamente al Vendedor por el chat del Pedido. Si el Vendedor no responde dentro de los quince (15) días hábiles siguientes, o si el Comprador no logra identificarlo o contactarlo, OigaGIG pondrá a su disposición la información de identificación del Vendedor, conforme al artículo 53 de la Ley 1480 de 2011.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 30. Garantía OigaGIG</h3>
          <p>
            La Garantía OigaGIG es un beneficio adicional y voluntario que ofrece OigaGIG a los Compradores, sin perjuicio de los derechos que la ley les reconoce. Cubre los Pedidos pagados en la Plataforma en los que:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>El Vendedor no prestó el servicio o no entregó el producto.</li>
            <li>Lo entregado es sustancialmente distinto a lo descrito en el Gig o a lo acordado en el chat.</li>
            <li>El Vendedor canceló el Pedido después de recibido el pago y no lo reembolsó.</li>
          </ol>
          <p>
            Para acceder a ella, el Comprador debe reportar la inconformidad dentro del plazo del artículo 21 y aportar las pruebas razonables que tenga (fotografías, mensajes, comprobantes). OigaGIG analizará el caso y, si la reclamación procede, ordenará la devolución total o parcial con cargo a los fondos retenidos del Pedido.
          </p>
          <p>
            La Garantía OigaGIG no cubre los Pedidos pagados por fuera de la Plataforma, las simples diferencias de gusto o expectativa sobre un servicio ejecutado conforme a lo ofrecido, ni los daños que deban reclamarse directamente al Vendedor o a su aseguradora.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título VII. Reseñas, contenidos y propiedad intelectual</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 31. Calificaciones y reseñas</h3>
          <p>
            Solo los Compradores con un Pedido finalizado pueden calificar al Vendedor y dejar una reseña sobre ese Pedido. Las reseñas deben ser honestas, basadas en la experiencia real y respetuosas.
          </p>
          <p>Está prohibido:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Publicar reseñas falsas, comprar o vender calificaciones, o calificar Pedidos propios o simulados.</li>
            <li>Ofrecer beneficios a cambio de una reseña positiva o presionar al Comprador para modificarla.</li>
            <li>Incluir en las reseñas insultos, contenido discriminatorio, datos personales de terceros o información confidencial.</li>
          </ul>
          <p>
            OigaGIG no edita el contenido de las reseñas. Podrá retirarlas cuando infrinjan este artículo, la ley o derechos de terceros, y el Vendedor podrá publicar una respuesta pública a cada reseña. OigaGIG no retirará reseñas por el solo hecho de ser negativas.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 32. Contenido de los Usuarios</h3>
          <p>
            El Usuario es responsable de los textos, fotografías, videos y demás contenidos que publique, y declara ser su titular o contar con las autorizaciones necesarias, incluida la de las personas que aparezcan en ellos.
          </p>
          <p>
            El Usuario concede a OigaGIG una licencia no exclusiva, gratuita, para el territorio mundial y por el tiempo en que el contenido permanezca publicado, para reproducir, adaptar en formato, exhibir y comunicar públicamente dicho contenido dentro de la Plataforma y en la promoción de la Plataforma en redes sociales y medios digitales. El Vendedor puede oponerse al uso promocional de sus contenidos escribiendo al correo de contacto.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 33. Propiedad intelectual de OigaGIG</h3>
          <p>
            La marca y los signos distintivos OigaGIG, el software, el diseño, las bases de datos, los textos y demás elementos de la Plataforma son de propiedad de CORTLAND BLACKSTONE S.A.S. o de sus licenciantes. Ningún elemento de estos Términos concede al Usuario derechos sobre ellos, más allá del uso personal de la Plataforma.
          </p>
          <p>
            Está prohibido copiar, extraer de forma masiva o automatizada (scraping), descompilar o hacer ingeniería inversa de la Plataforma, o usar sus signos distintivos sin autorización escrita.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 34. Reporte de infracciones</h3>
          <p>
            Quien considere que un contenido de la Plataforma infringe sus derechos de autor, sus marcas, su intimidad o su buen nombre podrá reportarlo al correo {site.supportEmail}, identificando el contenido, el derecho afectado y su calidad de titular. OigaGIG analizará el reporte, informará al Usuario que publicó el contenido, le dará la oportunidad de pronunciarse y retirará el contenido cuando la infracción sea evidente o lo ordene una autoridad.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título VIII. Relación con los Vendedores</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 35. Autonomía e independencia</h3>
          <p>
            Los Vendedores son personas independientes que ofrecen sus servicios o productos por su cuenta y riesgo. Entre OigaGIG y los Vendedores no existe contrato de trabajo, relación de subordinación, sociedad, agencia ni representación. En particular, el Vendedor:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Decide libremente qué servicios ofrece, sus precios, horarios, zona de cobertura y condiciones.</li>
            <li>Acepta o rechaza libremente cada Pedido, sin que el rechazo genere sanciones distintas del efecto natural en su reputación.</li>
            <li>Usa sus propias herramientas, materiales y medios de transporte.</li>
            <li>Puede ofrecer sus servicios en otras plataformas o canales, sin exclusividad.</li>
            <li>Ejecuta el servicio con autonomía técnica, sin recibir órdenes de OigaGIG sobre la forma de realizarlo.</li>
          </ol>
          <p>
            Las reglas de conducta, calidad y seguridad de estos Términos tienen como única finalidad proteger a la comunidad de Usuarios y el funcionamiento de la Plataforma.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 36. Seguros y responsabilidad del Vendedor</h3>
          <p>
            El Vendedor responde por los daños que cause al Comprador, a sus bienes o a terceros durante la ejecución del Pedido. Se recomienda a los Vendedores contar con seguros de responsabilidad civil acordes con su actividad. OigaGIG no asume la responsabilidad del Vendedor por esos daños, salvo cuando estos se deriven de una falla de la Plataforma imputable a OigaGIG.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título IX. Atención, controversias y responsabilidad</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 37. Peticiones, quejas y reclamos</h3>
          <p>
            Los Usuarios pueden presentar peticiones, quejas y reclamos sobre la Plataforma al correo {site.supportEmail} o por el canal de soporte. OigaGIG responderá dentro de los quince (15) días hábiles siguientes a su recibo. Las solicitudes sobre datos personales se tramitan conforme a la Política de Tratamiento de Datos Personales.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 38. Controversias entre Compradores y Vendedores</h3>
          <p>Las diferencias sobre la ejecución de un Pedido se tramitan así:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>Arreglo directo.</strong> Las partes intentarán resolver la diferencia por el chat del Pedido durante un máximo de tres (3) días hábiles.</li>
            <li><strong>Mediación de OigaGIG.</strong> Si no hay acuerdo, cualquiera de las partes podrá solicitar la intervención de OigaGIG. Ambas partes podrán aportar pruebas dentro de los tres (3) días hábiles siguientes.</li>
            <li><strong>Decisión sobre los fondos.</strong> Dentro de los diez (10) días hábiles siguientes, OigaGIG decidirá, de buena fe y con base en las pruebas, si libera los fondos retenidos al Vendedor, los devuelve total o parcialmente al Comprador o los distribuye entre ambos.</li>
          </ol>
          <p>
            La decisión de OigaGIG se limita a los fondos retenidos en la Plataforma. No es una decisión judicial y no impide que las partes acudan a la Superintendencia de Industria y Comercio, a los jueces o a los mecanismos alternativos de solución de conflictos.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 39. Responsabilidad de OigaGIG</h3>
          <p>
            OigaGIG responde por la prestación diligente de su servicio de intermediación tecnológica, por el manejo de los fondos que recauda, por la Garantía OigaGIG y por las obligaciones que la ley le impone como portal de contacto.
          </p>
          <p>
            OigaGIG no responde por la calidad, idoneidad, seguridad o legalidad de los servicios y productos ofrecidos por los Vendedores, ni por los daños que estos causen en su ejecución, salvo cuando haya incumplido sus propias obligaciones legales o contractuales.
          </p>
          <p>
            Frente a los Vendedores, y en cuanto la ley lo permita, la responsabilidad de OigaGIG por daños derivados del uso de la Plataforma se limitará al valor de las Comisiones pagadas por el Vendedor en los seis (6) meses anteriores al hecho que la origina. Ninguna limitación de estos Términos se aplica en casos de dolo o culpa grave de OigaGIG, ni restringe los derechos irrenunciables de los consumidores conforme a los artículos 4 y 43 de la Ley 1480 de 2011.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 40. Responsabilidad de los Usuarios</h3>
          <p>
            Cada Usuario responde por el incumplimiento de estos Términos y de la ley, y mantendrá indemne a OigaGIG frente a las reclamaciones de terceros o sanciones de autoridades derivadas de su conducta, de los contenidos que publique o de los servicios y productos que ofrezca, incluidos los honorarios razonables de abogados.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 41. Disponibilidad de la Plataforma</h3>
          <p>
            OigaGIG procurará que la Plataforma esté disponible de forma continua, pero podrá suspenderla temporalmente por mantenimiento, actualizaciones, fallas técnicas o causas ajenas a su control. Los mantenimientos programados se anunciarán con anticipación cuando sea posible. Si una interrupción afecta un Pedido en curso, los plazos de los artículos 21 y 38 se suspenderán mientras dure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título X. Disposiciones finales</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 42. Suspensión y cancelación de cuentas</h3>
          <p>OigaGIG podrá suspender temporalmente o cancelar una cuenta, o retirar Gigs y contenidos, cuando el Usuario:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Suministre información falsa o suplante a otra persona.</li>
            <li>Ofrezca bienes o servicios prohibidos o ilegales.</li>
            <li>Incurra en fraude, manipulación de reseñas o evasión de pagos de la Plataforma.</li>
            <li>Acose, amenace, discrimine o ponga en riesgo a otros Usuarios.</li>
            <li>Incumpla de forma grave o reiterada estos Términos.</li>
            <li>Sea requerido por una autoridad competente.</li>
          </ol>
          <p>
            Salvo en casos de riesgo inminente para otros Usuarios, fraude o orden de autoridad, OigaGIG informará previamente al Usuario la causa y le dará un plazo de tres (3) días hábiles para presentar sus explicaciones. La decisión final será revisada por una persona del equipo de OigaGIG. La cancelación no afecta los Pedidos ya pagados, que se resolverán conforme a estos Términos, ni el derecho del Vendedor a recibir los saldos que le correspondan, salvo que estén vinculados a un fraude.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 43. Terminación por el Usuario</h3>
          <p>
            El Usuario puede terminar su relación con OigaGIG en cualquier momento eliminando su cuenta desde Mi Perfil, siempre que no tenga Pedidos en curso. La eliminación de datos personales se rige por la Política de Tratamiento de Datos Personales.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 44. Modificaciones</h3>
          <p>
            OigaGIG podrá modificar estos Términos para atender cambios legales, tecnológicos u operativos. Las modificaciones se informarán por correo electrónico y mediante aviso destacado en la Plataforma con al menos quince (15) días calendario de anticipación a su entrada en vigencia, salvo que obedezcan a un mandato legal de aplicación inmediata.
          </p>
          <p>
            Las modificaciones no se aplicarán a los Pedidos ya confirmados. El Usuario que no esté de acuerdo podrá terminar su relación con OigaGIG antes de la entrada en vigencia, sin penalidad alguna.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 45. Notificaciones</h3>
          <p>
            Las comunicaciones de OigaGIG a los Usuarios se enviarán al correo electrónico registrado en la cuenta o por notificaciones dentro de la Plataforma. Las comunicaciones de los Usuarios a OigaGIG se dirigirán a:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Correo electrónico:</strong>{' '}
              <a href={`mailto:${site.supportEmail}`} className="text-orange-600 hover:underline">{site.supportEmail}</a>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 46. Ley aplicable y autoridades competentes</h3>
          <p>
            Estos Términos se rigen por las leyes de la República de Colombia. Las controversias se resolverán ante las autoridades colombianas competentes. Los Compradores que actúen como consumidores conservan su derecho a acudir a la Superintendencia de Industria y Comercio, en ejercicio de la acción de protección al consumidor, o a los jueces de su domicilio, conforme a la Ley 1480 de 2011 y al Código General del Proceso.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 47. Divisibilidad</h3>
          <p>
            Si alguna disposición de estos Términos es declarada nula, ineficaz o abusiva, las demás conservarán plena validez, y la disposición afectada se interpretará en el sentido más favorable al Usuario que la ley permita.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 48. Vigencia</h3>
          <p>
            Estos Términos rigen a partir de su publicación en https://oigagig.com/terms y reemplazan cualquier versión anterior.
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
