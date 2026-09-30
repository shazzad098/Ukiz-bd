import { Facebook, Instagram } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/social";

function WhatsAppIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.4 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.2-.7.6-.2.4-.9 2.1-.9 4.4 0 2.3 1.7 4.5 1.9 4.8.2.3 3.3 5.1 8 7.1 1.1.5 2 .8 2.7 1 .6.2 1.1.1 1.5 0 .5-.2 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.3-.2-.6-.3Z" />
    </svg>
  );
}

function TikTokIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 3c.4 2.2 1.9 3.7 4.4 3.9v3c-1.7 0-3.2-.5-4.4-1.4v6.6c0 3.9-2.7 6.4-6.2 6.4-3.4 0-6-2.6-6-6s2.7-6 6.1-6c.3 0 .7 0 1 .1v3.2c-.3-.1-.6-.2-1-.2-1.7 0-2.9 1.2-2.9 2.9s1.3 2.9 2.9 2.9c1.7 0 3-1.3 3-3.2V3h3.1Z" />
    </svg>
  );
}

export default function SocialLinks({ dark = true }: { dark?: boolean }) {
  const cls = dark
    ? "icon-button h-9 w-9 border-white/15 text-white/60 hover:border-white hover:text-white"
    : "icon-button h-9 w-9 text-[#777269] hover:text-[#151515]";
  return (
    <div className="flex gap-2">
      <a
        href={SOCIAL_LINKS.whatsapp}
        target="_blank"
        rel="noreferrer"
        className={cls}
        aria-label="WhatsApp"
      >
        <WhatsAppIcon size={15} />
      </a>
      <a
        href={SOCIAL_LINKS.facebook}
        target="_blank"
        rel="noreferrer"
        className={cls}
        aria-label="Facebook"
      >
        <Facebook size={15} />
      </a>
      <a
        href={SOCIAL_LINKS.instagram}
        target="_blank"
        rel="noreferrer"
        className={cls}
        aria-label="Instagram"
      >
        <Instagram size={15} />
      </a>
      <a
        href={SOCIAL_LINKS.tiktok}
        target="_blank"
        rel="noreferrer"
        className={cls}
        aria-label="TikTok"
      >
        <TikTokIcon size={15} />
      </a>
    </div>
  );
}
