export type VehicleSaleDocKind = 'contract' | 'checklist'

export type CityDocProfile = {
  cityId: string
  cityLabel: string
  region?: string
  transitAgency: string
  taxClearanceLabel: string
  extraSteps: string[]
  disclaimer: string
}

export type VehicleSaleDocContext = {
  orderId: string
  orderPrice: number
  saleDate: string
  city: CityDocProfile
  sellerName: string
  buyerName: string
  gigTitle: string
  vehicleType?: string
  condition?: string
  year?: string | number
  plate?: string
  brand?: string
  model?: string
  color?: string
  vin?: string
}
