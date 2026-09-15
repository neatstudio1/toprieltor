"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CatalogCard } from "@/lib/cms/client";
import { formatRub } from "@/lib/format";
import styles from "./catalog-filters.module.css";

type Chip = { key: string; label: string };

const ROOM_GROUPS: { key: string; label: string; types: string[] }[] = [
  { key: "студия", label: "Студии", types: ["студия"] },
  { key: "1к", label: "1к", types: ["1к"] },
  { key: "2к", label: "2к", types: ["2к"] },
  { key: "3к", label: "3к", types: ["3к"] },
  { key: "4plus", label: "4к+", types: ["4к", "5к"] },
];
const ROOM_ORDER = ["студия", "1к", "2к", "3к", "4к", "5к"];

const PRICE_BUCKETS: { key: string; label: string; test: (n: number) => boolean }[] = [
  { key: "all", label: "Любая", test: () => true },
  { key: "4", label: "до 4 млн", test: (n) => n < 4_000_000 },
  { key: "5", label: "4–5 млн", test: (n) => n >= 4_000_000 && n < 5_000_000 },
  { key: "6", label: "5–6 млн", test: (n) => n >= 5_000_000 && n < 6_000_000 },
  { key: "6plus", label: "от 6 млн", test: (n) => n >= 6_000_000 },
];

const SORT_OPTIONS: Chip[] = [
  { key: "priceAsc", label: "Дешевле" },
  { key: "priceDesc", label: "Дороже" },
  { key: "name", label: "По названию" },
];

function roomsText(roomTypes: string[]): string {
  const sorted = [...roomTypes].sort((a, b) => ROOM_ORDER.indexOf(a) - ROOM_ORDER.indexOf(b));
  return sorted
    .map((t) => (t === "студия" ? "студии" : t))
    .join(", ");
}

const VISIBLE_CHIPS = 3;

function FilterChipGroup({
  label,
  chips,
  activeKey,
  onSelect,
}: {
  label: string;
  chips: Chip[];
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = chips.length > VISIBLE_CHIPS;

  let visibleChips = chips;
  if (!expanded && canExpand) {
    visibleChips = chips.slice(0, VISIBLE_CHIPS);
    const activeHidden = !visibleChips.some((c) => c.key === activeKey);
    if (activeHidden) {
      const active = chips.find((c) => c.key === activeKey);
      if (active) visibleChips = [...visibleChips, active];
    }
  }

  return (
    <div className={styles.chipRow}>
      <span className={styles.chipLabel}>{label}</span>
      {visibleChips.map((c) => (
        <button
          key={c.key}
          type="button"
          data-chip=""
          data-on={activeKey === c.key ? "true" : "false"}
          className={styles.chip}
          onClick={() => onSelect(c.key)}
        >
          {c.label}
        </button>
      ))}
      {canExpand ? (
        <button type="button" className={styles.expandBtn} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Свернуть" : "Развернуть фильтр"}
        </button>
      ) : null}
    </div>
  );
}

export function CatalogFilters({
  cards,
  districts,
  developers,
  terms,
  rateText,
}: {
  cards: CatalogCard[];
  districts: string[];
  developers: string[];
  terms: number[];
  rateText: string;
}) {
  const [room, setRoom] = useState("all");
  const [district, setDistrict] = useState("all");
  const [dev, setDev] = useState("all");
  const [term, setTerm] = useState("all");
  const [price, setPrice] = useState("all");
  const [sort, setSort] = useState<"priceAsc" | "priceDesc" | "name">("priceAsc");

  const roomChips: Chip[] = useMemo(() => {
    const present = new Set(cards.flatMap((c) => c.roomTypes));
    const groups = ROOM_GROUPS.filter((g) => g.types.some((t) => present.has(t)));
    return [{ key: "all", label: "Все" }, ...groups.map((g) => ({ key: g.key, label: g.label }))];
  }, [cards]);

  const districtChips: Chip[] = useMemo(
    () => [{ key: "all", label: "Все районы" }, ...districts.map((d) => ({ key: d, label: d }))],
    [districts],
  );
  const devChips: Chip[] = useMemo(
    () => [{ key: "all", label: "Все" }, ...developers.map((d) => ({ key: d, label: d }))],
    [developers],
  );
  const termChips: Chip[] = useMemo(
    () => [{ key: "all", label: "Любой" }, ...terms.map((t) => ({ key: String(t), label: String(t) }))],
    [terms],
  );

  const hasFilters = room !== "all" || district !== "all" || dev !== "all" || term !== "all" || price !== "all";

  const resetFilters = () => {
    setRoom("all");
    setDistrict("all");
    setDev("all");
    setTerm("all");
    setPrice("all");
  };

  const visible = useMemo(() => {
    const priceBucket = PRICE_BUCKETS.find((b) => b.key === price) ?? PRICE_BUCKETS[0];
    const roomGroup = ROOM_GROUPS.find((g) => g.key === room);
    let list = cards.filter((c) => {
      if (roomGroup && !roomGroup.types.some((t) => c.roomTypes.includes(t))) return false;
      if (district !== "all" && c.district !== district) return false;
      if (dev !== "all" && c.developerName !== dev) return false;
      if (term !== "all" && String(c.termYear) !== term) return false;
      if (c.priceFrom !== null && !priceBucket.test(c.priceFrom)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ru");
      // Projects without priced apartments sort to the end regardless of direction.
      if (a.priceFrom === null && b.priceFrom === null) return 0;
      if (a.priceFrom === null) return 1;
      if (b.priceFrom === null) return -1;
      return sort === "priceAsc" ? a.priceFrom - b.priceFrom : b.priceFrom - a.priceFrom;
    });
    return list;
  }, [cards, room, district, dev, term, price, sort]);

  return (
    <>
      <div className={styles.filterBar}>
        <div className={styles.filterInner}>
          <FilterChipGroup label="Комнатность" chips={roomChips} activeKey={room} onSelect={setRoom} />
          <FilterChipGroup label="Район" chips={districtChips} activeKey={district} onSelect={setDistrict} />
          <FilterChipGroup label="Застройщик" chips={devChips} activeKey={dev} onSelect={setDev} />
          <div className={styles.chipGroups}>
            <FilterChipGroup label="Срок сдачи" chips={termChips} activeKey={term} onSelect={setTerm} />
            <FilterChipGroup label="Цена от" chips={PRICE_BUCKETS} activeKey={price} onSelect={setPrice} />
          </div>
          <div className={styles.footerRow}>
            <div className={styles.resultInfo}>
              <span>
                <b className={styles.resultCount}>{visible.length}</b> объектов
              </span>
              {hasFilters ? (
                <button type="button" className={styles.resetBtn} onClick={resetFilters}>
                  Сбросить фильтры
                </button>
              ) : null}
            </div>
            <div className={styles.sortRow}>
              <span className={styles.sortLabel}>Сортировка</span>
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  data-sortbtn=""
                  data-on={sort === s.key ? "true" : "false"}
                  className={styles.sortBtn}
                  onClick={() => setSort(s.key as typeof sort)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.gridSection}>
        {visible.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Ничего не нашлось под эти фильтры</div>
            <div className={styles.emptyDesc}>
              Сбросьте часть условий или доверьте подбор нашей команде — найдём варианты вне каталога.
            </div>
            <button type="button" className={`tpl-btn-prim ${styles.emptyBtn}`} onClick={resetFilters}>
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {visible.map((c) => (
              <Link key={`/zhk/${c.slug}`} data-jk="" href={`/zhk/${c.slug}`} className={styles.card}>
                <div className={styles.photo}>
                  {c.photo ? (
                    <Image
                      data-jkimg=""
                      src={c.photo}
                      alt={c.name}
                      fill
                      sizes="(min-width: 1280px) 400px, 90vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : null}
                  {c.termYear ? <div className={styles.badge}>Сдача {c.termYear}</div> : null}
                </div>
                <div className={styles.body}>
                  <div className={styles.name}>{c.name}</div>
                  <div className={styles.dev}>{c.developerName}</div>
                  <div className={styles.meta}>
                    {c.district ?? "Екатеринбург"}
                    {c.roomTypes.length ? ` · ${roomsText(c.roomTypes)}` : ""}
                    {c.termYear ? ` · сдача ${c.termYear}` : ""}
                  </div>
                  <div className={styles.factsRow}>
                    <div className={styles.fact}>
                      <div className={styles.factLabel}>Цена от</div>
                      <div className={styles.factValue}>
                        {c.priceFrom !== null ? `${formatRub(c.priceFrom)} ₽` : "—"}
                      </div>
                    </div>
                    <div className={styles.factBordered}>
                      <div className={styles.factLabel}>Площадь</div>
                      <div className={styles.factValue}>
                        {c.areaFromM2 !== null ? `от ${c.areaFromM2.toFixed(1).replace(".", ",")} м²` : "—"}
                      </div>
                    </div>
                    <div className={styles.factBordered}>
                      <div className={styles.factLabel}>Ставка от</div>
                      <div className={styles.factValueAccent}>{rateText}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
