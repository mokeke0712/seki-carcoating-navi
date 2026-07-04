import fs from "node:fs";
import path from "node:path";
import { DIST, IMAGES_SRC, esc } from "./util.js";

const SIZES = [400, 800, 1200]; // 生成する幅

let sharp = null;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("⚠ sharp が見つかりません。画像はWebP変換せずコピーのみ行います（npm install で有効化）。");
}

/**
 * images/ 配下の元画像を店舗ごとに最適化して dist/assets/img/{slug}/ に出力する。
 * ファイル名は「{元名}-{幅}.webp」に正規化。
 * 戻り値: slug → [{base, alt用元名}] のマップ
 */
export async function optimizeImages(stores) {
  const manifest = {};
  for (const store of stores) {
    if (!store.images?.length) continue;
    const outDir = path.join(DIST, "assets", "img", store.slug);
    fs.mkdirSync(outDir, { recursive: true });
    manifest[store.slug] = [];
    for (const file of store.images) {
      const src = path.join(IMAGES_SRC, file);
      if (!fs.existsSync(src)) {
        console.warn(`⚠ 画像が見つかりません: images/${file}（スキップ）`);
        continue;
      }
      const base = file.replace(/\.[a-z]+$/i, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-");
      if (sharp) {
        for (const w of SIZES) {
          await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 })
            .toFile(path.join(outDir, `${base}-${w}.webp`));
        }
      } else {
        fs.copyFileSync(src, path.join(outDir, `${base}-800${path.extname(file)}`));
      }
      manifest[store.slug].push(base);
    }
  }
  return manifest;
}

/** レスポンシブ + LazyLoad対応の<img>タグを生成 */
export function imgTag(store, base, altText, depth) {
  const up = "../".repeat(depth);
  const dir = `${up}assets/img/${store.slug}`;
  if (!sharp) {
    return `<img src="${dir}/${base}-800.jpg" alt="${esc(altText)}" loading="lazy" decoding="async">`;
  }
  const srcset = SIZES.map((w) => `${dir}/${base}-${w}.webp ${w}w`).join(", ");
  return `<img src="${dir}/${base}-800.webp" srcset="${srcset}" sizes="(max-width: 640px) 100vw, 640px" alt="${esc(altText)}" loading="lazy" decoding="async" width="800" height="600">`;
}
