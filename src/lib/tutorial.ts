import { isCapacitorNative } from '@/lib/capacitor-native'

export function tutorialStorageKey(mode: 'buyer' | 'seller', userId: string): string {
  return `tutorial_${mode}_${userId}`
}

export function markTutorialDismissed(mode: 'buyer' | 'seller', userId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(tutorialStorageKey(mode, userId), 'true')
  } catch {
    // non-fatal
  }
}

export function hasSeenTutorial(mode: 'buyer' | 'seller', userId: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(tutorialStorageKey(mode, userId)) === 'true'
  } catch {
    return true
  }
}

/** Native app users already installed — skip forced onboarding overlays. */
export function shouldAutoShowTutorial(): boolean {
  if (typeof window === 'undefined') return false
  return !isCapacitorNative()
}