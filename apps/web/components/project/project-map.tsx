import styles from "./project-map.module.css";

export function ProjectMap({
  district,
  geoLat,
  geoLon,
  address,
}: {
  district: string | null;
  geoLat: number | null;
  geoLon: number | null;
  address: string;
}) {
  const href =
    geoLat != null && geoLon != null
      ? `https://yandex.ru/maps/?pt=${geoLon},${geoLat}&z=15&l=map`
      : `https://yandex.ru/maps/54/yekaterinburg/?text=${encodeURIComponent(address)}`;

  return (
    <div className={styles.section}>
      <div className={styles.eyebrow}>На карте{district ? ` · ${district}` : ""}</div>
      <a href={href} target="_blank" rel="noreferrer" className={styles.mapLink}>
        <div className={styles.grid} />
        <div className={styles.pin}>
          <svg width="34" height="44" viewBox="0 0 34 44" fill="none">
            <path d="M17 43C17 43 32 27 32 16A15 15 0 1 0 2 16C2 27 17 43 17 43Z" fill="var(--accent)" />
            <circle cx="17" cy="16" r="6" fill="#fff" />
          </svg>
        </div>
        <div className={styles.caption}>{address} · открыть в Яндекс.Картах →</div>
      </a>
    </div>
  );
}
