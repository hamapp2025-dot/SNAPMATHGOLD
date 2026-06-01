export const PREMIUM_GOLD_LIGHT = '#DEC06D';
export const PREMIUM_GOLD = '#B8952A';
export const PREMIUM_GOLD_DEEP = '#8F6B1D';
export const PREMIUM_GOLD_INK = '#1B1D30';

export const PREMIUM_GOLD_GRADIENT: [string, string] = [PREMIUM_GOLD_LIGHT, PREMIUM_GOLD];
export const PREMIUM_GOLD_DEEP_GRADIENT: [string, string] = [PREMIUM_GOLD, PREMIUM_GOLD_DEEP];
export const PREMIUM_GOLD_TRIO: [string, string, string] = [
  PREMIUM_GOLD_LIGHT,
  PREMIUM_GOLD,
  PREMIUM_GOLD_DEEP,
];

export function premiumGoldTint(alpha: number) {
  return `rgba(184,149,42,${alpha})`;
}
