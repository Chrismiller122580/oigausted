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
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título I. Disposiciones generales</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 1. Responsable del tratamiento</h3>
          <p>
            CORTLAND BLACKSTONE S.A.S. es la sociedad propietaria y operadora de la plataforma OigaGIG, compuesta por el sitio web https://oigagig.com y la aplicación móvil OigaGIG para Android e iOS (en adelante, la “Plataforma”). En esa calidad, actúa como Responsable del Tratamiento de los datos personales que se recolectan a través de la Plataforma y en desarrollo de su actividad empresarial.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Razón social:</strong> CORTLAND BLACKSTONE S.A.S.</li>
            <li><strong>NIT:</strong> 901915866-7</li>
            <li><strong>Correo electrónico para asuntos de protección de datos personales:</strong>{' '}
              <a href={`mailto:${site.supportEmail}`} className="text-orange-600 hover:underline">{site.supportEmail}</a>
            </li>
            <li><strong>Marca y plataforma:</strong> OigaGIG (https://oigagig.com)</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 2. Objeto</h3>
          <p>
            Esta Política establece cómo OigaGIG recolecta, almacena, usa, circula, transmite, transfiere, actualiza, suprime y, en general, trata los datos personales de quienes usan la Plataforma o se relacionan con la compañía. Informa a los titulares sus derechos, las finalidades del tratamiento y los procedimientos para ejercerlos, en cumplimiento del artículo 13 del Decreto 1377 de 2013, compilado en el Decreto 1074 de 2015.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 3. Ámbito de aplicación</h3>
          <p>
            La Política aplica a todas las bases de datos de OigaGIG, cualquiera sea su formato o lugar de almacenamiento, y cobija a las siguientes personas naturales:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Compradores:</strong> quienes buscan, contratan y pagan servicios o productos a través de la Plataforma.</li>
            <li><strong>Vendedores:</strong> profesionales, independientes y representantes de negocios que publican servicios o productos (“gigs”).</li>
            <li><strong>Visitantes:</strong> quienes navegan el sitio web o la aplicación sin crear una cuenta.</li>
            <li><strong>Personas que contactan a OigaGIG:</strong> solicitudes de soporte, peticiones, quejas, reclamos o mensajes por redes sociales y canales de atención.</li>
            <li><strong>Grupos de interés internos:</strong> trabajadores, contratistas, aspirantes, proveedores, aliados y accionistas.</li>
          </ul>
          <p>
            La Política se aplica a los tratamientos realizados en Colombia. Cuando OigaGIG inicie operaciones en otros países (actualmente anunciados como próximos lanzamientos: Panamá y El Salvador), esta Política se complementará con las disposiciones locales que resulten aplicables. La información de personas jurídicas no constituye dato personal; sin embargo, los datos de sus representantes, empleados y contactos sí se rigen por esta Política.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 4. Marco normativo</h3>
          <p>Esta Política se fundamenta en:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Artículos 15 y 20 de la Constitución Política de Colombia.</li>
            <li>Ley Estatutaria 1581 de 2012, régimen general de protección de datos personales.</li>
            <li>Decreto 1074 de 2015, Capítulos 25 y 26 (que compilan los Decretos 1377 de 2013 y 886 de 2014, y el Decreto 090 de 2018).</li>
            <li>Título V de la Circular Única de la Superintendencia de Industria y Comercio (SIC).</li>
            <li>Ley 1480 de 2011 (Estatuto del Consumidor), en particular el artículo 53 sobre portales de contacto.</li>
            <li>Ley 527 de 1999, sobre comercio electrónico y mensajes de datos.</li>
            <li>Ley 2300 de 2023, sobre canales y horarios para el contacto con consumidores.</li>
            <li>Jurisprudencia de la Corte Constitucional, en especial la Sentencia C-748 de 2011.</li>
          </ul>
          <p>
            OigaGIG no actúa como fuente de información ante operadores de bancos de datos financieros o crediticios. Si en el futuro lo hiciera, ese tratamiento se sujetará a la Ley 1266 de 2008.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 5. Definiciones</h3>
          <p>
            Para efectos de esta Política se adoptan las definiciones de la Ley 1581 de 2012 y sus decretos reglamentarios, junto con las siguientes, propias de la Plataforma:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Autorización:</strong> consentimiento previo, expreso e informado del Titular para el tratamiento de sus datos.</li>
            <li><strong>Aviso de privacidad:</strong> comunicación mediante la cual se informa al Titular la existencia de esta Política, las finalidades del tratamiento y la forma de acceder a ella.</li>
            <li><strong>Dato personal:</strong> información vinculada o que pueda asociarse a una persona natural determinada o determinable.</li>
            <li><strong>Dato público:</strong> el que no es semiprivado, privado ni sensible, como el estado civil, la profesión u oficio o la calidad de comerciante.</li>
            <li><strong>Dato sensible:</strong> el que afecta la intimidad del Titular o cuyo uso indebido puede generar discriminación, como los datos de salud, la vida sexual, el origen racial o étnico, las convicciones religiosas o políticas y los datos biométricos.</li>
            <li><strong>Encargado del tratamiento:</strong> persona que trata datos personales por cuenta de OigaGIG.</li>
            <li><strong>Responsable del tratamiento:</strong> persona que decide sobre la base de datos y su tratamiento.</li>
            <li><strong>Titular:</strong> persona natural cuyos datos son objeto de tratamiento.</li>
            <li><strong>Transferencia:</strong> envío de datos a un receptor que, a su vez, es Responsable del Tratamiento, dentro o fuera de Colombia.</li>
            <li><strong>Transmisión:</strong> comunicación de datos a un Encargado para que los trate por cuenta de OigaGIG, dentro o fuera de Colombia.</li>
            <li><strong>Usuario:</strong> toda persona registrada en la Plataforma, sea como Comprador, como Vendedor o con ambos roles.</li>
            <li><strong>Gig:</strong> publicación en la que un Vendedor ofrece un servicio o producto, con su descripción, precio, fotografías y zona de cobertura.</li>
            <li><strong>Pedido:</strong> solicitud de compra de un Gig realizada por un Comprador a través de la Plataforma.</li>
            <li><strong>Pasarela de pagos:</strong> proveedor autorizado que procesa los pagos de la Plataforma, actualmente Wompi.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 6. Principios</h3>
          <p>OigaGIG aplica los principios del artículo 4 de la Ley 1581 de 2012 de la siguiente forma:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Legalidad:</strong> El tratamiento se sujeta a la ley colombiana y a esta Política.</li>
            <li><strong>Finalidad:</strong> Los datos se usan solo para las finalidades del Título IV, informadas al Titular al momento del registro.</li>
            <li><strong>Libertad:</strong> Se trata la información con autorización del Titular, salvo las excepciones del artículo 10 de la Ley 1581 de 2012. Las finalidades opcionales (publicidad, analítica con cookies) se autorizan por separado.</li>
            <li><strong>Veracidad o calidad:</strong> Los Usuarios deben suministrar información veraz y pueden actualizarla en su perfil en cualquier momento.</li>
            <li><strong>Transparencia:</strong> El Titular puede conocer en todo momento qué datos suyos se tratan, a través de su perfil o del correo de protección de datos.</li>
            <li><strong>Acceso y circulación restringida:</strong> Solo el personal y los proveedores que lo necesitan acceden a los datos. Lo que se publica en perfiles y reseñas se limita a lo indispensable para generar confianza entre Usuarios.</li>
            <li><strong>Seguridad:</strong> Se aplican las medidas técnicas, humanas y administrativas descritas en el Título VIII.</li>
            <li><strong>Confidencialidad:</strong> Toda persona que intervenga en el tratamiento guarda reserva de la información, incluso después de terminada su relación con OigaGIG.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título II. Funcionamiento de la Plataforma y autorización</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 7. Cómo funciona OigaGIG y quién responde por los datos</h3>
          <p>
            OigaGIG es un marketplace que conecta a personas que necesitan un servicio o producto con profesionales y negocios locales. Los Usuarios se registran, publican o buscan Gigs por categoría, ciudad, precio, distancia o mapa, conversan por el chat de la Plataforma, pagan a través de la Pasarela de pagos, hacen seguimiento al Pedido y califican la experiencia.
          </p>
          <p>
            OigaGIG no es parte del contrato de servicio que celebran Compradores y Vendedores. Por esa razón, la responsabilidad sobre los datos se distribuye así:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>OigaGIG</strong> es Responsable de los datos que recolecta para operar la Plataforma: cuentas, perfiles, Gigs, Pedidos, mensajes, pagos registrados, reseñas, soporte y datos técnicos.</li>
            <li><strong>Cada Vendedor</strong> que recibe datos de un Comprador para atender un Pedido (por ejemplo, nombre, teléfono o dirección donde se prestará el servicio) los trata como Responsable independiente. Solo puede usarlos para ejecutar ese Pedido y no puede incorporarlos a bases propias para publicidad, venderlos ni compartirlos con terceros. La misma regla aplica al Comprador respecto de los datos del Vendedor.</li>
            <li><strong>La Pasarela de pagos (Wompi)</strong> trata los datos de los medios de pago que el Usuario ingresa en su formulario de pago, bajo su propia política de tratamiento. OigaGIG recibe la información necesaria para registrar la transacción (referencia, valor, estado y medio de pago utilizado), pero no almacena números completos de tarjetas ni claves bancarias.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 8. Medios de recolección</h3>
          <p>OigaGIG obtiene datos personales por los siguientes medios:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Formularios de registro e inicio de sesión del sitio web y de la aplicación.</li>
            <li>Perfil del Usuario y publicación de Gigs (textos, fotografías, precios, ciudad y zona de cobertura).</li>
            <li>Chat de la Plataforma, Pedidos, calificaciones y reseñas.</li>
            <li>Sección de ganancias, donde el Vendedor registra sus datos para recibir desembolsos.</li>
            <li>Canales de soporte, correo electrónico, redes sociales y WhatsApp.</li>
            <li>Permisos del dispositivo móvil que el Usuario decida conceder: ubicación, cámara, galería de fotos y notificaciones.</li>
            <li>Cookies, almacenamiento local y tecnologías similares, en los términos del artículo 21.</li>
            <li>Terceros autorizados, como la Pasarela de pagos (confirmación de transacciones) y las tiendas de aplicaciones.</li>
          </ol>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 9. Autorización del Titular</h3>
          <p>
            OigaGIG solicita la autorización del Titular de forma previa, expresa e informada, a más tardar al momento de la recolección. En la Plataforma, la autorización se otorga mediante una casilla de aceptación, no marcada de forma previa, ubicada en el formulario de registro, acompañada del enlace a esta Política. También puede otorgarse por escrito, de forma oral o mediante conductas inequívocas que permitan concluir razonablemente que fue otorgada, conforme al artículo 7 del Decreto 1377 de 2013.
          </p>
          <p>Las siguientes finalidades son opcionales y requieren una autorización separada, que el Titular puede negar o retirar sin afectar el uso de la Plataforma:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Envío de publicidad, promociones y novedades comerciales (artículo 22).</li>
            <li>Cookies de analítica y medición publicitaria de terceros, como Google Analytics y Meta Pixel (artículo 21).</li>
            <li>Acceso a la ubicación precisa del dispositivo (artículo 13).</li>
          </ul>
          <p>
            OigaGIG conserva prueba de cada autorización: fecha, hora, versión de la Política aceptada, identificador de la cuenta y dirección IP.
          </p>
          <p>
            No se requiere autorización en los casos del artículo 10 de la Ley 1581 de 2012: información requerida por una entidad pública o administrativa en ejercicio de sus funciones legales o por orden judicial, datos de naturaleza pública, casos de urgencia médica o sanitaria, tratamiento autorizado por la ley para fines históricos, estadísticos o científicos, y datos relacionados con el Registro Civil de las Personas.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 10. Aviso de privacidad</h3>
          <p>
            Cuando no sea posible poner esta Política a disposición del Titular en el momento de la recolección, OigaGIG le informará mediante un aviso de privacidad su existencia, la identidad del Responsable, las finalidades del tratamiento, sus derechos y la forma de consultar el texto completo, publicado de manera permanente en https://oigagig.com/privacy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título III. Datos personales que trata OigaGIG</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 11. Datos según el tipo de Titular</h3>
          <p>
            OigaGIG recolecta únicamente los datos necesarios para cada relación. Los datos marcados como opcionales pueden omitirse sin impedir el registro.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Titular</th>
                  <th className="text-left p-2">Datos obligatorios</th>
                  <th className="text-left p-2">Datos opcionales</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">Comprador</td>
                  <td className="p-2">Nombre, correo electrónico, contraseña (almacenada cifrada), rol en la Plataforma; datos del Pedido (servicio, fecha, valor, dirección o lugar donde se prestará el servicio cuando aplique).</td>
                  <td className="p-2">Teléfono, ciudad, fotografía de perfil, preferencias de notificación.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Vendedor</td>
                  <td className="p-2">Los anteriores, más: tipo y número de documento de identidad, teléfono o WhatsApp, ciudad y zona de cobertura, descripción del Gig, precio, datos para desembolsos (titular, entidad, tipo y número de cuenta o billetera digital) y, cuando corresponda, NIT o RUT y nombre comercial.</td>
                  <td className="p-2">Fotografía de perfil, biografía, fotografías de trabajos realizados, certificaciones, licencias y experiencia.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Ambos roles</td>
                  <td className="p-2">Historial de Pedidos, pagos registrados, calificaciones y reseñas emitidas y recibidas, mensajes enviados por el chat, solicitudes de soporte y registros de aceptación de documentos legales.</td>
                  <td className="p-2">—</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Visitante</td>
                  <td className="p-2">Datos técnicos de navegación (artículo 14) y cookies esenciales.</td>
                  <td className="p-2">Cookies de analítica y medición publicitaria, solo con su consentimiento.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Persona que contacta a OigaGIG</td>
                  <td className="p-2">Nombre, datos de contacto y contenido de la solicitud.</td>
                  <td className="p-2">Documentos de soporte que decida aportar.</td>
                </tr>
                <tr>
                  <td className="p-2">Trabajadores, contratistas, aspirantes, proveedores y accionistas</td>
                  <td className="p-2">Datos de identificación, contacto, formación, experiencia, información contractual, tributaria y bancaria necesaria para la relación.</td>
                  <td className="p-2">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 12. Información de pagos, comisiones y desembolsos</h3>
          <p>
            Los pagos de los Compradores se realizan a través de la Pasarela de pagos con Nequi, PSE, tarjetas débito o crédito y los demás medios habilitados, en pesos colombianos. OigaGIG registra la información de cada transacción, la comisión que retiene sobre las ventas completadas y los desembolsos a los Vendedores.
          </p>
          <p>
            Los datos bancarios del Vendedor se usan exclusivamente para pagarle sus ganancias, verificar la titularidad de la cuenta, emitir los documentos tributarios correspondientes y prevenir fraudes. Solo el personal autorizado del área financiera puede consultarlos.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 13. Ubicación</h3>
          <p>
            La Plataforma usa la ubicación para mostrar Gigs cercanos, ordenar resultados por distancia y presentar el mapa de profesionales. Por defecto, OigaGIG trabaja con la ciudad o zona que el Usuario indica en su perfil.
          </p>
          <p>
            La ubicación precisa del dispositivo solo se recolecta si el Usuario concede el permiso correspondiente en su teléfono o navegador, y puede retirarlo en cualquier momento desde la configuración del dispositivo. Retirar el permiso no impide usar la Plataforma; solo limita las búsquedas por cercanía.
          </p>
          <p>
            La ubicación de los Vendedores se muestra públicamente a nivel de ciudad, barrio o zona de cobertura, nunca con su dirección exacta, salvo que el Vendedor decida publicarla para un establecimiento de comercio abierto al público.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 14. Información técnica y del dispositivo</h3>
          <p>
            Al usar la Plataforma se generan registros técnicos: dirección IP, tipo de dispositivo y sistema operativo, navegador, versión de la aplicación, identificadores del dispositivo, token de notificaciones, idioma, zona horaria, páginas visitadas, fecha y hora de acceso y eventos de seguridad. Estos datos se usan para mantener la sesión, proteger las cuentas, detectar fraudes, corregir fallas y medir el rendimiento de la Plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título IV. Finalidades del tratamiento</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 15. Finalidades</h3>
          <p>
            OigaGIG trata los datos personales para las finalidades que se enumeran a continuación. Las de los literales A y E son necesarias para prestar el servicio; las del literal F son opcionales.
          </p>
          <h4 className="font-semibold mt-3">A. Operación de la Plataforma</h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Crear, autenticar y administrar las cuentas de Compradores y Vendedores, y permitir el cambio de rol.</li>
            <li>Publicar los perfiles y Gigs de los Vendedores y mostrarlos en búsquedas, categorías y en el mapa.</li>
            <li>Gestionar Pedidos, habilitar el chat entre las partes y mostrar el estado del Pedido en tiempo real.</li>
            <li>Enviar notificaciones operativas por correo, notificación push o dentro de la Plataforma sobre cuentas, Pedidos, mensajes, pagos y cambios en los documentos legales.</li>
            <li>Atender solicitudes de soporte, preguntas y reclamaciones de los Usuarios.</li>
          </ol>
          <h4 className="font-semibold mt-3">B. Pagos y garantía</h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Procesar los pagos a través de la Pasarela de pagos y conciliar las transacciones.</li>
            <li>Liquidar y retener la comisión de OigaGIG y realizar los desembolsos a los Vendedores.</li>
            <li>Gestionar el pago protegido, la Garantía OigaGIG, las devoluciones, las cancelaciones y los reembolsos.</li>
            <li>Emitir facturas y demás documentos contables y tributarios.</li>
          </ol>
          <h4 className="font-semibold mt-3">C. Confianza y seguridad de la comunidad</h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Gestionar el sistema de calificaciones y reseñas y calcular los indicadores de reputación de los Vendedores.</li>
            <li>Verificar la identidad de los Usuarios y la información de los Vendedores, cuando aplique (artículo 20).</li>
            <li>Prevenir y detectar fraudes, suplantaciones, cuentas falsas, manipulación de calificaciones y la evasión de pagos fuera de la Plataforma.</li>
            <li>Mediar de buena fe en las controversias entre Compradores y Vendedores y suspender o desactivar cuentas que incumplan los Términos de uso.</li>
            <li>Proteger la seguridad de la Plataforma, de los Usuarios y de terceros.</li>
          </ol>
          <h4 className="font-semibold mt-3">D. Cumplimiento legal</h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Cumplir las obligaciones contables, tributarias y comerciales de CORTLAND BLACKSTONE S.A.S.</li>
            <li>Exigir a los Vendedores su información de identificación y ponerla a disposición de los Compradores y de las autoridades cuando presenten una reclamación, conforme al artículo 53 de la Ley 1480 de 2011.</li>
            <li>Atender requerimientos de autoridades administrativas y judiciales competentes.</li>
            <li>Ejercer o defender los derechos de OigaGIG en procesos judiciales, administrativos o extrajudiciales.</li>
          </ol>
          <h4 className="font-semibold mt-3">E. Mejora del servicio</h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Elaborar estadísticas de uso, preferiblemente con información agregada o seudonimizada.</li>
            <li>Personalizar los resultados de búsqueda y las recomendaciones de Gigs según la ciudad, la categoría y la actividad del Usuario en la Plataforma.</li>
            <li>Corregir errores, probar nuevas funcionalidades y mejorar la experiencia de la aplicación y del sitio web.</li>
          </ol>
          <h4 className="font-semibold mt-3">F. Finalidades opcionales (requieren autorización separada)</h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Enviar publicidad, promociones, beneficios, encuestas y novedades de OigaGIG por correo, WhatsApp, mensajes de texto o notificaciones push.</li>
            <li>Medir campañas publicitarias y mostrar anuncios relevantes en plataformas de terceros mediante cookies de analítica y medición, como Google Analytics y Meta Pixel.</li>
            <li>Destacar Gigs o perfiles en campañas promocionales de OigaGIG, cuando el Vendedor participe en ellas.</li>
          </ol>
          <p>
            OigaGIG no vende datos personales. Cualquier uso para una finalidad distinta de las aquí descritas requerirá una nueva autorización del Titular.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 16. Reputación, ordenamiento y decisiones automatizadas</h3>
          <p>
            Las calificaciones, reseñas, tiempos de respuesta, Pedidos completados y reportes de otros Usuarios influyen en la posición de los Gigs en los resultados de búsqueda y en los indicadores de confianza del perfil.
          </p>
          <p>
            OigaGIG puede usar reglas automatizadas para detectar actividad sospechosa. Sin embargo, la suspensión o desactivación definitiva de una cuenta siempre será revisada por una persona del equipo de OigaGIG. El Usuario afectado podrá conocer el motivo general de la decisión y presentar sus explicaciones a través del correo de protección de datos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título V. Tratamientos especiales</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 17. Información visible en la Plataforma</h3>
          <p>
            Al crear un Gig, el Vendedor autoriza que la siguiente información sea visible para cualquier persona que visite la Plataforma: nombre o nombre comercial, fotografía de perfil, ciudad y zona de cobertura, descripción, precios, fotografías de trabajos, calificación promedio y reseñas recibidas. El teléfono o WhatsApp del Vendedor solo se muestra cuando este decide habilitarlo.
          </p>
          <p>
            Las reseñas de los Compradores se publican con su nombre de pila y la inicial de su apellido. La información del Pedido (dirección, teléfono y detalles del servicio) solo es visible para las partes de ese Pedido y para el personal de OigaGIG que lo requiera.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 18. Datos sensibles</h3>
          <p>
            OigaGIG no solicita datos sensibles para el registro ni para el uso ordinario de la Plataforma. El Titular no está obligado a suministrar datos sensibles ni a autorizar su tratamiento, y ninguna actividad de la Plataforma se condiciona a ello, conforme a los artículos 5 y 6 de la Ley 1581 de 2012.
          </p>
          <p>
            Algunas categorías de la Plataforma, como belleza a domicilio, venta de productos de sanación natural, asesoría legal o clases particulares, pueden llevar a que los Usuarios compartan información sobre su salud, su situación financiera u otros aspectos íntimos. Se recomienda compartir por el chat solo lo indispensable para el servicio. Los Vendedores que reciban esta información deben usarla exclusivamente para prestar el servicio contratado y guardar estricta reserva.
          </p>
          <p>
            Cuando OigaGIG deba tratar datos sensibles, por ejemplo datos biométricos en un proceso de verificación de identidad, solicitará autorización explícita, informará qué datos son sensibles y la finalidad específica, y aplicará controles de acceso reforzados.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 19. Niños, niñas y adolescentes</h3>
          <p>
            La Plataforma está dirigida exclusivamente a personas mayores de 18 años. Los menores de edad no pueden crear cuentas. Si OigaGIG detecta una cuenta de un menor, la deshabilitará y suprimirá sus datos, salvo los que deba conservar por obligación legal.
          </p>
          <p>
            Algunos servicios pueden estar dirigidos a menores, como clases particulares o fotografía de eventos familiares. En esos casos, el Comprador mayor de edad que actúa como representante legal del menor suministra solo los datos indispensables para el servicio y otorga la autorización correspondiente. El tratamiento respetará el interés superior del menor y sus derechos prevalentes, conforme al artículo 7 de la Ley 1581 de 2012.
          </p>
          <p>
            Los Vendedores no pueden publicar en sus Gigs fotografías o videos en los que aparezcan menores de edad sin la autorización previa y expresa de su representante legal.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 20. Verificación de identidad</h3>
          <p>
            Para otorgar la insignia de Vendedor verificado y prevenir suplantaciones, OigaGIG puede validar el documento de identidad, la titularidad de la cuenta bancaria, el RUT y las certificaciones aportadas por el Vendedor, consultando fuentes oficiales o proveedores especializados.
          </p>
          <p>
            Si OigaGIG implementa la verificación mediante reconocimiento facial o comparación de fotografía con el documento, ese tratamiento se considera de datos sensibles. Solo se realizará con autorización explícita del Vendedor, quien podrá optar por un mecanismo de verificación alternativo.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 21. Cookies y tecnologías similares</h3>
          <p>La Plataforma usa cookies y almacenamiento local en las siguientes categorías:</p>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Categoría</th>
                  <th className="text-left p-2">Para qué se usa</th>
                  <th className="text-left p-2">¿Requiere consentimiento?</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">Esenciales</td>
                  <td className="p-2">Mantener la sesión, autenticación, seguridad y preferencias básicas (tema, tutoriales).</td>
                  <td className="p-2">No; son necesarias para que la Plataforma funcione.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Analítica agregada</td>
                  <td className="p-2">Métricas agregadas de páginas visitadas mediante Vercel Web Analytics, sin cookies de marketing y sin identificar personas.</td>
                  <td className="p-2">No.</td>
                </tr>
                <tr>
                  <td className="p-2">Analítica y medición publicitaria</td>
                  <td className="p-2">Google Analytics y Meta Pixel, para entender el tráfico y medir visitas, registros y compras, y para mostrar anuncios relevantes en plataformas de terceros.</td>
                  <td className="p-2">Sí; solo se activan si el Usuario selecciona “Aceptar analíticas” en el banner de cookies.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            El Usuario puede cambiar su elección en cualquier momento seleccionando “Solo esenciales” en el banner o desde la configuración de su navegador. En la aplicación móvil, puede gestionar los permisos de notificaciones, ubicación, cámara y galería desde la configuración de su dispositivo.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 22. Comunicaciones operativas y comerciales</h3>
          <p>
            Las comunicaciones operativas (confirmaciones de Pedidos, mensajes del chat, pagos, alertas de seguridad y cambios en los documentos legales) forman parte del servicio y se envían mientras la cuenta esté activa.
          </p>
          <p>
            Las comunicaciones comerciales solo se envían a quienes las hayan autorizado, por los canales autorizados, respetando los horarios y condiciones de la Ley 2300 de 2023. El Titular puede retirar esta autorización en cualquier momento desde sus preferencias de notificación, con el enlace de cancelación de cada mensaje o escribiendo al correo de protección de datos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título VI. Circulación de los datos</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 23. Encargados del tratamiento y transmisión</h3>
          <p>
            OigaGIG se apoya en proveedores tecnológicos que tratan datos por su cuenta. Con cada uno suscribe un contrato de transmisión o acepta condiciones contractuales que los obligan a tratar los datos solo según las instrucciones de OigaGIG, a aplicar medidas de seguridad y a guardar confidencialidad, conforme al artículo 25 del Decreto 1377 de 2013.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Servicio</th>
                  <th className="text-left p-2">Proveedor</th>
                  <th className="text-left p-2">Ubicación de los servidores</th>
                  <th className="text-left p-2">Calidad</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">Alojamiento del sitio y la aplicación, y analítica agregada</td>
                  <td className="p-2">Vercel Inc.</td>
                  <td className="p-2">Estados Unidos</td>
                  <td className="p-2">Encargado</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Base de datos</td>
                  <td className="p-2">Proveedor de alojamiento de la base PostgreSQL</td>
                  <td className="p-2">Según el proveedor contratado</td>
                  <td className="p-2">Encargado</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Correo electrónico transaccional</td>
                  <td className="p-2">Resend</td>
                  <td className="p-2">Estados Unidos</td>
                  <td className="p-2">Encargado</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Notificaciones push</td>
                  <td className="p-2">Servicios de notificaciones de Google y Apple</td>
                  <td className="p-2">Estados Unidos</td>
                  <td className="p-2">Encargado</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Procesamiento de pagos</td>
                  <td className="p-2">Wompi</td>
                  <td className="p-2">Colombia</td>
                  <td className="p-2">Responsable independiente respecto de los datos de pago</td>
                </tr>
                <tr>
                  <td className="p-2">Analítica y medición publicitaria (opcional)</td>
                  <td className="p-2">Google LLC (Google Analytics) y Meta Platforms Inc. (Meta Pixel)</td>
                  <td className="p-2">Estados Unidos y otros países</td>
                  <td className="p-2">Responsables independientes, según sus propias políticas</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            OigaGIG mantendrá actualizada esta relación. La contratación de proveedores no exime a OigaGIG de su responsabilidad frente a los Titulares.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 24. Transferencias y transmisiones internacionales</h3>
          <p>
            Varios proveedores almacenan o procesan datos fuera de Colombia, principalmente en Estados Unidos. Estados Unidos figura en la lista de países con nivel adecuado de protección establecida por la SIC en el Título V de la Circular Única. Para cualquier otro país, OigaGIG solo transferirá datos cuando se cumpla alguna de las condiciones del artículo 26 de la Ley 1581 de 2012 o cuando obtenga la declaración de conformidad de la SIC.
          </p>
          <p>
            Cuando OigaGIG inicie operaciones en Panamá, El Salvador u otros países, podrá compartir datos con las sociedades o aliados que operen la Plataforma en esos territorios, solo en la medida necesaria para atender a Usuarios de esos países y bajo las mismas garantías de esta Política.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 25. Entrega de datos a otros Usuarios y a autoridades</h3>
          <p>
            OigaGIG comparte con la contraparte de cada Pedido los datos indispensables para ejecutarlo: al Vendedor, el nombre del Comprador, sus datos de contacto y el lugar del servicio; al Comprador, la información de identificación y contacto del Vendedor.
          </p>
          <p>
            Conforme al artículo 53 de la Ley 1480 de 2011, cuando un Comprador presente una reclamación, OigaGIG pondrá a su disposición la identificación del Vendedor (nombre o razón social, documento o NIT, dirección de notificación, teléfono y correo electrónico).
          </p>
          <p>
            OigaGIG entregará datos a autoridades públicas solo cuando lo requieran en ejercicio de sus funciones legales o por orden judicial, conforme al artículo 13 de la Ley 1581 de 2012. Antes de hacerlo, verificará la competencia de la autoridad y entregará únicamente la información pertinente.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 26. Operaciones corporativas</h3>
          <p>
            Si CORTLAND BLACKSTONE S.A.S. participa en una fusión, escisión, venta de la Plataforma o reorganización empresarial, las bases de datos podrán transferirse al adquirente o sucesor. Este deberá respetar esta Política, y OigaGIG informará a los Titulares sobre el cambio de Responsable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título VII. Derechos de los Titulares y procedimientos</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 27. Derechos de los Titulares</h3>
          <p>Conforme al artículo 8 de la Ley 1581 de 2012, el Titular tiene derecho a:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Conocer, actualizar y rectificar sus datos personales, incluidos los parciales, inexactos, incompletos o que induzcan a error.</li>
            <li>Solicitar prueba de la autorización otorgada, salvo cuando no sea requerida.</li>
            <li>Ser informado, previa solicitud, sobre el uso que se ha dado a sus datos.</li>
            <li>Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley, una vez agotado el trámite ante OigaGIG.</li>
            <li>Revocar la autorización y solicitar la supresión de sus datos cuando no se respeten los principios, derechos y garantías legales, siempre que no exista un deber legal o contractual de conservarlos.</li>
            <li>Acceder en forma gratuita a sus datos personales, al menos una vez cada mes calendario y cada vez que existan modificaciones sustanciales de esta Política.</li>
          </ol>
          <p>
            El Usuario también puede consultar y actualizar directamente la mayor parte de sus datos desde la sección Mi Perfil de la Plataforma.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 28. Quiénes pueden ejercer los derechos</h3>
          <p>
            Pueden ejercer estos derechos el Titular, acreditando su identidad; sus causahabientes, acreditando esa calidad; su representante o apoderado, acreditando la representación o el apoderamiento; y quien actúe por estipulación a favor de otro. Los derechos de los menores de edad se ejercen por sus representantes legales.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 29. Persona y canal de atención</h3>
          <p>
            Las consultas y reclamos son atendidos por el Oficial de Protección de Datos Personales de OigaGIG (artículo 38) a través del correo electrónico{' '}
            <a href={`mailto:${site.supportEmail}`} className="text-orange-600 hover:underline">{site.supportEmail}</a>.
            La solicitud debe indicar el nombre del Titular, el correo con el que está registrado en la Plataforma, la descripción de lo solicitado y una dirección de respuesta. OigaGIG podrá pedir información adicional razonable para verificar la identidad del solicitante antes de entregar o modificar datos.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 30. Consultas</h3>
          <p>
            El Titular o sus legitimados pueden consultar la información personal que repose en las bases de datos de OigaGIG. La consulta se atenderá en un máximo de diez (10) días hábiles contados a partir de su recibo. Si no es posible atenderla en ese término, OigaGIG informará al interesado los motivos de la demora y la fecha de respuesta, que no podrá superar cinco (5) días hábiles adicionales al vencimiento del primer término.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 31. Reclamos</h3>
          <p>
            Cuando el Titular considere que su información debe ser corregida, actualizada o suprimida, o advierta un presunto incumplimiento de la ley, podrá presentar un reclamo con el siguiente trámite, previsto en el artículo 15 de la Ley 1581 de 2012:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>El reclamo debe incluir la identificación del Titular, la descripción de los hechos, la dirección de respuesta y los documentos que se quieran hacer valer.</li>
            <li>Si el reclamo está incompleto, OigaGIG requerirá al interesado dentro de los cinco (5) días hábiles siguientes para que lo complete. Si transcurren dos (2) meses sin que presente la información requerida, se entenderá que desistió del reclamo.</li>
            <li>Si OigaGIG no es competente para resolverlo, dará traslado a quien corresponda en un máximo de dos (2) días hábiles e informará al interesado.</li>
            <li>Una vez recibido el reclamo completo, se incluirá en la base de datos la leyenda “reclamo en trámite” y el motivo, en un máximo de dos (2) días hábiles. La leyenda se mantendrá hasta que el reclamo sea decidido.</li>
            <li>El reclamo se resolverá en un máximo de quince (15) días hábiles desde el día siguiente a su recibo. Si no es posible, se informará al interesado los motivos y la fecha de respuesta, que no podrá superar ocho (8) días hábiles adicionales.</li>
          </ol>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Trámite</th>
                  <th className="text-left p-2">Término de respuesta</th>
                  <th className="text-left p-2">Prórroga máxima</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="p-2">Consulta</td><td className="p-2">10 días hábiles</td><td className="p-2">5 días hábiles</td></tr>
                <tr className="border-b"><td className="p-2">Reclamo</td><td className="p-2">15 días hábiles</td><td className="p-2">8 días hábiles</td></tr>
                <tr className="border-b"><td className="p-2">Requerimiento por reclamo incompleto</td><td className="p-2">5 días hábiles</td><td className="p-2">—</td></tr>
                <tr><td className="p-2">Desistimiento por falta de respuesta del interesado</td><td className="p-2">2 meses</td><td className="p-2">—</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 32. Eliminación de cuenta, supresión y revocatoria</h3>
          <p>
            El Usuario puede eliminar su cuenta en cualquier momento desde Mi Perfil, en el sitio web o en la aplicación, con dos alternativas:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Cerrar el acceso:</strong> la cuenta se desactiva y deja de ser visible.</li>
            <li><strong>Cerrar el acceso y eliminar los datos personales:</strong> además, se borran o anonimizan el perfil, las fotografías, las notificaciones, las preferencias y la demás información personal.</li>
          </ul>
          <p>
            Si el Usuario tiene Pedidos en curso, debe completarlos o cancelarlos antes de eliminar la cuenta. La solicitud también puede presentarse al correo de protección de datos.
          </p>
          <p>
            La supresión y la revocatoria no proceden cuando el Titular tenga un deber legal o contractual de permanecer en la base de datos, conforme al artículo 9 del Decreto 1377 de 2013. Por ello, OigaGIG conservará, bloqueados o anonimizados, los registros de transacciones, facturas, comisiones y controversias abiertas durante los plazos del artículo 36. Las reseñas que el Usuario haya publicado sobre otros podrán mantenerse de forma anonimizada para preservar la integridad del sistema de reputación.
          </p>
          <p>
            La revocatoria puede ser total o parcial. Por ejemplo, el Titular puede revocar solo la autorización para recibir publicidad y conservar su cuenta activa.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 33. Requisito de procedibilidad</h3>
          <p>
            El Titular o su causahabiente solo podrá elevar queja ante la Superintendencia de Industria y Comercio una vez haya agotado el trámite de consulta o reclamo ante OigaGIG, conforme al artículo 16 de la Ley 1581 de 2012.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título VIII. Seguridad y conservación</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 34. Medidas de seguridad</h3>
          <p>OigaGIG aplica medidas técnicas, humanas y administrativas proporcionales al volumen y la naturaleza de los datos, entre ellas:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Conexiones cifradas (HTTPS) en el sitio web y en la aplicación.</li>
            <li>Contraseñas almacenadas mediante funciones de hash, nunca en texto plano.</li>
            <li>Acceso a las bases de datos y paneles administrativos restringido por roles y protegido con autenticación reforzada.</li>
            <li>Acceso a datos bancarios, documentos de identidad y mensajes del chat limitado al personal que lo necesite para soporte, pagos, controversias o prevención de fraude, con registro de cada consulta.</li>
            <li>Copias de respaldo, monitoreo de la Plataforma y registro de eventos de seguridad.</li>
            <li>Evaluación de las condiciones de seguridad de los proveedores tecnológicos antes de contratarlos.</li>
            <li>Acuerdos de confidencialidad con trabajadores y contratistas.</li>
          </ul>
          <p>
            Ningún sistema es completamente infalible. Se recomienda a los Usuarios usar contraseñas fuertes y únicas, no compartir su acceso y mantener las conversaciones y los pagos dentro de la Plataforma.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 35. Gestión de incidentes de seguridad</h3>
          <p>
            OigaGIG cuenta con un procedimiento para identificar, contener, investigar y documentar los incidentes que afecten la confidencialidad, integridad o disponibilidad de los datos. Cuando se presente una violación de los códigos de seguridad o un riesgo en la administración de la información, OigaGIG:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Reportará el incidente a la Superintendencia de Industria y Comercio, a través del Registro Nacional de Bases de Datos, dentro de los quince (15) días hábiles siguientes a su detección, conforme al Título V de la Circular Única.</li>
            <li>Informará a los Titulares afectados cuando el incidente pueda afectar sus derechos, con recomendaciones para mitigar el riesgo.</li>
            <li>Adoptará medidas correctivas para evitar que el incidente se repita.</li>
          </ol>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 36. Plazos de conservación</h3>
          <p>
            Los datos se conservan solo durante el tiempo necesario para la finalidad que justificó su recolección y para cumplir obligaciones legales.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Información</th>
                  <th className="text-left p-2">Plazo de conservación</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="p-2">Datos de cuenta y perfil</td><td className="p-2">Mientras la cuenta esté activa. Tras la eliminación de la cuenta con borrado de datos, se suprimen o anonimizan en un máximo de 30 días calendario.</td></tr>
                <tr className="border-b"><td className="p-2">Mensajes del chat</td><td className="p-2">Mientras la cuenta esté activa y hasta 2 años después del cierre del Pedido correspondiente, para atender controversias y garantías.</td></tr>
                <tr className="border-b"><td className="p-2">Pedidos, pagos, comisiones, facturas y soportes contables</td><td className="p-2">10 años desde la fecha del último asiento o documento, conforme al artículo 28 de la Ley 962 de 2005.</td></tr>
                <tr className="border-b"><td className="p-2">Datos bancarios del Vendedor</td><td className="p-2">Mientras tenga saldos o desembolsos pendientes y, luego, solo dentro de los soportes contables.</td></tr>
                <tr className="border-b"><td className="p-2">Reclamaciones de consumidores y controversias</td><td className="p-2">Hasta 3 años después de su cierre.</td></tr>
                <tr className="border-b"><td className="p-2">Registros técnicos y de seguridad</td><td className="p-2">12 meses, salvo que se requieran para investigar un incidente.</td></tr>
                <tr className="border-b"><td className="p-2">Prueba de autorizaciones</td><td className="p-2">Mientras se trate el dato y durante el término de prescripción de las acciones derivadas.</td></tr>
                <tr><td className="p-2">Hojas de vida de aspirantes no seleccionados</td><td className="p-2">1 año desde la terminación del proceso de selección.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 37. Bloqueo, supresión y anonimización</h3>
          <p>
            Cuando desaparezca la finalidad principal del tratamiento pero subsista una obligación legal o contractual de conservar los datos, OigaGIG los bloqueará: solo podrán usarse para cumplir esa obligación y no para fines comerciales u operativos.
          </p>
          <p>
            Vencidos los plazos, los datos se eliminarán de forma segura o se anonimizarán de manera irreversible. La información anonimizada podrá conservarse para fines estadísticos, pues ya no permite identificar a ninguna persona.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Título IX. Gobierno del programa y disposiciones finales</h2>
          <h3 className="text-lg font-semibold mt-4">Artículo 38. Oficial de Protección de Datos Personales</h3>
          <p>
            CORTLAND BLACKSTONE S.A.S. designa un Oficial de Protección de Datos Personales, responsable de atender consultas y reclamos, coordinar la implementación de esta Política, capacitar al equipo, gestionar los incidentes de seguridad y servir de enlace con la SIC. Su canal de contacto es{' '}
            <a href={`mailto:${site.supportEmail}`} className="text-orange-600 hover:underline">{site.supportEmail}</a>.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 39. Responsabilidad demostrada y privacidad desde el diseño</h3>
          <p>
            OigaGIG documenta sus procedimientos, autorizaciones, contratos con proveedores e incidentes, de modo que pueda demostrar ante la SIC el cumplimiento de esta Política, conforme al artículo 26 del Decreto 1377 de 2013.
          </p>
          <p>
            Antes de lanzar funcionalidades que impliquen nuevos tratamientos de riesgo, como verificación biométrica, ubicación precisa en tiempo real o nuevos proveedores en el exterior, OigaGIG evaluará su impacto en la privacidad y adoptará las medidas necesarias desde el diseño. El programa se revisará al menos una vez al año.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 40. Registro Nacional de Bases de Datos</h3>
          <p>
            CORTLAND BLACKSTONE S.A.S. inscribirá sus bases de datos en el Registro Nacional de Bases de Datos administrado por la SIC cuando esté legalmente obligada a hacerlo, en particular cuando sus activos totales superen 100.000 UVT, conforme al Decreto 090 de 2018. Una vez inscritas, mantendrá actualizada la información en los plazos que fije la SIC.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 41. Relación con otros documentos</h3>
          <p>
            Esta Política se complementa con los Términos de uso de OigaGIG (https://oigagig.com/terms) y con las condiciones de los proveedores de pagos. Si existe contradicción entre documentos en materia de datos personales, prevalecerá la disposición que otorgue mayor protección al Titular.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 42. Modificaciones</h3>
          <p>
            OigaGIG podrá modificar esta Política para atender cambios normativos, tecnológicos u operativos. Los cambios sustanciales, en especial los relativos a la identidad del Responsable o a las finalidades del tratamiento, se comunicarán a los Titulares antes de su implementación, por correo electrónico o mediante aviso destacado en la Plataforma.
          </p>
          <p>
            Cuando el cambio implique una nueva finalidad, OigaGIG solicitará una nueva autorización. El uso continuado de la Plataforma no se entenderá como autorización para finalidades nuevas.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 43. Vigencia</h3>
          <p>
            Esta Política rige a partir de su publicación en https://oigagig.com/privacy y reemplaza cualquier versión anterior. Las bases de datos de OigaGIG estarán vigentes mientras la Plataforma opere y mientras subsistan las finalidades que justificaron el tratamiento o las obligaciones legales de conservación descritas en el artículo 36.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Artículo 44. Canales de contacto</h3>
          <p>Los Titulares pueden presentar consultas, reclamos y solicitudes de actualización, rectificación, supresión o revocatoria a través de:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Correo electrónico:</strong>{' '}
              <a href={`mailto:${site.supportEmail}`} className="text-orange-600 hover:underline">{site.supportEmail}</a>
            </li>
            <li><strong>Plataforma:</strong> sección Mi Perfil, en https://oigagig.com o en la aplicación móvil OigaGIG.</li>
          </ul>
          <p>Esta información estará publicada de forma permanente en la Plataforma.</p>
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
