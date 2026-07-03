#!/usr/bin/env node
/**
 * ビルドスクリプト
 * data/stores.json ・ data/areas.json ・ data/site.json を読み込み、
 * dist/ に全ページ・sitemap.xml・robots.txt を生成する。
 *
 * 使い方:  npm run build
 */
import fs from "node:fs";
import path from "node:path";
import { loadJSON, writePage, validateStore, menusOfStore, ROOT, DIST } from "./lib/util.js";
import { optimizeImages } from "./lib/images.js";
import { writeSitemap } from "./lib/sitemap.js";
import {
  storePage, areaPage, areasIndexPage,
  compareAreaPage, compareVsPage, compareMenuPage, compareIndexPage,
  indexPage, simplePage, notFoundPage,
} from "./lib/templates.js";

const t0 = Date.now();
const site = loadJSON("site.json");
const areas = loadJSON("areas.json");
const stores = loadJSON("stores.json");

/* ---- 1. データ検証 ---- */
const errors = stores.flatMap((s) => validateStore(s, areas));
const slugs = new Set();
for (const s of stores) {
  if (slugs.has(s.slug)) errors.push(`slugが重複しています: "${s.slug}"`);
  slugs.add(s.slug);
}
if (errors.length) {
  console.error("✖ データエラー:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}

/* ---- 2. distを初期化してアセットをコピー ---- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, "assets"), { recursive: true });
fs.cpSync(path.join(ROOT, "src", "assets"), path.join(DIST, "assets"), { recursive: true });

/* ---- 3. 画像最適化（WebP・リサイズ・Lazy Load用マニフェスト） ---- */
const imageManifest = await optimizeImages(stores);

/* ---- 4. ページ生成 ---- */
const urls = [{ path: "", priority: "1.0" }];

// 店舗ページ
for (const store of stores) {
  writePage(`stores/${store.slug}/index.html`, storePage({ site, store, stores, areas, imageManifest }));
  urls.push({ path: `stores/${store.slug}/`, priority: "0.8" });
}

// 地域ページ（店舗が1件以上あるエリアのみ）
const activeAreas = areas.filter((a) => stores.some((s) => s.area === a.slug));
for (const area of activeAreas) {
  writePage(`areas/${area.slug}/index.html`, areaPage({ site, area, stores, areas }));
  urls.push({ path: `areas/${area.slug}/`, priority: "0.7" });
}
writePage("areas/index.html", areasIndexPage({ site, areas: activeAreas, stores }));
urls.push({ path: "areas/", priority: "0.6" });

// エリア比較ページ
for (const area of activeAreas) {
  writePage(`compare/${area.slug}/index.html`, compareAreaPage({ site, area, stores, areas }));
  urls.push({ path: `compare/${area.slug}/`, priority: "0.9" });
}

// エリアvsエリア比較（隣接ペアを重複なく生成。相手エリアが0店舗でも一覧誘導ページとして生成）
const vsPages = [];
const seenPairs = new Set();
for (const a of activeAreas) {
  for (const nSlug of a.neighbors || []) {
    const b = areas.find((x) => x.slug === nSlug);
    if (!b) continue;
    const key = [a.slug, b.slug].sort().join("|");
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    vsPages.push([a, b]);
    writePage(`compare/${a.slug}-vs-${b.slug}/index.html`, compareVsPage({ site, areaA: a, areaB: b, stores, areas }));
    urls.push({ path: `compare/${a.slug}-vs-${b.slug}/`, priority: "0.6" });
  }
}

// メニュー別比較ページ（該当店舗が1件以上あるメニューのみ）
const menuPages = [];
for (const menuDef of site.menus) {
  const list = stores.filter((s) => menusOfStore(s, [menuDef]).length);
  if (!list.length) continue;
  menuPages.push(menuDef);
  writePage(`compare/menu/${menuDef.slug}/index.html`, compareMenuPage({ site, menuDef, storesList: list, areas }));
  urls.push({ path: `compare/menu/${menuDef.slug}/`, priority: "0.7" });
}

// 比較トップ・サイトトップ・固定ページ・404
writePage("compare/index.html", compareIndexPage({ site, areas: activeAreas, stores, menuPages, vsPages }));
urls.push({ path: "compare/", priority: "0.6" });

writePage("index.html", indexPage({ site, areas: activeAreas, stores, menuPages }));

writePage("about.html", simplePage({
  site, title: "運営者情報", urlPath: "about.html",
  bodyHtml: `<p>本サイトは「${site.operator}」が運営する、公開情報にもとづくカーコーティング店の比較サイトです。</p><p>${site.adNotice}</p><p>調査時期：${site.surveyDate}</p>`,
}));
urls.push({ path: "about.html", priority: "0.3" });

writePage("criteria.html", simplePage({
  site, title: "掲載基準", urlPath: "criteria.html",
  bodyHtml: `<ul class="feature-list"><li>掲載情報は各店舗の公式サイト・KeePer公式・楽天Carなどの公開情報をもとに作成しています。</li><li>順位・おすすめ表記は「専門性」「施工実績の見えやすさ」「設備」「予約しやすさ」を基準に編集部が整理したものです。</li><li>掲載内容に誤りがある場合は修正いたします。運営者情報ページよりご連絡ください。</li></ul>`,
}));
urls.push({ path: "criteria.html", priority: "0.3" });

writePage("404.html", notFoundPage({ site }));

/* ---- 5. サイトマップ ---- */
writeSitemap(site, urls);

console.log(`✔ ビルド完了: ${urls.length + 1}ページ生成（${stores.length}店舗 / ${activeAreas.length}エリア / 比較${activeAreas.length + vsPages.length + menuPages.length}ページ） ${Date.now() - t0}ms`);
