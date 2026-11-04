import { useState, type FormEvent, type ReactNode } from "react";
import { CircleUserRound, Heart, Mail, Menu, Search, ShoppingBag, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import BrandLogo from "./BrandLogo";
import SocialLinks from "./SocialLinks";
import { usePublicSettings } from "@/lib/settings";
import { useCart } from "@/lib/cart";

export default function StorefrontLayout({ children, title, eyebrow }: { children: ReactNode; title: string; eyebrow?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { announcement, supportEmail } = usePublicSettings();
  const { count } = useCart();

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = search.trim();
    setSearchOpen(false);
    setLocation(term ? `/shop?search=${encodeURIComponent(term)}` : "/shop");
  };

  return (
    <div className="min-h-screen bg-[#f3f0e9] text-[#151515]">
      <div className="overflow-hidden bg-[#151515] text-[#f5f0e6]" role="region" aria-label="Store announcement">
        <div className="flex min-w-max motion-safe:animate-[marquee_22s_linear_infinite] items-center gap-10 whitespace-nowrap py-2.5 text-[10px] font-semibold uppercase tracking-[.16em] text-white/75" role="marquee">
          <span>{announcement}</span>
          <span aria-hidden="true">{announcement}</span>
        </div>
      </div>

      <header className="glass-nav sticky top-0 z-40">
        <div className="container flex h-[72px] items-center justify-between gap-4">
          <BrandLogo />
          <nav aria-label="Main navigation" className="hide-mobile flex items-center gap-6 text-xs font-bold uppercase tracking-[.13em] text-[#4f4a42] lg:gap-7">
            <Link href="/shop" className="nav-link">Shop</Link>
            <Link href="/shop" className="nav-link">Collections</Link>
            <Link href="/finder" className="nav-link">Scent index</Link>
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/contact" className="nav-link">Contact</Link>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button type="button" className="icon-button h-10 w-10" onClick={() => setSearchOpen((value) => !value)} aria-label="Search fragrances" aria-expanded={searchOpen} aria-controls="store-search">
              {searchOpen ? <X size={16} /> : <Search size={16} />}
            </button>
            <Link href="/account" className="icon-button h-10 w-10 hide-mobile" aria-label="Your account"><CircleUserRound size={16} /></Link>
            <Link href="/wishlist" className="icon-button h-10 w-10 hide-mobile" aria-label="Wishlist"><Heart size={16} /></Link>
            <Link href="/cart" className="icon-button relative h-10 w-10" aria-label={`Shopping bag, ${count} item${count === 1 ? "" : "s"}`}>
              <ShoppingBag size={16} />
              {count > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#b89558] px-1 text-[10px] font-extrabold text-[#151515]">{count}</span>}
            </Link>
            <button type="button" className="icon-button h-10 w-10 mobile-only" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="store-mobile-menu">
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="container pb-4">
            <form id="store-search" role="search" onSubmit={submitSearch} className="flex items-center gap-3 border-b border-black/20 pb-3">
              <Search size={17} aria-hidden="true" className="shrink-0 text-[#8b7657]" />
              <input autoFocus type="search" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); }} placeholder="Search by fragrance, house or note" aria-label="Search by fragrance, house or note" className="w-full bg-transparent text-sm outline-none placeholder:text-[#777269]" />
              <button type="submit" className="shrink-0 text-xs font-bold uppercase tracking-[.12em] text-[#6e5839]">Search</button>
            </form>
          </div>
        )}

        {menuOpen && (
          <nav id="store-mobile-menu" aria-label="Mobile navigation" className="border-t border-black/10 bg-[#f3f0e9] px-5 pb-6 pt-4 mobile-only">
            <div className="grid gap-4 text-sm font-semibold">
              <Link href="/shop" onClick={() => setMenuOpen(false)}>Shop all</Link>
              <Link href="/finder" onClick={() => setMenuOpen(false)}>Scent index</Link>
              <Link href="/about" onClick={() => setMenuOpen(false)}>Our story</Link>
              <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
              <Link href="/account" onClick={() => setMenuOpen(false)}>Account</Link>
              <Link href="/wishlist" onClick={() => setMenuOpen(false)}>Wishlist</Link>
            </div>
          </nav>
        )}
      </header>

      <main>
        <div className="container pb-4 pt-14 md:pt-20">
          <div className="eyebrow mb-4">{eyebrow ?? "UKIZ-BD / The considered edit"}</div>
          <h1 className="display max-w-4xl text-[clamp(3.2rem,8vw,7rem)]">{title}</h1>
        </div>
        {children}
      </main>

      <footer className="mt-20 bg-[#151515] py-14 text-[#f5f0e6] md:py-20">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:gap-8">
            <div>
              <BrandLogo light />
              <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/65">Modern fragrance for people who know that presence is felt before it is seen.</p>
              <div className="mt-7 flex items-center gap-2">
                <SocialLinks />
                <a href={`mailto:${supportEmail}`} className="icon-button h-10 w-10 border-white/25 text-white/75 hover:border-white hover:text-white" aria-label="Email UKIZ-BD"><Mail size={15} /></a>
              </div>
            </div>
            <div>
              <div className="mono mb-5 text-white/55">Explore</div>
              <div className="grid gap-3 text-sm text-white/75"><Link href="/shop" className="hover:text-white">Shop all</Link><Link href="/finder" className="hover:text-white">Scent index</Link><Link href="/about" className="hover:text-white">Our story</Link></div>
            </div>
            <div>
              <div className="mono mb-5 text-white/55">For you</div>
              <div className="grid gap-3 text-sm text-white/75"><Link href="/account" className="hover:text-white">Your account</Link><Link href="/wishlist" className="hover:text-white">Your wishlist</Link><Link href="/cart" className="hover:text-white">Your bag</Link><Link href="/refund-policy" className="hover:text-white">Refund &amp; exchange</Link><Link href="/contact" className="hover:text-white">Contact us</Link></div>
            </div>
            <div>
              <div className="mono mb-5 text-white/55">Get in touch</div>
              <p className="text-sm leading-relaxed text-white/65">Questions, recommendations or just want to talk perfume?</p>
              <a href={`mailto:${supportEmail}`} className="mt-4 inline-flex text-sm text-[#d6bb83]">{supportEmail}</a>
            </div>
          </div>
          <div className="mt-16 flex flex-col justify-between gap-4 border-t border-white/15 pt-5 text-xs uppercase tracking-[.12em] text-white/55 md:flex-row">
            <span>© {new Date().getFullYear()} UKIZ-BD. Made with intention.</span>
            <span>Dhaka · Bangladesh / Nationwide delivery</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
