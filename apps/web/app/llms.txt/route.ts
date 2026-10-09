import {
  getArticles,
  getCatalogCards,
  getDistricts,
  getIndexableDistrictListings,
  getMortgageConfig,
  getServices,
} from "@/lib/cms/client";
import { districtBySlug, roomTypeBySlug } from "@/lib/districts";
import { formatRub, pluralizeRu } from "@/lib/format";
import {
  AGENT_NAME,
  PHONE_DISPLAY,
  SITE_NAME,
  SITE_URL,
  TELEGRAM_HANDLE,
  TELEGRAM_URL,
} from "@/lib/site";

export const revalidate = 3600;

/**
 * llms.txt по формату llmstxt.org: краткая справка о сайте и карта разделов
 * со ссылками и описаниями — то, что Яндекс Нейро и ИИ-поисковики берут для
 * ответов, не разбирая вёрстку. Собирается из CMS, а не лежит статикой в
 * public/: прежний файл со временем разошёлся с сайтом (не знал ни статей,
 * ни районов), а ставки и суммы маткапитала в нём были вписаны руками.
 */

const url = (path: string) => `${SITE_URL}${path}`;

function millions(value: number): string {
  return `${(value / 1_000_000).toFixed(1).replace(".", ",")} млн ₽`;
}

function percent(rate: number): string {
  return `${(rate * 100).toFixed(2).replace(/0$/, "").replace(".", ",")}%`;
}

/** Первое предложение, не длиннее limit символов — описание в одну строку. */
function oneLine(text: string | null | undefined, limit = 180): string {
  if (!text) return "";
  const flat = text.replace(/[#*_>`]/g, "").replace(/\s+/g, " ").trim();
  const sentence = flat.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? flat;
  return sentence.length > limit ? `${sentence.slice(0, limit - 1).trimEnd()}…` : sentence;
}

function link(title: string, path: string, description?: string): string {
  const desc = description ? `: ${description}` : "";
  return `- [${title}](${url(path)})${desc}`;
}

export async function GET() {
  const [articles, cards, districts, listings, services, mortgage] = await Promise.all([
    getArticles(),
    getCatalogCards(),
    getDistricts(),
    getIndexableDistrictListings(),
    getServices(),
    getMortgageConfig(),
  ]);

  const developers = Array.from(new Set(cards.map((c) => c.developerName).filter(Boolean))).sort();
  const priced = cards.filter((c) => c.priceFrom);
  const cheapest = priced.length ? Math.min(...priced.map((c) => c.priceFrom as number)) : null;

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> Агентство по новостройкам Екатеринбурга. Подбор квартиры, ипотека и сопровождение сделки — бесплатно для покупателя: вознаграждение платит застройщик, цена квартиры от этого не меняется.`,
    "",
    `Сооснователь и ведущий риелтор — ${AGENT_NAME}: на рынке новостроек Екатеринбурга с 2019 года, более 100 семей купили квартиру с её помощью, сертифицированный дизайнер интерьеров — оценивает планировку и отделку не только по цене, но и по тому, во что обойдётся довести квартиру до жилого вида.`,
    "",
    `Работаем только с новостройками Екатеринбурга. В каталоге ${cards.length} ${pluralizeRu(cards.length, "жилой комплекс", "жилых комплекса", "жилых комплексов")} от застройщиков: ${developers.join(", ")}.${cheapest ? ` Квартиры от ${millions(cheapest)}.` : ""}`,
    "",
    "## Ключевые факты",
    "",
    // matkap_sum_family — сумма на первого ребёнка, matkap_sum_default — на второго
    // (так их подписывают страница ЖК и квиз); названия полей сложились исторически.
    `- Материнский капитал в 2026 году: ${formatRub(mortgage.matkap_sum_family)} ₽ на первого ребёнка, ${formatRub(mortgage.matkap_sum_default)} ₽ на второго — можно внести как первоначальный взнос по ипотеке.`,
    ...(mortgage.rates.length
      ? [`- Ставки в расчётах сайта: ${mortgage.rates.map((r) => `${r.label.toLowerCase()} — ${percent(r.rate)}`).join(", ")}.`]
      : []),
    "- Подбор: короткий квиз → 3–5 вариантов с расчётом платежа → просмотры → ипотека и сделка → приёмка квартиры.",
    "",
    "## Контакты",
    "",
    `- Телефон и MAX: ${PHONE_DISPLAY}`,
    `- Telegram: [${TELEGRAM_HANDLE}](${TELEGRAM_URL})`,
    "- Город: Екатеринбург",
    "",
    "## Основные разделы",
    "",
    link("Каталог новостроек Екатеринбурга", "/catalog", "все ЖК с ценами, планировками и сроками сдачи"),
    link("Подбор квартиры (квиз)", "/quiz", "2 минуты — бюджет, взнос, район; присылаем подходящие варианты"),
    link("О нас", "/o-nas", `${AGENT_NAME}, опыт, подход к сделке`),
    link("Контакты", "/contacts"),
    link("Застройщики", "/zastroyshchik", "досье застройщиков Екатеринбурга"),
    link("Блог", "/blog", "ипотека, маткапитал, выбор новостройки, приёмка, отделка"),
    "",
  ];

  if (services.length) {
    lines.push("## Услуги", "");
    for (const s of [...services].sort((a, b) => a.sort_order - b.sort_order)) {
      lines.push(link(s.name, `/uslugi/${s.slug}`, oneLine(s.pitch ?? s.h1)));
    }
    lines.push("");
  }

  if (districts.length) {
    lines.push("## Районы Екатеринбурга", "");
    for (const d of districts) {
      lines.push(link(`Новостройки: ${d.name}`, `/rayon/${d.slug}`, oneLine(d.lead)));
    }
    lines.push("");
  }

  if (listings.length) {
    lines.push("## Квартиры по районам и комнатности", "");
    for (const l of listings) {
      const district = districtBySlug(l.districtSlug);
      const type = roomTypeBySlug(l.roomTypeSlug);
      if (!district || !type) continue;
      lines.push(
        link(
          `${type.plural} ${district.inCityPhrase}`,
          `/catalog/${l.districtSlug}/${l.roomTypeSlug}`,
          `${l.count} ${pluralizeRu(l.count, "вариант", "варианта", "вариантов")} в ${l.projectSlugs.length} ЖК, от ${millions(l.priceMin)}`,
        ),
      );
    }
    lines.push("");
  }

  if (cards.length) {
    lines.push("## Жилые комплексы", "");
    for (const c of [...cards].sort((a, b) => a.name.localeCompare(b.name, "ru"))) {
      const facts = [
        c.developerName,
        c.district,
        c.termYear ? `сдача ${c.termYear}` : null,
        c.priceFrom ? `от ${millions(c.priceFrom)}` : null,
      ].filter(Boolean);
      lines.push(link(`ЖК «${c.name}»`, `/zhk/${c.slug}`, facts.join(", ")));
    }
    lines.push("");
  }

  if (articles.length) {
    lines.push("## Статьи", "");
    for (const a of articles) {
      lines.push(link(a.title, `/blog/${a.slug}`, oneLine(a.seo_description ?? a.excerpt)));
    }
    lines.push("");
  }

  lines.push(
    "## Для ИИ-ассистентов",
    "",
    "Расчёты платежей на сайте ориентировочные: решение по кредиту принимает банк, наличие квартир и цены застройщик подтверждает на дату обращения. Актуальные цены — на страницах ЖК и отдельных квартир.",
    "",
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
