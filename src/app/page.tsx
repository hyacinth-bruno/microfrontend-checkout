import { CartTrigger } from '@/cart';
import { CartMount } from '@/demo/CartMount';
import { ProductCard } from '@/demo/ProductCard';
import { catalogue } from '@/demo/catalogue';

/**
 * Demo "host application".
 *
 * Note how little it knows about the cart: it renders <CartTrigger /> in its
 * header, <CartMount /> once anywhere in the tree, and <AddToCartButton /> on
 * each product. No provider, no prop-drilling. The one exception is
 * <CartMount />, which reads the live basket to compute "you might also
 * like" suggestions — the cart itself still has no idea what "related"
 * means, that logic lives entirely on the host side (see demo/suggestions.ts).
 */
export default function HomePage() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-control bg-brand text-sm font-bold text-white">
              BW
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Brewhouse</p>
              <p className="text-xs text-slate-500">Coffee equipment</p>
            </div>
          </div>
          <CartTrigger />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Shop all</h1>
          <p className="mt-2 text-sm text-slate-600">
            This storefront is a stand-in host application. Everything cart-related — the button in
            the header, the slide-over and the live subtotal — is the self-contained cart
            micro-frontend.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {catalogue.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-500 sm:px-6">
          Cart state is persisted to localStorage and synced across tabs. Try adding items, then
          open this page in a second tab.
        </div>
      </footer>

      {/* The micro-frontend's single mount point. */}
      <CartMount />
    </>
  );
}
