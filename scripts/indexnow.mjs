#!/usr/bin/env node
/**
 * IndexNow: сообщить Яндексу (и Bing — у них общий протокол) об адресах сайта.
 *
 * Зачем: «Переобход страниц» в Вебмастере ручной, с дневным лимитом, и бывает
 * недоступен — в октябре 2026 Яндекс переводил его в режим «только чтение».
 * IndexNow принимает до 10 000 адресов за раз и работает без входа в кабинет.
 *
 * Ключ лежит в apps/web/public/<ключ>.txt — по нему поисковик проверяет, что
 * запрос пришёл от владельца сайта. Ключ публичный по устройству протокола.
 *
 * Запуск (после выкладки, из корня репозитория):
 *   node scripts/indexnow.mjs              — все адреса из sitemap.xml
 *   node scripts/indexnow.mjs /catalog /   — только перечисленные пути
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://ysrealty.ru";
const ENDPOINTS = ["https://yandex.com/indexnow", "https://api.indexnow.org/indexnow"];

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../apps/web/public");
const keyFile = fs.readdirSync(publicDir).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) {
  console.error("IndexNow: нет файла ключа в apps/web/public");
  process.exit(1);
}
const key = keyFile.replace(/\.txt$/, "");

async function sitemapUrls() {
  const index = await (await fetch(`${SITE}/sitemap.xml`)).text();
  const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const urls = [];
  for (const map of maps) {
    const xml = await (await fetch(map)).text();
    urls.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  }
  return urls;
}

const args = process.argv.slice(2);
const urls = args.length ? args.map((p) => `${SITE}${p.startsWith("/") ? p : `/${p}`}`) : await sitemapUrls();

// Ключ должен открываться с сайта до отправки, иначе поисковик отклонит запрос.
const check = await fetch(`${SITE}/${key}.txt`);
if (!check.ok || (await check.text()).trim() !== key) {
  console.error(`IndexNow: ${SITE}/${key}.txt не отдаёт ключ (HTTP ${check.status}) — сначала выложите сайт`);
  process.exit(1);
}

for (const endpoint of ENDPOINTS) {
  for (let i = 0; i < urls.length; i += 10_000) {
    const batch = urls.slice(i, i + 10_000);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: new URL(SITE).host, key, keyLocation: `${SITE}/${key}.txt`, urlList: batch }),
    });
    // 200 — принято, 202 — принято, ключ ещё проверяется.
    console.log(`IndexNow ${new URL(endpoint).host}: ${batch.length} адресов → HTTP ${res.status}`);
  }
}
