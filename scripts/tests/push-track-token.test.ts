import {
  createPushTrackToken,
  verifyPushTrackToken,
} from '../../src/lib/push-track-token'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

// Ensure a secret exists for tests when env is empty
if (!process.env.NEXTAUTH_SECRET && !process.env.PUSH_TRACK_SECRET) {
  process.env.NEXTAUTH_SECRET = 'test-secret-for-push-track'
}

const id = 'notif_abc123'
const token = createPushTrackToken(id)
assert(!!token && token.length === 64, 'token is sha256 hex')
assert(verifyPushTrackToken(id, token) === true, 'valid token verifies')
assert(verifyPushTrackToken(id, 'deadbeef') === false, 'wrong token rejects')
assert(verifyPushTrackToken(id, null) === false, 'null token rejects')
assert(verifyPushTrackToken('other', token) === false, 'token not reusable across ids')

console.log('push-track-token.test.ts OK')
