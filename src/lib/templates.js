import { esc } from "./util.js";
import { headTag, breadcrumb, storeJsonLd, faqJsonLd, itemListJsonLd } from "./seo.js";
import { relatedForStore, relatedLinksHtml } from "./links.js";
import { imgTag } from "./images.js";

/* ---------- 共通レイアウト ---------- */

function layout({ site, head, bodyClass, breadcrumbHtml, main, depth }) {
  const up = "../".repeat(depth);
  return `<!DOCTYPE html>
<html lang="ja">
${head}
<body class="${bodyClass || ""}">
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${up || "./"}">${esc(site.siteName)}</a>
    <nav class="global-nav" aria-label="サイト内メニュー">
      <a href="${up}areas/">エリアから探す</a>
      <a href="${up}compare/">比較ページ</a>
      <a href="${up}about.html">運営者情報</a>
    </nav>
  </div>
</header>
${breadcrumbHtml ? `<div class="wrap">${breadcrumbHtml}</div>` : ""}
<main class="wrap">
${main}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p class="notice">${esc(site.adNotice)} ${esc(site.disclaimer)}（調査時期：${esc(site.surveyDate)}）</p>
    <nav><a href="${up}about.html">運営者情報</a> ｜ <a href="${up}criteria.html">掲載基準</a> ｜ <a href="${up}sitemap.xml">サイトマップ</a></nav>
    <p class="copy">© ${esc(site.siteName)}</p>
  </div>
</footer>
</body>
</html>`;
}

const star = (n) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

function storeCard(store, area, depth, { showArea = false } = {}) {
  const up = "../".repeat(depth);
  return `<article class="card">
  ${store.rankLabel ? `<p class="rank-label">${esc(store.rankLabel)}</p>` : ""}
  <h3><a href="${up}stores/${store.slug}/">${esc(store.name)}</a></h3>
  ${showArea ? `<p class="card-area">${esc(area.pref)}${esc(area.name)}</p>` : ""}
  <p class="card-summary">${esc(store.summary || "")}</p>
  <p class="badges">${(store.badges || []).map((b) => `<span class="badge">${esc(b)}</span>`).join("")}</p>
  <p class="card-more"><a href="${up}stores/${store.slug}/">詳しく見る →</a></p>
</article>`;
}

/* ---------- 店舗ページ ---------- */

export function storePage({ site, store, stores, areas, imageManifest }) {
  const depth = 2; // stores/{slug}/index.html
  const area = areas.find((a) => a.slug === store.area);
  const rel = relatedForStore(store, { stores, areas, site });
  const bc = breadcrumb(site, [
    { name: "トップ", path: "" },
    { name: `${area.name}のコーティング店`, path: `areas/${area.slug}/` },
    { name: store.name, path: `stores/${store.slug}/` },
  ], depth);

  const jsonLd = [bc.jsonLd, storeJsonLd(site, store, area)];
  const faqLd = faqJsonLd(store.faq);
  if (faqLd) jsonLd.push(faqLd);

  const title = `${store.name}｜${area.name}のカーコーティング【料金・口コミ・特徴】`;
  const description = `${area.pref}${area.name}の${store.name}の特徴・コーティングメニュー・料金・口コミ・FAQ。${(store.summary || "").slice(0, 60)}`;

  const bases = imageManifest[store.slug] || [];
  const gallery = bases.length
    ? `<section class="gallery"><h2>施工・店舗写真</h2><div class="gallery-grid">${bases
        .map((b, i) => imgTag(store, b, `${store.name}の施工写真${i + 1}（${area.name}のカーコーティング）`, depth))
        .join("")}</div></section>`
    : "";

  const infoRows = [
    ["エリア", `${area.pref}${area.name}`],
    ["住所", store.address],
    ["電話番号", store.tel],
    ["営業時間", store.hours],
    ["定休日", store.closed],
    ["設備", (store.equipment || []).join("・")],
    ["資格者", store.staff],
    ["施工写真", store.photoCount ? `${store.photoCount.toLocaleString()}枚を公開` : ""],
  ].filter(([, v]) => v);

  const linksRow = [
    store.website ? `<a class="btn" href="${esc(store.website)}" rel="noopener" target="_blank">公式サイトを見る</a>` : "",
    store.mapQuery
      ? `<a class="btn btn-sub" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.mapQuery)}" rel="noopener" target="_blank">Googleマップで開く</a>`
      : "",
    store.tel ? `<a class="btn btn-sub" href="tel:${esc(store.tel)}">電話する</a>` : "",
  ].filter(Boolean).join(" ");

  const main = `
<article class="store-page">
  <p class="eyebrow">${esc(area.pref)}${esc(area.name)}のカーコーティング</p>
  <h1>${esc(store.name)}</h1>
  <p class="badges">${(store.badges || []).map((b) => `<span class="badge">${esc(b)}</span>`).join("")}</p>
  <p class="lead">${esc(store.summary || "")}</p>
  <p class="btn-row">${linksRow}</p>

  ${gallery}

  <section><h2>店舗情報</h2>
    <table class="info-table"><tbody>
    ${infoRows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("\n    ")}
    </tbody></table>
  </section>

  ${store.features?.length ? `<section><h2>${esc(store.name)}の特徴</h2><ul class="feature-list">${store.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></section>` : ""}

  ${store.menus?.length ? `<section><h2>コーティングメニューと価格</h2>
    <table class="menu-table"><thead><tr><th>メニュー</th><th>価格（税込目安）</th><th>備考</th></tr></thead><tbody>
    ${store.menus.map((m) => `<tr><td>${esc(m.name)}</td><td>${esc(m.price || "要問い合わせ")}</td><td>${esc(m.note || "")}</td></tr>`).join("\n    ")}
    </tbody></table>
    <p class="small">※価格は調査時点の公開情報です。最新の料金は店舗へご確認ください。</p></section>` : ""}

  ${store.reviews?.length ? `<section><h2>口コミ</h2>${store.reviews
    .map((r) => `<blockquote class="review"><p class="review-meta"><span class="stars" aria-label="評価${r.rating}点">${star(r.rating)}</span> ${esc(r.author || "")}</p><p>${esc(r.text)}</p></blockquote>`)
    .join("")}</section>` : ""}

  ${store.faq?.length ? `<section><h2>よくある質問</h2>${store.faq
    .map((f) => `<details class="faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
    .join("")}</section>` : ""}
</article>
${relatedLinksHtml(rel, depth)}`;

  const head = headTag({
    site, title, description,
    urlPath: `stores/${store.slug}/`,
    ogImage: bases.length ? `assets/img/${store.slug}/${bases[0]}-800.webp` : null,
    jsonLd, depth,
  });
  return layout({ site, head, breadcrumbHtml: bc.html, main, depth });
}

/* ---------- 地域ページ ---------- */

export function areaPage({ site, area, stores, areas }) {
  const depth = 2; // areas/{slug}/index.html
  const areaStores = stores.filter((s) => s.area === area.slug);
  const neighbors = (area.neighbors || []).map((n) => areas.find((a) => a.slug === n)).filter(Boolean)
    .filter((n) => stores.some((s) => s.area === n.slug));
  const bc = breadcrumb(site, [
    { name: "トップ", path: "" },
    { name: "エリア一覧", path: "areas/" },
    { name: `${area.name}のコーティング店`, path: `areas/${area.slug}/` },
  ], depth);
  const title = `${area.name}のカーコーティング店一覧【${areaStores.length}店舗を掲載】｜${site.shortName}`;
  const description = `${area.pref}${area.name}のカーコーティング店${areaStores.length}店舗を一覧で紹介。${area.intro || ""}資格者・設備・施工写真で比較できます。`;
  const up = "../".repeat(depth);

  const main = `
<h1>${esc(area.name)}のカーコーティング店一覧</h1>
<p class="lead">${esc(area.intro || "")}（掲載 ${areaStores.length} 店舗）</p>
<p><a class="btn" href="${up}compare/${area.slug}/">${esc(area.name)}の店舗を比較表で見る →</a></p>
<div class="card-grid">
${areaStores.map((s) => storeCard(s, area, depth)).join("\n")}
</div>
${neighbors.length ? `<section class="related"><h2>近隣エリアから探す</h2><ul class="inline-links">${neighbors
    .map((n) => `<li><a href="${up}areas/${n.slug}/">${esc(n.name)}のコーティング店一覧</a></li>`)
    .join("")}</ul></section>` : ""}`;

  const head = headTag({ site, title, description, urlPath: `areas/${area.slug}/`, jsonLd: [bc.jsonLd, itemListJsonLd(site, title, areaStores)], depth });
  return layout({ site, head, breadcrumbHtml: bc.html, main, depth });
}

export function areasIndexPage({ site, areas, stores }) {
  const depth = 1;
  const bc = breadcrumb(site, [{ name: "トップ", path: "" }, { name: "エリア一覧", path: "areas/" }], depth);
  const title = `エリアから探す｜${site.siteName}`;
  const description = `岐阜県内のカーコーティング店をエリア別に掲載。${areas.map((a) => a.name).join("・")}から探せます。`;
  const up = "../".repeat(depth);
  const main = `
<h1>エリアから探す</h1>
<div class="card-grid">
${areas.map((a) => {
    const count = stores.filter((s) => s.area === a.slug).length;
    return `<article class="card"><h3><a href="${up}areas/${a.slug}/">${esc(a.name)}</a></h3><p class="card-summary">${esc(a.intro || "")}</p><p class="card-more"><a href="${up}areas/${a.slug}/">${count}店舗を見る →</a></p></article>`;
  }).join("\n")}
</div>`;
  const head = headTag({ site, title, description, urlPath: "areas/", jsonLd: [bc.jsonLd], depth });
  return layout({ site, head, breadcrumbHtml: bc.html, main, depth });
}

/* ---------- 比較ページ ---------- */

function compareTable(storesList, areas, depth, { showArea = true } = {}) {
  const up = "../".repeat(depth);
  return `<div class="table-scroll"><table class="compare-table">
<thead><tr><th>店舗名</th>${showArea ? "<th>所在地</th>" : ""}<th>主な特徴</th><th>資格・設備</th><th>向いている人</th></tr></thead>
<tbody>
${storesList.map((s) => {
    const a = areas.find((x) => x.slug === s.area);
    return `<tr>
<td><a href="${up}stores/${s.slug}/"><strong>${esc(s.name)}</strong></a></td>
${showArea ? `<td>${esc(s.address || a.name)}</td>` : ""}
<td>${esc(s.summary || "")}</td>
<td>${esc([s.staff, (s.equipment || []).join("・"), s.photoCount ? `施工写真${s.photoCount.toLocaleString()}枚` : ""].filter(Boolean).join("／"))}</td>
<td>${esc(s.suitedFor || "")}</td>
</tr>`;
  }).join("\n")}
</tbody></table></div>`;
}

export function compareAreaPage({ site, area, stores, areas }) {
  const depth = 2; // compare/{slug}/
  const list = stores.filter((s) => s.area === area.slug);
  const ranked = list.filter((s) => s.rank).sort((a, b) => a.rank - b.rank);
  const bc = breadcrumb(site, [
    { name: "トップ", path: "" },
    { name: "比較ページ", path: "compare/" },
    { name: `${area.name}の比較`, path: `compare/${area.slug}/` },
  ], depth);
  const title = `【${new Date().getFullYear()}年版】${area.name}のカーコーティング店おすすめ比較｜${site.shortName}`;
  const description = `${area.pref}${area.name}のカーコーティング店${list.length}店舗を、資格者・設備・施工写真・向いている人で比較。目的別のおすすめも紹介します。`;
  const up = "../".repeat(depth);

  const main = `
<h1>${esc(area.name)}のカーコーティング店を比較</h1>
<p class="lead">「専門性」「施工実績の見えやすさ」「設備」「予約しやすさ」を軸に、${esc(area.name)}の${list.length}店舗を目的別に整理しました。</p>

${ranked.length ? `<section><h2>目的別おすすめ</h2><div class="card-grid">${ranked.map((s) => storeCard(s, area, depth)).join("")}</div></section>` : ""}

<section><h2>店舗比較表</h2>
${compareTable(list, areas, depth)}
<p class="small">${esc(site.disclaimer)}</p></section>

<section><h2>失敗しない選び方</h2>
<ol class="howto">
<li><strong>施工写真を見る</strong> — 写真が多い店舗は車種・色・仕上がりを事前に確認しやすく、濃色車や経年車ほど事例が参考になります。</li>
<li><strong>設備を見る</strong> — コーティングブース・待合室・純水手洗い・代車の有無は、雨天や長時間施工での安心材料です。</li>
<li><strong>資格者を見る</strong> — KeePerなら1級・EX資格者の在籍を確認。高額メニューほど説明のわかりやすさも大切です。</li>
</ol></section>`;

  const head = headTag({ site, title, description, urlPath: `compare/${area.slug}/`, jsonLd: [bc.jsonLd, itemListJsonLd(site, title, list)], depth });
  return layout({ site, head, breadcrumbHtml: bc.html, main, depth });
}

export function compareVsPage({ site, areaA, areaB, stores, areas }) {
  const depth = 2; // compare/{a}-vs-{b}/
  const listA = stores.filter((s) => s.area === areaA.slug);
  const listB = stores.filter((s) => s.area === areaB.slug);
  const bc = breadcrumb(site, [
    { name: "トップ", path: "" },
    { name: "比較ページ", path: "compare/" },
    { name: `${areaA.name}と${areaB.name}の比較`, path: `compare/${areaA.slug}-vs-${areaB.slug}/` },
  ], depth);
  const title = `${areaA.name}と${areaB.name}のカーコーティング店を比較｜${site.shortName}`;
  const description = `${areaA.name}（${listA.length}店舗）と${areaB.name}（${listB.length}店舗）のカーコーティング店をまとめて比較。通いやすさとメニューで選べます。`;
  const up = "../".repeat(depth);

  const main = `
<h1>${esc(areaA.name)}と${esc(areaB.name)}のコーティング店を比較</h1>
<p class="lead">生活圏や通勤経路によっては隣接エリアの店舗も選択肢になります。両エリアの店舗をまとめて比較できるようにしました。</p>
<section><h2>${esc(areaA.name)}の店舗（${listA.length}件）</h2>${compareTable(listA, areas, depth)}
<p><a href="${up}compare/${areaA.slug}/">${esc(areaA.name)}の詳しい比較を見る →</a></p></section>
<section><h2>${esc(areaB.name)}の店舗（${listB.length}件）</h2>${listB.length ? compareTable(listB, areas, depth) : `<p>${esc(areaB.name)}の店舗情報は現在準備中です。掲載が始まり次第、このページで比較できるようになります。</p>`}
${listB.length ? `<p><a href="${up}compare/${areaB.slug}/">${esc(areaB.name)}の詳しい比較を見る →</a></p>` : ""}</section>`;

  const head = headTag({ site, title, description, urlPath: `compare/${areaA.slug}-vs-${areaB.slug}/`, jsonLd: [bc.jsonLd], depth });
  return layout({ site, head, breadcrumbHtml: bc.html, main, depth });
}

export function compareMenuPage({ site, menuDef, storesList, areas }) {
  const depth = 3; // compare/menu/{slug}/
  const bc = breadcrumb(site, [
    { name: "トップ", path: "" },
    { name: "比較ページ", path: "compare/" },
    { name: `${menuDef.name}の比較`, path: `compare/menu/${menuDef.slug}/` },
  ], depth);
  const title = `${menuDef.name}の取扱店を比較【${storesList.length}店舗】｜${site.shortName}`;
  const description = `${menuDef.name}を取り扱う店舗${storesList.length}件を比較。${menuDef.description}`;

  const main = `
<h1>${esc(menuDef.name)}の取扱店を比較</h1>
<p class="lead">${esc(menuDef.description)}</p>
${compareTable(storesList, areas, depth)}
<p class="small">${esc(site.disclaimer)}</p>`;

  const head = headTag({ site, title, description, urlPath: `compare/menu/${menuDef.slug}/`, jsonLd: [bc.jsonLd, itemListJsonLd(site, title, storesList)], depth });
  return layout({ site, head, breadcrumbHtml: bc.html, main, depth });
}

export function compareIndexPage({ site, areas, stores, menuPages, vsPages }) {
  const depth = 1;
  const bc = breadcrumb(site, [{ name: "トップ", path: "" }, { name: "比較ページ", path: "compare/" }], depth);
  const title = `比較ページ一覧｜${site.siteName}`;
  const description = "エリア別・メニュー別のカーコーティング比較ページ一覧です。";
  const up = "../".repeat(depth);
  const areasWithStores = areas.filter((a) => stores.some((s) => s.area === a.slug));
  const main = `
<h1>比較ページ一覧</h1>
<section><h2>エリア別の比較</h2><ul class="inline-links">${areasWithStores
    .map((a) => `<li><a href="${up}compare/${a.slug}/">${esc(a.name)}のカーコーティング比較</a></li>`).join("")}</ul></section>
${vsPages.length ? `<section><h2>エリア同士の比較</h2><ul class="inline-links">${vsPages
    .map(([a, b]) => `<li><a href="${up}compare/${a.slug}-vs-${b.slug}/">${esc(a.name)}と${esc(b.name)}の比較</a></li>`).join("")}</ul></section>` : ""}
${menuPages.length ? `<section><h2>メニュー別の比較</h2><ul class="inline-links">${menuPages
    .map((m) => `<li><a href="${up}compare/menu/${m.slug}/">${esc(m.name)}の取扱店比較</a></li>`).join("")}</ul></section>` : ""}`;
  const head = headTag({ site, title, description, urlPath: "compare/", jsonLd: [bc.jsonLd], depth });
  return layout({ site, head, breadcrumbHtml: bc.html, main, depth });
}

/* ---------- トップ・固定ページ ---------- */

export function indexPage({ site, areas, stores, menuPages }) {
  const depth = 0;
  const ranked = stores.filter((s) => s.rank).sort((a, b) => a.rank - b.rank).slice(0, 3);
  const areasWithStores = areas.filter((a) => stores.some((s) => s.area === a.slug));
  const title = `${site.siteName}｜資格者・設備・施工写真で選べる`;
  const main = `
<section class="hero">
  <p class="eyebrow">岐阜県のカーコーティング比較</p>
  <h1>コーティング店選びを、<br>「資格者・設備・実績写真」で。</h1>
  <p class="lead">${esc(site.description)}</p>
  <p class="btn-row"><a class="btn" href="areas/">エリアから探す</a> <a class="btn btn-sub" href="compare/">比較ページを見る</a></p>
</section>

${ranked.length ? `<section><h2>目的別おすすめ店舗</h2><div class="card-grid">${ranked
    .map((s) => storeCard(s, areas.find((a) => a.slug === s.area), depth, { showArea: true })).join("")}</div></section>` : ""}

<section><h2>エリアから探す</h2><ul class="inline-links">${areasWithStores
    .map((a) => `<li><a href="areas/${a.slug}/">${esc(a.name)}（${stores.filter((s) => s.area === a.slug).length}店舗）</a></li>`).join("")}</ul></section>

${menuPages.length ? `<section><h2>メニューから比較する</h2><ul class="inline-links">${menuPages
    .map((m) => `<li><a href="compare/menu/${m.slug}/">${esc(m.name)}の取扱店比較</a></li>`).join("")}</ul></section>` : ""}`;
  const head = headTag({ site, title, description: site.description, urlPath: "", jsonLd: [{
    "@context": "https://schema.org", "@type": "WebSite", name: site.siteName, url: site.baseUrl,
  }], depth });
  return layout({ site, head, main, depth });
}

export function simplePage({ site, title, urlPath, bodyHtml, depth = 0 }) {
  const bc = breadcrumb(site, [{ name: "トップ", path: "" }, { name: title, path: urlPath }], depth);
  const head = headTag({ site, title: `${title}｜${site.siteName}`, description: `${site.siteName}の${title}ページです。`, urlPath, jsonLd: [bc.jsonLd], depth });
  return layout({ site, head, breadcrumbHtml: bc.html, main: `<h1>${esc(title)}</h1>${bodyHtml}`, depth });
}

export function notFoundPage({ site }) {
  const head = headTag({ site, title: `ページが見つかりません｜${site.siteName}`, description: "お探しのページは見つかりませんでした。", urlPath: "404.html", depth: 0 });
  return layout({ site, head, main: `<h1>ページが見つかりません</h1><p>URLが変更されたか、削除された可能性があります。<a href="./">トップページ</a>からお探しください。</p>`, depth: 0 });
}
