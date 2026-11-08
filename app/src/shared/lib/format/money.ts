const CENTAVOS_PER_PESO = 100;

/**
 * Formats integer centavos as "₱1,234.50". Mirrors Money::format() on the
 * server; the app never does money arithmetic, it only displays it.
 */
export function formatMoney(centavos: number): string {
  if (!Number.isInteger(centavos)) {
    throw new TypeError(`formatMoney expects integer centavos, got ${centavos}`);
  }

  const sign = centavos < 0 ? '-' : '';
  const absolute = Math.abs(centavos);
  const pesos = Math.floor(absolute / CENTAVOS_PER_PESO).toLocaleString('en-PH');
  const cents = String(absolute % CENTAVOS_PER_PESO).padStart(2, '0');

  return `${sign}₱${pesos}.${cents}`;
}
