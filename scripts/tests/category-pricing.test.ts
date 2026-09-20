import { gigCategories } from '../../src/lib/gig-categories'
import { computeOrderPrice, isQuantityField } from '../../src/lib/order-price'
import { isSellerAttributeField } from '../../src/lib/persist-gig-fields'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const UNIT_CATS = new Set([
  'Venta de Productos de Belleza y Maquillaje',
  'Venta de Productos de Sanación Natural',
  'Artesanías y Productos Hechos a Mano',
  'Recursos Naturales y Minerales',
  'Reparación de Computadores y Electrónica',
])

for (const cat of gigCategories) {
  const qtyFields = cat.fields.filter((field) => isQuantityField(field))
  assert(qtyFields.length <= 1, `${cat.name} has ${qtyFields.length} unit fields`)

  if (UNIT_CATS.has(cat.name)) {
    assert(qtyFields.length === 1, `${cat.name} should sell by units`)
    const key = qtyFields[0].key
    const priced = computeOrderPrice(10000, cat.fields, { [key]: 3 })
    assert(priced === 30000, `${cat.name} 3 units should be 3x base, got ${priced}`)
  } else {
    assert(qtyFields.length === 0, `${cat.name} should not multiply base by a unit field`)
    const priced = computeOrderPrice(10000, cat.fields, {})
    assert(priced === 10000, `${cat.name} empty selections should stay at base`)
  }
}

assert(isSellerAttributeField({ key: 'deviceType', label: 'Tipo de equipo', type: 'select' }), 'device type is seller fact')
assert(isSellerAttributeField({ key: 'productType', label: 'Tipo de producto', type: 'select' }), 'product type is seller fact')
assert(!isSellerAttributeField({ key: 'rooms', label: 'Número de habitaciones', type: 'number' }), 'rooms stay buyer extras')

console.log(`category-pricing.test.ts OK (${gigCategories.length} categories)`)
