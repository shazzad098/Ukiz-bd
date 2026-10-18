import { useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import StorefrontLayout from "@/components/StorefrontLayout";
import { useProducts } from "@/lib/products";
import { useCustomer } from "@/lib/customer";
import { useCart } from "@/lib/cart";

const steps = [{ title: "What do you want to leave in the air?", options: ["Fresh", "Soft", "Magnetic", "Grounded"] }, { title: "When will you wear it most?", options: ["Everyday", "After dark", "Slow mornings", "A special occasion"] }, { title: "How close should it sit?", options: ["Skin-close", "A quiet trail", "Make an entrance", "Let it linger"] }];
export default function ScentIndex() {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [, setLocation] = useLocation();
  const { requireAuth } = useCustomer();
  const { addItem } = useCart();
  const { products } = useProducts();
  const recommendation = answer === "Fresh" ? products[5] ?? products[0] : answer === "Soft" ? products[1] ?? products[0] : answer === "Grounded" ? products[0] : products[4] ?? products[0];
  return <StorefrontLayout eyebrow="Discovery / 02" title="Find the one that feels like you."><section className="container pb-24"><div className="grid gap-10 md:grid-cols-[.8fr_1.2fr]"><div className="rounded-[1.5rem] bg-[#1a1a18] p-7 text-[#f5f0e6] md:p-10"><div className="eyebrow mb-6 text-[#c7a970]">A three-step edit</div><p className="max-w-sm text-sm leading-relaxed text-white/55">Start with a mood, a moment and an intensity. We will match you with a composition worth wearing in.</p><div className="mt-12 flex gap-2">{steps.map((_, index) => <span key={index} className={`h-1 rounded-full ${index <= step ? "w-12 bg-[#c7a970]" : "w-7 bg-white/20"}`} />)}</div></div><div className="rounded-[1.5rem] border border-black/10 bg-[#e9e5dc] p-7 md:p-10">{step < steps.length ? <><div className="eyebrow mb-5">Step 0{step + 1} / 03</div><h2 className="serif max-w-xl text-4xl leading-tight">{steps[step].title}</h2><div className="mt-10 grid grid-cols-2 gap-3">{steps[step].options.map((option) => <button key={option} onClick={() => { setAnswer(option); setStep((value) => value + 1); }} className="flex min-h-24 items-end justify-between rounded-xl border border-black/10 bg-[#f3f0e9] p-4 text-left text-sm transition-colors hover:border-[#b89558]">{option}<ArrowRight size={14} /></button>)}</div></> : <><div className="eyebrow mb-5 text-[#8b6d3e]">Your match is in <Sparkles size={14} className="inline" /></div><div className="flex items-center gap-5"><img src={recommendation.image} alt={recommendation.name} className="h-32 w-28 rounded-xl object-cover mix-blend-multiply" /><div><div className="text-xs uppercase tracking-[.13em] text-[#907f66]">{recommendation.brand}</div><h2 className="serif mt-1 text-4xl">{recommendation.name}</h2><p className="mt-2 text-sm text-[#777269]">{recommendation.notes}</p></div></div><div className="mt-10 flex flex-wrap gap-3"><button onClick={() => requireAuth(() => { addItem(recommendation); setLocation("/cart"); }, "/finder")} className="primary-button dark">Try this scent <ArrowRight size={14} /></button><button onClick={() => { setStep(0); setAnswer(""); }} className="secondary-button">Start over</button></div><div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[.1em] text-[#8a8378]"><Check size={13} /> Based on your answers</div></>}</div></div></section></StorefrontLayout>;
}
