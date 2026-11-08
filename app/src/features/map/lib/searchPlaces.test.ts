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
