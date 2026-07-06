import { Capacitor } from '@capacitor/core'
import { isCapacitorNative } from '@/lib/capacitor-native'

let listenersAttached = false

async function saveNativeToken(platform: 'android' | 'ios', token: string) {
  const res = await fetch('/api/notifications/push/subscribe', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platform,
      token,
      device: platform === 'android' ? 'Android App' : 'iOS App',
    }),
  })
  if (!res.ok) {
    throw new Error('Failed to register native push token')
  }
}

/**
 * Register FCM/APNs token for the Capacitor shell (Android + iOS).
 * No-op on web browsers.
 */
export async function initNativePushNotifications(): Promise<void> {
  if (!isCapacitorNative()) return

  const platform = Capacitor.getPlatform()
  if (platform !== 'android' && platform !== 'ios') return

  const { PushNotifications } = await import('@capacitor/push-notifications')

  if (platform === 'android') {
    try {
      await PushNotifications.createChannel({
        id: 'oigagig_default',
        name: 'OigaGIG',
        description: 'Pedidos, mensajes y alertas de OigaGIG',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
      })
    } catch {
      // channel may already exist
    }
  }

  if (!listenersAttached) {
    await PushNotifications.addListener('registration', (token) => {
      void saveNativeToken(platform, token.value).catch((err) => {
        console.warn('[Push] token registration failed:', err)
      })
    })

    await PushNotifications.addListener('registrationError', (error) => {
      console.warn('[Push] registration error:', error)
    })

    await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      const url = event.notification.data?.url
      if (url && typeof window !== 'undefined') {
        window.location.href = url
      }
    })

    listenersAttached = true
  }

  let permission = await PushNotifications.checkPermissions()
  if (permission.receive === 'prompt') {
    permission = await PushNotifications.requestPermissions()
  }
  if (permission.receive !== 'granted') return

  await PushNotifications.register()
}

export async function unregisterNativePushNotifications(): Promise<void> {
  if (!isCapacitorNative()) return

  const platform = Capacitor.getPlatform()
  if (platform !== 'android' && platform !== 'ios') return

  await fetch('/api/notifications/push/unsubscribe', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform }),
  }).catch(() => {})
}