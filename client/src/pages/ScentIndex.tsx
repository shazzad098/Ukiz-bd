import { useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import StorefrontLayout from "@/components/StorefrontLayout";
import { stockForSize, useProducts } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { recommendScent } from "@/lib/scent-matcher";

const steps = [
  { title: "What do you want to leave in the air?", options: ["Fresh", "Soft", "Magnetic", "Grounded"] },
  { title: "When will you wear it most?", options: ["Everyday", "After dark", "Slow mornings", "A special occasion"] },
  { title: "How close should it sit?", options: ["Skin-close", "A quiet trail", "Make an entrance", "Let it linger"] },
];

export default function ScentIndex() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const { addItem } = useCart();
  const { products, isLoading, isError, refetch } = useProducts();
  const complete = step >= steps.length;
  const recommendation = complete ? recommendScent(products, { mood: answers[0], moment: answers[1], intensity: answers[2] }) : undefined;

  const select = (value: string) => {
    setAnswers((current) => [...current, value]);
    setStep((current) => current + 1);
  };
  const restart = () => { setStep(0); setAnswers([]); };
  const tryRecommendation = () => {
    if (!recommendation) return;
    const size = recommendation.sizes[0] ?? "50ml";
    if (stockForSize(recommendation, size) === 0 || !addItem(recommendation, size)) {
      toast.error("This fragrance is currently out of stock.");
      return;
    }
    toast.success(`${recommendation.name} added to your bag.`);
    setLocation("/cart");
  };

  return (
    <StorefrontLayout eyebrow="Discovery / 02" title="Find the one that feels like you.">
      <section className="container pb-24">
        <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr]">
          <div className="rounded-[1.5rem] bg-[#1a1a18] p-7 text-[#f5f0e6] md:p-10">
            <div className="eyebrow mb-6 text-[#c7a970]">A three-step edit</div>
            <p className="max-w-sm text-sm leading-relaxed text-white/70">Start with a mood, a moment and an intensity. We will match you with a composition worth wearing in.</p>
            <div className="mt-12 flex gap-2" aria-label={`Step ${Math.min(step + 1, 3)} of 3`}>
              {steps.map((_, index) => <span key={index} className={`h-1 rounded-full transition-all ${index < step ? "w-12 bg-[#c7a970]" : "w-7 bg-white/25"}`} />)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-black/10 bg-[#e9e5dc] p-7 md:p-10">
            {!complete ? (
              <>
                <div className="eyebrow mb-5">Step 0{step + 1} / 03</div>
                <h2 className="serif max-w-xl text-4xl leading-tight">{steps[step].title}</h2>
                <div className="mt-10 grid grid-cols-2 gap-3">
                  {steps[step].options.map((option) => <button type="button" key={option} onClick={() => select(option)} className="flex min-h-24 items-end justify-between rounded-xl border border-black/10 bg-[#f3f0e9] p-4 text-left text-sm transition-colors hover:border-[#9b7c4b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9b7c4b]">{option}<ArrowRight size={14} /></button>)}
                </div>
              </>
            ) : recommendation ? (
              <>
                <div className="eyebrow mb-5 text-[#6e5839]">Your match is in <Sparkles size={14} className="inline" /></div>
                <div className="flex items-center gap-5">
                  <img src={recommendation.image} alt={`${recommendation.brand} ${recommendation.name}`} className="h-32 w-28 rounded-xl object-cover" loading="lazy" />
                  <div><div className="text-xs uppercase tracking-[.13em] text-[#6e5839]">{recommendation.brand}</div><h2 className="serif mt-1 text-4xl">{recommendation.name}</h2><p className="mt-2 text-sm text-[#625d55]">{recommendation.notes}</p></div>
                </div>
                <div className="mt-10 flex flex-wrap gap-3">
                  <button type="button" onClick={tryRecommendation} className="primary-button dark">Try this scent <ArrowRight size={14} /></button>
                  <button type="button" onClick={restart} className="secondary-button">Start over</button>
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[.1em] text-[#625d55]"><Check size={13} /> Based on your mood, moment and intensity</div>
              </>
            ) : (
              <div role="status" className="py-8">
                <h2 className="serif text-3xl">{isLoading ? "Finding your match…" : isError ? "The scent edit is unavailable." : "No fragrances are listed right now."}</h2>
                {isError && <button type="button" onClick={() => void refetch()} className="mt-5 font-semibold underline underline-offset-4">Try again</button>}
                <button type="button" onClick={restart} className="ml-5 mt-5 text-sm font-semibold underline underline-offset-4">Restart finder</button>
              </div>
            )}
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
