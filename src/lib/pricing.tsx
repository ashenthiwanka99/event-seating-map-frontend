export const PRICE_BY_TIER: Record<number, number> = {
  1: 120, 2: 95, 3: 70, 4: 50,
};
export const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
