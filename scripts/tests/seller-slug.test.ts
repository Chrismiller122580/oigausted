import { isUuidIdentifier, slugify } from '../../src/lib/utils'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(
  !isUuidIdentifier('cortland-blackstone-sas404'),
  'long business slug must not be treated as UUID'
)
assert(
  isUuidIdentifier('96b152de-d6a7-4fc8-aca8-50fe8e6ee321'),
  'standard user id is UUID'
)
assert(
  slugify('Cortland Blackstone SAS404') === 'cortland-blackstone-sas404',
  'business name slugifies to expected public path'
)

console.log('seller-slug.test.ts OK')