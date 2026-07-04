import { esc, priceNumber } from "./util.js";

/** <head>全体を生成 */
export function headTag({ site, title, description, urlPath, ogImage, jsonLd = [], depth = 0 }) {
  const canonical = `${site.baseUrl}/${urlPath}`.replace(/\/index\.html$/, "/").replace(/([^:])\/\/+/g, "$1/");
  const cssPath = "../".repeat(depth) + "assets/style.css";
  const img = ogImage ? `${site.baseUrl}/${ogImage}` : `${site.baseUrl}/assets/ogp-default.svg`;
  const ld = jsonLd.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n");
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.siteName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:locale" content="${esc(site.locale)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="${cssPath}">
${ld}
</head>`;
}

/** パンくず：HTML と JSON-LD をペアで生成 */
export function breadcrumb(site, trail, depth) {
  // trail: [{name, path}] path はサイトルートからの相対（"" = トップ）
  const rel = (p) => (p === "" ? "../".repeat(depth) || "./" : "../".repeat(depth) + p);
  const html = `<nav class="breadcrumb" aria-label="パンくずリスト"><ol>${trail
    .map((t, i) =>
      i === trail.length - 1
        ? `<li aria-current="page">${esc(t.name)}</li>`
        : `<li><a href="${esc(rel(t.path))}">${esc(t.name)}</a></li>`
    )
    .join("")}</ol></nav>`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${site.baseUrl}/${t.path}`.replace(/\/$/, "") || site.baseUrl,
    })),
  };
  return { html, jsonLd };
}

/** 店舗ページ用 LocalBusiness(AutoRepair系) JSON-LD */
export function storeJsonLd(site, store, area) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "AutoBodyShop",
    name: store.name,
    address: { "@type": "PostalAddress", addressRegion: area.pref, addressLocality: area.name, streetAddress: store.address || undefined },
    url: `${site.baseUrl}/stores/${store.slug}/`,
    description: store.summary,
  };
  if (store.tel) ld.telephone = store.tel;
  if (store.website) ld.sameAs = [store.website];
  if (store.lat && store.lng) ld.geo = { "@type": "GeoCoordinates", latitude: store.lat, longitude: store.lng };
  if (store.hours) ld.openingHours = store.hours;
  if (store.images?.length) ld.image = store.images.map((f) => `${site.baseUrl}/assets/img/${store.slug}/${f.replace(/\.[a-z]+$/i, "")}-800.webp`);
  const offers = (store.menus || [])
    .map((m) => {
      const price = priceNumber(m.price);
      return price ? { "@type": "Offer", name: m.name, price, priceCurrency: "JPY" } : null;
    })
    .filter(Boolean);
  if (offers.length) ld.makesOffer = offers;
  if (store.reviews?.length) {
    const avg = store.reviews.reduce((s, r) => s + (r.rating || 0), 0) / store.reviews.length;
    ld.aggregateRating = { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: store.reviews.length };
  }
  return ld;
}

/** FAQPage JSON-LD */
export function faqJsonLd(faq) {
  if (!faq?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** 一覧・比較ページ用 ItemList JSON-LD */
export function itemListJsonLd(site, name, stores) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: stores.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      url: `${site.baseUrl}/stores/${s.slug}/`,
    })),
  };
}
