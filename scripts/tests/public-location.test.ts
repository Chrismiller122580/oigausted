import { formatPublicCityCountry, looksLikeStreetAddress, toPublicCityName } from '../../src/lib/public-location'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(toPublicCityName('Carrera 27 # 37-33, Bucaramanga') === 'Bucaramanga', 'street + city')
assert(toPublicCityName('Bucaramanga') === 'Bucaramanga', 'plain city')
assert(toPublicCityName('Ubicación actual (7.1193, -73.1227)') === 'Bucaramanga' || toPublicCityName('Ubicación actual (7.1193, -73.1227)') === null, 'coords drop or city')
assert(looksLikeStreetAddress('Calle 45 #12-08'), 'street detected')
assert(formatPublicCityCountry('Floridablanca') === 'Floridablanca, Colombia', 'country suffix')
assert(formatPublicCityCountry('', true) === 'Remoto / online', 'remote fallback')
assert(toPublicCityName('apto 302 edificio sol') === null, 'building dropped')

console.log('public-location.test.ts OK')
