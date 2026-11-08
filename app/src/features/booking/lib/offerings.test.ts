import { offeringParams, resolveOffering, SERVICE_OFFERINGS } from './offerings';

describe('resolveOffering', () => {
  it('defaults to Pasuyo, and to grocery for a Pabili', () => {
    expect(resolveOffering(undefined, undefined)?.key).toBe('pasuyo');
    expect(resolveOffering('pabili', undefined)?.key).toBe('pabili:grocery');
    expect(resolveOffering('pabili', 'pet_food')?.key).toBe('pabili:pet_food');
  });

  it('ignores a category on Pasuyo and rejects unknown names', () => {
    expect(resolveOffering('pasuyo', 'food')?.key).toBe('pasuyo');
    expect(resolveOffering('pabili', 'toys')).toBeNull();
    expect(resolveOffering('teleport', undefined)).toBeNull();
  });

  it('round-trips every offering through its route params', () => {
    for (const offering of SERVICE_OFFERINGS) {
      const params = offeringParams(offering);

      expect(resolveOffering(params.serviceType, params.category)?.key).toBe(offering.key);
    }
  });
});
