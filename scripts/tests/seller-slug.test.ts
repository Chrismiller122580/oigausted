import { isUuidIdentifier, slugify } from '../../src/lib/utils'
import { isSlugPrefixMatch, publicSellerSegment } from '../../src/lib/seller-profile'
import { normalizeStoreUrlsInText } from '../../src/lib/seller-marketing-brand'

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
  slugify('Café José') === 'cafe-jose',
  'accented business name slugifies without diacritics'
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
assert(
  publicSellerSegment({
    id: '96b152de-d6a7-4fc8-aca8-50fe8e6ee321',
    slug: null,
    businessName: 'Cortland Blackstone SAS',
  }) === 'cortland-blackstone-sas',
  'missing slug falls back to businessName slug'
)
assert(
  publicSellerSegment({
    id: '96b152de-d6a7-4fc8-aca8-50fe8e6ee321',
    slug: 'cortland-blackstone-sas404',
    businessName: 'Cortland Blackstone SAS',
  }) === 'cortland-blackstone-sas404',
  'stored slug takes precedence'
)
assert(
  normalizeStoreUrlsInText(
    'Visita https://oigagig.com/sellers/d1455845-abd3-478d-86e7-64a0ae3ec714 hoy',
    'https://oigagig.com/sellers/cortland-blackstone-sas',
  ) === 'Visita https://oigagig.com/sellers/cortland-blackstone-sas hoy',
  'UUID seller links normalize to canonical slug URL'
)

console.log('seller-slug.test.ts OK')