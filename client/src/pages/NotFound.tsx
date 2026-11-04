import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { Link } from "wouter";
import StorefrontLayout from "@/components/StorefrontLayout";

export default function NotFound() {
  return (
    <StorefrontLayout eyebrow="A wrong turn / 404" title="That scent trail ends here.">
      <section className="container pb-24">
        <div className="mx-auto grid max-w-4xl gap-8 rounded-[1.6rem] bg-[#1a1a18] p-7 text-[#f5f0e6] md:grid-cols-[.75fr_1.25fr] md:items-center md:p-12">
          <div className="grid min-h-52 place-items-center rounded-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(199,169,112,.24),transparent_65%)]">
            <span className="serif text-[8rem] leading-none text-[#d2b77e]">404</span>
          </div>
          <div>
            <div className="eyebrow mb-4 text-[#d2b77e]">Page not found</div>
            <h2 className="serif text-3xl leading-tight md:text-4xl">The page you’re looking for has moved on.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">The link may be old, or the composition may no longer be in our edit. Let’s find you something that is.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/collection" className="primary-button"><Search size={14} /> Explore the edit</Link>
              <Link href="/" className="secondary-button border-white/25 text-white hover:border-white"><ArrowLeft size={14} /> Back home</Link>
            </div>
            <Link href="/contact" className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#d2b77e]">Need a hand? Contact us <ArrowRight size={13} /></Link>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
