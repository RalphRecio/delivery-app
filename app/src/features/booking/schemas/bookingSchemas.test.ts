import { pabiliFormSchema, pasuyoFormSchema } from './bookingSchemas';

const location = {
  address: 'SM City Cebu',
  landmark: ' beside the taxi bay ',
  details: '',
  point: { latitude: 10.3119, longitude: 123.918 },
};

describe('pabiliFormSchema', () => {
  it('parses text-field strings into API types', () => {
    const result = pabiliFormSchema.parse({
      pabili_category: 'food',
      dropoff: { ...location, address: 'Ayala Center Cebu' },
      items: [{ name: 'Water', quantity: '2', note: '' }],
      purchase_budget: '350.50',
      notes: '   ',
    });

    expect(result.dropoff).toEqual({
      address: 'Ayala Center Cebu',
      landmark: 'beside the taxi bay',
      details: null,
      latitude: 10.3119,
      longitude: 123.918,
    });
    expect('pickup' in result).toBe(false);
    expect(result.pabili_category).toBe('food');
    expect(result.items[0]).toEqual({ name: 'Water', quantity: 2, note: null });
    expect(result.purchase_budget).toBe('350.50');
    expect(result.notes).toBeNull();
  });

  it('reports every invalid field by path', () => {
    const result = pabiliFormSchema.safeParse({
      pabili_category: 'toys',
      dropoff: { address: '', landmark: '', details: 'x'.repeat(300), point: null },
      items: [],
      purchase_budget: '12.345',
      notes: '',
    });

    expect(result.success).toBe(false);

    const paths = result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));

    expect(paths).toEqual(
      expect.arrayContaining([
        'pabili_category',
        'dropoff.address',
        'dropoff.details',
        'dropoff.point',
        'items',
        'purchase_budget',
      ]),
    );
  });
});

describe('pasuyoFormSchema', () => {
  it('normalises the recipient phone', () => {
    const result = pasuyoFormSchema.parse({
      pickup: location,
      dropoff: location,
      recipient_name: 'Juan',
      recipient_phone: '0917 123 4567',
      parcel_description: 'Documents',
      notes: 'Call on arrival',
    });

    expect(result.recipient_phone).toBe('+639171234567');
    expect(result.notes).toBe('Call on arrival');
  });
});
