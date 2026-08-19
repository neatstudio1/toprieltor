import type { Apartment } from "@/lib/cms/client";
import { pluralizeRu } from "@/lib/format";
import { PlanImage } from "./plan-image";
import styles from "./plan-section.module.css";

function typeLabel(type: string): string {
  if (type === "студия") return "Студия";
  const match = type.match(/^(\d)к$/);
  return match ? `${match[1]}-комнатная` : type;
}

export function PlanSection({ apartment }: { apartment: Apartment }) {
  const areaLabel = apartment.area_m2.toFixed(2).replace(".", ",");
  const floorsRange =
    apartment.floors.length > 0
      ? `${Math.min(...apartment.floors)}–${Math.max(...apartment.floors)}`
      : "—";

  return (
    <div className={styles.section}>
      <div className={styles.eyebrow}>Планировка</div>
      <div className={styles.card}>
        {apartment.floor_plan_url ? (
          <PlanImage
            src={apartment.floor_plan_url}
            alt={`Планировка ${typeLabel(apartment.type)} ${areaLabel} м²`}
          />
        ) : (
          <div />
        )}
        <div className={styles.factsList}>
          <div className={styles.factRow}>
            <span className={styles.factLabel}>Тип</span>
            <span className={styles.factValue}>{typeLabel(apartment.type)}</span>
          </div>
          <div className={styles.factRow}>
            <span className={styles.factLabel}>Площадь</span>
            <span className={styles.factValue}>{areaLabel} м²</span>
          </div>
          <div className={styles.factRow}>
            <span className={styles.factLabel}>Этажи</span>
            <span className={styles.factValue}>{floorsRange}</span>
          </div>
          <div className={styles.factRow}>
            <span className={styles.factLabel}>Отделка</span>
            <span className={styles.factValue}>{apartment.finish ?? "—"}</span>
          </div>
          <div className={styles.factRow}>
            <span className={styles.factLabel}>В наличии</span>
            <span className={styles.factValue}>
              {apartment.lots_count} {pluralizeRu(apartment.lots_count, "лот", "лота", "лотов")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
