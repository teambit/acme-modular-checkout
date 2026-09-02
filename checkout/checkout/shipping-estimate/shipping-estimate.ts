/**
 * Estimate shipping cost from parcel weight (kg) and distance (km).
 * Pure function: no I/O, deterministic.
 */
export function shippingEstimate(weightKg: number, distanceKm: number): number {
  const base = 3.0;
  const perKg = 1.2;
  const perHundredKm = 0.8;
  const total = base + weightKg * perKg + (distanceKm / 100) * perHundredKm;
  return Math.round(total * 100) / 100;
}
