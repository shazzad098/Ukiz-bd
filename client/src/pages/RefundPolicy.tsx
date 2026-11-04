import { ArrowRight, CircleAlert, PackageCheck, PackageX, RotateCcw } from "lucide-react";
import { Link } from "wouter";
import StorefrontLayout from "@/components/StorefrontLayout";
import { usePublicSettings } from "@/lib/settings";

export default function RefundPolicy() {
  const { supportEmail } = usePublicSettings();
  return (
    <StorefrontLayout eyebrow="Our promise / 11" title="Refund & exchange policy.">
      <section className="container pb-24">
        <div className="grid gap-6 md:grid-cols-[1fr_.9fr]">
          <div className="rounded-[1.5rem] bg-[#1a1a18] p-8 text-[#f5f0e6] md:p-12">
            <div className="eyebrow mb-5 text-[#c7a970]">Please read before ordering</div>
            <h2 className="serif max-w-md text-4xl leading-tight">
              We sell decants, so please choose your scent carefully.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/55">
              Every decant is repacked from an original, authentic bottle. Because we didn't
              create the fragrance itself, we can't accept returns simply because the smell
              isn't to your liking. We encourage you to read the notes and reviews before
              you order.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/collection" className="primary-button">
                Shop the edit <ArrowRight size={14} />
              </Link>
              <Link href="/contact" className="secondary-button border-white/20 text-white hover:border-white">
                Ask us first
              </Link>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-black/10 bg-[#f8f6f0] p-8 md:p-10">
            <div className="eyebrow mb-6">When refund / exchange applies</div>
            <div className="grid gap-4">
              <div className="flex gap-4 rounded-xl border border-black/10 bg-white/60 p-5">
                <PackageX size={20} className="mt-0.5 shrink-0 text-[#9b6d5d]" />
                <div>
                  <div className="text-sm font-bold">1. Damaged product received</div>
                  <p className="mt-1 text-sm leading-relaxed text-[#777269]">
                    Broken, leaked, or visibly damaged bottle / packaging on arrival.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-black/10 bg-white/60 p-5">
                <PackageCheck size={20} className="mt-0.5 shrink-0 text-[#54724c]" />
                <div>
                  <div className="text-sm font-bold">2. Wrong product received</div>
                  <p className="mt-1 text-sm leading-relaxed text-[#777269]">
                    You received a different perfume, brand, or size than what you ordered.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-[#a4824e]/30 bg-[#a4824e]/10 p-5">
                <CircleAlert size={20} className="mt-0.5 shrink-0 text-[#a4824e]" />
                <div>
                  <div className="text-sm font-bold">Not eligible: smell preference</div>
                  <p className="mt-1 text-sm leading-relaxed text-[#777269]">
                    "I don't like the smell" is not eligible for refund or exchange, as
                    decants are repacked from original creations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-black/10 bg-[#e9e5dc] p-7">
            <div className="eyebrow mb-4">Step 01</div>
            <h3 className="serif text-2xl">Unbox in front of the delivery man.</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#777269]">
              You must open and check your parcel in front of the delivery person. This is
              required to verify damage or a wrong item. Claims without this check cannot
              be accepted.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-black/10 bg-[#e9e5dc] p-7">
            <div className="eyebrow mb-4">Step 02</div>
            <h3 className="serif text-2xl">Report immediately.</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#777269]">
              If the product is damaged or wrong, do not accept it as-is — inform the
              delivery man on the spot and contact us right away with your order number,
              photos / video of the unboxing, and a short description.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-black/10 bg-[#e9e5dc] p-7">
            <div className="eyebrow mb-4">Step 03</div>
            <h3 className="serif text-2xl">We make it right.</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#777269]">
              Once verified, we will arrange a replacement or refund for the affected item.
              Contact us at <a href={`mailto:${supportEmail}`} className="font-semibold text-[#8e7650] underline underline-offset-4">{supportEmail}</a>.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-[1.5rem] border border-black/10 bg-[#f8f6f0] p-6 text-sm text-[#777269] md:px-8">
          <RotateCcw size={16} className="shrink-0 text-[#a4824e]" />
          <span>
            Quick summary: decant perfume · no return for scent preference · unbox in front
            of rider · refund / exchange only for damaged or wrong product.
          </span>
        </div>
      </section>
    </StorefrontLayout>
  );
}
