import Image from "next/image";
import Link from "next/link";
import styles from "./similar-projects.module.css";

export interface SimilarProjectCard {
  slug: string;
  name: string;
  district: string | null;
  termYear: number | null;
  priceText: string;
  photo: string | null;
}

export function SimilarProjects({ projects }: { projects: SimilarProjectCard[] }) {
  if (!projects.length) return null;

  return (
    <div className={styles.section}>
      <div className={styles.eyebrow}>Похожие проекты · тот же бюджет</div>
      <div className={styles.grid}>
        {projects.map((p) => (
          <Link key={`/zhk/${p.slug}`} data-sim="" href={`/zhk/${p.slug}`} className={styles.card}>
            <div className={styles.photo}>
              {p.photo ? (
                <Image
                  data-simimg=""
                  src={p.photo}
                  alt={p.name}
                  fill
                  sizes="(min-width: 1280px) 400px, 90vw"
                  style={{ objectFit: "cover" }}
                />
              ) : null}
            </div>
            <div className={styles.body}>
              <div className={styles.name}>{p.name}</div>
              <div className={styles.meta}>
                {p.district ?? "Екатеринбург"}
                {p.termYear ? ` · сдача ${p.termYear}` : ""}
              </div>
              <div className={styles.price}>от {p.priceText}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
