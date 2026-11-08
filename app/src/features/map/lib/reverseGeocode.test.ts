import { reverseGeocode } from './reverseGeocode';

describe('reverseGeocode (native)', () => {
  it('builds a short address line from the device geocoder', async () => {
    await expect(reverseGeocode({ latitude: 10.3157, longitude: 123.8854 })).resolves.toBe(
      'Osmeña Blvd, Cebu City',
    );
  });
});
