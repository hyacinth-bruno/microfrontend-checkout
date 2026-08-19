import type { CartLine, Product } from '@/cart';

/**
 * "You might also like": ranks catalogue products by how many of the current
 * cart lines list them in `relatedIds`, most-referenced first. An empty cart
 * yields no suggestions — there's nothing yet to call these "similar" to.
 */
export function getSuggestedProducts(lines: CartLine[], catalogue: Product[], limit = 4): Product[] {
  const inCart = new Set(lines.map((line) => line.id));
  const byId = new Map(catalogue.map((product) => [product.id, product]));
  const score = new Map<string, number>();

  for (const line of lines) {
    for (const relatedId of byId.get(line.id)?.relatedIds ?? []) {
      if (inCart.has(relatedId)) continue;
      score.set(relatedId, (score.get(relatedId) ?? 0) + 1);
    }
  }

  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => byId.get(id))
    .filter((product): product is Product => product !== undefined);
}
