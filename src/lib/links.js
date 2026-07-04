import { esc, menusOfStore } from "./util.js";

/**
 * 店舗ページに載せる「関連リンク」を自動計算する。
 * ルール:
 *  1. 同エリアの他店舗（最大4件）
 *  2. 店舗が該当する比較メニューページ
 *  3. 所属エリアページ + エリア比較ページ
 *  4. 隣接エリアページ
 */
export function relatedForStore(store, { stores, areas, site }) {
  const area = areas.find((a) => a.slug === store.area);
  const sameArea = stores.filter((s) => s.area === store.area && s.slug !== store.slug).slice(0, 4);
  const menus = menusOfStore(store, site.menus);
  const neighbors = (area.neighbors || []).map((n) => areas.find((a) => a.slug === n)).filter(Boolean)
    .filter((n) => stores.some((s) => s.area === n.slug));
  return { area, sameArea, menus, neighbors };
}

/** 関連リンクセクションHTML（depthはページ階層の深さ） */
export function relatedLinksHtml(rel, depth) {
  const up = "../".repeat(depth);
  const blocks = [];
  if (rel.sameArea.length) {
    blocks.push(`<div class="rel-block"><h3>${esc(rel.area.name)}の他の店舗</h3><ul>${rel.sameArea
      .map((s) => `<li><a href="${up}stores/${s.slug}/">${esc(s.name)}</a> — ${esc(s.suitedFor || s.summary || "")}</li>`)
      .join("")}</ul></div>`);
  }
  if (rel.menus.length) {
    blocks.push(`<div class="rel-block"><h3>メニューで比較する</h3><ul>${rel.menus
      .map((m) => `<li><a href="${up}compare/menu/${m.slug}/">${esc(m.name)}の取扱店を比較</a></li>`)
      .join("")}</ul></div>`);
  }
  const areaLinks = [
    `<li><a href="${up}areas/${rel.area.slug}/">${esc(rel.area.name)}のコーティング店一覧</a></li>`,
    `<li><a href="${up}compare/${rel.area.slug}/">${esc(rel.area.name)}のコーティング店を比較</a></li>`,
    ...rel.neighbors.map((n) => `<li><a href="${up}areas/${n.slug}/">${esc(n.name)}のコーティング店一覧</a></li>`),
  ];
  blocks.push(`<div class="rel-block"><h3>エリアから探す</h3><ul>${areaLinks.join("")}</ul></div>`);
  return `<section class="related"><h2>関連ページ</h2><div class="rel-grid">${blocks.join("")}</div></section>`;
}
