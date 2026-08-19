"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Apartment } from "@/lib/cms/client";
import { calcMonthlyPayment } from "@/lib/mortgage";
import { formatRub, pluralizeRu } from "@/lib/format";
import styles from "./apartments-list.module.css";

const PAGE_SIZE = 20;

const TYPE_GROUPS: { key: string; label: string; types: string[] }[] = [
  { key: "all", label: "Все", types: [] },
  { key: "студия", label: "Студии", types: ["студия"] },
  { key: "1к", label: "1к", types: ["1к"] },
  { key: "2к", label: "2к", types: ["2к"] },
  { key: "3plus", label: "3к+", types: ["3к", "4к", "5к"] },
];

function typeLabel(type: string): string {
  if (type === "студия") return "Студия";
  const match = type.match(/^(\d)к$/);
  return match ? `${match[1]}-комн.` : type;
}

function parseNum(v: string): number | null {
  const n = parseInt(v.replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? null : n;
}

export function ApartmentsList({
  apartments,
  projectSlug,
  matkapSum,
  rate,
}: {
  apartments: Apartment[];
  projectSlug: string;
  matkapSum: number;
  rate: number;
}) {
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<"priceAsc" | "priceDesc">("priceAsc");
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const listTopRef = useRef<HTMLDivElement | null>(null);

  const typeChips = useMemo(() => {
    const present = new Set(apartments.map((a) => a.type));
    return TYPE_GROUPS.filter((g) => g.key === "all" || g.types.some((t) => present.has(t)));
  }, [apartments]);

  const visible = useMemo(() => {
    const group = TYPE_GROUPS.find((g) => g.key === type);
    let list = apartments.filter((a) => {
      if (group && group.key !== "all" && !group.types.includes(a.type)) return false;
      if (priceMin != null && a.price_from < priceMin) return false;
      if (priceMax != null && a.price_from > priceMax) return false;
      return true;
    });
    list = [...list].sort((a, b) =>
      sort === "priceDesc" ? b.price_from - a.price_from : a.price_from - b.price_from,
    );
    return list;
  }, [apartments, type, priceMin, priceMax, sort]);

  useEffect(() => {
    setPage(1);
  }, [type, priceMin, priceMax, sort]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [visible, currentPage],
  );

  const goToPage = (p: number) => {
    setPage(p);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetType = () => {
    setType("all");
    setPriceMin(null);
    setPriceMax(null);
  };

  return (
    <div className={styles.section} ref={listTopRef}>
      <div className={styles.head}>
        <div>
          <div className={styles.eyebrow}>Квартиры в проекте</div>
          <h2 className={styles.title}>{apartments.length} планировок в продаже</h2>
        </div>
        <div className={styles.sortRow}>
          <span className={styles.sortLabel}>Сортировка</span>
          <button
            type="button"
            data-sortbtn=""
            data-on={sort === "priceAsc" ? "true" : "false"}
            className={styles.sortBtn}
            onClick={() => setSort("priceAsc")}
          >
            Дешевле
          </button>
          <button
            type="button"
            data-sortbtn=""
            data-on={sort === "priceDesc" ? "true" : "false"}
            className={styles.sortBtn}
            onClick={() => setSort("priceDesc")}
          >
            Дороже
          </button>
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.chips}>
          {typeChips.map((c) => (
            <button
              key={c.key}
              type="button"
              data-chip=""
              data-on={type === c.key ? "true" : "false"}
              className={styles.chip}
              onClick={() => setType(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className={styles.priceInputs}>
          <span className={styles.priceLabel}>Цена, ₽</span>
          <div className={styles.priceBox}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="от"
              value={priceMin ?? ""}
              onChange={(e) => setPriceMin(parseNum(e.target.value))}
              className={styles.priceInput}
            />
            <span className={styles.priceDivider} />
            <input
              type="text"
              inputMode="numeric"
              placeholder="до"
              value={priceMax ?? ""}
              onChange={(e) => setPriceMax(parseNum(e.target.value))}
              className={styles.priceInput}
            />
          </div>
          {priceMin != null || priceMax != null ? (
            <button
              type="button"
              aria-label="Сбросить цену"
              className={styles.clearBtn}
              onClick={() => {
                setPriceMin(null);
                setPriceMax(null);
              }}
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>В этой комнатности сейчас нет предложений</div>
          <div className={styles.emptyDesc}>Появляются регулярно — оставьте заявку, сообщим первыми.</div>
          <button type="button" className={`tpl-btn-prim ${styles.emptyBtn}`} onClick={resetType}>
            Показать все квартиры
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {paginated.map((a) => {
            const areaLabel = a.area_m2.toFixed(2).replace(".", ",");
            const floorsRange =
              a.floors.length > 1
                ? `${Math.min(...a.floors)}–${Math.max(...a.floors)}`
                : String(a.floors[0] ?? "—");
            const payment = calcMonthlyPayment({
              price: a.price_from,
              down: Math.min(matkapSum, a.price_from),
              annualRate: rate,
              termMonths: 240,
            });
            return (
              <Link key={a.slug} data-apt="" href={`/zhk/${projectSlug}/apartments/${a.slug}`} className={styles.card}>
                <div className={styles.planWrap}>
                  {a.floor_plan_url ? (
                    <Image src={a.floor_plan_url} alt="Планировка" fill sizes="150px" style={{ objectFit: "contain" }} />
                  ) : null}
                </div>
                <div className={styles.body}>
                  <div className={styles.aptTitle}>
                    {typeLabel(a.type)} · {areaLabel} м²
                  </div>
                  <div className={styles.meta}>
                    Этажи {floorsRange} {a.finish ? `· ${a.finish}` : ""}
                  </div>
                  <div className={styles.tags}>
                    {a.tags.slice(0, 3).map((t) => (
                      <span className={styles.tag} key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.priceCol}>
                  <div className={styles.priceLabelSmall}>Цена от</div>
                  <div className={styles.priceValue}>{a.price_from ? `${formatRub(a.price_from)} ₽` : "по запросу"}</div>
                  <div className={styles.priceRange}>
                    {a.price_min === a.price_max ? "единственный лот" : `${formatRub(a.price_min)}–${formatRub(a.price_max)} ₽`}
                  </div>
                  {a.price_from ? (
                    <div style={{ fontSize: 13, color: "var(--accent)", marginBottom: 6 }}>
                      Платёж от {formatRub(payment)} ₽/мес
                    </div>
                  ) : null}
                  <div className={styles.lots}>
                    в наличии {a.lots_count} {pluralizeRu(a.lots_count, "вариант", "варианта", "вариантов")}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageNav}
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            Назад
          </button>
          <div className={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                data-pagebtn=""
                data-on={p === currentPage ? "true" : "false"}
                className={styles.pageBtn}
                onClick={() => goToPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.pageNav}
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            Вперёд
          </button>
        </div>
      ) : null}
    </div>
  );
}
