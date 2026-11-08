import type { LocationFormValues } from '../types';

/**
 * Two Cebu addresses so a booking can be tested in a couple of taps
 * without dragging the map.
 */
export const SAMPLE_PICKUP: LocationFormValues = {
  address: 'SM City Cebu, North Reclamation Area',
  landmark: 'Main entrance, beside the taxi bay',
  details: '',
  point: { latitude: 10.3119, longitude: 123.918 },
};

export const SAMPLE_DROPOFF: LocationFormValues = {
  address: 'Ayala Center Cebu, Cebu Business Park',
  landmark: 'The Terraces',
  details: '2nd floor, call on arrival',
  point: { latitude: 10.3181, longitude: 123.905 },
};

export const EMPTY_LOCATION: LocationFormValues = {
  address: '',
  landmark: '',
  details: '',
  point: null,
};
