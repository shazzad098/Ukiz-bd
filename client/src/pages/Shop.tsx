import { useMemo, useState } from "react";
import { ArrowRight, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { Link } from "wouter";
import StorefrontLayout from "@/components/StorefrontLayout";
import { money } from "./Home";
import { fromPrice, maxPrice, useProducts, type StoreProduct } from "@/lib/products";

type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "oldest";

const SORT_LABELS: Record<SortKey, string> = {
  featured: "Sort: Featured",
  "price-asc": "Price: Low to high",
  "price-desc": "Price: High to low",
  newest: "Newest first",
  oldest: "Oldest first",
};

function uniqueSorted(values: (string | undefined | null)[]): string[] {
  const out: string[] = [];
  values.forEach((v) => {
    const t = (v ?? "").trim();
    if (t && out.indexOf(t) === -1) out.push(t);
  });
  return out.sort();
}

function toggleInSet(set: Set<string>, value: string): Set<string> {
  const next = new Set<string>();
  set.forEach((v) => next.add(v));
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function FilterGroup({ title, options, selected, onToggle }: { title: string; options: string[]; selected: Set<string>; onToggle: (value: string) => void }) {
  if (options.length === 0) return null;
  return (
    <div className="border-b border-black/10 py-5 first:pt-0 last:border-b-0">
      <div className="mb-3 text-[10px] font-bold uppercase tracking-[.13em] text-[#5c584f]">{title}</div>
      <div className="grid gap-2.5">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3d3932]">
            <input
              type="checkbox"
              checked={selected.has(option)}
              onChange={() => onToggle(option)}
              className="h-4 w-4 rounded accent-[#151515]"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Shop() {
  const { products } = useProducts();
  const [query, setQuery] = useState("");
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [audiences, setAudiences] = useState<Set<string>>(new Set());
  const [vibes, setVibes] = useState<Set<string>>(new Set());
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const brandOptions = useMemo(() => uniqueSorted(products.map((p) => p.brand)), [products]);
  const audienceOptions = useMemo(
    () => uniqueSorted(products.map((p) => p.audience ?? "Unisex")),
    [products]
  );
  const vibeOptions = useMemo(
    () => uniqueSorted(products.map((p) => p.vibe)),
    [products]
  );
  const typeOptions = useMemo(
    () => uniqueSorted(products.map((p) => p.type)),
    [products]
  );
  const priceBounds = useMemo(() => {
    if (products.length === 0) return { lo: 0, hi: 10000 };
    const los = products.map(fromPrice);
    const his = products.map(maxPrice);
    return { lo: Math.min(...los), hi: Math.max(...his) };
  }, [products]);

  const activeFilterCount =
    brands.size + audiences.size + vibes.size + types.size + (minInput ? 1 : 0) + (maxInput ? 1 : 0);

  const clearAll = () => {
    setBrands(new Set());
    setAudiences(new Set());
    setVibes(new Set());
    setTypes(new Set());
    setMinInput("");
    setMaxInput("");
    setQuery("");
    setSort("featured");
  };

  const visible = useMemo(() => {
    const min = minInput === "" ? Number.NEGATIVE_INFINITY : Number(minInput) || 0;
    const max = maxInput === "" ? Number.POSITIVE_INFINITY : Number(maxInput) || 0;
    const q = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      if (brands.size > 0 && !brands.has(product.brand)) return false;
      if (audiences.size > 0 && !audiences.has(product.audience ?? "Unisex")) return false;
      if (vibes.size > 0 && !vibes.has((product.vibe ?? "").trim())) return false;
      if (types.size > 0 && !types.has((product.type ?? "").trim())) return false;
      // price-range overlap: product visible when its range touches the filter range
      if (!(fromPrice(product) <= max && maxPrice(product) >= min)) return false;
      if (q && !`${product.name} ${product.brand} ${product.notes} ${product.vibe ?? ""} ${product.type ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const sorted = [...filtered];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => fromPrice(a) - fromPrice(b));
        break;
      case "price-desc":
        sorted.sort((a, b) => fromPrice(b) - fromPrice(a));
        break;
      case "newest":
        sorted.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
        break;
      default:
        break;
    }
    return sorted;
  }, [products, brands, audiences, vibes, types, minInput, maxInput, query, sort]);

  const filters = (
    <div>
      <div className="flex items-center gap-3 border-b border-black/10 pb-5">
        <Search size={16} className="shrink-0 text-[#95866c]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search scent, note, house"
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#9a948a]"
        />
      </div>
      <div className="py-2">
        <FilterGroup title="Brand" options={brandOptions} selected={brands} onToggle={(v) => setBrands((s) => toggleInSet(s, v))} />
        <FilterGroup title="For" options={audienceOptions} selected={audiences} onToggle={(v) => setAudiences((s) => toggleInSet(s, v))} />
        <FilterGroup title="Vibe" options={vibeOptions} selected={vibes} onToggle={(v) => setVibes((s) => toggleInSet(s, v))} />
        <FilterGroup title="Type" options={typeOptions} selected={types} onToggle={(v) => setTypes((s) => toggleInSet(s, v))} />
        <div className="border-b border-black/10 py-5 last:border-b-0">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[.13em] text-[#5c584f]">Price range (৳)</div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              placeholder={String(priceBounds.lo)}
              className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#9a948a]"
            />
            <span className="text-[#9a948a]">–</span>
            <input
              type="number"
              min={0}
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              placeholder={String(priceBounds.hi)}
              className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#9a948a]"
            />
          </div>
        </div>
      </div>
      {activeFilterCount > 0 && (
        <button onClick={clearAll} className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#9b6d5d]">
          <RotateCcw size={12} /> Clear all ({activeFilterCount})
        </button>
      )}
    </div>
  );

  const productCard = (product: StoreProduct) => (
    <article key={product.id} className="product-card group">
      <Link href={`/product/${product.id}`} className="block">
        <div className="image-sheen relative aspect-[.86] overflow-hidden rounded-[1.2rem]" style={{ backgroundColor: product.tone }}>
          <img src={product.image} alt={product.name} className="product-image h-full w-full object-cover mix-blend-multiply" loading="lazy" />
          <span className="absolute left-3 top-3 rounded-full bg-[#f3f0e9]/90 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.12em]">{product.badge ?? "Curated"}</span>
          <span className="absolute inset-x-3 bottom-3 rounded-full bg-[#151515]/90 py-3 text-center text-[10px] font-bold uppercase tracking-[.12em] text-white opacity-0 transition-opacity group-hover:opacity-100">View composition</span>
        </div>
        <div className="px-1 pt-4">
          <div className="text-[10px] font-bold uppercase tracking-[.12em] text-[#907f66]">{product.brand}</div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <h2 className="serif text-[22px]">{product.name}</h2>
            <span className="whitespace-nowrap text-[10px] text-[#777269]">From {money(fromPrice(product))}</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[#777269]">{product.family} · {product.notes}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] uppercase tracking-[.08em] text-[#9a907e]">
            {product.audience && product.audience !== "Unisex" && <span className="rounded-full border border-black/10 px-2 py-0.5">{product.audience}</span>}
            {product.vibe && <span className="rounded-full border border-black/10 px-2 py-0.5">{product.vibe}</span>}
            {product.type && <span className="rounded-full border border-black/10 px-2 py-0.5">{product.type}</span>}
          </div>
        </div>
      </Link>
    </article>
  );

  return (
    <StorefrontLayout eyebrow="Collection / 01" title="The full edit.">
      <section className="container pb-24">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="eyebrow">{visible.length} of {products.length} compositions</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFiltersOpen((v) => !v)} className="flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[.12em] md:hidden">
              <SlidersHorizontal size={13} /> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-full border border-black/15 bg-transparent px-4 py-2 text-[10px] uppercase tracking-[.12em] outline-none"
              aria-label="Sort products"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>{SORT_LABELS[key]}</option>
              ))}
            </select>
          </div>
        </div>
        {filtersOpen && <div className="mb-8 rounded-[1.2rem] border border-black/10 bg-[#f8f6f0] p-5 md:hidden">{filters}</div>}
        <div className="grid gap-10 md:grid-cols-[240px_1fr]">
          <aside className="hide-mobile">
            <div className="sticky top-24 rounded-[1.2rem] border border-black/10 bg-[#f8f6f0] p-5">{filters}</div>
          </aside>
          <div>
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/15 py-20 text-center text-sm text-[#777269]">
                No fragrances match those filters.
                <div><button onClick={clearAll} className="mt-4 text-[10px] font-bold uppercase tracking-[.12em] text-[#8d744e]">Clear all filters</button></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3">{visible.map(productCard)}</div>
            )}
            <div className="mt-16 flex justify-center">
              <Link href="/finder" className="primary-button dark">Not sure? Take the scent index <ArrowRight size={14} /></Link>
            </div>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
