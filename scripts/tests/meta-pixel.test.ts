import {
  DEFAULT_META_PIXEL_ID,
  META_PIXEL_ID,
  normalizeMetaPixelId,
  resolveMetaPixelEvent,
  toMetaPixelParams,
} from '../../src/lib/meta-pixel'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(normalizeMetaPixelId('123456789012345') === '123456789012345', 'valid id')
assert(normalizeMetaPixelId('  9876543210  ') === '9876543210', 'trims whitespace')
assert(normalizeMetaPixelId('G-9FNTWY76HH') === '', 'rejects non-digits')
assert(normalizeMetaPixelId('12') === '', 'rejects too-short ids')
assert(normalizeMetaPixelId('') === '', 'empty string')
assert(normalizeMetaPixelId(undefined) === '', 'undefined')
assert(DEFAULT_META_PIXEL_ID === '1064604162935356', 'official pixel id')
assert(normalizeMetaPixelId(DEFAULT_META_PIXEL_ID) === DEFAULT_META_PIXEL_ID, 'default id is valid')
assert(META_PIXEL_ID === DEFAULT_META_PIXEL_ID || /^\d{5,20}$/.test(META_PIXEL_ID), 'runtime id is usable')

assert(resolveMetaPixelEvent('signup_completed').event === 'CompleteRegistration', 'signup')
assert(resolveMetaPixelEvent('signup_completed').kind === 'track', 'signup is standard')
assert(resolveMetaPixelEvent('checkout_started').event === 'InitiateCheckout', 'checkout')
assert(resolveMetaPixelEvent('payment_initiated').event === 'AddPaymentInfo', 'payment start')
assert(resolveMetaPixelEvent('payment_completed').event === 'Purchase', 'purchase')
assert(resolveMetaPixelEvent('gig_created').event === 'Lead', 'gig created')
assert(resolveMetaPixelEvent('become_seller').event === 'Lead', 'become seller')
assert(resolveMetaPixelEvent('account_deleted').kind === 'trackCustom', 'unknown stays custom')
assert(resolveMetaPixelEvent('account_deleted').event === 'account_deleted', 'custom name kept')

const purchase = toMetaPixelParams('payment_completed', { amount: 15000, order_status: 'paid' })
assert(purchase?.currency === 'COP', 'purchase defaults COP')
assert(purchase?.value === 15000, 'purchase maps amount → value')
assert(purchase?.order_status === 'paid', 'purchase keeps extra props')

const checkout = toMetaPixelParams('checkout_started', { gig_category: 'limpieza' })
assert(checkout?.content_category === 'limpieza', 'aliases gig_category')
assert(checkout?.gig_category === 'limpieza', 'keeps original category')

const emptyPurchase = toMetaPixelParams('payment_completed')
assert(emptyPurchase?.currency === 'COP', 'purchase without props still has currency')

const emptyOther = toMetaPixelParams('become_seller')
assert(emptyOther === undefined, 'no empty object for events without props')

console.log('meta-pixel.test.ts OK')
