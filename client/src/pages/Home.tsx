import { useEffect, useMemo, useRef, useState } from "react";
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
  Star,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import BrandLogo from "@/components/BrandLogo";
import SocialLinks from "@/components/SocialLinks";
import { usePublicSettings } from "@/lib/settings";
import { fallbackProducts, fromPrice, hasPremium, premiumAvailable, priceForSize, stockForSize, useProducts, type StoreProduct } from "@/lib/products";
import { useCustomer } from "@/lib/customer";
import { useCart } from "@/lib/cart";
import { imageSrcSet, imageUrl } from "@/lib/images";

export type Product = StoreProduct;

export type { CartItem } from "@/lib/cart";

export const products: Product[] = fallbackProducts;

const categories = [
  { name: "Woody", count: "24 scents", image: "https://images.unsplash.com/photo-1557170334-a9632e77c6e4?auto=format&fit=crop&w=700&q=80" },
  { name: "Floral", count: "18 scents", image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=700&q=80" },
  { name: "Fresh", count: "31 scents", image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=700&q=80" },
  { name: "Amber", count: "16 scents", image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=700&q=80" },
];

export const money = (value: number) => `৳${value.toLocaleString("en-BD")}`;

function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const top = target.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior: "smooth" });
}

function Logo({ light = false }: { light?: boolean }) {
  return <BrandLogo light={light} />;
}

function ProductCard({ product, onAdd, onWish, wished }: { product: Product; onAdd: (product: Product) => void; onWish: (id: string) => void; wished: boolean }) {
  return (
    <article className="product-card group min-w-[255px] flex-1">
      <div className="image-sheen relative aspect-[.86] overflow-hidden rounded-[1.2rem] bg-[#ded9cd]" style={{ backgroundColor: product.tone }}>
        <img src={imageUrl(product.image, 900)} srcSet={imageSrcSet(product.image)} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw" alt={`${product.brand} ${product.name}`} className="product-image h-full w-full object-cover mix-blend-multiply" loading="lazy" decoding="async" />
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
          {product.badge && <span className="rounded-full bg-[#f3f0e9]/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[.12em] backdrop-blur">{product.badge}</span>}
        </div>
        <button onClick={() => onWish(product.id)} className={`icon-button absolute right-3 top-3 z-10 h-9 w-9 border-white/50 bg-white/50 backdrop-blur ${wished ? "text-[#a57b3d]" : "text-[#151515]"}`} aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}>
          <Heart size={15} fill={wished ? "currentColor" : "none"} />
        </button>
        <div className="absolute inset-x-3 bottom-3 z-10 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button onClick={() => onAdd(product)} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#151515]/90 py-3 text-xs font-bold uppercase tracking-[.13em] text-[#f5f0e6] backdrop-blur hover:bg-[#151515]">
            Add to bag <Plus size={13} />
          </button>
        </div>
      </div>
      <div className="px-1 pt-4">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-[.12em] text-[#907f66]">{product.brand}</span>
          <span className="text-xs text-[#8d877c]">From {money(fromPrice(product))}</span>
        </div>
        <h3 className="serif text-[22px] leading-none">{product.name}</h3>
        <p className="mt-2 text-xs leading-relaxed text-[#777269]">{product.family} · {product.notes}</p>
        <div className="mt-3 flex gap-1.5">
          {product.sizes.map((size) => <span key={size} className="rounded-full border border-black/10 px-2 py-1 text-xs uppercase tracking-[.08em] text-[#777269]">{size}</span>)}
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
      {action && <Link href="/shop" className="hide-mobile group flex items-center gap-2 pb-1 text-xs font-bold uppercase tracking-[.15em]">{action}<MoveRight size={15} className="transition-transform group-hover:translate-x-1" /></Link>}
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
  const recommendation = answers[0] === "Fresh" ? products[5] ?? products[0] : answers[0] === "Soft" ? products[1] ?? products[0] : answers[0] === "Grounded" ? products[0] : products[4] ?? products[0];

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
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">A three-step edit for the way you move through a day, a room, or a memory.</p>
            <div className="mt-10 flex items-center gap-2">
              {[0, 1, 2].map((item) => <span key={item} className={`h-1 rounded-full transition-all ${item < step ? "w-12 bg-[#c7a970]" : "w-7 bg-white/20"}`} />)}
            </div>
          </div>
          <div className="min-h-[270px] rounded-[1.3rem] border border-white/12 bg-white/[.045] p-6 backdrop-blur md:p-8">
            {!complete ? (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[.15em] text-white/40"><span>{current.label}</span><span>0{step + 1} / 03</span></div>
                  <h3 className="serif max-w-lg text-3xl leading-tight md:text-4xl">{current.question}</h3>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {current.options.map((option) => <button key={option} onClick={() => choose(option)} className="group flex min-h-16 items-end justify-between rounded-xl border border-white/12 p-3 text-left text-xs text-white/75 transition-colors hover:border-[#c7a970] hover:bg-[#c7a970]/10"><span>{option}</span><ArrowUpRight size={14} className="text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button>)}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[.15em] text-[#c7a970]"><Sparkles size={14} /> Your match is in</div>
                <div className="mt-8 flex items-center gap-5">
                  <img src={recommendation.image} alt="Recommended fragrance" className="h-24 w-20 rounded-xl object-cover mix-blend-screen" />
                  <div><div className="text-xs uppercase tracking-[.14em] text-white/40">{recommendation.brand}</div><div className="serif mt-1 text-3xl">{recommendation.name}</div><div className="mt-2 text-xs text-white/45">{recommendation.notes}</div></div>
                </div>
                <div className="mt-8 flex flex-wrap gap-2"><button onClick={() => onAdd(recommendation)} className="primary-button">Try {recommendation.name} <ArrowRight size={14} /></button><button onClick={() => { setStep(0); setAnswers([]); }} className="text-button px-3 text-xs font-bold uppercase tracking-[.13em] text-white/55 hover:text-white">Start over</button></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const { items: cart, count: cartCount, total: cartTotal, addItem, updateQuantity: changeCartQty, removeItem: removeCartItem, updateSize, togglePremium } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [email, setEmail] = useState("");
  const { products: liveProducts } = useProducts();
  const products = liveProducts;
  const { requireAuth, isAuthenticated } = useCustomer();
  const { announcement, supportEmail } = usePublicSettings();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (location === "/shop") scrollToSection("collection");
    if (location === "/finder") scrollToSection("finder");
  }, [location]);

  const prevSearchRef = useRef("");
  useEffect(() => {
    if (search.trim() && !prevSearchRef.current.trim()) {
      setSearchOpen(false);
      requestAnimationFrame(() => scrollToSection("collection"));
    }
    prevSearchRef.current = search;
  }, [search]);

  const filters = ["All", "Woody", "Fresh", "Floral", "Amber"];
  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesFilter = activeFilter === "All" || product.family.toLowerCase().includes(activeFilter.toLowerCase());
    const query = search.toLowerCase();
    const matchesSearch = !query || `${product.name} ${product.brand} ${product.notes}`.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  }), [activeFilter, search, products]);

  const addToCart = (product: Product) => {
    if (!requireAuth()) return;
    addItem(product);
    setCartOpen(true);
    toast.success(`${product.name} added to your bag`, { description: "Your edit is waiting in the cart." });
  };
  const updateQuantity = (id: string, size: string, amount: number) => changeCartQty(id, size, amount);
  const removeFromCart = (id: string, size: string) => removeCartItem(id, size);
  const toggleWishlist = (id: string) => {
    if (!requireAuth()) return;
    setWishlist((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
  };
  const submitEmail = () => {
    if (!email.includes("@")) { toast.error("Please enter a valid email address."); return; }
    toast.success("Welcome to the inner circle.", { description: "A little beauty is on its way to your inbox." });
    setEmail("");
  };

  return (
    <div id="top" className="min-h-screen overflow-x-hidden bg-[#f3f0e9]">
      <div className="overflow-hidden bg-[#151515] text-[#f5f0e6]">
        <div className="flex min-w-max animate-[marquee_22s_linear_infinite] items-center py-2.5 text-xs uppercase tracking-[.2em] text-white/65">
          <div className="flex items-center gap-10 pr-10"><span>{announcement}</span></div>
          <div className="flex items-center gap-10 pr-10"><span>{announcement}</span></div>
        </div>
      </div>

      <header className={`fixed inset-x-0 z-40 transition-all duration-300 ${scrolled ? "glass-nav top-0" : "top-[29px] border-b border-transparent bg-transparent"}`}>
        <div className="container flex h-[72px] items-center justify-between gap-6">
          <Logo />
          <nav className="hide-mobile flex items-center gap-7 text-xs font-bold uppercase tracking-[.13em] text-[#5c584f]">
            <Link className="nav-link" href="/shop">Shop</Link>
            <Link className="nav-link" href="/shop">Collections</Link>
            <Link className="nav-link" href="/finder">Scent index</Link>
            <Link className="nav-link" href="/about">About</Link>
            <Link className="nav-link" href="/contact">Contact</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button className="icon-button h-9 w-9" onClick={() => setSearchOpen((value) => !value)} aria-label="Search"><Search size={16} /></button>
            <button className="icon-button h-9 w-9" onClick={() => setLocation(isAuthenticated ? "/account" : "/signin")} aria-label="Account"><CircleUserRound size={16} /></button>
            <button className="icon-button relative h-9 w-9" onClick={() => setCartOpen(true)} aria-label="Open cart"><ShoppingBag size={16} />{cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#b89558] px-1 text-xs font-bold text-[#151515]">{cartCount}</span>}</button>
            <button className="icon-button h-9 w-9 mobile-only" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle menu">{menuOpen ? <X size={16} /> : <Menu size={16} />}</button>
          </div>
        </div>
        {searchOpen && <div className="container pb-4"><div className="flex items-center gap-3 border-b border-black/20 pb-3"><Search size={17} className="text-[#938873]" /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, note or mood" className="w-full bg-transparent text-sm outline-none placeholder:text-[#989287]" />{search.trim() !== "" && <span className="whitespace-nowrap text-xs uppercase tracking-[.1em] text-[#938873]">{filteredProducts.length} found</span>}<button onClick={() => { setSearch(""); setSearchOpen(false); }}><X size={16} /></button></div></div>}
        {menuOpen && <div className="border-t border-black/10 bg-[#f3f0e9] px-5 pb-6 pt-4 mobile-only"><div className="grid gap-4 text-sm font-semibold"><a href="#collection" onClick={() => setMenuOpen(false)}>Shop all</a><a href="#categories" onClick={() => setMenuOpen(false)}>Collections</a><a href="#finder" onClick={() => setMenuOpen(false)}>Scent index</a><a href="#story" onClick={() => setMenuOpen(false)}>Our story</a></div></div>}
      </header>

      <main>
        <section className="hero-grid hero-glow relative min-h-[730px] overflow-hidden bg-[#1a1a18] pt-32 text-[#f5f0e6] md:min-h-[800px] md:pt-40">
          <div className="container relative z-10 grid min-h-[650px] items-center gap-10 pb-16 md:grid-cols-[.95fr_1.05fr] md:pb-24">
            <div className="reveal max-w-xl">
              <div className="eyebrow mb-6 text-[#c7a970]">Chapter 01 / The considered edit</div>
              <h1 className="display text-[clamp(4.3rem,9vw,8.7rem)]">Scent is<br /><em className="text-[#c7a970]">a signature.</em></h1>
              <p className="mt-8 max-w-sm text-sm leading-relaxed text-white/55 md:text-base">A considered collection of modern fragrance, selected for the way you move — not the way you’re told to.</p>
              <div className="mt-9 flex flex-wrap items-center gap-3"><a href="#collection" className="primary-button">Shop the edit <ArrowRight size={15} /></a><a href="#finder" className="secondary-button border-white/20 text-white hover:border-white">Find your scent <Sparkles size={14} /></a></div>
              <div className="mt-12 flex items-center gap-4 text-xs uppercase tracking-[.12em] text-white/40"><span className="grid h-8 w-8 place-items-center rounded-full border border-white/20"><ArrowDown /></span><span>Scroll to explore</span></div>
            </div>
            <div className="reveal reveal-delay-2 relative mx-auto w-full max-w-[570px]">
              <div className="relative aspect-[.84] overflow-hidden rounded-[2rem] bg-[#6a5948] shadow-[0_35px_80px_rgba(0,0,0,.3)] md:aspect-[.86]"><img src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=1200&q=90" alt="Amber fragrance bottle in warm light" className="h-full w-full object-cover mix-blend-screen opacity-85" /><div className="absolute inset-0 bg-gradient-to-t from-[#161513]/80 via-transparent to-[#f7ddac]/10" /><div className="absolute bottom-6 left-6 right-6 flex items-end justify-between"><div><div className="eyebrow text-[#d7bb83]">Featured composition</div><div className="serif mt-2 text-3xl">Santal 04</div></div><div className="rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs uppercase tracking-[.12em] backdrop-blur">EDP · 50ML</div></div></div>
              
              
            </div>
          </div>
        </section>

        <section className="border-b border-black/10 bg-[#e9e5dc]">
          <div className="container grid divide-y divide-black/10 py-1 md:grid-cols-4 md:divide-x md:divide-y-0">
            {[{ icon: ShieldCheck, title: "Authenticity, always", copy: "Curated, verified bottles" }, { icon: PackageOpen, title: "Small & considered", copy: "Decants for every mood" }, { icon: Truck, title: "Made to arrive", copy: "Nationwide delivery" }, { icon: LockKeyhole, title: "Checkout, secured", copy: "Safe from start to finish" }].map(({ icon: Icon, title, copy }) => <div key={title} className="flex items-center gap-3 px-2 py-5 md:justify-center md:px-5"><Icon size={17} strokeWidth={1.5} className="text-[#a4824e]" /><div><div className="text-xs font-bold uppercase tracking-[.1em]">{title}</div><div className="mt-1 text-xs text-[#8a8479]">{copy}</div></div></div>)}
          </div>
        </section>

        <section id="collection" className="container scroll-mt-24 py-24 md:py-32">
          <SectionHeading eyebrow="The first impression" title="The edit, at a glance." description="A tight selection of compositions that hold their own, from skin-close musks to unapologetic ambers." action="Shop all" />
          <div className="mb-8 flex items-center gap-2 overflow-x-auto scroll-hide pb-1">
            {filters.map((filter) => <button key={filter} onClick={() => setActiveFilter(filter)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[.12em] transition-colors ${activeFilter === filter ? "border-[#151515] bg-[#151515] text-[#f5f0e6]" : "border-black/15 text-[#777269] hover:border-black/40"}`}>{filter}</button>)}
            <span className="ml-auto hide-mobile text-xs uppercase tracking-[.12em] text-[#aaa399]">{filteredProducts.length} compositions</span>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-4 scroll-hide md:grid md:grid-cols-3 lg:grid-cols-4">{filteredProducts.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} onWish={toggleWishlist} wished={wishlist.includes(product.id)} />)}</div>
          {filteredProducts.length === 0 && <div className="rounded-2xl border border-dashed border-black/15 py-16 text-center text-sm text-[#777269]">No compositions found. Try a different note or mood.{search.trim() !== "" && <div><button onClick={() => setSearch("")} className="mt-4 text-xs font-bold uppercase tracking-[.12em] text-[#8e7650] underline underline-offset-4">Clear search</button></div>}</div>}
        </section>

        <Finder onAdd={addToCart} products={products} />

        <section id="story" className="container scroll-mt-24 pb-24 md:pb-32">
          <div className="grid overflow-hidden rounded-[1.8rem] bg-[#ded8cd] md:grid-cols-[1.1fr_.9fr]">
            <div className="image-sheen min-h-[420px] md:min-h-[570px]"><img src="https://plus.unsplash.com/premium_photo-1679106770086-f4355693be1b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Warm light across a fragrance bottle" className="h-full w-full object-cover mix-blend-multiply" /><div className="absolute bottom-7 left-7 rounded-full border border-black/15 bg-[#f3f0e9]/70 px-4 py-2 text-xs uppercase tracking-[.13em] backdrop-blur">From the atelier / 03</div></div>
            <div className="flex flex-col justify-between p-8 md:p-12"><div><div className="eyebrow mb-5">A little more than a bottle</div><h2 className="display max-w-md text-[clamp(2.8rem,5vw,4.8rem)]">Fragrance is the closest thing to time travel.</h2><p className="mt-7 max-w-sm text-sm leading-relaxed text-[#777269]">UKIZ-BD is a slower way to discover perfume. We look for balance, materiality and the little details that make a scent feel like it has always belonged to you.</p></div></div>
          </div>
        </section>

        <section id="categories" className="container scroll-mt-24 pb-24 md:pb-32">
          <SectionHeading eyebrow="Follow your nose" title="Shop by feeling." description="Start with the atmosphere you want to create, then let the notes do the rest." />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{categories.map((category, index) => <a key={category.name} href="#collection" onClick={() => setActiveFilter(category.name)} className={`group relative overflow-hidden rounded-[1.2rem] bg-[#d0c7b8] ${index === 1 || index === 2 ? "md:translate-y-8" : ""}`}><div className="aspect-[.9] overflow-hidden"><img src={category.image} alt={category.name} className="h-full w-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105" /></div><div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" /><div className="absolute inset-x-4 bottom-4 text-[#f5f0e6]"><div className="serif text-2xl md:text-3xl">{category.name}</div><div className="mt-1 text-xs uppercase tracking-[.12em] text-white/60">{category.count} ↗</div></div></a>)}</div>
        </section>

        <section className="container py-24 md:py-32"><SectionHeading eyebrow="The popular ones" title="Good taste travels." action="View bestsellers" /><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{products.slice(1, 4).map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} onWish={toggleWishlist} wished={wishlist.includes(product.id)} />)}</div></section>

        <section className="container pb-24 md:pb-32"><div className="mb-8 flex items-end justify-between"><div><div className="eyebrow mb-3">Notes from the community</div><h2 className="display text-[clamp(2.7rem,5vw,4.5rem)]">In good company.</h2></div><div className="hide-mobile flex items-center gap-2 text-xs text-[#777269]"><span className="flex gap-0.5 text-[#b89558]"><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /></span> 4.9 / 5 from 240+ notes</div></div><div className="grid gap-3 md:grid-cols-3">{[{ quote: "Santal 04 is the first bottle I've finished in years. It smells like a version of me that gets enough sleep.", name: "Nusrat A.", city: "Dhaka", product: "Santal 04" }, { quote: "The decant sizes are genius. I can actually live with a scent before I commit to the full story.", name: "Rafid M.", city: "Chattogram", product: "Musc 11" }, { quote: "Beautifully packed, impossibly quick delivery, and the perfume is even better than the moodboard.", name: "Ayesha K.", city: "Sylhet", product: "Bois Rosé" }].map((review) => <div key={review.name} className="flex min-h-64 flex-col justify-between rounded-[1.2rem] border border-black/10 bg-[#ebe7de] p-6"><div><div className="mb-6 flex gap-0.5 text-[#b89558]"><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /></div><p className="serif text-[21px] leading-snug">“{review.quote}”</p></div><div className="mt-8 flex items-end justify-between"><div><div className="text-xs font-bold">{review.name}</div><div className="mt-1 text-xs text-[#8b847a]">{review.city} · Verified purchase</div></div><span className="text-xs uppercase tracking-[.12em] text-[#9a907e]">{review.product}</span></div></div>)}</div></section>

        <section className="container pb-24 md:pb-32"><div className="relative overflow-hidden rounded-[1.8rem] bg-[#c7b08a] px-6 py-14 md:px-14 md:py-20"><div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[28px] border-white/10" /><div className="relative grid gap-10 md:grid-cols-[1fr_1fr] md:items-end"><div><div className="eyebrow mb-5 text-[#65533a]">The inner circle</div><h2 className="display max-w-lg text-[clamp(2.8rem,5vw,4.8rem)] text-[#252017]">A little beauty, in your inbox.</h2></div><div><p className="mb-5 max-w-sm text-sm leading-relaxed text-[#574b37]">New drops, quiet discoveries and a few things worth knowing about scent.</p><div className="flex max-w-md items-center border-b border-[#5d4e36]/35 pb-3"><Mail size={16} className="mr-3 text-[#5d4e36]" /><input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" type="email" className="w-full bg-transparent text-sm outline-none placeholder:text-[#796b52]" /><button onClick={submitEmail} className="text-xs font-bold uppercase tracking-[.13em] text-[#252017]">Join ↗</button></div><div className="mt-3 text-xs uppercase tracking-[.12em] text-[#78684c]">No noise. Just the good stuff.</div></div></div></div></section>
      </main>

      <footer className="bg-[#151515] py-14 text-[#f5f0e6] md:py-20"><div className="container"><div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:gap-8"><div><Logo light /><p className="mt-6 max-w-xs text-sm leading-relaxed text-white/45">Modern fragrance for people who know that presence is felt before it is seen.</p><div className="mt-7 flex items-center gap-2"><SocialLinks /><a href={`mailto:${supportEmail}`} className="icon-button h-9 w-9 border-white/15 text-white/60 hover:border-white hover:text-white" aria-label="Email"><Mail size={15} /></a></div></div><div><div className="mono mb-5 text-white/35">Explore</div><div className="grid gap-3 text-sm text-white/65"><a href="#collection" className="hover:text-white">Shop all</a><a href="#categories" className="hover:text-white">Collections</a><a href="#finder" className="hover:text-white">Scent index</a></div></div><div><div className="mono mb-5 text-white/35">For you</div><div className="grid gap-3 text-sm text-white/65"><a href="#top" className="hover:text-white">Your account</a><Link href="/refund-policy" className="hover:text-white">Refund & exchange</Link><a href="#top" className="hover:text-white">Scent notes</a><a href="#top" className="hover:text-white">Contact us</a></div></div><div><div className="mono mb-5 text-white/35">Keep in touch</div><p className="text-sm leading-relaxed text-white/45">Questions, recommendations or just want to talk perfume?</p><a href={`mailto:${supportEmail}`} className="mt-4 inline-flex items-center gap-2 text-sm text-[#c7a970]">{supportEmail} <ArrowUpRight size={14} /></a></div></div><div className="mt-16 flex flex-col justify-between gap-4 border-t border-white/10 pt-5 text-xs uppercase tracking-[.14em] text-white/30 md:flex-row"><span>© 2026 UKIZ-BD. Made with intention.</span><span>Dhaka · Bangladesh / Secure payments · Nationwide delivery</span></div></div></footer>

      {cartOpen && <><button className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]" onClick={() => setCartOpen(false)} aria-label="Close cart overlay" /><aside className="fixed right-0 top-0 z-[60] flex h-full w-full max-w-md flex-col bg-[#f3f0e9] p-6 shadow-2xl reveal md:p-8"><div className="flex items-center justify-between border-b border-black/10 pb-5"><div><div className="eyebrow mb-1">Your edit</div><h2 className="serif text-3xl">The bag <span className="text-[#988b75]">({cartCount})</span></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close cart"><X size={17} /></button></div><div className="scroll-hide flex-1 overflow-y-auto py-5">{cart.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-center"><div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-[#e6e0d5] text-[#9e8967]"><ShoppingBag size={23} /></div><h3 className="serif text-2xl">Your bag is quiet.</h3><p className="mt-2 max-w-xs text-sm text-[#777269]">Add a composition and make it yours.</p><a href="#collection" onClick={() => setCartOpen(false)} className="primary-button dark mt-7">Explore the edit <ArrowRight size={14} /></a></div> : <div className="grid gap-5">{cart.map((item) => <div key={`${item.id}-${item.size}`} className="flex gap-4"><img src={item.image} alt={item.name} className="h-24 w-20 rounded-xl object-cover mix-blend-multiply" /><div className="min-w-0 flex-1"><div className="text-xs uppercase tracking-[.12em] text-[#907f66]">{item.brand}</div><div className="serif mt-1 text-xl">{item.name}</div><div className="mt-2 flex flex-wrap gap-1.5">{item.sizes.map((s) => { const st = stockForSize(item, s); const out = st === 0; const active = s === item.size; return <button key={s} disabled={out} onClick={() => { if (!updateSize(item.id, item.size, s)) toast.error("That size is out of stock."); }} className={`rounded-full border px-2.5 py-1 text-xs uppercase tracking-[.08em] ${active ? "border-[#151515] bg-[#151515] text-[#f5f0e6]" : out ? "border-black/10 text-black/25 line-through" : "border-black/15 text-[#777269]"}`}>{s} · {money(priceForSize(item, s))}</button>; })}</div><div className="mt-1 text-xs text-[#777269]">{(() => { const st = stockForSize(item, item.size); if (st === 0) return "Out of stock"; if (st !== undefined && st <= 5) return `Only ${st} left`; return "In stock"; })()} · {money(item.price)}{item.premium ? ` · +${item.premiumName}` : ""}</div>{hasPremium(item) && (premiumAvailable(item) || item.premium ? <button onClick={() => { if (!togglePremium(item.id, item.size)) toast.error("The premium bottle is out of stock."); }} className={`mt-2 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${item.premium ? "border-[#a4824e] bg-[#a4824e]/10" : "border-black/10 bg-white/50"}`}><span className="text-xs font-bold uppercase tracking-[.1em]">{item.premium ? "✓ " : "+ "}{item.premiumName}</span><span className="text-xs text-[#777269]">+{money(item.premiumPrice ?? 0)}</span></button> : <div className="mt-2 rounded-lg border border-black/10 px-3 py-2 text-xs uppercase tracking-[.1em] text-black/30">{item.premiumName} · Sold out</div>)}<div className="mt-3 flex items-center gap-2"><button onClick={() => updateQuantity(item.id, item.size, -1)} className="grid h-6 w-6 place-items-center rounded-full border border-black/15"><Minus size={11} /></button><span className="w-4 text-center text-xs">{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.size, 1)} className="grid h-6 w-6 place-items-center rounded-full border border-black/15"><Plus size={11} /></button><button onClick={() => removeFromCart(item.id, item.size)} className="ml-2 text-xs uppercase tracking-[.1em] text-[#9b6d5d]">Remove</button></div></div><div className="text-right text-sm font-semibold">{money(item.price * item.quantity)}</div></div>)}</div>}</div>{cart.length > 0 && <div className="border-t border-black/10 pt-5"><div className="flex justify-between text-sm"><span className="text-[#777269]">Subtotal</span><span className="font-bold">{money(cartTotal)}</span></div><div className="mt-2 flex justify-between text-xs uppercase tracking-[.1em] text-[#999186]"><span>Delivery</span><span>{cartTotal >= 3000 ? "Complimentary" : "Calculated at checkout"}</span></div><button onClick={() => requireAuth(() => setLocation("/checkout"), "/checkout")} className="primary-button dark mt-6 w-full">Continue to checkout <ArrowRight size={14} /></button><div className="mt-3 flex items-center justify-center gap-2 text-xs uppercase tracking-[.12em] text-[#999186]"><Check size={12} className="text-[#a4824e]" /> Secure, simple, considered</div></div>}</aside></>}
    </div>
  );
}

function ArrowDown() { return <span className="text-[14px]">↓</span>; }
