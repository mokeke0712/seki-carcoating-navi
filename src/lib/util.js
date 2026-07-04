import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DATA = path.join(ROOT, "data");
export const DIST = path.join(ROOT, "dist");
export const IMAGES_SRC = path.join(ROOT, "images");

/** HTMLエスケープ */
export const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** JSONファイル読込 */
export const loadJSON = (file) => JSON.parse(fs.readFileSync(path.join(DATA, file), "utf8"));

/** ディレクトリを作ってファイル書き込み */
export function writePage(relPath, html) {
  const out = path.join(DIST, relPath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
}

/** 全角混じり文字列 → URLスラッグ検証（データ側でslug必須にする） */
export function validateStore(store, areas) {
  const errors = [];
  if (!store.slug || !/^[a-z0-9-]+$/.test(store.slug)) errors.push(`slugが不正です: "${store.slug}"（半角英数とハイフンのみ）`);
  if (!store.name) errors.push("nameは必須です");
  if (!store.area) errors.push(`[${store.name}] areaは必須です`);
  else if (!areas.find((a) => a.slug === store.area)) errors.push(`[${store.name}] area "${store.area}" がareas.jsonにありません`);
  return errors;
}

/** 店舗がどの比較メニューに該当するか（キーワード部分一致） */
export function menusOfStore(store, menuDefs) {
  const text = [store.name, ...(store.badges || []), ...(store.features || []), ...(store.menus || []).map((m) => m.name)].join(" ");
  return menuDefs.filter((def) => def.keywords.some((kw) => text.includes(kw)));
}

/** 価格文字列から数値を抜く（構造化データ用、無ければnull） */
export function priceNumber(priceStr = "") {
  const m = String(priceStr).replace(/,/g, "").match(/(\d{4,7})/);
  return m ? Number(m[1]) : null;
}
