import { decodeFullCode, decodeShortCode, findPlusCode } from './plusCode';

const PARANG = { latitude: 7.3755802, longitude: 124.267482 };

// 8FVC9G8F+6X worked by hand from the spec: latitude digits 8,V,9,8,6 and longitude
// digits F,C,G,F,X select the cell 47.3655..47.365625 / 8.524875..8.525; this is its centre.
const ZURICH = { latitude: 47.3655625, longitude: 8.5249375 };

describe('findPlusCode', () => {
  it('finds a short code in a pasted Google Maps address and keeps the locality', () => {
    expect(findPlusCode('97G7+7RG, Brgy, Poblacion, ll, Parang, Maguindanao del Norte')).toEqual({
      code: '97G7+7RG',
      isFull: false,
      locality: 'Brgy, Poblacion, ll, Parang, Maguindanao del Norte',
    });
  });

  it('accepts lower case and a full code', () => {
    expect(findPlusCode('6q8g97g7+7rg')).toEqual({
      code: '6Q8G97G7+7RG',
      isFull: true,
      locality: '',
    });
  });

  it('ignores ordinary addresses and things that only look similar', () => {
    expect(findPlusCode('12 Salinas Drive, Lahug, Cebu City')).toBeNull();
    expect(findPlusCode('Unit 5+6, Ayala Center')).toBeNull();
    expect(findPlusCode('ABC+DEF')).toBeNull();
  });
});

describe('decodeFullCode', () => {
  it('returns the centre of the code area', () => {
    const point = decodeFullCode('8FVC9G8F+6X');

    expect(point.latitude).toBeCloseTo(ZURICH.latitude, 9);
    expect(point.longitude).toBeCloseTo(ZURICH.longitude, 9);
  });
});

describe('decodeShortCode', () => {
  it('recovers the occurrence nearest to the reference point', () => {
    const point = decodeShortCode('9G8F+6X', { latitude: 47.4, longitude: 8.6 });

    expect(point.latitude).toBeCloseTo(ZURICH.latitude, 9);
    expect(point.longitude).toBeCloseTo(ZURICH.longitude, 9);
  });

  it('places the Parang code in Poblacion, Parang', () => {
    const point = decodeShortCode('97G7+7RG', PARANG);

    // Within ~1 km of the town centre, at street-level precision.
    expect(Math.abs(point.latitude - PARANG.latitude)).toBeLessThan(0.01);
    expect(Math.abs(point.longitude - PARANG.longitude)).toBeLessThan(0.01);
  });

  it('crosses into the neighbouring area when the reference sits near its edge', () => {
    // Reference just south of a 1-degree boundary still resolves to the code north of it.
    const north = decodeShortCode('9G8F+6X', { latitude: 46.9, longitude: 8.6 });

    expect(north.latitude).toBeCloseTo(ZURICH.latitude, 9);
  });
});
