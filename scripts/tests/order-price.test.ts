import { computeOrderPrice } from '../../src/lib/order-price'

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

console.log('order-price.test.ts OK')