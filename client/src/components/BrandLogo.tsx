import { Link } from "wouter";

export default function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="UKIZ-BD home">
      <img
        src="/ukiz-bd-logo.png"
        alt="UKIZ-BD logo"
        className={`h-9 w-9 rounded-full object-cover ${light ? "border border-white/30" : "border border-black/20"}`}
      />
      <span
        className={`text-[13px] font-extrabold tracking-[.22em] ${light ? "text-[#f5f0e6]" : "text-[#151515]"}`}
      >
        UKIZ-BD
      </span>
    </Link>
  );
}
