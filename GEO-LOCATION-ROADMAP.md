# Google Maps / Geolocation Features Roadmap

## Vision
Add smart location-based features to make OigaUsted more useful in Colombia, where traffic and distance matter a lot for service gigs.

## High-Value Features (Prioritized)

### 1. Gigs Near Me (High Priority)
- On the main `/gigs` page, show "Gigs cerca de ti" filter.
- Users can allow location access → see gigs sorted by distance.
- Show distance in km on every gig card.
- Sellers can set `serviceRadiusKm` (how far they're willing to travel).

### 2. Service Location at Checkout
- When buying a gig, buyer can set the exact address where the service will take place.
- Store `serviceLatitude`, `serviceLongitude`, `serviceAddress` on the Order.
- Show the location on a map in the order details.

### 3. Seller Service Area
- Sellers define the cities/areas they serve + max travel distance.
- System can warn buyers if a seller is too far.

### 4. Basic Order/Service Tracking Map
- On order page, show a map with the service location.
- Future: Live location updates from the seller (for deliveries, installations, etc.).

### 5. Address Autocomplete (UX Win)
- Use Google Places Autocomplete when entering addresses (profile, checkout, gig creation).
- Much better experience than typing addresses manually.

## Other Good Ideas

- "Popular services in your neighborhood" recommendations.
- Heatmap in admin showing where most gigs are happening.
- Route optimization for sellers who have multiple orders in one day.
- "Sellers near your location" when browsing categories.
- Delivery radius warnings (e.g., "This seller usually serves up to 15km").

## Technical Setup Needed

1. Google Cloud Project
   - Enable: Maps JavaScript API, Places API, Geocoding API
2. Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to Vercel + .env files
3. Add location fields to User, Gig, and Order models (done in this branch)

## Current Status (feat/google-geolocation branch)

- [x] Created branch
- [x] Added location fields to User, Gig, and Order models
- [x] Basic reusable GoogleMap component
- [ ] Gigs near me filter
- [ ] Address autocomplete
- [ ] Service location at checkout
- [ ] Seller service radius
- [ ] Order tracking map

## Next Steps (suggested order)

1. Set up Google Maps API key (dev + production)
2. Build address autocomplete component (Google Places)
3. Add "Gigs cerca de ti" on the main gigs listing page
4. Allow sellers to set service radius in their profile
5. Capture service location during checkout for non-remote gigs
6. Show service location map on order details
