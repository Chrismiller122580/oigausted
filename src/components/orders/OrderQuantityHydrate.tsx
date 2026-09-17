'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

function orderIdFromPath(): string | null {
  const match = window.location.pathname.match(/\/orders\/([^/?#]+)/)
  return match?.[1] || null
}

function isPendingPage(): boolean {
  return /Cancelar Pedido|Cancel Order/i.test(document.body.innerText || '')
}

function enhanceQuantityRow() {
  if (!isPendingPage()) return
  const orderId = orderIdFromPath()
  if (!orderId) return
  if (document.querySelector('[data-qty-editor]')) return

  const nodes = Array.from(document.querySelectorAll('span, p, div')) as HTMLElement[]
  const label = nodes.find((el) => {
    const t = (el.textContent || '').trim()
    return /^(Quantity|Cantidad|Cantidad de unidades)$/i.test(t) && el.children.length === 0
  })
  if (!label) return
  const row = label.parentElement
  if (!row) return
  const valueEl = Array.from(row.querySelectorAll('span, p')).find((el) => el !== label && /^\d+$/.test((el.textContent || '').trim()))
  if (!valueEl) return

  const current = Math.max(1, parseInt((valueEl.textContent || '1').trim(), 10) || 1)
  const editor = document.createElement('div')
  editor.setAttribute('data-qty-editor', '1')
  editor.className = 'flex items-center gap-2'
  editor.innerHTML = `
    <button type="button" data-qty-dec class="h-10 w-10 rounded-xl border text-xl font-semibold">−</button>
    <input data-qty-input type="number" min="1" value="${current}" class="h-10 w-16 rounded-xl border text-center font-semibold" />
    <button type="button" data-qty-inc class="h-10 w-10 rounded-xl border text-xl font-semibold">+</button>
  `
  valueEl.replaceWith(editor)

  const input = editor.querySelector('[data-qty-input]') as HTMLInputElement
  const save = async (next: number) => {
    const qty = Math.max(1, Math.floor(next || 1))
    input.value = String(qty)
    try {
      const currentRes = await fetch(`/api/orders/${orderId}`)
      const currentJson = await currentRes.json()
      const order = currentJson.order || currentJson
      let customFields: Record<string, unknown> = {}
      if (order.customFields && typeof order.customFields === 'object' && !Array.isArray(order.customFields)) {
        customFields = order.customFields
      } else if (typeof order.customFields === 'string') {
        try { customFields = JSON.parse(order.customFields) } catch { customFields = {} }
      }
      const key = Object.keys(customFields).find((k) => /quantity|qty|cantidad|unidades|units/i.test(k)) || 'quantity'
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customFields: { ...customFields, [key]: qty } }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la cantidad')
      toast.success(`Cantidad actualizada: ${qty}`)
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar la cantidad')
    }
  }

  editor.querySelector('[data-qty-dec]')?.addEventListener('click', () => {
    save(Math.max(1, parseInt(input.value, 10) - 1))
  })
  editor.querySelector('[data-qty-inc]')?.addEventListener('click', () => {
    save((parseInt(input.value, 10) || 1) + 1)
  })
  input.addEventListener('change', () => save(parseInt(input.value, 10) || 1))
}

export default function OrderQuantityHydrate() {
  useEffect(() => {
    enhanceQuantityRow()
    const observer = new MutationObserver(() => enhanceQuantityRow())
    observer.observe(document.body, { childList: true, subtree: true })
    const timer = window.setInterval(enhanceQuantityRow, 1000)
    return () => {
      observer.disconnect()
      window.clearInterval(timer)
    }
  }, [])
  return null
}
