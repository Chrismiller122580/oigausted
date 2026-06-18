import {
  buildWhatsAppLink,
  bundleTotal,
  formatProjectQuote,
  networkGigToBundleItem,
  sellerDisplayName,
  type NetworkGig,
} from '../../src/lib/seller-network'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(
  sellerDisplayName({ id: '1', businessName: 'Plomería Juan', name: 'Juan' }) === 'Plomería Juan',
  'prefers businessName'
)

const gig: NetworkGig = {
  id: 'g1',
  title: 'Pintura interior',
  price: 280000,
  category: 'Pintura',
  seller: {
    id: 's1',
    businessName: 'Pinturas SAS',
    slug: 'pinturas-sas',
    whatsapp: '+57 300 123 4567',
  },
}

const item = networkGigToBundleItem(gig)
assert(item.gigId === 'g1', 'bundle item gig id')
assert(item.sellerName === 'Pinturas SAS', 'bundle item seller name')

const quote = formatProjectQuote([item])
assert(quote.includes('Pintura interior'), 'quote includes gig title')
assert(quote.includes('$280.000'), 'quote includes formatted price')
assert(quote.includes('Total estimado'), 'quote includes total line')

assert(bundleTotal([item, { ...item, gigId: 'g2', price: 120000 }]) === 400000, 'bundle total')

const wa = buildWhatsAppLink('+57 300 123 4567', 'Hola, quiero coordinar un proyecto')
assert(wa?.startsWith('https://wa.me/573001234567'), 'whatsapp link normalized')

console.log('seller-network.test.ts OK')