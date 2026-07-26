import type { VehicleSaleDocContext } from './types'

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function blank(label: string, value?: string | number): string {
  const v = value != null && String(value).trim() ? esc(value) : '________________'
  return `<tr><td style="padding:6px 8px;border:1px solid #ddd;width:40%;">${esc(label)}</td><td style="padding:6px 8px;border:1px solid #ddd;">${v}</td></tr>`
}

const printStyles = `
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;line-height:1.5;max-width:800px;margin:24px auto;padding:0 16px;}
  h1{font-size:1.4rem;color:#ea580c;margin-bottom:4px;}
  h2{font-size:1.1rem;margin-top:28px;border-bottom:2px solid #fed7aa;padding-bottom:6px;}
  .muted{color:#666;font-size:0.9rem;}
  .disclaimer{background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 16px;margin:20px 0;font-size:0.85rem;}
  table{width:100%;border-collapse:collapse;margin:12px 0;}
  .sig{display:flex;gap:32px;margin-top:48px;flex-wrap:wrap;}
  .sig div{flex:1;min-width:220px;border-top:1px solid #333;padding-top:8px;margin-top:48px;}
  ul{padding-left:1.2rem;}
  li{margin:8px 0;}
  @media print{body{margin:0;} .no-print{display:none;}}
`

export function buildSaleContractHtml(ctx: VehicleSaleDocContext): string {
  const price = ctx.orderPrice.toLocaleString('es-CO')
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Contrato de compraventa de vehículo — OigaGIG</title>
  <style>${printStyles}</style>
</head>
<body>
  <p class="muted no-print">OigaGIG · Pedido ${esc(ctx.orderId)} · Usa “Imprimir → Guardar como PDF” si lo necesitas en PDF.</p>
  <h1>Contrato de compraventa de vehículo</h1>
  <p class="muted">Borrador generado para la ciudad de <strong>${esc(ctx.city.cityLabel)}</strong> · ${esc(ctx.saleDate)}</p>

  <div class="disclaimer">${esc(ctx.city.disclaimer)}</div>

  <h2>1. Partes</h2>
  <table>
    ${blank('Vendedor (oferente)', ctx.sellerName)}
    ${blank('Comprador', ctx.buyerName)}
    ${blank('Ciudad del acuerdo', ctx.city.cityLabel)}
    ${blank('Fecha', ctx.saleDate)}
  </table>

  <h2>2. Objeto — Vehículo</h2>
  <p class="muted">Servicio / anuncio: ${esc(ctx.gigTitle)}</p>
  <table>
    ${blank('Tipo de vehículo', ctx.vehicleType)}
    ${blank('Condición', ctx.condition)}
    ${blank('Año', ctx.year)}
    ${blank('Marca', ctx.brand)}
    ${blank('Línea / modelo', ctx.model)}
    ${blank('Color', ctx.color)}
    ${blank('Placa', ctx.plate)}
    ${blank('Número de motor / chasis / VIN', ctx.vin)}
  </table>

  <h2>3. Precio</h2>
  <p>El precio total convenido para esta operación en OigaGIG es de <strong>$${price} COP</strong> (incluye el servicio y extras seleccionados en el pedido).</p>
  <p class="muted">Si el precio del vehículo es distinto al del servicio intermediado, anótalo aquí: $ ________________ COP.</p>

  <h2>4. Entrega y papeles</h2>
  <ul>
    <li>El vendedor se compromete a entregar el vehículo en las condiciones acordadas y la documentación a su cargo.</li>
    <li>El comprador se compromete a pagar el precio y a adelantar el traspaso ante <strong>${esc(ctx.city.transitAgency)}</strong>.</li>
    <li>Ambas partes revisarán el checklist de papeles (documento anexo del paquete OigaGIG).</li>
  </ul>

  <h2>5. Traspaso</h2>
  <p>El traspaso de la propiedad se formalizará ante la autoridad de tránsito competente y el RUNT, en particular: <strong>${esc(ctx.city.transitAgency)}</strong>.</p>
  <p>${esc(ctx.city.taxClearanceLabel)} debe estar al día o gestionarse según lo acuerden las partes.</p>

  <h2>6. Declaraciones</h2>
  <ul>
    <li>El vendedor declara ser el legítimo propietario o estar autorizado para vender.</li>
    <li>El comprador declara conocer el estado del vehículo o haber tenido oportunidad de inspeccionarlo.</li>
    <li>Las partes reconocen que este contrato es un apoyo y no reemplaza formularios oficiales del organismo de tránsito.</li>
  </ul>

  <div class="sig">
    <div><strong>Vendedor</strong><br/>Nombre: ${esc(ctx.sellerName)}<br/>C.C. _______________<br/>Firma:</div>
    <div><strong>Comprador</strong><br/>Nombre: ${esc(ctx.buyerName)}<br/>C.C. _______________<br/>Firma:</div>
  </div>

  <p class="muted" style="margin-top:40px;">OigaGIG · oigagig.com · Pedido ${esc(ctx.orderId)}</p>
</body>
</html>`
}

export function buildPapersChecklistHtml(ctx: VehicleSaleDocContext): string {
  const citySteps = ctx.city.extraSteps
    .map((s) => `<li>${esc(s)}</li>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Checklist de papeles — venta de vehículo — OigaGIG</title>
  <style>${printStyles}</style>
</head>
<body>
  <p class="muted no-print">OigaGIG · Pedido ${esc(ctx.orderId)} · Ciudad: ${esc(ctx.city.cityLabel)}</p>
  <h1>Checklist de papeles para la venta</h1>
  <p class="muted">${esc(ctx.gigTitle)} · ${esc(ctx.sellerName)} → ${esc(ctx.buyerName)} · ${esc(ctx.saleDate)}</p>

  <div class="disclaimer">${esc(ctx.city.disclaimer)}</div>

  <h2>Autoridad local</h2>
  <ul>
    <li><strong>Tránsito / movilidad:</strong> ${esc(ctx.city.transitAgency)}</li>
    <li><strong>Impuestos del vehículo:</strong> ${esc(ctx.city.taxClearanceLabel)}</li>
  </ul>

  <h2>Documentos y requisitos</h2>
  <ul>
    <li>☐ <strong>SOAT</strong> vigente (póliza y vigencia legibles).</li>
    <li>☐ <strong>Revisión tecnomecánica y de gases</strong> al día (si aplica al tipo de vehículo).</li>
    <li>☐ <strong>${esc(ctx.city.taxClearanceLabel)}</strong>.</li>
    <li>☐ <strong>Licencia de tránsito</strong> del vehículo (tarjeta de propiedad) a nombre del vendedor o con cadena de traspasos clara.</li>
    <li>☐ <strong>Cédulas</strong> de comprador y vendedor (y poderes si actúa un tercero).</li>
    <li>☐ <strong>Contrato de compraventa</strong> firmado (plantilla OigaGIG u otro acuerdo).</li>
    <li>☐ <strong>Formulario / solicitud de traspaso</strong> según el organismo de tránsito y RUNT.</li>
    <li>☐ <strong>Impronta / datos de motor y chasis</strong> si el organismo lo exige.</li>
    <li>☐ <strong>Llaves, controles y accesorios</strong> listados en inventario de entrega.</li>
    <li>☐ <strong>Manuales / historial de mantenimiento</strong> (recomendado).</li>
  </ul>

  <h2>Pasos de traspaso (orientativos)</h2>
  <ul>
    <li>1. Verificar que SOAT, tecnomecánica e impuestos estén en regla.</li>
    <li>2. Firmar contrato y reunir copias de documentos de identidad.</li>
    <li>3. Diligenciar el trámite de traspaso en <strong>${esc(ctx.city.transitAgency)}</strong> y actualizar el RUNT.</li>
    <li>4. Conservar soportes de pago de derechos y constancia del nuevo propietario.</li>
    ${citySteps}
  </ul>

  <h2>Datos del vehículo (completar)</h2>
  <table>
    ${blank('Tipo', ctx.vehicleType)}
    ${blank('Condición', ctx.condition)}
    ${blank('Año', ctx.year)}
    ${blank('Placa', ctx.plate)}
    ${blank('Marca / modelo', [ctx.brand, ctx.model].filter(Boolean).join(' ') || undefined)}
  </table>

  <h2>Entrega</h2>
  <ul>
    <li>☐ Fecha y lugar de entrega: _______________________________</li>
    <li>☐ Kilometraje al entregar: _______________</li>
    <li>☐ Observaciones de estado: _______________________________</li>
  </ul>

  <div class="sig">
    <div>Entrega conforme — Vendedor<br/>${esc(ctx.sellerName)}</div>
    <div>Recibe conforme — Comprador<br/>${esc(ctx.buyerName)}</div>
  </div>

  <p class="muted" style="margin-top:40px;">OigaGIG · oigagig.com · Pedido ${esc(ctx.orderId)}</p>
</body>
</html>`
}
