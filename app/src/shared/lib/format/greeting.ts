const NOON = 12;
const SIX_PM = 18;

/** "Magandang umaga" before noon, "hapon" until six, "gabi" after. */
export function filipinoGreeting(date: Date): string {
  const hour = date.getHours();

  if (hour < NOON) {
    return 'Magandang umaga';
  }

  if (hour < SIX_PM) {
    return 'Magandang hapon';
  }

  return 'Magandang gabi';
}
