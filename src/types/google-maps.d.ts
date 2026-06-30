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

  interface GoogleMapsMarkerLabel {
    text: string
    color?: string
    fontWeight?: string
  }

  interface GoogleMapsMarkerOptions {
    position: GoogleMapsLatLng
    map: GoogleMapInstance | null
    title?: string
    label?: GoogleMapsMarkerLabel | string
    cursor?: string
  }

  interface GoogleMapsEventListener {
    remove?: () => void
  }

  interface GoogleMapsMarkerInstance {
    addListener?: (event: string, handler: () => void) => GoogleMapsEventListener
    setMap?: (map: GoogleMapInstance | null) => void
  }

  interface GoogleMapInstance {
    panTo?: (latLng: GoogleMapsLatLng) => void
    setCenter?: (latLng: GoogleMapsLatLng) => void
    setZoom?: (zoom: number) => void
    getZoom?: () => number
    addListener?: (event: string, handler: () => void) => GoogleMapsEventListener
  }

  interface GoogleMapsEventNamespace {
    trigger?: (instance: GoogleMapInstance, eventName: string) => void
  }

  type GoogleMapsMarkerConstructor = new (options: GoogleMapsMarkerOptions) => GoogleMapsMarkerInstance

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
    event?: GoogleMapsEventNamespace
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