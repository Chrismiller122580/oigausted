import type { WompiWidgetConfig, WompiPrepareResponse, WompiWidgetResult } from '@/types/wompi'

interface WompiCheckoutInstance {
  open: ((callback?: (result: WompiWidgetResult) => void) => void) &
    ((config: WompiWidgetConfig) => void)
  close?: () => void
}

type WompiCheckoutConstructor = new (config: WompiWidgetConfig) => WompiCheckoutInstance

interface WompiSdk {
  publicKey?: string
  initialize?: ((opts?: { publicKey?: string }) => void) | (() => void)
}

declare global {
  interface Window {
    WompiCheckout?: WompiCheckoutConstructor
    WidgetCheckout?: WompiCheckoutConstructor
    WOMPI_PUBLIC_KEY?: string
    $wompi?: WompiSdk
    Wompi?: WompiSdk
    WOMPI_CONFIG?: WompiPrepareResponse
  }
}

export {}