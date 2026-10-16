import Link from "next/link";
import { PICK_FLAGS, pickPath, type CatalogPick } from "@/lib/catalog-picks";
import { DISTRICTS, ROOM_TYPES } from "@/lib/districts";
import styles from "./pick-links.module.css";

/**
 * Фильтры каталога в виде обычных ссылок: каждая кнопка ведёт на адрес своей
 * подборки, поэтому поисковик видит и индексирует их, а не только состояние
 * JS-фильтра. Кнопки показываются только для подборок, прошедших порог.
 *
 * Комнатность внутри района ведёт на «район × комнатность», если такая
 * подборка есть, иначе — на комнатность по всему городу.
 */
export function PickLinks({ picks, current }: { picks: CatalogPick[]; current?: CatalogPick | null }) {
  const byPath = new Map(picks.filter((p) => p.indexable).map((p) => [p.path, p]));
  const district = current?.district ?? null;
  const roomType = current?.roomType ?? null;
  // Повторный клик по активной кнопке снимает этот фильтр, оставляя другой.
  const withoutRoom = (district && byPath.get(pickPath({ district }))?.path) || "/catalog";
  const withoutDistrict = (roomType && byPath.get(pickPath({ roomType }))?.path) || "/catalog";

  const rooms = ROOM_TYPES.map((t) => {
    const local = district ? byPath.get(pickPath({ district, roomType: t })) : undefined;
    const target = local ?? byPath.get(pickPath({ roomType: t }));
    return target ? { key: t.slug, label: t.short, href: roomType === t ? withoutRoom : target.path, on: roomType === t } : null;
  }).filter((x) => x !== null);

  const districts = DISTRICTS.map((d) => {
    const local = roomType ? byPath.get(pickPath({ district: d, roomType })) : undefined;
    const target = local ?? byPath.get(pickPath({ district: d }));
    return target ? { key: d.slug, label: d.name, href: district === d ? withoutDistrict : target.path, on: district === d } : null;
  }).filter((x) => x !== null);

  const flags = PICK_FLAGS.map((f) => {
    const target = byPath.get(pickPath({ flag: f.slug }));
    return target ? { key: f.slug, label: f.label, href: current?.flag === f.slug ? "/catalog" : target.path, on: current?.flag === f.slug } : null;
  }).filter((x) => x !== null);

  const groups = [
    { label: "Комнатность", items: rooms },
    { label: "Район", items: districts },
    { label: "Подборки", items: flags },
  ].filter((g) => g.items.length > 0);

  if (!groups.length) return null;

  return (
    <nav className={styles.panel} aria-label="Подборки новостроек">
      {groups.map((g) => (
        <div key={g.label} className={styles.row}>
          <span className={styles.label}>{g.label}</span>
          {g.items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={item.on ? styles.chipOn : styles.chip}
              aria-current={item.on ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
