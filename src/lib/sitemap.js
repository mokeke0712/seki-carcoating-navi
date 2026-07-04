import { writePage } from "./util.js";

/** 収集したURL一覧から sitemap.xml と robots.txt を生成 */
export function writeSitemap(site, urls) {
  const today = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url><loc>${site.baseUrl}/${u.path}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`
  )
  .join("\n")}
</urlset>`;
  writePage("sitemap.xml", xml);
  writePage("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${site.baseUrl}/sitemap.xml\n`);
}
