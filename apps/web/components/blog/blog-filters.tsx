"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/cms/client";
import { ArticleCover } from "@/components/blog/article-cover";
import styles from "./blog-filters.module.css";

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(iso));
}

export function BlogFilters({ articles }: { articles: Article[] }) {
  const [cat, setCat] = useState("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const a of articles) {
      (a.category ?? "").split("·").forEach((part) => {
        const trimmed = part.trim();
        if (trimmed) set.add(trimmed);
      });
    }
    return Array.from(set);
  }, [articles]);

  const visible = cat === "all" ? articles : articles.filter((a) => (a.category ?? "").includes(cat));

  return (
    <>
      <div className={styles.chipRow}>
        <button
          type="button"
          data-chip=""
          data-on={cat === "all" ? "true" : "false"}
          className={styles.chip}
          onClick={() => setCat("all")}
        >
          Все темы
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            data-chip=""
            data-on={cat === c ? "true" : "false"}
            className={styles.chip}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className={styles.gridSection}>
        {visible.length === 0 ? (
          <div className={styles.empty}>Пока нет статей в этой теме</div>
        ) : (
          <div className={styles.grid}>
            {visible.map((p) => (
              <Link key={`/blog/${p.slug}`} data-post="" href={`/blog/${p.slug}`} className={styles.card}>
                <div className={styles.photo}>
                  <div data-pimg="" style={{ position: "absolute", inset: 0 }}>
                    <ArticleCover
                      cover={p.cover}
                      alt={p.title}
                      fallbackLabel={p.category ?? "Статья"}
                      sizes="(min-width: 1024px) 380px, 90vw"
                    />
                  </div>
                </div>
                <div className={styles.body}>
                  {p.category ? <div className={styles.category}>{p.category}</div> : null}
                  <div className={styles.title}>{p.title}</div>
                  {p.excerpt ? <div className={styles.excerpt}>{p.excerpt}</div> : null}
                  <div className={styles.meta}>
                    {p.read_minutes ? <span>{p.read_minutes} мин</span> : null}
                    {p.read_minutes ? <span>·</span> : null}
                    <span>{formatShortDate(p.published_date)}</span>
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
