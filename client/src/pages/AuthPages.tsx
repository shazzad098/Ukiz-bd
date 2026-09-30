import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import { Link } from "wouter";
import StorefrontLayout from "@/components/StorefrontLayout";
import { useCustomer } from "@/lib/customer";

function Shell({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children: React.ReactNode }) {
  return (
    <StorefrontLayout eyebrow={eyebrow} title={title}>
      <section className="container pb-24">
        <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
          <div className="rounded-[1.5rem] bg-[#1a1a18] p-8 text-[#f5f0e6] md:p-12">
            <div className="eyebrow mb-5 text-[#c7a970]">Why sign in</div>
            <h2 className="serif text-4xl leading-tight">Your bag, your wishlist, your orders — kept for you.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">{copy}</p>
            <div className="mt-8 grid gap-3 text-sm text-white/60">
              <div className="flex gap-3"><Sparkles size={16} className="text-[#c7a970]" /> Add to bag & save wishlist</div>
              <div className="flex gap-3"><LockKeyhole size={16} className="text-[#c7a970]" /> Secure, faster checkout</div>
              <div className="flex gap-3"><ShieldCheck size={16} className="text-[#c7a970]" /> You stay signed in until you log out</div>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-black/10 bg-[#f8f6f0] p-8 md:p-12">{children}</div>
        </div>
      </section>
    </StorefrontLayout>
  );
}

const inputClass =
  "w-full border-b border-black/15 bg-transparent py-3 text-sm outline-none placeholder:text-[#9a948a] focus:border-[#a4824e]";

export function SignIn() {
  const { login, loginPending } = useCustomer();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    login({ email: email.trim(), password });
  };
  return (
    <Shell eyebrow="Your space / 05" title="Welcome back." copy="Sign in to add fragrances to your bag, keep a wishlist, and check out.">
      <div className="eyebrow mb-4">Sign in</div>
      <h2 className="serif text-4xl">Good to see you.</h2>
      <form onSubmit={submit} className="mt-8 grid gap-6">
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[.12em]">
          Email
          <span className="flex items-center gap-2">
            <Mail size={15} className="shrink-0 text-[#a4824e]" />
            <input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </span>
        </label>
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[.12em]">
          Password
          <span className="flex items-center gap-2">
            <LockKeyhole size={15} className="shrink-0 text-[#a4824e]" />
            <input required type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </span>
        </label>
        <button disabled={loginPending} className="primary-button dark mt-2 w-full disabled:opacity-50">
          {loginPending ? "Signing in..." : "Sign in"} <ArrowRight size={14} />
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[#777269]">
        New to UKIX-BD? <Link href="/signup" className="font-semibold text-[#151515] underline underline-offset-4">Create an account</Link>
      </p>
    </Shell>
  );
}

export function SignUp() {
  const { signup, signupPending } = useCustomer();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    signup({ name: name.trim(), email: email.trim(), password, phone: phone.trim() || undefined });
  };
  return (
    <Shell eyebrow="Your space / 05" title="Join the house." copy="Create an account to shop the edit, keep a wishlist, and check out in seconds.">
      <div className="eyebrow mb-4">Sign up</div>
      <h2 className="serif text-4xl">A minute, then all yours.</h2>
      <form onSubmit={submit} className="mt-8 grid gap-6">
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[.12em]">
          Full name
          <span className="flex items-center gap-2">
            <User size={15} className="shrink-0 text-[#a4824e]" />
            <input required autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </span>
        </label>
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[.12em]">
          Email
          <span className="flex items-center gap-2">
            <Mail size={15} className="shrink-0 text-[#a4824e]" />
            <input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </span>
        </label>
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[.12em]">
          Phone <span className="font-normal normal-case tracking-normal text-[#a39b90]">(optional)</span>
          <input autoComplete="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </label>
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[.12em]">
          Password <span className="font-normal normal-case tracking-normal text-[#a39b90]">(min 6 characters)</span>
          <span className="flex items-center gap-2">
            <LockKeyhole size={15} className="shrink-0 text-[#a4824e]" />
            <input required type="password" autoComplete="new-password" minLength={6} placeholder="Choose a password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </span>
        </label>
        <button disabled={signupPending} className="primary-button dark mt-2 w-full disabled:opacity-50">
          {signupPending ? "Creating account..." : "Create account"} <ArrowRight size={14} />
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[#777269]">
        Already have an account? <Link href="/signin" className="font-semibold text-[#151515] underline underline-offset-4">Sign in</Link>
      </p>
    </Shell>
  );
}
