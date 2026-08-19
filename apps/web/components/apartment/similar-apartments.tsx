import Image from "next/image";
import Link from "next/link";
import type { Apartment } from "@/lib/cms/client";
import { formatRub, pluralizeRu } from "@/lib/format";
import styles from "./similar-apartments.module.css";

function typeLabel(type: string): string {
  if (type === "студия") return "Студия";
  const match = type.match(/^(\d)к$/);
  return match ? `${match[1]}-комн.` : type;
}

export function SimilarApartments({
  apartments,
  projectSlug,
}: {
  apartments: Apartment[];
  projectSlug: string;
}) {
  if (!apartments.length) return null;

  return (
    <div className={styles.section}>
      <div className={styles.eyebrow}>Похожие квартиры · тот же проект</div>
      <div className={styles.grid}>
        {apartments.map((apt) => {
          const areaLabel = apt.area_m2.toFixed(2).replace(".", ",");
          const floorsRange =
            apt.floors.length > 0
              ? `${Math.min(...apt.floors)}–${Math.max(...apt.floors)}`
              : "—";
          return (
            <Link
              key={apt.slug}
              data-sim=""
              href={`/zhk/${projectSlug}/apartments/${apt.slug}`}
              className={styles.card}
            >
              <div className={styles.planWrap}>
                {apt.floor_plan_url ? (
                  <Image
                    src={apt.floor_plan_url}
                    alt="Планировка"
                    fill
                    sizes="280px"
                    style={{ objectFit: "contain" }}
                  />
                ) : null}
              </div>
              <div className={styles.body}>
                <div className={styles.title}>
                  {typeLabel(apt.type)} · {areaLabel} м²
                </div>
                <div className={styles.meta}>
                  Этажи {floorsRange} · {apt.lots_count}{" "}
                  {pluralizeRu(apt.lots_count, "вариант", "варианта", "вариантов")}
                </div>
                <div className={styles.price}>
                  от {formatRub(apt.price_from)} ₽
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
