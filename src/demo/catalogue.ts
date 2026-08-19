import type { Product } from '@/cart';

/**
 * Demo catalogue. In a real deployment this arrives from the host app or a
 * product API — the cart MFE only ever needs the `Product` shape.
 *
 * Thumbnails are inline SVG data-URLs so the demo renders with zero network
 * requests (and no broken images in an offline environment).
 */
function thumbnail(from: string, to: string, glyph: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
    </linearGradient></defs>
    <rect width="400" height="400" fill="url(#g)"/>
    <text x="50%" y="50%" dy="0.35em" text-anchor="middle" font-size="160" font-family="system-ui, sans-serif">${glyph}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const catalogue: Product[] = [
  {
    id: 'sku-aeropress',
    name: 'AeroPress Go',
    variant: 'Travel coffee press',
    priceCents: 3995,
    currency: 'USD',
    imageUrl: thumbnail('#fde68a', '#f59e0b', '☕'),
    maxQuantity: 10,
    relatedIds: ['sku-filters', 'sku-beans'],
  },
  {
    id: 'sku-grinder',
    name: 'Comandante C40',
    variant: 'Hand grinder · Walnut',
    priceCents: 27500,
    currency: 'USD',
    imageUrl: thumbnail('#bfdbfe', '#3b82f6', '⚙'),
    maxQuantity: 4,
    relatedIds: ['sku-beans', 'sku-scale', 'sku-tamper'],
  },
  {
    id: 'sku-kettle',
    name: 'Gooseneck Kettle',
    variant: '0.9L · Matte black',
    priceCents: 8900,
    currency: 'USD',
    imageUrl: thumbnail('#e2e8f0', '#64748b', '🫖'),
    maxQuantity: 6,
    relatedIds: ['sku-beans', 'sku-mug'],
  },
  {
    id: 'sku-beans',
    name: 'Single Origin Beans',
    variant: 'Ethiopia Guji · 250g',
    priceCents: 1850,
    currency: 'USD',
    imageUrl: thumbnail('#bbf7d0', '#16a34a', '🌱'),
    maxQuantity: 24,
    relatedIds: ['sku-grinder', 'sku-aeropress', 'sku-filters'],
  },
  {
    id: 'sku-scale',
    name: 'Precision Scale',
    variant: '0.1g · USB-C',
    priceCents: 6400,
    currency: 'USD',
    imageUrl: thumbnail('#ddd6fe', '#7c3aed', '⚖'),
    // Deliberately low stock to demo the quantity cap.
    maxQuantity: 2,
    relatedIds: ['sku-grinder', 'sku-tamper'],
  },
  {
    id: 'sku-mug',
    name: 'Double-Wall Mug',
    variant: '250ml · Borosilicate',
    priceCents: 2200,
    currency: 'USD',
    imageUrl: thumbnail('#fecdd3', '#e11d48', '🥛'),
    maxQuantity: 12,
    relatedIds: ['sku-kettle', 'sku-beans'],
  },
  {
    id: 'sku-filters',
    name: 'Paper Filters',
    variant: 'Pack of 350',
    priceCents: 950,
    currency: 'USD',
    imageUrl: thumbnail('#fef3c7', '#d97706', '📄'),
    maxQuantity: 30,
    relatedIds: ['sku-aeropress', 'sku-beans'],
  },
  {
    id: 'sku-tamper',
    name: 'Calibrated Tamper',
    variant: '58.5mm · Steel',
    priceCents: 12000,
    currency: 'USD',
    imageUrl: thumbnail('#cbd5e1', '#334155', '🔨'),
    // Out of stock to demo the disabled state.
    maxQuantity: 0,
    relatedIds: ['sku-scale', 'sku-grinder'],
  },
];
