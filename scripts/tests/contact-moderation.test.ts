import {
  CONTACT_BLOCKED_MESSAGE,
  detectContactInfo,
  redactSnippet,
} from '../../src/lib/contact-moderation'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const clean = detectContactInfo('Hola, ¿cuánto tarda el servicio?')
assert(!clean.blocked, 'normal question is not blocked')
assert(clean.types.length === 0, 'normal question has no violation types')

const email = detectContactInfo('Escríbeme a juan@example.com por favor')
assert(email.blocked, 'plain email is blocked')
assert(email.types.includes('email'), 'email type detected')

const phone = detectContactInfo('Llámame al 3001234567')
assert(phone.blocked, 'Colombian mobile is blocked')
assert(phone.types.includes('phone'), 'phone type detected')

const whatsapp = detectContactInfo('Te paso mi whatsapp para coordinar')
assert(whatsapp.blocked, 'whatsapp mention is blocked')
assert(whatsapp.types.includes('whatsapp'), 'whatsapp type detected')

const price = detectContactInfo('El precio es $120.000 COP')
assert(!price.blocked, 'price-like numbers are not blocked as phone')

const obfuscated = detectContactInfo('mi correo es juan arroba gmail punto com')
assert(obfuscated.blocked, 'obfuscated email is blocked')

assert(
  redactSnippet('  uno   dos   tres   cuatro   cinco   seis   siete   ocho   nueve   diez  ') ===
    'uno dos tres cuatro cinco seis siete ocho nueve diez',
  'redactSnippet collapses whitespace'
)
const longText = 'abcdefghijklmnopqrstuvwxyz'.repeat(4)
assert(
  redactSnippet(longText).endsWith('…'),
  'redactSnippet truncates long text'
)

assert(
  CONTACT_BLOCKED_MESSAGE.includes('OigaGIG'),
  'blocked message mentions platform chat'
)

console.log('contact-moderation.test.ts OK')