import type { Apartment, Project } from "@/lib/cms/client";
import { formatRub, pluralizeRu } from "@/lib/format";
import { ViewingCtaButton } from "@/components/lead-modal/viewing-cta-button";
import styles from "./sticky-info-card.module.css";

function typeToTitle(type: string): string {
  if (type === "студия") return "Студия";
  const match = type.match(/^(\d)к$/);
  if (match) return `${match[1]}-комнатная`;
  return type;
}

function formatArea(areaM2: number): string {
  return areaM2.toFixed(2).replace(".", ",");
}

function deliveryRange(project: Project): string | null {
  const years = project.queues
    .map((q) => q.delivery?.match(/(\d{4})/)?.[1])
    .filter((y): y is string => Boolean(y))
    .map(Number);
  if (!years.length) return project.delivery_date;
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? String(min) : `${min}–${max}`;
}

export function StickyInfoCard({ apartment }: { apartment: Apartment }) {
  const project = apartment.project!;
  const floors = apartment.floors;
  const floorsRange =
    floors.length > 0
      ? `${Math.min(...floors)}–${Math.max(...floors)}`
      : "—";
  const pricePerM2 = formatRub(apartment.price_from / apartment.area_m2);
  const rangeShort =
    apartment.price_min === apartment.price_max
      ? `${formatRub(apartment.price_min)} ₽`
      : `${formatRub(apartment.price_min)} до ${formatRub(apartment.price_max)} ₽`;

  return (
    <div className={styles.card}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>
          {typeToTitle(apartment.type)}, {formatArea(apartment.area_m2)} м²
        </h1>
        <div className={styles.subtitle}>
          ЖК «{project.name}» · {project.district}
        </div>
      </div>
      <div className={styles.priceBlock}>
        <div className={styles.priceLabel}>Цена от</div>
        <div className={styles.price}>{formatRub(apartment.price_from)} ₽</div>
        <div className={styles.priceMeta}>
          <span>{pricePerM2} ₽/м²</span>
          <span className={styles.priceMetaDivider}>от {rangeShort}</span>
        </div>
      </div>
      <div className={styles.factsGrid}>
        <div>
          <div className={styles.factLabel}>Этажи</div>
          <div className={styles.factValue}>{floorsRange}</div>
        </div>
        <div>
          <div className={styles.factLabel}>Отделка</div>
          <div className={styles.factValue}>{apartment.finish ?? "—"}</div>
        </div>
        <div>
          <div className={styles.factLabel}>В наличии</div>
          <div className={styles.factValue}>
            {apartment.lots_count} {pluralizeRu(apartment.lots_count, "лот", "лота", "лотов")}
          </div>
        </div>
        <div>
          <div className={styles.factLabel}>Сдача</div>
          <div className={styles.factValue}>{deliveryRange(project) ?? "—"}</div>
        </div>
      </div>
      <div className={styles.actions}>
        <ViewingCtaButton className={`tpl-btn-prim ${styles.ctaPrimary}`} />
        <a href="#calc" className={`tpl-btn-sec ${styles.ctaSecondary}`}>
          Рассчитать ипотеку
        </a>
      </div>
    </div>
  );
}
