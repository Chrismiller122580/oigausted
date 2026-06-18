import {
  isOrderStatusLabel,
  labelToPrismaStatus,
  prismaStatusToLabel,
  OrderStatusLabel,
} from '../../src/lib/order-status'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(isOrderStatusLabel('In Progress'), 'In Progress is valid label')
assert(!isOrderStatusLabel('InProgress'), 'InProgress is not API label')
const mapped = labelToPrismaStatus(OrderStatusLabel.InProgress)
assert(mapped === 'In_Progress', 'label to prisma enum member')
assert(prismaStatusToLabel('In_Progress') === 'In Progress', 'prisma enum member to label')
assert(prismaStatusToLabel('InProgress') === 'In Progress', 'legacy prisma to label')
assert(prismaStatusToLabel('Paid') === 'Paid', 'Paid roundtrip')

console.log('order-status.test.ts OK')