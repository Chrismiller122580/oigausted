'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { isQuantityField } from '@/lib/order-price'
import { parseCustomFields, parseJsonArrayField } from '@/lib/utils'
import type { DynamicFieldDef } from '@/types/gig-fields'
import type { OrderDetail } from '@/types/order'

type Props = {
  order: OrderDetail
  isBuyer: boolean
  onOrderUpdated: (order: OrderDetail) => void
}

function labelFor(key: string, fields: DynamicFieldDef[]): string {
  const match = fields.find((field) => field.key === key)
  if (match?.label) return match.label
  if (/quantity|qty|cantidad|unidades|units/i.test(key)) return 'Cantidad'
  return key.replace(/([A-Z])/g, ' $1')
}

function formatValue(value: unknown): string {
  if (value === true) return 'Sí'
  if (value === false) return 'No'
  return String(value ?? '')
}

export default function OrderServiceDetails({ order, isBuyer, onOrderUpdated }: Props) {
  const fields = parseJsonArrayField(order.gig?.fields) as DynamicFieldDef[]
  const customFields = parseCustomFields(order.customFields)
  const pending = String(order.status) === 'Pending'
  const canEdit = isBuyer && pending
  const [saving, setSaving] = useState(false)

  const quantityField = useMemo(
    () => fields.find((field) => isQuantityField(field)) || { key: 'quantity', label: 'Cantidad' },
    [fields]
  )

  const quantity = Math.max(
    1,
    Math.floor(Number(customFields[quantityField.key] ?? customFields.quantity ?? 1) || 1)
  )

  const rows = Object.entries(customFields).filter(([key]) => key && !key.startsWith('__'))

  const updateQuantity = async (nextQty: number) => {
    const qty = Math.max(1, Math.floor(nextQty || 1))
    if (qty === quantity || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customFields: {
            ...customFields,
            [quantityField.key]: qty,
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la cantidad')
      const updated = data.order || data
      if (updated?.id) {
        onOrderUpdated({
          ...order,
          ...updated,
          gig: order.gig,
          price: updated.price ?? order.price,
          customFields: updated.customFields ?? order.customFields,
        })
      }
      toast.success(`Cantidad actualizada: ${qty}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar la cantidad')
    } finally {
      setSaving(false)
    }
  }

  if (rows.length === 0 && !fields.some((field) => isQuantityField(field))) {
    return <p className="text-muted-foreground">Sin detalles adicionales.</p>
  }

  return (
    <div className="space-y-4">
      {fields.some((field) => isQuantityField(field)) || customFields[quantityField.key] != null || customFields.quantity != null ? (
        <div className="flex items-center justify-between gap-3 py-4 border-b text-lg">
          <span className="text-foreground">{quantityField.label || 'Cantidad'}</span>
          {canEdit ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving || quantity <= 1}
                onClick={() => updateQuantity(quantity - 1)}
                className="h-10 w-10 rounded-xl border text-xl font-semibold disabled:opacity-40"
                aria-label="Quitar una unidad"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                disabled={saving}
                value={quantity}
                onChange={(e) => updateQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="h-10 w-16 rounded-xl border text-center font-semibold"
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => updateQuantity(quantity + 1)}
                className="h-10 w-10 rounded-xl border text-xl font-semibold disabled:opacity-40"
                aria-label="Agregar una unidad"
              >
                +
              </button>
            </div>
          ) : (
            <span className="font-semibold">{quantity}</span>
          )}
        </div>
      ) : null}

      {rows
        .filter(([key]) => !isQuantityField({ key, label: labelFor(key, fields) }))
        .map(([key, val]) => (
          <div key={key} className="flex justify-between py-4 border-b last:border-0 text-lg">
            <span className="text-foreground">{labelFor(key, fields)}</span>
            <span className="font-semibold">{formatValue(val)}</span>
          </div>
        ))}

      {canEdit && (
        <p className="text-sm text-muted-foreground">
          Puedes cambiar la cantidad mientras el pedido esté pendiente de pago. El total se actualiza al momento.
        </p>
      )}
    </div>
  )
}
