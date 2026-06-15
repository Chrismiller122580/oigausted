export {}

declare global {
  interface GoogleMapsLatLng {
    lat: number
    lng: number
  }

  interface GoogleMapOptions {
    center: GoogleMapsLatLng
    zoom?: number
    mapTypeControl?: boolean
    streetViewControl?: boolean
    fullscreenControl?: boolean
  }

  interface GoogleMapsMarkerOptions {
    position: GoogleMapsLatLng
    map: GoogleMapInstance | null
    title?: string
  }

  interface GoogleMapInstance {}

  type GoogleMapsMarkerConstructor = new (options: GoogleMapsMarkerOptions) => unknown

  type GoogleMapsMapConstructor = new (element: HTMLElement, options: GoogleMapOptions) => GoogleMapInstance

  type GoogleMapsPlacesAutocompleteStub = () => Record<string, never>

  interface GoogleMapsPlacesNamespace {
    Autocomplete?: GoogleMapsPlacesAutocompleteStub
    AutocompleteService?: () => void
    PlacesService?: () => void
    PlacesServiceStatus?: Record<string, never>
    RankBy?: Record<string, never>
    PlaceAutocompleteElement?: () => void
  }

  interface GoogleMapsNamespace {
    Map: GoogleMapsMapConstructor
    Marker: GoogleMapsMarkerConstructor
    places?: GoogleMapsPlacesNamespace
    importLibrary?: (name: string) => Promise<unknown>
  }

  interface GoogleNamespace {
    maps: GoogleMapsNamespace
  }

  interface Window {
    google?: GoogleNamespace
  }
}