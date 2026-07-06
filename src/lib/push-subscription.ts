export type NativePushPlatform = 'android' | 'ios'

export function buildNativePushEndpoint(platform: NativePushPlatform, token: string): string {
  return `fcm:${platform}:${token}`
}

export function parseNativePushEndpoint(
  endpoint: string,
): { platform: NativePushPlatform; token: string } | null {
  const match = endpoint.match(/^fcm:(android|ios):(.+)$/)
  if (!match) return null
  return { platform: match[1] as NativePushPlatform, token: match[2] }
}

export function isNativePushEndpoint(endpoint: string): boolean {
  return endpoint.startsWith('fcm:')
}