export interface InfraGroup {
  title: string;
  count: string;
  items: string[];
}

type Rule = { title: string; test: RegExp };

function categorize(items: string[], rules: Rule[], fallbackTitle: string): InfraGroup[] {
  const buckets = new Map<string, string[]>();

  for (const item of items) {
    const rule = rules.find((r) => r.test.test(item));
    const title = rule?.title ?? fallbackTitle;
    if (!buckets.has(title)) buckets.set(title, []);
    buckets.get(title)!.push(item);
  }

  const order = [...rules.map((r) => r.title), fallbackTitle];
  return order
    .filter((title) => buckets.has(title))
    .map((title) => {
      const groupItems = buckets.get(title)!;
      return { title, count: String(groupItems.length), items: groupItems };
    });
}

const APARTMENT_RULES: Rule[] = [
  { title: "Детские сады", test: /детск.*сад|ясли|сандалик/i },
  { title: "Школы", test: /школ|сош|гимнази|лице[йя]|техникум|колледж/i },
  { title: "Медицина", test: /поликлиник|больниц|медицин|клиник/i },
];

/**
 * Real infrastructure data is a flat list of place names (Strapi
 * `project.infrastructure: string[]`). The design groups it into labeled
 * columns — this is a display-only heuristic, nothing is persisted.
 * 4-bucket variant used on the apartment page.
 */
export function categorizeInfrastructure(items: string[]): InfraGroup[] {
  return categorize(items, APARTMENT_RULES, "Спорт и магазины");
}

const PROJECT_RULES: Rule[] = [
  { title: "Детские сады", test: /детск.*сад|ясли|сандалик/i },
  { title: "Школы и образование", test: /школ|сош|гимнази|лице[йя]|техникум|колледж/i },
  { title: "Медицина", test: /поликлиник|больниц|медицин|клиник/i },
  { title: "Спорт", test: /спорт|gym|фитнес|клуб/i },
];

/** 5-bucket variant (accordion) used on the ЖК project page. */
export function categorizeInfrastructureDetailed(items: string[]): InfraGroup[] {
  return categorize(items, PROJECT_RULES, "Магазины и услуги");
}
