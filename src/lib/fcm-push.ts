import 'server-only'
import { devLog } from '@/lib/utils'

type FcmMessaging = {
  sendEachForMulticast(message: {
    tokens: string[]
    notification: { title: string; body: string }
    data?: Record<string, string>
    android?: { priority?: 'high' | 'normal'; notification?: { channelId?: string } }
    apns?: { payload?: { aps?: { sound?: string } } }
  }): Promise<{ successCount: number; failureCount: number }>
}

let messaging: FcmMessaging | null | undefined

async function getFcmMessaging(): Promise<FcmMessaging | null> {
  if (messaging !== undefined) return messaging

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    devLog('[FCM] FIREBASE_SERVICE_ACCOUNT_JSON not configured — native push skipped')
    messaging = null
    return null
  }

  try {
    const admin = await import('firebase-admin')
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(raw) as admin.ServiceAccount
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
    }
    messaging = admin.messaging() as FcmMessaging
    return messaging
  } catch (err) {
    devLog('[FCM] Failed to initialize firebase-admin:', err)
    messaging = null
    return null
  }
}

export async function sendFcmPush(
  tokens: string[],
  title: string,
  body: string,
  url?: string,
): Promise<void> {
  if (tokens.length === 0) return

  const fcm = await getFcmMessaging()
  if (!fcm) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com'
  const targetUrl = url?.startsWith('http') ? url : `${appUrl}${url || '/notifications'}`

  try {
    const result = await fcm.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: {
        title,
        body,
        url: targetUrl,
      },
      android: {
        priority: 'high',
        notification: { channelId: 'oigagig_default' },
      },
      apns: {
        payload: { aps: { sound: 'default' } },
      },
    })
    devLog(`[FCM] Sent ${result.successCount}/${tokens.length} native push(es)`)
  } catch (err) {
    devLog('[FCM] sendEachForMulticast error:', err)
  }
}