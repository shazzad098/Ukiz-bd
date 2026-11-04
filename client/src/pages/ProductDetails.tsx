import { useEffect, useState } from "react";
import { ArrowRight, Check, Heart, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import StorefrontLayout from "@/components/StorefrontLayout";
import { money } from "./Home";
import { hasPremium, premiumAvailable, priceForSize, stockForSize, unitPrice, useProducts } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import NotFound from "./NotFound";
import { usePageSeo } from "@/components/Seo";
import { imageSrcSet, imageUrl } from "@/lib/images";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { addItem } = useCart();
  const { has: isSaved, toggle: toggleSaved } = useWishlist();
  const { products, isLoading, isError, refetch } = useProducts();
  const product = products.find((item) => item.id === id);
  const [size, setSize] = useState(product?.sizes[0] ?? "50ml");
  const [quantity, setQuantity] = useState(1);
  const [premium, setPremium] = useState(false);
  const firstSize = product?.sizes[0] ?? "50ml";
  const selectedStock = product ? stockForSize(product, size) : undefined;
  const maxQuantity = product
    ? premium
      ? Math.min(selectedStock ?? Number.POSITIVE_INFINITY, product.premiumStock ?? 0)
      : selectedStock ?? Number.POSITIVE_INFINITY
    : 0;
  const saved = product ? isSaved(product.id) : false;

  usePageSeo({
    title: product ? `${product.name} by ${product.brand} — UKIZ-BD` : "Fragrance — UKIZ-BD",
    description: product ? `${product.name}: authentic ${product.family.toLowerCase()} fragrance decant with nationwide delivery in Bangladesh.` : "Authentic fragrance decants in Bangladesh.",
    canonicalPath: `/product/${id ?? ""}`,
    image: product?.image,
  });

  useEffect(() => {
    setSize(firstSize);
    setQuantity(1);
    setPremium(false);
  }, [firstSize, product?.id]);

  useEffect(() => {
    setQuantity((current) => maxQuantity === 0 ? 1 : Math.min(current, maxQuantity));
  }, [maxQuantity]);

  if (isLoading && !product) {
    return <StorefrontLayout eyebrow="Composition / Loading" title="Finding your scent."><section className="container pb-24"><p className="text-sm text-[#625d55]">Loading composition…</p></section></StorefrontLayout>;
  }
  if (isError && !product) {
    return <StorefrontLayout eyebrow="Composition / Unavailable" title="The edit is taking a moment."><section className="container pb-24"><div role="alert" className="rounded-2xl border border-[#8f4c3c]/30 bg-[#f1e2db] p-6 text-sm text-[#6f382e]">We could not load this fragrance. <button type="button" onClick={() => void refetch()} className="ml-2 font-bold underline underline-offset-4">Try again</button></div></section></StorefrontLayout>;
  }
  if (!product) return <NotFound />;

  const addToBag = () => {
    if (maxQuantity === 0 || !addItem(product, size, quantity, premium)) {
      toast.error("This size is currently out of stock.");
      return;
    }
    toast.success(`${product.name} added to your bag.`);
    setLocation("/cart");
  };

  return (
    <StorefrontLayout eyebrow={`Composition / ${product.brand}`} title={product.name}>
      <section className="container pb-24">
        <div className="grid gap-10 md:grid-cols-[1fr_.85fr] md:items-start">
          <figure className="image-sheen relative aspect-[.88] overflow-hidden rounded-[1.5rem] bg-[#ded8cd] md:aspect-[.82]" style={{ backgroundColor: product.tone }}>
            <img
              src={imageUrl(product.image, 1200)}
              srcSet={imageSrcSet(product.image)}
              sizes="(min-width: 768px) 55vw, 95vw"
              alt={`${product.brand} ${product.name} fragrance bottle`}
              className="h-full w-full object-cover"
              fetchPriority="high"
              decoding="async"
            />
            <figcaption className="absolute bottom-4 left-4 rounded-full border border-white/40 bg-[#151515]/70 px-4 py-2 text-xs font-semibold uppercase tracking-[.12em] text-white backdrop-blur">
              {product.badge ?? "The considered edit"}
            </figcaption>
          </figure>

          <div className="md:pl-6">
            <div className="eyebrow mb-4">{product.brand}</div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-[#625d55]">A considered composition built around {product.notes.toLowerCase()}.</p>
              </div>
              <button
                type="button"
                onClick={() => { const added = toggleSaved(product.id); toast.success(added ? "Saved to your wishlist." : "Removed from your wishlist."); }}
                className={`icon-button shrink-0 ${saved ? "text-[#8e642b]" : ""}`}
                aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                aria-pressed={saved}
              >
                <Heart size={17} fill={saved ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[.1em] text-[#6e5839]">
              <span className="rounded-full border border-black/15 px-3 py-2">{product.family}</span>
              {product.vibe && <span className="rounded-full border border-black/15 px-3 py-2">{product.vibe}</span>}
            </div>

            <div className="my-8 border-y border-black/10 py-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase tracking-[.13em]">
                <span>Choose your size</span>
                <span className="text-[#6e5839]">{money(unitPrice(product, size, premium))}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((item) => {
                  const stock = stockForSize(product, item);
                  const out = stock === 0;
                  return (
                    <button
                      type="button"
                      key={item}
                      disabled={out}
                      onClick={() => setSize(item)}
                      aria-pressed={size === item}
                      className={`min-h-11 rounded-full border px-4 py-2 text-xs uppercase tracking-[.12em] transition-colors ${size === item ? "border-[#151515] bg-[#151515] text-[#f5f0e6]" : out ? "border-black/10 text-black/35 line-through" : "border-black/15 text-[#625d55] hover:border-black/45"}`}
                    >
                      {item} · {money(priceForSize(product, item))}{stock !== undefined ? (out ? " · Out" : stock <= 5 ? ` · ${stock} left` : "") : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {hasPremium(product) && (premiumAvailable(product) ? (
              <button type="button" onClick={() => setPremium((value) => !value)} aria-pressed={premium} className={`mb-5 flex min-h-14 w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${premium ? "border-[#a4824e] bg-[#a4824e]/10" : "border-black/15 hover:border-black/35"}`}>
                <span><span className="block text-xs font-bold uppercase tracking-[.13em]">{premium ? "✓ " : "+ "}Add {product.premiumName}</span><span className="mt-1 block text-xs text-[#625d55]">Premium bottle · {product.premiumStock} available</span></span>
                <span className="text-sm font-bold">+{money(product.premiumPrice ?? 0)}</span>
              </button>
            ) : <div className="mb-5 rounded-xl border border-black/10 px-4 py-3 text-xs uppercase tracking-[.13em] text-[#69645b]">{product.premiumName} · Sold out</div>)}

            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-black/15" aria-label="Quantity">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid h-11 w-11 place-items-center" aria-label="Decrease quantity"><Minus size={13} /></button>
                <span className="w-7 text-center text-sm" aria-live="polite">{quantity}</span>
                <button type="button" onClick={() => setQuantity((value) => Math.min(value + 1, maxQuantity))} disabled={quantity >= maxQuantity} className="grid h-11 w-11 place-items-center disabled:cursor-not-allowed disabled:text-black/30" aria-label="Increase quantity"><Plus size={13} /></button>
              </div>
              <button type="button" onClick={addToBag} disabled={maxQuantity === 0} className="primary-button dark min-h-11 flex-1 disabled:cursor-not-allowed disabled:opacity-45">
                {maxQuantity === 0 ? "Out of stock" : "Add to bag"} <ArrowRight size={14} />
              </button>
            </div>

            <div className="mt-7 grid gap-4 text-xs leading-relaxed text-[#625d55]">
              <div className="flex gap-3"><ShieldCheck size={16} className="shrink-0 text-[#8e6d3f]" /> Authentic product, carefully packed</div>
              <div className="flex gap-3"><Truck size={16} className="shrink-0 text-[#8e6d3f]" /> Ships nationwide from Dhaka</div>
              <div className="flex gap-3"><Check size={16} className="shrink-0 text-[#8e6d3f]" /> Decant policy: unbox in front of rider — exchange only for damage / wrong item. <Link href="/refund-policy" className="shrink-0 font-semibold text-[#6e5839] underline underline-offset-4">Details</Link></div>
            </div>
          </div>
        </div>

        <div className="mt-24 grid gap-10 border-t border-black/10 pt-10 md:grid-cols-[.6fr_1.4fr]">
          <div className="eyebrow">The scent profile</div>
          <div className="grid gap-7 sm:grid-cols-3">
            <div><div className="text-xs uppercase tracking-[.12em] text-[#806b4b]">Family</div><div className="serif mt-2 text-2xl">{product.family}</div></div>
            <div><div className="text-xs uppercase tracking-[.12em] text-[#806b4b]">Notes</div><div className="serif mt-2 text-2xl">{product.notes}</div></div>
            <div><div className="text-xs uppercase tracking-[.12em] text-[#806b4b]">Wear it</div><div className="serif mt-2 text-2xl">{product.vibe ?? "Close, then closer"}</div></div>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
