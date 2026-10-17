import Link from "next/link";
import { PICK_FLAGS, pickPath, type CatalogPick, type PickFlag } from "@/lib/catalog-picks";
import { DISTRICTS, ROOM_TYPES, type District, type RoomType } from "@/lib/districts";
import styles from "./pick-links.module.css";

interface Current {
  district: District | null;
  roomType: RoomType | null;
  flag: PickFlag | null;
}

/**
 * Фильтры каталога в виде обычных ссылок: каждая кнопка ведёт на адрес своей
 * подборки, поэтому поисковик видит и индексирует их, а не только состояние
 * JS-фильтра.
 *
 * Фильтры складываются (2026-10-17): кнопка меняет только своё измерение и
 * сохраняет остальные — «1-комнатные в Академическом» + «С отделкой» дают
 * «1-комнатные с отделкой в Академическом», а не отделку по всему городу.
 * Повторный клик по активной кнопке снимает этот фильтр. Кнопки, под которыми
 * сейчас нет квартир, не показываются; ссылки на подборки вне индекса — nofollow.
 */
export function PickLinks({ picks, current }: { picks: CatalogPick[]; current?: Current | null }) {
  const byPath = new Map(picks.map((p) => [p.path, p]));
  const cur: Current = current ?? { district: null, roomType: null, flag: null };

  function item(key: string, label: string, next: Current, on: boolean) {
    const href = pickPath(next);
    const target = byPath.get(href);
    // Снять фильтр можно всегда — если уровнем выше подборки нет, это каталог.
    if (!on && !target) return null;
    return { key, label, href, on, count: on ? null : (target?.count ?? null), nofollow: Boolean(target && !target.indexable) };
  }

  const rooms = ROOM_TYPES.map((t) =>
    item(t.slug, t.short, { ...cur, roomType: cur.roomType === t ? null : t }, cur.roomType === t),
  ).filter((x) => x !== null);

  const districts = DISTRICTS.map((d) =>
    item(d.slug, d.name, { ...cur, district: cur.district === d ? null : d }, cur.district === d),
  ).filter((x) => x !== null);

  const flags = PICK_FLAGS.map((f) =>
    item(f.slug, f.label, { ...cur, flag: cur.flag === f.slug ? null : f.slug }, cur.flag === f.slug),
  ).filter((x) => x !== null);

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
          <div className={styles.chips}>
            {g.items.map((it) => (
              <Link
                key={it.key}
                href={it.href}
                className={it.on ? styles.chipOn : styles.chip}
                aria-current={it.on ? "page" : undefined}
                rel={it.nofollow ? "nofollow" : undefined}
                title={it.on ? "Снять фильтр" : undefined}
              >
                {it.label}
                {it.on ? <span className={styles.x}>×</span> : null}
                {it.count !== null ? <span className={styles.count}>{it.count}</span> : null}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
