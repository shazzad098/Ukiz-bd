import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleUserRound,
  Heart,
  LockKeyhole,
  Mail,
  Menu,
  Minus,
  MoveRight,
  PackageOpen,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import BrandLogo from "@/components/BrandLogo";
import SocialLinks from "@/components/SocialLinks";
import { usePublicSettings } from "@/lib/settings";
import { fromPrice, hasPremium, premiumAvailable, priceForSize, stockForSize, useProducts, type StoreProduct } from "@/lib/products";
import { useCustomer } from "@/lib/customer";
import { cartLineKey, useCart } from "@/lib/cart";
import { imageSrcSet, imageUrl } from "@/lib/images";
import { useWishlist } from "@/lib/wishlist";
import { recommendScent } from "@/lib/scent-matcher";
import { useActiveDeals } from "@/lib/deals";

export type Product = StoreProduct;

export type { CartItem } from "@/lib/cart";

export const money = (value: number) => `৳${value.toLocaleString("en-BD")}`;

function Logo({ light = false }: { light?: boolean }) {
  return <BrandLogo light={light} />;
}

function ProductCard({ product, onAdd, onWish, wished }: { product: Product; onAdd: (product: Product) => void; onWish: (id: string) => void; wished: boolean }) {
  return (
    <article className="product-card group min-w-[255px] flex-1">
      <div className="image-sheen relative aspect-[.86] overflow-hidden rounded-[1.2rem] bg-[#ded9cd]" style={{ backgroundColor: product.tone }}>
        <Link href={`/product/${product.id}`} className="absolute inset-0 z-0" aria-label={`View ${product.brand} ${product.name} details`}>
          <img src={imageUrl(product.image, 900)} srcSet={imageSrcSet(product.image)} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw" alt={`${product.brand} ${product.name}`} className="product-image h-full w-full object-cover" loading="lazy" decoding="async" />
          {product.badge && <span className="absolute left-3 top-3 rounded-full bg-[#f3f0e9]/95 px-3 py-1.5 text-xs font-bold uppercase tracking-[.12em] backdrop-blur">{product.badge}</span>}
        </Link>
        <button type="button" onClick={() => onWish(product.id)} className={`icon-button absolute right-3 top-3 z-10 h-10 w-10 border-white/50 bg-white/80 backdrop-blur ${wished ? "text-[#8e642b]" : "text-[#151515]"}`} aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} aria-pressed={wished}>
          <Heart size={15} fill={wished ? "currentColor" : "none"} />
        </button>
        <div className="product-quick-action absolute inset-x-3 bottom-3 z-10 transition-all duration-300">
          <button type="button" onClick={() => onAdd(product)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#151515]/95 py-3 text-xs font-bold uppercase tracking-[.13em] text-[#f5f0e6] backdrop-blur hover:bg-[#151515]">
            Add to bag <Plus size={13} />
          </button>
        </div>
      </div>
      <div className="px-1 pt-4">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-[.12em] text-[#806b4b]">{product.brand}</span>
          <span className="text-xs text-[#69645b]">From {money(fromPrice(product))}</span>
        </div>
        <Link href={`/product/${product.id}`} className="inline-block focus-visible:rounded-sm">
          <h3 className="serif text-[22px] leading-tight">{product.name}</h3>
        </Link>
        <p className="mt-2 text-xs leading-relaxed text-[#625d55]">{product.family} · {product.notes}</p>
        <div className="mt-3 flex gap-1.5">
          {product.sizes.map((size) => <span key={size} className="rounded-full border border-black/15 px-2 py-1 text-xs uppercase tracking-[.08em] text-[#625d55]">{size}</span>)}
        </div>
      </div>
    </article>
  );
}
function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-5">
      <div>
        <div className="eyebrow mb-3">{eyebrow}</div>
        <h2 className="display max-w-xl text-[clamp(2.5rem,5vw,4.7rem)]">{title}</h2>
        {description && <p className="mt-4 max-w-md text-sm leading-relaxed text-[#777269]">{description}</p>}
      </div>
      {action && <Link href="/collection" className="hide-mobile group flex items-center gap-2 pb-1 text-xs font-bold uppercase tracking-[.15em]">{action}<MoveRight size={15} className="transition-transform group-hover:translate-x-1" /></Link>}
    </div>
  );
}

function Finder({ onAdd, products }: { onAdd: (product: Product) => void; products: Product[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const prompts = [
    { label: "Choose a mood", question: "What do you want to leave in the air?", options: ["Fresh", "Soft", "Magnetic", "Grounded"] },
    { label: "Choose a moment", question: "When will you wear it most?", options: ["Everyday", "After dark", "Slow mornings", "A special occasion"] },
    { label: "Choose an intensity", question: "How close should it sit?", options: ["Skin-close", "A quiet trail", "Make an entrance", "Let it linger"] },
  ];
  const current = prompts[step];
  const complete = step >= prompts.length;
  const recommendation = complete ? recommendScent(products, { mood: answers[0], moment: answers[1], intensity: answers[2] }) : undefined;
  const choose = (option: string) => {
    setAnswers((previous) => [...previous, option]);
    setStep((previous) => previous + 1);
  };

  return (
    <section id="finder" className="container py-24 md:py-32">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#1a1a18] p-6 text-[#f5f0e6] md:p-12">
        <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#c3a16b]/15 blur-3xl" />
        <div className="relative grid gap-12 md:grid-cols-[.85fr_1.15fr] md:items-end">
          <div>
            <div className="eyebrow mb-5 text-[#c7a970]">The scent index / 01</div>
            <h2 className="display max-w-md text-[clamp(2.7rem,5vw,4.8rem)]">Find the one that feels like you.</h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">A three-step edit for the way you move through a day, a room, or a memory.</p>
            <div className="mt-10 flex items-center gap-2" aria-label={`Step ${Math.min(step + 1, 3)} of 3`}>
              {[0, 1, 2].map((item) => <span key={item} className={`h-1 rounded-full transition-all ${item < step ? "w-12 bg-[#c7a970]" : "w-7 bg-white/25"}`} />)}
            </div>
          </div>
          <div className="min-h-[270px] rounded-[1.3rem] border border-white/15 bg-white/[.045] p-6 backdrop-blur md:p-8">
            {!complete ? (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[.15em] text-white/65"><span>{current.label}</span><span>0{step + 1} / 03</span></div>
                  <h3 className="serif max-w-lg text-3xl leading-tight md:text-4xl">{current.question}</h3>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {current.options.map((option) => <button type="button" key={option} onClick={() => choose(option)} className="group flex min-h-16 items-end justify-between rounded-xl border border-white/15 p-3 text-left text-xs text-white/85 transition-colors hover:border-[#c7a970] hover:bg-[#c7a970]/10"><span>{option}</span><ArrowUpRight size={14} className="text-white/55 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button>)}
                </div>
              </div>
            ) : recommendation ? (
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[.15em] text-[#d8bd86]"><Sparkles size={14} /> Your match is in</div>
                <div className="mt-8 flex items-center gap-5">
                  <img src={imageUrl(recommendation.image, 360)} alt={`${recommendation.brand} ${recommendation.name}`} className="h-24 w-20 rounded-xl object-cover" loading="lazy" />
                  <div><div className="text-xs uppercase tracking-[.14em] text-white/65">{recommendation.brand}</div><div className="serif mt-1 text-3xl">{recommendation.name}</div><div className="mt-2 text-xs text-white/65">{recommendation.notes}</div></div>
                </div>
                <div className="mt-8 flex flex-wrap gap-2"><button type="button" onClick={() => onAdd(recommendation)} className="primary-button dark">Try {recommendation.name} <ArrowRight size={14} /></button><button type="button" onClick={() => { setStep(0); setAnswers([]); }} className="px-3 text-xs font-bold uppercase tracking-[.13em] text-white/70 hover:text-white">Start over</button></div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-start justify-center">
                <h3 className="serif text-2xl">We’re refreshing the scent edit.</h3>
                <p className="mt-3 text-sm text-white/70">Please try the finder again in a moment.</p>
                <button type="button" onClick={() => { setStep(0); setAnswers([]); }} className="mt-6 text-xs font-bold uppercase tracking-[.13em] text-[#d8bd86]">Start over</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
export default function Home() {
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const { ids: wishlistIds, toggle: toggleSavedProduct } = useWishlist();
  const { items: cart, count: cartCount, total: cartTotal, addItem, updateQuantity: changeCartQty, removeItem: removeCartItem, updateSize, togglePremium } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const { products, isLoading: productsLoading, isError: productsError, refetch: refetchProducts } = useProducts();
  const { data: activeDeals = [] } = useActiveDeals();
  const featuredProduct = products[0];
  const { requireAuth, isAuthenticated } = useCustomer();
  const { announcement, supportEmail, freeThreshold } = usePublicSettings();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!cartOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setCartOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [cartOpen]);

  const filters = useMemo(() => {
    const values = Array.from(new Set(products.map((product) => product.vibe?.trim() || product.family.split("/")[0]?.trim()).filter((value): value is string => Boolean(value)))).sort();
    return ["All", ...values];
  }, [products]);
  const categories = useMemo(() => {
    const byFamily = new Map<string, Product>();
    for (const product of products) {
      const name = product.vibe?.trim() || product.family.split("/")[0]?.trim();
      if (name && !byFamily.has(name)) byFamily.set(name, product);
    }
    return Array.from(byFamily.entries()).slice(0, 4).map(([name, product]) => ({ name, product }));
  }, [products]);
  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesFilter = activeFilter === "All" || `${product.family} ${product.vibe ?? ""} ${product.notes}`.toLowerCase().includes(activeFilter.toLowerCase());
    const query = search.toLowerCase();
    const matchesSearch = !query || `${product.name} ${product.brand} ${product.notes}`.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  }), [activeFilter, search, products]);

  const addToCart = (product: Product) => {
    const size = product.sizes[0];
    if (!size || stockForSize(product, size) === 0 || !addItem(product)) { toast.error(`${product.name} is currently unavailable in a purchasable size.`); return; }
    setCartOpen(true);
    toast.success(`${product.name} added to your bag`, { description: "Your edit is waiting in the cart." });
  };
  const updateQuantity = (item: (typeof cart)[number], amount: number) => {
    if (!changeCartQty(cartLineKey(item), amount) && amount > 0) toast.error("You have reached the available stock for this size.");
  };
  const removeFromCart = (item: (typeof cart)[number]) => removeCartItem(cartLineKey(item));
  const toggleWishlist = (id: string) => {
    const saved = toggleSavedProduct(id);
    toast.success(saved ? "Saved to your wishlist." : "Removed from your wishlist.");
  };

  return (
    <div id="top" className="min-h-screen overflow-x-hidden bg-[#f3f0e9]">
      {announcement && <div className="overflow-hidden bg-[#151515] text-[#f5f0e6]" role="region" aria-label="Store announcement">
        <div className="flex min-w-max motion-safe:animate-[marquee_22s_linear_infinite] items-center py-2.5 text-xs uppercase tracking-[.2em] text-white/65" role="marquee">
          <div className="flex items-center gap-10 pr-10"><span>{announcement}</span></div>
          <div className="flex items-center gap-10 pr-10" aria-hidden="true"><span>{announcement}</span></div>
        </div>
      </div>}

      <header className={`fixed inset-x-0 z-40 transition-all duration-300 ${scrolled ? "glass-nav top-0" : announcement ? "hero-nav top-[29px] border-b border-white/10 bg-[#151515]/30 backdrop-blur-sm" : "hero-nav top-0 border-b border-white/10 bg-[#151515]/30 backdrop-blur-sm"}`}>
        <div className="container flex h-[72px] items-center justify-between gap-6">
          <Logo light={!scrolled} />
          <nav aria-label="Main navigation" className={`hide-mobile flex items-center gap-7 text-xs font-bold uppercase tracking-[.13em] ${scrolled ? "text-[#5c584f]" : "text-white/85"}`}>
            <Link className="nav-link" href="/collection">Collections</Link>
            <Link className="nav-link" href="/finder">Scent index</Link>
            <Link className="nav-link" href="/about">About</Link>
            <Link className="nav-link" href="/contact">Contact</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" className="icon-button h-10 w-10" onClick={() => setSearchOpen((value) => !value)} aria-label="Search fragrances" aria-expanded={searchOpen} aria-controls="home-search"><Search size={16} /></button>
            <button type="button" className="icon-button h-10 w-10 hide-mobile" onClick={() => setLocation(isAuthenticated ? "/account" : "/signin")} aria-label="Account"><CircleUserRound size={16} /></button>
            <Link href="/wishlist" className="icon-button h-10 w-10 hide-mobile" aria-label="Wishlist"><Heart size={16} /></Link>
            <button type="button" className="icon-button relative h-10 w-10" onClick={() => setCartOpen(true)} aria-label={`Open shopping bag, ${cartCount} item${cartCount === 1 ? "" : "s"}`}><ShoppingBag size={16} />{cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#b89558] px-1 text-xs font-bold text-[#151515]">{cartCount}</span>}</button>
            <button type="button" className="icon-button h-10 w-10 mobile-only" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="home-mobile-menu">{menuOpen ? <X size={16} /> : <Menu size={16} />}</button>
          </div>
        </div>
        {searchOpen && <div id="home-search" className="container pb-4"><div role="search" className="flex items-center gap-3 border-b border-white/25 pb-3"><Search size={17} className="text-[#d6bb83]" /><input autoFocus type="search" aria-label="Search by name, note or mood" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); }} placeholder="Search by name, note or mood" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/60" />{search.trim() !== "" && <span className="whitespace-nowrap text-xs uppercase tracking-[.1em] text-white/75">{filteredProducts.length} found</span>}<button type="button" aria-label="Clear search" onClick={() => { setSearch(""); setSearchOpen(false); }} className="text-white"><X size={16} /></button></div></div>}
        {menuOpen && <nav id="home-mobile-menu" aria-label="Mobile navigation" className="border-t border-white/15 bg-[#151515] px-5 pb-6 pt-4 text-white mobile-only"><div className="grid gap-4 text-sm font-semibold"><Link href="/collection" onClick={() => setMenuOpen(false)}>Collection</Link><a href="#categories" onClick={() => setMenuOpen(false)}>Browse by family</a><a href="#finder" onClick={() => setMenuOpen(false)}>Scent index</a><a href="#story" onClick={() => setMenuOpen(false)}>Our story</a><Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link><Link href="/account" onClick={() => setMenuOpen(false)}>Account</Link><Link href="/wishlist" onClick={() => setMenuOpen(false)}>Wishlist</Link></div></nav>}
      </header>

      <main>
        <section className="hero-grid hero-glow relative min-h-[730px] overflow-hidden bg-[#1a1a18] pt-32 text-[#f5f0e6] md:min-h-[800px] md:pt-40">
          <div className="container relative z-10 grid min-h-[650px] items-center gap-10 pb-16 md:grid-cols-[.95fr_1.05fr] md:pb-24">
            <div className="reveal max-w-xl">
              <div className="eyebrow mb-6 text-[#c7a970]">Chapter 01 / The considered edit</div>
              <h1 className="display text-[clamp(4.3rem,9vw,8.7rem)]">Scent is<br /><em className="text-[#c7a970]">a signature.</em></h1>
              <p className="mt-8 max-w-sm text-sm leading-relaxed text-white/55 md:text-base">A considered collection of modern fragrance, selected for the way you move — not the way you’re told to.</p>
              <div className="mt-9 flex flex-wrap items-center gap-3"><a href="#collection" className="primary-button">Explore collection <ArrowRight size={15} /></a><a href="#finder" className="secondary-button border-white/20 text-white hover:border-white">Find your scent <Sparkles size={14} /></a></div>
              <div className="mt-12 flex items-center gap-4 text-xs uppercase tracking-[.12em] text-white/40"><span className="grid h-8 w-8 place-items-center rounded-full border border-white/20"><ArrowDown /></span><span>Scroll to explore</span></div>
            </div>
            <div className="reveal reveal-delay-2 relative mx-auto w-full max-w-[570px]">
              {featuredProduct ? (
                <div className="relative aspect-[.84] overflow-hidden rounded-[2rem] bg-[#6a5948] shadow-[0_35px_80px_rgba(0,0,0,.3)] md:aspect-[.86]">
                  <img src={imageUrl(featuredProduct.image, 1200)} srcSet={imageSrcSet(featuredProduct.image)} sizes="(min-width: 768px) 48vw, 92vw" alt={`${featuredProduct.brand} ${featuredProduct.name} fragrance`} className="h-full w-full object-cover" fetchPriority="high" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161513]/80 via-transparent to-[#f7ddac]/10" />
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between"><div><div className="eyebrow text-[#d7bb83]">From the collection</div><div className="serif mt-2 text-3xl">{featuredProduct.name}</div></div><div className="rounded-full border border-white/30 bg-black/30 px-3 py-2 text-xs font-semibold uppercase tracking-[.12em] backdrop-blur">{featuredProduct.type ?? "COMPOSITION"}{featuredProduct.sizes[0] ? ` · ${featuredProduct.sizes[0]}` : ""}</div></div>
                </div>
              ) : (
                <div className="relative flex aspect-[.84] flex-col justify-end overflow-hidden rounded-[2rem] bg-[#292720] p-8 text-[#f5f0e6] shadow-[0_35px_80px_rgba(0,0,0,.3)] md:aspect-[.86] md:p-10">
                  <div className="eyebrow mb-4 text-[#d7bb83]">Live collection</div>
                  <h2 className="display max-w-md text-5xl">{productsLoading ? "Loading the edit." : productsError ? "The edit is unavailable." : "Your next signature starts here."}</h2>
                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">{productsLoading ? "Checking the current catalogue." : productsError ? "We could not reach the live catalogue." : "New fragrances will appear here as soon as they are added in the admin panel."}</p>
                  {productsError && <button type="button" onClick={() => void refetchProducts()} className="mt-6 w-fit text-xs font-bold uppercase tracking-[.13em] text-[#d7bb83] underline underline-offset-4">Retry catalogue</button>}
                  {!productsLoading && !productsError && <Link href="/collection" className="mt-6 w-fit text-xs font-bold uppercase tracking-[.13em] text-[#d7bb83] underline underline-offset-4">View collection</Link>}
                </div>
              )}
              
              
            </div>
          </div>
        </section>

        <section className="border-b border-black/10 bg-[#e9e5dc]">
          <div className="container grid divide-y divide-black/10 py-1 md:grid-cols-4 md:divide-x md:divide-y-0">
            {[{ icon: ShieldCheck, title: "Authenticity, always", copy: "Curated, verified bottles" }, { icon: PackageOpen, title: "Small & considered", copy: "Decants for every mood" }, { icon: Truck, title: "Made to arrive", copy: "Nationwide delivery" }, { icon: LockKeyhole, title: "Checkout, secured", copy: "Safe from start to finish" }].map(({ icon: Icon, title, copy }) => <div key={title} className="flex items-center gap-3 px-2 py-5 md:justify-center md:px-5"><Icon size={17} strokeWidth={1.5} className="text-[#8e6d3f]" /><div><div className="text-xs font-bold uppercase tracking-[.1em]">{title}</div><div className="mt-1 text-xs text-[#625d55]">{copy}</div></div></div>)}
          </div>
        </section>

        <section id="collection" className="container scroll-mt-24 py-24 md:py-32">
          <SectionHeading eyebrow="The first impression" title="The edit, at a glance." description="A tight selection of compositions that hold their own, from skin-close musks to unapologetic ambers." action="Explore collection" />
          <div className="mb-8 flex items-center gap-2 overflow-x-auto scroll-hide pb-1">
            {filters.map((filter) => <button key={filter} onClick={() => setActiveFilter(filter)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[.12em] transition-colors ${activeFilter === filter ? "border-[#151515] bg-[#151515] text-[#f5f0e6]" : "border-black/15 text-[#777269] hover:border-black/40"}`}>{filter}</button>)}
            <span className="ml-auto hide-mobile text-xs uppercase tracking-[.12em] text-[#69645b]">{filteredProducts.length} compositions</span>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-4 scroll-hide md:grid md:grid-cols-3 lg:grid-cols-4">{filteredProducts.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} onWish={toggleWishlist} wished={wishlistIds.includes(product.id)} />)}</div>
          {productsLoading && <div className="rounded-2xl border border-black/10 bg-[#ebe7de] py-12 text-center text-sm text-[#625d55]">Finding the edit…</div>}
          {productsError && <div role="alert" className="rounded-2xl border border-[#8f4c3c]/30 bg-[#f1e2db] p-6 text-center text-sm text-[#6f382e]">The fragrance edit could not load. Please try again. <button type="button" onClick={() => void refetchProducts()} className="ml-2 font-bold underline underline-offset-4">Try again</button></div>}
          {!productsLoading && !productsError && filteredProducts.length === 0 && <div className="rounded-2xl border border-dashed border-black/15 py-16 text-center text-sm text-[#625d55]">{products.length === 0 ? "No fragrances are listed right now." : "No compositions found. Try a different note or mood."}{search.trim() !== "" && <div><button type="button" onClick={() => setSearch("")} className="mt-4 text-xs font-bold uppercase tracking-[.12em] text-[#6e5839] underline underline-offset-4">Clear search</button></div>}</div>}
        </section>

        {activeDeals.length > 0 && <section aria-labelledby="current-deals-title" className="container pb-12 md:pb-16">
          <div className="mb-6"><div className="eyebrow mb-3">Admin-published / live offers</div><h2 id="current-deals-title" className="display text-[clamp(2.2rem,4vw,3.5rem)]">Current offers.</h2></div>
          <div className="grid gap-3 md:grid-cols-2">{activeDeals.map((deal) => <article key={deal.code} className="flex flex-col justify-between gap-5 rounded-[1.2rem] border border-[#a4824e]/25 bg-[#e9e1d2] p-6 md:flex-row md:items-center"><div><div className="text-xs font-bold uppercase tracking-[.13em] text-[#806b4b]">{deal.type === "flat" ? `৳${deal.value.toLocaleString("en-BD")} off` : `${deal.value}% off`}</div><div className="mt-2 serif text-2xl">Use <span className="font-bold tracking-[.08em]">{deal.code}</span> at checkout</div><div className="mt-2 text-xs text-[#625d55]">{deal.minSubtotal > 0 ? `Minimum order ৳${deal.minSubtotal.toLocaleString("en-BD")}` : "No minimum order"}{deal.expiresAt ? ` · Ends ${new Date(deal.expiresAt).toLocaleDateString("en-GB")}` : " · No expiry"}</div></div><Link href="/collection" className="secondary-button shrink-0">Shop collection <ArrowRight size={14} /></Link></article>)}</div>
        </section>}

        <Finder onAdd={addToCart} products={products} />

        <section id="story" className="container scroll-mt-24 pb-24 md:pb-32">
          <div className="grid overflow-hidden rounded-[1.8rem] bg-[#ded8cd] md:grid-cols-[1.1fr_.9fr]">
            <div className="image-sheen min-h-[420px] md:min-h-[570px]"><img src="https://plus.unsplash.com/premium_photo-1679106770086-f4355693be1b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Warm light across a fragrance bottle" className="h-full w-full object-cover mix-blend-multiply" /><div className="absolute bottom-7 left-7 rounded-full border border-black/15 bg-[#f3f0e9]/70 px-4 py-2 text-xs uppercase tracking-[.13em] backdrop-blur">From the atelier / 03</div></div>
            <div className="flex flex-col justify-between p-8 md:p-12"><div><div className="eyebrow mb-5">A little more than a bottle</div><h2 className="display max-w-md text-[clamp(2.8rem,5vw,4.8rem)]">Fragrance is the closest thing to time travel.</h2><p className="mt-7 max-w-sm text-sm leading-relaxed text-[#777269]">UKIZ-BD is a slower way to discover perfume. We look for balance, materiality and the little details that make a scent feel like it has always belonged to you.</p></div></div>
          </div>
        </section>

        {categories.length > 0 && <section id="categories" className="container scroll-mt-24 pb-24 md:pb-32">
          <SectionHeading eyebrow="Follow your nose" title="Shop by feeling." description="Choose a fragrance family from the live collection." />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{categories.map(({ name, product }, index) => { const count = products.filter((item) => (item.vibe?.trim() || item.family.split("/")[0]?.trim()) === name).length; return <a key={name} href="#collection" onClick={() => setActiveFilter(name)} className={`group relative overflow-hidden rounded-[1.2rem] ${index === 1 || index === 2 ? "md:translate-y-8" : ""}`} style={{ backgroundColor: product.tone }}><div className="aspect-[.9] overflow-hidden"><img src={imageUrl(product.image, 700)} alt={`${product.brand} ${product.name}`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" /></div><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" /><div className="absolute inset-x-4 bottom-4 text-[#f5f0e6]"><div className="serif text-2xl md:text-3xl">{name}</div><div className="mt-1 text-xs font-semibold uppercase tracking-[.12em] text-white/85">{count} {count === 1 ? "composition" : "compositions"} ↗</div></div></a>; })}</div>
        </section>}

        <section className="container py-24 md:py-32"><SectionHeading eyebrow="From the collection" title="More to explore." action="Browse all scents" /><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{products.slice(1, 4).map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} onWish={toggleWishlist} wished={wishlistIds.includes(product.id)} />)}</div></section>

        <section className="container pb-24 md:pb-32"><div className="mb-8"><div className="eyebrow mb-3">A more considered way to explore</div><h2 className="display text-[clamp(2.7rem,5vw,4.5rem)]">The good part is finding your own.</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-[#625d55]">Start small, learn what you love, and choose your next scent with confidence.</p></div><div className="grid gap-3 md:grid-cols-3">{[{ title: "Try before you commit.", copy: "Explore a fragrance in a size that fits your day before choosing a larger bottle." }, { title: "A considered edit.", copy: "Browse by scent family, notes, mood, or the way you want a fragrance to feel." }, { title: "Made to arrive.", copy: "Choose nationwide delivery from Dhaka, with clear order and exchange information." }].map((item, index) => <article key={item.title} className="rounded-[1.2rem] border border-black/10 bg-[#ebe7de] p-6 md:p-7"><div className="eyebrow mb-5">0{index + 1} / UKIZ-BD</div><h3 className="serif text-2xl leading-tight">{item.title}</h3><p className="mt-4 text-sm leading-relaxed text-[#625d55]">{item.copy}</p></article>)}</div></section>
        <section className="container pb-24 md:pb-32"><div className="relative overflow-hidden rounded-[1.8rem] bg-[#c7b08a] px-6 py-14 md:px-14 md:py-20"><div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[28px] border-white/10" /><div className="relative grid gap-10 md:grid-cols-[1fr_.8fr] md:items-end"><div><div className="eyebrow mb-5 text-[#51442f]">The next good thing</div><h2 className="display max-w-lg text-[clamp(2.8rem,5vw,4.8rem)] text-[#252017]">A little more conversation. A lot more scent.</h2></div><div><p className="mb-6 max-w-sm text-sm leading-relaxed text-[#443a2b]">Need a recommendation or want to ask about an upcoming drop? We would love to help you find your next favourite.</p><Link href="/contact" className="primary-button dark">Talk to the team <ArrowRight size={14} /></Link></div></div></div></section>
      </main>

      <footer className="bg-[#151515] py-14 text-[#f5f0e6] md:py-20"><div className="container"><div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:gap-8"><div><Logo light /><p className="mt-6 max-w-xs text-sm leading-relaxed text-white/45">Modern fragrance for people who know that presence is felt before it is seen.</p><div className="mt-7 flex items-center gap-2"><SocialLinks />{supportEmail && <a href={`mailto:${supportEmail}`} className="icon-button h-9 w-9 border-white/15 text-white/60 hover:border-white hover:text-white" aria-label="Email"><Mail size={15} /></a>}</div></div><div><div className="mono mb-5 text-white/35">Explore</div><div className="grid gap-3 text-sm text-white/75"><a href="#collection" className="hover:text-white">Shop all</a><a href="#categories" className="hover:text-white">Collections</a><a href="#finder" className="hover:text-white">Scent index</a></div></div><div><div className="mono mb-5 text-white/35">For you</div><div className="grid gap-3 text-sm text-white/75"><Link href="/account" className="hover:text-white">Your account</Link><Link href="/wishlist" className="hover:text-white">Your wishlist</Link><Link href="/refund-policy" className="hover:text-white">Refund &amp; exchange</Link><Link href="/finder" className="hover:text-white">Scent index</Link><Link href="/contact" className="hover:text-white">Contact us</Link></div></div><div><div className="mono mb-5 text-white/35">Keep in touch</div><p className="text-sm leading-relaxed text-white/45">Questions, recommendations or just want to talk perfume?</p>{supportEmail && <a href={`mailto:${supportEmail}`} className="mt-4 inline-flex items-center gap-2 text-sm text-[#c7a970]">{supportEmail} <ArrowUpRight size={14} /></a>}</div></div><div className="mt-16 flex flex-col justify-between gap-4 border-t border-white/10 pt-5 text-xs uppercase tracking-[.14em] text-white/30 md:flex-row"><span>© {new Date().getFullYear()} UKIZ-BD. Made with intention.</span><span>Dhaka · Bangladesh / Secure payments · Nationwide delivery</span></div></div></footer>

      {cartOpen && <><button className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]" onClick={() => setCartOpen(false)} aria-label="Close cart overlay" /><aside role="dialog" aria-modal="true" aria-labelledby="home-cart-title" tabIndex={-1} className="fixed right-0 top-0 z-[60] flex h-full w-full max-w-md flex-col bg-[#f3f0e9] p-6 shadow-2xl reveal md:p-8"><div className="flex items-center justify-between border-b border-black/10 pb-5"><div><div className="eyebrow mb-1">Your edit</div><h2 id="home-cart-title" className="serif text-3xl">The bag <span className="text-[#69645b]">({cartCount})</span></h2></div><button type="button" className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close cart"><X size={17} /></button></div><div className="scroll-hide flex-1 overflow-y-auto py-5">{cart.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-center"><div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-[#e6e0d5] text-[#9e8967]"><ShoppingBag size={23} /></div><h3 className="serif text-2xl">Your bag is quiet.</h3><p className="mt-2 max-w-xs text-sm text-[#777269]">Add a composition and make it yours.</p><a href="#collection" onClick={() => setCartOpen(false)} className="primary-button dark mt-7">Explore the edit <ArrowRight size={14} /></a></div> : <div className="grid gap-5">{cart.map((item) => <div key={cartLineKey(item)} className="flex gap-4"><img src={item.image} alt={item.name} className="h-24 w-20 rounded-xl object-cover mix-blend-multiply" /><div className="min-w-0 flex-1"><div className="text-xs uppercase tracking-[.12em] text-[#907f66]">{item.brand}</div><div className="serif mt-1 text-xl">{item.name}</div><div className="mt-2 flex flex-wrap gap-1.5">{item.sizes.map((s) => { const st = stockForSize(item, s); const out = st === 0; const active = s === item.size; return <button key={s} disabled={out} onClick={() => { if (!updateSize(cartLineKey(item), s)) toast.error("That size is out of stock."); }} className={`rounded-full border px-2.5 py-1 text-xs uppercase tracking-[.08em] ${active ? "border-[#151515] bg-[#151515] text-[#f5f0e6]" : out ? "border-black/10 text-black/25 line-through" : "border-black/15 text-[#777269]"}`}>{s} · {money(priceForSize(item, s))}</button>; })}</div><div className="mt-1 text-xs text-[#777269]">{(() => { const st = stockForSize(item, item.size); if (st === 0) return "Out of stock"; if (st !== undefined && st <= 5) return `Only ${st} left`; return "In stock"; })()} · {money(item.price)}{item.premium ? ` · +${item.premiumName}` : ""}</div>{hasPremium(item) && (premiumAvailable(item) || item.premium ? <button onClick={() => { if (!togglePremium(cartLineKey(item))) toast.error("The premium bottle is out of stock."); }} className={`mt-2 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${item.premium ? "border-[#a4824e] bg-[#a4824e]/10" : "border-black/10 bg-white/50"}`}><span className="text-xs font-bold uppercase tracking-[.1em]">{item.premium ? "✓ " : "+ "}{item.premiumName}</span><span className="text-xs text-[#777269]">+{money(item.premiumPrice ?? 0)}</span></button> : <div className="mt-2 rounded-lg border border-black/10 px-3 py-2 text-xs uppercase tracking-[.1em] text-black/30">{item.premiumName} · Sold out</div>)}<div className="mt-3 flex items-center gap-2"><button onClick={() => updateQuantity(item, -1)} className="grid h-10 w-10 place-items-center rounded-full border border-black/15"><Minus size={13} /></button><span className="w-4 text-center text-xs">{item.quantity}</span><button onClick={() => updateQuantity(item, 1)} className="grid h-10 w-10 place-items-center rounded-full border border-black/15"><Plus size={13} /></button><button onClick={() => removeFromCart(item)} className="ml-2 text-xs uppercase tracking-[.1em] text-[#9b6d5d]">Remove</button></div></div><div className="text-right text-sm font-semibold">{money(item.price * item.quantity)}</div></div>)}</div>}</div>{cart.length > 0 && <div className="border-t border-black/10 pt-5"><div className="flex justify-between text-sm"><span className="text-[#777269]">Subtotal</span><span className="font-bold">{money(cartTotal)}</span></div><div className="mt-2 flex justify-between text-xs uppercase tracking-[.1em] text-[#999186]"><span>Delivery</span><span>{cartTotal >= freeThreshold ? "Complimentary" : "Calculated at checkout"}</span></div><button onClick={() => requireAuth(() => setLocation("/checkout"), "/checkout")} className="primary-button dark mt-6 w-full">Continue to checkout <ArrowRight size={14} /></button><div className="mt-3 flex items-center justify-center gap-2 text-xs uppercase tracking-[.12em] text-[#999186]"><Check size={12} className="text-[#a4824e]" /> Secure, simple, considered</div></div>}</aside></>}
    </div>
  );
}

function ArrowDown() { return <span className="text-[14px]">↓</span>; }
