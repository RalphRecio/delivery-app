import { searchPlaces, toSuggestion } from './searchPlaces';

describe('toSuggestion', () => {
  it('uses the place name and a short locality line', () => {
    expect(
      toSuggestion({
        place_id: 1,
        lat: '10.3181',
        lon: '123.9050',
        display_name:
          'Ayala Center Cebu, Cebu Business Park, Cebu City, Central Visayas, Philippines',
        name: 'Ayala Center Cebu',
        address: { suburb: 'Cebu Business Park', city: 'Cebu City', state: 'Central Visayas' },
      }),
    ).toEqual({
      id: '1',
      title: 'Ayala Center Cebu',
      subtitle: 'Cebu Business Park, Cebu City, Central Visayas',
      point: { latitude: 10.3181, longitude: 123.905 },
    });
  });

  it('falls back to street and the display name when there is no name', () => {
    const suggestion = toSuggestion({
      place_id: 2,
      lat: '10.3',
      lon: '123.9',
      display_name: '12 Salinas Drive, Lahug, Cebu City',
      address: { house_number: '12', road: 'Salinas Drive' },
    });

    expect(suggestion.title).toBe('12 Salinas Drive');
    expect(suggestion.subtitle).toBe('12 Salinas Drive, Lahug, Cebu City');
  });
});

describe('searchPlaces', () => {
  it('asks Nominatim for Philippine results near the given point and drops duplicate places', async () => {
    const duplicate = {
      place_id: 1,
      lat: '10.3',
      lon: '123.9',
      display_name: 'Ayala Center Cebu, Luz, Cebu City',
      name: 'Ayala Center Cebu',
      address: { suburb: 'Luz', city: 'Cebu City' },
    };
    const fetchMock = jest.fn<
      Promise<{ ok: boolean; json: () => Promise<unknown[]> }>,
      [string, RequestInit?]
    >(async () => ({
      ok: true,
      json: async () => [
        duplicate,
        { ...duplicate, place_id: 2 },
        { ...duplicate, place_id: 3, name: 'Jollibee' },
      ],
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const results = await searchPlaces('ayala', { latitude: 10.3, longitude: 123.9 });

    expect(results.map((r) => r.title)).toEqual(['Ayala Center Cebu', 'Jollibee']);

    const url = new URL(fetchMock.mock.calls[0]?.[0] ?? '');

    expect(url.searchParams.get('q')).toBe('ayala');
    expect(url.searchParams.get('countrycodes')).toBe('ph');
    expect(url.searchParams.get('viewbox')).toBe('123.4,10.8,124.4,9.8');
  });
});

describe('searchPlaces with a Plus Code', () => {
  function mockNominatim(resultsByQuery: Record<string, unknown[]>) {
    const fetchMock = jest.fn<
      Promise<{ ok: boolean; json: () => Promise<unknown[]> }>,
      [string, RequestInit?]
    >(async (url) => ({
      ok: true,
      json: async () => resultsByQuery[new URL(url).searchParams.get('q') ?? ''] ?? [],
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    return fetchMock;
  }

  it('resolves a short code against the town after it, ignoring the noisy barangay part', async () => {
    const fetchMock = mockNominatim({
      'Parang, Maguindanao del Norte': [
        { place_id: 9, lat: '7.3755802', lon: '124.267482', display_name: 'Parang' },
      ],
    });

    const [suggestion, ...rest] = await searchPlaces(
      '97G7+7RG, Brgy, Poblacion, ll, Parang, Maguindanao del Norte',
      { latitude: 10.3, longitude: 123.9 },
    );

    expect(rest).toEqual([]);
    expect(suggestion?.title).toBe('97G7+7RG');
    expect(suggestion?.subtitle).toBe('Brgy, Poblacion, ll, Parang, Maguindanao del Norte');
    expect(suggestion?.point.latitude).toBeCloseTo(7.37, 1);
    expect(suggestion?.point.longitude).toBeCloseTo(124.26, 1);
    // The code itself never goes to Nominatim, which cannot read it.
    expect(fetchMock.mock.calls.map(([url]) => new URL(url).searchParams.get('q'))).toEqual([
      'Parang, Maguindanao del Norte',
    ]);
  });

  it('falls back to the current point when no town is given', async () => {
    const fetchMock = mockNominatim({});

    const [suggestion] = await searchPlaces('97G7+7RG', { latitude: 7.4, longitude: 124.3 });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(suggestion?.point.latitude).toBeCloseTo(7.37, 1);
  });

  it('decodes a full code without any network call', async () => {
    const fetchMock = mockNominatim({});

    const [suggestion] = await searchPlaces('8FVC9G8F+6X', null);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(suggestion?.point.latitude).toBeCloseTo(47.3655625, 6);
  });
});
