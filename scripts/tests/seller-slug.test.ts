import { isUuidIdentifier, slugify } from '../../src/lib/utils'
import { isSlugPrefixMatch } from '../../src/lib/seller-profile'

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
assert(
  isSlugPrefixMatch('cortland-blackstone-sas', 'cortland-blackstone-sas404'),
  'short public path matches stored slug with trailing digits'
)
assert(
  isSlugPrefixMatch('cortland-blackstone-sas', 'cortland-blackstone-sas'),
  'exact slug match'
)
assert(
  isSlugPrefixMatch('cortland-blackstone-sas', 'cortland-blackstone-sas-2'),
  'uniqueness suffix -N is a safe alias'
)
assert(
  !isSlugPrefixMatch('cortland-blackstone', 'cortland-blackstone-extra-co'),
  'reject slug extension that is not a numeric suffix'
)

console.log('seller-slug.test.ts OK')