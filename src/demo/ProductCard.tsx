'use client';

import { AddToCartButton, formatMoney, useLineQuantity, type Product } from '@/cart';

export function ProductCard({ product }: { product: Product }) {
  const inCart = useLineQuantity(product.id);
  const soldOut = (product.maxQuantity ?? Infinity) < 1;

  return (
    <article className="group flex flex-col overflow-hidden rounded-panel border border-slate-200 bg-white shadow-resting transition hover:shadow-raised">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element -- demo uses inline data-URLs */}
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover transition duration-300 motion-safe:group-hover:scale-[1.03] ${
            soldOut ? 'opacity-50 grayscale' : ''
          }`}
        />
        {inCart > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-slate-900/90 px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
            {inCart} in cart
          </span>
        )}
        {soldOut && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-600">
            Sold out
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-sm font-semibold text-slate-900">{product.name}</h3>
        {product.variant && <p className="text-xs text-slate-500">{product.variant}</p>}
        <p className="mt-1 text-base font-semibold text-slate-900 tabular-nums">
          {formatMoney(product.priceCents, product.currency)}
        </p>
        <div className="mt-3">
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}
