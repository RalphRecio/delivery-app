# ADR 0009: Map pin picker with device location and free geocoding

Date: 2026-11-02 · Status: accepted

## Decision

- Customers choose pickup and drop-off by dragging a map under a fixed centre pin (Grab-style), or by tapping **Use my location**. The pin's coordinates are what the booking stores; typed coordinates are gone.
- The address line is filled from the pin by reverse geocoding and stays editable. Two more fields per location, **landmark** (120 chars) and **other details** (255 chars), carry what gets a rider to the right door. Riders see all three.
- Map and geocoding are platform-specific behind one `MapPicker` component in `features/map`:
  - Web: Leaflet with OpenStreetMap tiles; reverse geocoding via Nominatim. No API key.
  - iOS / Android: `react-native-maps` (Apple Maps on iOS, Google Maps on Android) and `expo-location` for GPS and on-device reverse geocoding.
- Programmatic moves (GPS fix, sample location, a value set by the form) do not count as the user dragging, so they never overwrite a typed address.

## Why

- Pin-at-centre is simpler to build and use than draggable markers, and it is the pattern local users already know from Grab.
- OpenStreetMap and Nominatim cost nothing and need no key, which keeps the web build and tests runnable anywhere. Nominatim asks for light use (about one request per second); the picker debounces by 700 ms and sends one request per pin stop.
- `.web.tsx` / native file pairs follow the project convention instead of `Platform.OS` branches, and TypeScript checks against the native file.

## Address search (added 2026-11-02)

Typing in the address field shows a list of matching places (Nominatim `search`, Philippines only, biased to the current pin, debounced 450 ms, 6 results). Choosing one fills the address with "name, locality" and jumps the pin there without triggering reverse geocoding, so the chosen wording is kept. "Use my location" sits in the card header. Only a drag or zoom the user started moves the pin; programmatic recentres jump without animation, which removed a bug where an interrupted pan animation was mistaken for a drag and overwrote a typed address.

## Consequences

- Android dev builds need a Google Maps API key in `app.json` (`android.config.googleMaps.apiKey`); Expo Go already carries one.
- Browser geolocation only works on `localhost` or `https`. On a LAN address the user drags the map instead.
- Nominatim is fine for development and a soft launch; a paid geocoder (Google, Mapbox) replaces `reverseGeocode.web.ts` when volume grows. Routing distance for fares is still the straight-line estimate from ADR 0007.
