import Link from "next/link";
import type { Article } from "@/lib/cms/client";
import { ArticleCover } from "@/components/blog/article-cover";
import styles from "./related-posts.module.css";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export function RelatedPosts({
  title,
  eyebrow = "Блог",
  posts,
}: {
  title: string;
  eyebrow?: string;
  posts: Article[];
}) {
  if (!posts.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div>
          <div className={styles.eyebrow}>{eyebrow}</div>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <Link href="/blog" className={styles.allLink}>
          Все статьи →
        </Link>
      </div>
      <div className={styles.grid}>
        {posts.map((p) => (
          <Link key={`/blog/${p.slug}`} data-post="" href={`/blog/${p.slug}`} className={styles.card}>
            <div className={styles.photo}>
              <ArticleCover cover={p.cover} alt={p.title} fallbackLabel={p.category ?? "Статья"} sizes="(min-width: 1280px) 400px, 90vw" />
            </div>
            <div className={styles.body}>
              {p.category ? <div className={styles.category}>{p.category}</div> : null}
              <div className={styles.postTitle}>{p.title}</div>
              {p.excerpt ? <div className={styles.excerpt}>{p.excerpt}</div> : null}
              <div className={styles.meta}>
                {p.read_minutes ? <span>{p.read_minutes} мин</span> : null}
                {p.read_minutes ? <span>·</span> : null}
                <span>{formatDate(p.published_date)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
