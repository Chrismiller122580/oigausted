type FbqCommand = 'init' | 'track' | 'trackCustom' | 'consent' | 'set'

interface FbqFn {
  (command: FbqCommand, ...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  loaded: boolean
  version: string
  push: FbqFn
}

declare global {
  interface Window {
    fbq?: FbqFn
    _fbq?: FbqFn
  }
}

export {}
