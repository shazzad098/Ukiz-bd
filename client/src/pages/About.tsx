import { ArrowRight, BadgeCheck, Droplets, PackageCheck } from "lucide-react";
import { Link } from "wouter";
import StorefrontLayout from "@/components/StorefrontLayout";

export default function About() {
  return (
    <StorefrontLayout eyebrow="The house / 03" title="Try before you commit.">
      <section className="container pb-24">
        <div className="grid gap-10 md:grid-cols-[1.1fr_.9fr] md:items-stretch">
          <div className="image-sheen min-h-[460px] overflow-hidden rounded-[1.5rem] bg-[#d1c7b8]">
            <img
              src="https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=88"
              alt="UKIZ-BD fragrance atelier"
              className="h-full w-full object-cover mix-blend-multiply"
            />
          </div>
          <div className="flex flex-col justify-between rounded-[1.5rem] bg-[#1a1a18] p-8 text-[#f5f0e6] md:p-12">
            <div>
              <div className="eyebrow mb-6 text-[#c7a970]">Who we are</div>
              <h2 className="display max-w-lg text-[clamp(2.4rem,4.5vw,4rem)]">
                An online perfume decant shop in Bangladesh.
              </h2>
              <p className="mt-7 max-w-md text-sm leading-relaxed text-white/55">
                UKIZ-BD offers authentic Middle-Eastern, designer &amp; niche fragrances in
                smaller trial sizes. Everyone deserves to smell exceptional — without
                gambling on a full bottle.
              </p>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
                We source original, authentic designer and niche fragrances and decant them
                into precise 3ml, 5ml, 10ml and 15ml sizes — just the fragrances you love,
                matched to your personality.
              </p>
            </div>
            <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-5 text-xs uppercase tracking-[.13em] text-white/45">
              <span>Dhaka / Bangladesh</span>
              <span>Est. 2026</span>
            </div>
          </div>
        </div>

        <div className="grid gap-10 py-24 md:grid-cols-3 md:py-32">
          <div>
            <div className="eyebrow mb-4">01 / 100% Original</div>
            <h3 className="serif text-3xl">No fakes, no imitations.</h3>
            <p className="mt-4 text-sm leading-relaxed text-[#777269]">
              100% original juice, sourced from authentic bottles. What reaches you is
              exactly what the house created.
            </p>
          </div>
          <div>
            <div className="eyebrow mb-4">02 / Precise decants</div>
            <h3 className="serif text-3xl">3ml · 5ml · 10ml · 15ml.</h3>
            <p className="mt-4 text-sm leading-relaxed text-[#777269]">
              Every decant is filled fresh, measured precisely and sealed carefully — then
              delivered with care to your doorstep.
            </p>
          </div>
          <div>
            <div className="eyebrow mb-4">03 / Try first</div>
            <h3 className="serif text-3xl">Find your favourite.</h3>
            <p className="mt-4 text-sm leading-relaxed text-[#777269]">
              Live with a scent before you commit to the full bottle. Discover your
              favourite fragrance through UKIZ-BD.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex gap-4 rounded-[1.5rem] border border-black/10 bg-[#f8f6f0] p-7">
            <BadgeCheck size={20} className="mt-1 shrink-0 text-[#a4824e]" />
            <div>
              <div className="text-sm font-bold">Authentic, always</div>
              <p className="mt-2 text-sm leading-relaxed text-[#777269]">
                Middle-Eastern, designer &amp; niche — original juice only.
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-[1.5rem] border border-black/10 bg-[#f8f6f0] p-7">
            <Droplets size={20} className="mt-1 shrink-0 text-[#a4824e]" />
            <div>
              <div className="text-sm font-bold">Filled fresh</div>
              <p className="mt-2 text-sm leading-relaxed text-[#777269]">
                Decanted to order in 3ml, 5ml, 10ml and 15ml sizes.
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-[1.5rem] border border-black/10 bg-[#f8f6f0] p-7">
            <PackageCheck size={20} className="mt-1 shrink-0 text-[#a4824e]" />
            <div>
              <div className="text-sm font-bold">Sealed with care</div>
              <p className="mt-2 text-sm leading-relaxed text-[#777269]">
                Carefully sealed, packed and delivered nationwide from Dhaka.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-y border-black/10 py-12">
          <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr] md:items-center">
            <div className="eyebrow">The invitation</div>
            <div>
              <p className="serif max-w-2xl text-3xl leading-tight md:text-4xl">
                “Find the scent that feels like it has always belonged to you.”
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/collection" className="primary-button dark">
                  Shop decants <ArrowRight size={14} />
                </Link>
                <Link
                  href="/finder"
                  className="group inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[.15em]"
                >
                  Find your scent{" "}
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-black/15 transition-transform group-hover:translate-x-1">
                    <ArrowRight size={14} />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
