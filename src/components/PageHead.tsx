import { useEffect } from "react";

interface PageHeadProps {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
}

/**
 * Sets document title, meta description, and Open Graph tags for SEO.
 * Since we're a SPA, this updates the head on route change.
 */
const PageHead = ({ title, description, path, ogImage }: PageHeadProps) => {
  useEffect(() => {
    document.title = `${title} | RapidoMeet`;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    setMeta("property", "og:title", `${title} | RapidoMeet`);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "website");
    if (path) {
      setMeta("property", "og:url", `https://rapidomeet.io${path}`);
    }
    if (ogImage) {
      setMeta("property", "og:image", ogImage);
    }
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", `${title} | RapidoMeet`);
    setMeta("name", "twitter:description", description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && path) {
      canonical.setAttribute("href", `https://rapidomeet.io${path}`);
    }

    return () => {
      document.title = "RapidoMeet — Vos réunions se transforment en actions automatiques";
    };
  }, [title, description, path, ogImage]);

  return null;
};

export default PageHead;
