import { computeOrderPrice, isQuantityField } from '../../src/lib/order-price'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const fields = [
  { key: 'rooms', type: 'number', extraPrice: 10000 },
  { key: 'deep', type: 'checkbox', extraPrice: 5000 },
]

assert(computeOrderPrice(50000, fields, {}) === 50000, 'base only')
assert(computeOrderPrice(50000, fields, { rooms: 2 }) === 70000, 'number field')
assert(computeOrderPrice(50000, fields, { deep: true }) === 55000, 'checkbox field')
assert(computeOrderPrice(50000, fields, { rooms: 2, deep: true }) === 75000, 'combined')
assert(!isQuantityField({ key: 'rooms', label: 'Número de habitaciones' }), 'rooms is not units')
assert(!isQuantityField({ key: 'hours', label: 'Horas de servicio' }), 'hours is not units')

const productFields = [
  { key: 'quantity', label: 'Cantidad de unidades', type: 'number' },
  { key: 'giftWrap', type: 'checkbox', extraPrice: 6000 },
]
assert(computeOrderPrice(60000, productFields, {}) === 60000, 'qty defaults to 1')
assert(computeOrderPrice(60000, productFields, { quantity: 0 }) === 60000, 'qty 0 becomes 1')
assert(computeOrderPrice(60000, productFields, { quantity: 6 }) === 360000, 'qty multiplies base')
assert(computeOrderPrice(60000, productFields, { quantity: '6' }) === 360000, 'qty string multiplies base')
assert(computeOrderPrice(60000, productFields, { quantity: 6, giftWrap: true }) === 366000, 'qty plus addon')

const electronicsFields = [
  { key: 'devices', label: 'Número de equipos', type: 'number', extraPrice: 30000 },
  { key: 'homeVisit', type: 'checkbox', extraPrice: 35000 },
]
assert(isQuantityField(electronicsFields[0]), 'equipos is a unit field')
assert(computeOrderPrice(80000, electronicsFields, {}) === 80000, 'electronics 1 device = base')
assert(computeOrderPrice(80000, electronicsFields, { devices: 3 }) === 240000, 'electronics 3 devices multiply base')
assert(
  computeOrderPrice(80000, electronicsFields, { devices: 3, homeVisit: true }) === 275000,
  'electronics units plus addon'
)

const resourceFields = [
  { key: 'quantity', label: 'Cantidad', type: 'number', extraPrice: 8000 },
]
assert(computeOrderPrice(50000, resourceFields, { quantity: 4 }) === 200000, 'resource qty ignores extraPrice')

console.log('order-price.test.ts OK')
