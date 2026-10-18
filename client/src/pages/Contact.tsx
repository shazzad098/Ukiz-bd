import { useState } from "react";
import { ArrowRight, Facebook, Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import StorefrontLayout from "@/components/StorefrontLayout";
import { usePublicSettings } from "@/lib/settings";
import { SOCIAL_LINKS } from "@/lib/social";
import { trpc } from "@/lib/trpc";

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 3c.4 2.2 1.9 3.7 4.4 3.9v3c-1.7 0-3.2-.5-4.4-1.4v6.6c0 3.9-2.7 6.4-6.2 6.4-3.4 0-6-2.6-6-6s2.7-6 6.1-6c.3 0 .7 0 1 .1v3.2c-.3-.1-.6-.2-1-.2-1.7 0-2.9 1.2-2.9 2.9s1.3 2.9 2.9 2.9c1.7 0 3-1.3 3-3.2V3h3.1Z" />
    </svg>
  );
}

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { supportEmail } = usePublicSettings();
  const submitContact = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
      toast.success("Your note has been sent.");
    },
    onError: (error) => toast.error(error.message),
  });
  return (
    <StorefrontLayout eyebrow="Correspondence / 04" title="Let's talk scent.">
      <section className="container pb-24">
        <div className="grid gap-10 md:grid-cols-[.75fr_1.25fr]">
          <div className="rounded-[1.5rem] bg-[#e9e5dc] p-7 md:p-10">
            <div className="eyebrow mb-8">We are here</div>
            <div className="grid gap-7">
              <div className="flex gap-4">
                <Mail size={18} className="mt-1 text-[#a4824e]" />
                <div>
                  <div className="text-sm font-semibold">Email us</div>
                  <a href={`mailto:${supportEmail}`} className="mt-1 block text-sm text-[#777269]">
                    {supportEmail}
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <MessageCircle size={18} className="mt-1 text-[#a4824e]" />
                <div>
                  <div className="text-sm font-semibold">WhatsApp</div>
                  <a
                    href={SOCIAL_LINKS.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-sm text-[#777269] underline underline-offset-4"
                  >
                    Chat with us on WhatsApp
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <Facebook size={18} className="mt-1 text-[#a4824e]" />
                <div>
                  <div className="text-sm font-semibold">Facebook</div>
                  <a
                    href={SOCIAL_LINKS.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-sm text-[#777269] underline underline-offset-4"
                  >
                    Follow us on Facebook
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <Instagram size={18} className="mt-1 text-[#a4824e]" />
                <div>
                  <div className="text-sm font-semibold">Instagram</div>
                  <a
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-sm text-[#777269] underline underline-offset-4"
                  >
                    @ukiz_bd on Instagram
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="mt-1 text-[#a4824e]">
                  <TikTokIcon size={18} />
                </span>
                <div>
                  <div className="text-sm font-semibold">TikTok</div>
                  <a
                    href={SOCIAL_LINKS.tiktok}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-sm text-[#777269] underline underline-offset-4"
                  >
                    @ukiz_bd on TikTok
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <MapPin size={18} className="mt-1 text-[#a4824e]" />
                <div>
                  <div className="text-sm font-semibold">Find us in Dhaka</div>
                  <p className="mt-1 text-sm text-[#777269]">By appointment / Gulshan 2</p>
                </div>
              </div>
            </div>
            <div className="mt-16 border-t border-black/10 pt-5 text-xs uppercase tracking-[.13em] text-[#9a9388]">
              Response time / usually within 24 hours
            </div>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitContact.mutate({ name, email, message });
            }}
            className="rounded-[1.5rem] border border-black/10 bg-[#f8f6f0] p-7 md:p-10"
          >
            <div className="eyebrow mb-6">Send a note</div>
            <div className="grid gap-6">
              <label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">
                Your name
                <input
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(event) => { setName(event.target.value); setSent(false); }}
                  className="border-b border-black/15 bg-transparent py-3 text-sm font-normal outline-none focus:border-[#a4824e]"
                />
              </label>
              <label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">
                Email address
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => { setEmail(event.target.value); setSent(false); }}
                  className="border-b border-black/15 bg-transparent py-3 text-sm font-normal outline-none focus:border-[#a4824e]"
                />
              </label>
              <label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">
                How can we help?
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(event) => { setMessage(event.target.value); setSent(false); }}
                  className="resize-none border-b border-black/15 bg-transparent py-3 text-sm font-normal outline-none focus:border-[#a4824e]"
                  placeholder="Tell us what is on your mind..."
                />
              </label>
              <button disabled={submitContact.isPending} className="primary-button dark mt-3 w-fit disabled:cursor-not-allowed disabled:opacity-60">
                {submitContact.isPending ? "Sending..." : sent ? "Sent — thank you" : "Send your note"} <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </div>
      </section>
    </StorefrontLayout>
  );
}
