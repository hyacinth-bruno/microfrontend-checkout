/**
 * Domain types for the Cart micro-frontend.
 *
 * Money is *always* handled as an integer number of minor units (cents).
 * Never floats: 0.1 + 0.2 !== 0.3 and a storefront that is a penny out on a
 * subtotal loses trust instantly.
 */
export type CurrencyCode = 'USD' | 'GBP' | 'EUR' | 'AUD' | 'CAD' | 'JPY';

/** A sellable item as it arrives from the catalogue/host application. */
export interface Product {
  /** Stable identifier of the purchasable unit (i.e. the variant/SKU). */
  id: string;
  name: string;
  /** Unit price in minor units, e.g. 1299 === $12.99 */
  priceCents: number;
  currency: CurrencyCode;
  /** Optional short descriptor shown under the product name, e.g. "Large / Blue". */
  variant?: string;
  imageUrl?: string;
  /** Units the customer is allowed to buy. Defaults to DEFAULT_MAX_QUANTITY. */
  maxQuantity?: number;
  /**
   * IDs of products the host considers related to this one (e.g. "goes well
   * with"). Purely a host-supplied hint — the cart never reads this itself,
   * it only carries the field so a host can build "you might also like"
   * suggestions from whatever's currently in the basket.
   */
  relatedIds?: string[];
}

/** A product plus the quantity the customer has chosen. */
export interface CartLine {
  /** Line id === product id. One line per purchasable unit. */
  id: string;
  name: string;
  variant?: string;
  imageUrl?: string;
  unitPriceCents: number;
  currency: CurrencyCode;
  quantity: number;
  maxQuantity: number;
  /** Epoch ms the line was first added — used for stable ordering. */
  addedAt: number;
}

/** Derived, never stored. The cart state has a single source of truth: `lines`. */
export interface CartTotals {
  /** Number of distinct lines. */
  lineCount: number;
  /** Sum of every line quantity — what the header badge shows. */
  itemCount: number;
  subtotalCents: number;
  currency: CurrencyCode;
}
