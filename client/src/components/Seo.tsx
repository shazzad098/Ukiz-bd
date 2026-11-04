import { useEffect } from "react";
import { useLocation } from "wouter";

const SITE_URL = "https://ukizbd.com";
const DEFAULT_IMAGE = `${SITE_URL}/ukiz-bd-logo.png`;

type SeoConfig = {
  title: string;
  description: string;
  canonicalPath: string;
  noIndex?: boolean;
  image?: string;
};

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let node = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.content = content;
}

export function usePageSeo(config: SeoConfig) {
  useEffect(() => {
    const canonical = `${SITE_URL}${config.canonicalPath === "/" ? "/" : config.canonicalPath}`;
    document.title = config.title;
    setMeta("name", "description", config.description);
    setMeta("name", "robots", config.noIndex ? "noindex,nofollow" : "index,follow");
    setMeta("property", "og:title", config.title);
    setMeta("property", "og:description", config.description);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:image", config.image ?? DEFAULT_IMAGE);
    setMeta("name", "twitter:title", config.title);
    setMeta("name", "twitter:description", config.description);
    setMeta("name", "twitter:image", config.image ?? DEFAULT_IMAGE);
    let link = document.head.querySelector<HTMLLinkElement>("link[rel=canonical]");
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;
  }, [config]);
}

function configFor(pathname: string): SeoConfig {
  if (pathname === "/") return { title: "UKIZ-BD — Try before you commit.", description: "Authentic Middle-Eastern, designer and niche perfume decants in Bangladesh.", canonicalPath: "/" };
  if (pathname === "/collection") return { title: "Fragrance collection — UKIZ-BD", description: "Explore the live UKIZ-BD fragrance collection, updated from the store catalogue.", canonicalPath: "/collection" };
  if (pathname === "/finder") return { title: "Find your scent — UKIZ-BD Scent Index", description: "Use the UKIZ-BD scent index to discover a fragrance for your mood, moment and intensity.", canonicalPath: "/finder" };
  if (pathname === "/about") return { title: "Our story — UKIZ-BD", description: "Meet UKIZ-BD, a considered fragrance decant edit built for trying before committing.", canonicalPath: "/about" };
  if (pathname === "/contact") return { title: "Contact UKIZ-BD", description: "Talk to UKIZ-BD about fragrance recommendations, orders and delivery across Bangladesh.", canonicalPath: "/contact" };
  if (pathname === "/refund-policy" || pathname === "/returns") return { title: "Refund & exchange policy — UKIZ-BD", description: "Read the UKIZ-BD refund, exchange and delivery policy before placing an order.", canonicalPath: "/refund-policy" };
  const privateRoute = /^\/(auth\/callback|signin|signup|account|wishlist|cart|checkout|order-success|admin)(\/|$)/.test(pathname);
  return { title: "UKIZ-BD — Authentic fragrance decants", description: "Authentic fragrance decants in Bangladesh.", canonicalPath: pathname, noIndex: privateRoute };
}

export default function SeoController() {
  const [pathname] = useLocation();
  usePageSeo(configFor(pathname));
  return null;
}
