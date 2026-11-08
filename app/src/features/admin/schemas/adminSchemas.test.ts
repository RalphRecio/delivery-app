import { fareSettingFormSchema } from './adminSchemas';

describe('fareSettingFormSchema', () => {
  it('keeps pesos as decimal strings and parses metres as a number', () => {
    const result = fareSettingFormSchema.parse({
      base_fare: ' 49 ',
      included_distance_meters: '2000',
      per_km: '10.50',
      service_fee: '0',
      minimum_fare: '49.00',
      commission_rate: ' 12.5 ',
    });

    expect(result).toEqual({
      base_fare: '49',
      included_distance_meters: 2000,
      per_km: '10.50',
      service_fee: '0',
      minimum_fare: '49.00',
      commission_rate: '12.5',
    });
  });

  it('rejects float-looking money and fractional metres', () => {
    const result = fareSettingFormSchema.safeParse({
      base_fare: '49.999',
      included_distance_meters: '2000.5',
      per_km: 'ten',
      service_fee: '0',
      minimum_fare: '49',
    });

    const paths = result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));

    expect(paths).toEqual(
      expect.arrayContaining(['base_fare', 'included_distance_meters', 'per_km']),
    );
  });
});
