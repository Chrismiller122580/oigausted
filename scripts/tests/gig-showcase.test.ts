import { PUBLIC_PROFILE_GIG_LIMIT } from '../../src/lib/gig-showcase'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(PUBLIC_PROFILE_GIG_LIMIT === 12, 'public profile gig limit is 12')

console.log('gig-showcase.test.ts OK')