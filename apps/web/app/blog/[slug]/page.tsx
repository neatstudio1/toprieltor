import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAllArticleSlugs,
  getArticleBySlug,
  getArticles,
  getCatalogCards,
  pickRelatedArticles,
  strapiMediaUrl,
} from "@/lib/cms/client";
import { getCatalogPicks } from "@/lib/catalog-picks";
import { LEAD_BLOCKS, endBlock, picksMentioned, projectsMentioned, splitArticle, topicBlock } from "@/lib/article-blocks";
import { ArticleCatalogLinks, ArticleLeadBlock } from "@/components/blog/article-lead-block";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArticleCover, generatedCoverPath } from "@/components/blog/article-cover";
import { ArticleProse, countForms } from "@/components/blog/article-prose";
import { ViewTracker } from "@/components/blog/view-tracker";
import { CommentSection } from "@/components/blog/comment-section";
import { pageMetadata } from "@/lib/site";
import { seoCopy } from "@/lib/seo-copy";
import { JsonLd } from "@/components/json-ld";
import { articleSchema, breadcrumbListSchema, faqPageSchema } from "@/lib/json-ld";
import { extractFaqFromMarkdown } from "@/lib/article-faq";
import { matchServiceForArticle } from "@/lib/article-service";
import styles from "./page.module.css";
import { yanaPhotos } from "@/lib/yana-photos";

export const revalidate = 3600;

interface RouteParams {
  slug: string;
}

export async function generateStaticParams(): Promise<RouteParams[]> {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  const copy = seoCopy(`/blog/${slug}`);
  return pageMetadata({
    title: copy?.title ?? article.seo_title ?? article.title,
    description: copy?.description ?? article.seo_description ?? article.excerpt ?? article.title,
    path: `/blog/${slug}`,
    image: article.cover ? strapiMediaUrl(article.cover) : generatedCoverPath(slug),
  });
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}

export default async function ArticlePage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [all, cards, picks] = await Promise.all([getArticles(), getCatalogCards(), getCatalogPicks()]);
  const keywords = [...(article.category?.split("·") ?? []), ...(article.tags ?? [])].map((k) => k.trim());
  const related = pickRelatedArticles(all, keywords, 3, slug);
  const faq = extractFaqFromMarkdown(article.content);
  const service = matchServiceForArticle(article);
  const [intro, middle, rest] = splitArticle(article.content);
  const midBlock = topicBlock(article);
  const mentionedProjects = projectsMentioned(article, cards);
  const mentionedPicks = picksMentioned(article, picks);

  // В конце статьи — один блок заявки по теме. Если статья сама заканчивается
  // формой ([[форма]] в последней части), второй блок следом не ставим.
  const lastPart = rest || middle || intro;
  const end = countForms(lastPart) ? null : endBlock(service);

  // У каждого блока заявки своё фото Яны: блоки по порядку на странице.
  const slots = [
    countForms(intro),
    middle ? 1 : 0,
    countForms(middle),
    rest && midBlock ? 1 : 0,
    countForms(rest),
    end ? 1 : 0,
  ];
  const photos = yanaPhotos(slug);
  const [introPhotos, [podborPhoto], middlePhotos, [midPhoto], restPhotos, [endPhoto]] = slots.map((n, i) => {
    const from = slots.slice(0, i).reduce((a, b) => a + b, 0);
    return photos.slice(from, from + n);
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", path: "/" },
          { name: "Блог", path: "/blog" },
          { name: article.title, path: `/blog/${slug}` },
        ])}
      />
      <JsonLd data={articleSchema(article, `/blog/${slug}`)} />
      {faq.length ? <JsonLd data={faqPageSchema(faq)} /> : null}
      <SiteHeader active="blog" cta="quiz" />

      <article>
        <div className={styles.head}>
          <Link href="/blog" className={styles.back}>
            ← Все статьи
          </Link>
          {article.category ? <div className={styles.category}>{article.category}</div> : null}
          <h1 className={styles.title}>{article.title}</h1>
          <div className={styles.meta}>
            <span className={styles.author}>{article.author_name}</span>
            <span>·</span>
            {article.author_role ? (
              <>
                <span>{article.author_role}</span>
                <span>·</span>
              </>
            ) : null}
            {article.read_minutes ? (
              <>
                <span>{article.read_minutes} мин</span>
                <span>·</span>
              </>
            ) : null}
            <span>{formatDate(article.published_date)}</span>
            <span>·</span>
            <span>{article.views ?? 0} просмотров</span>
          </div>
        </div>
        <ViewTracker articleDocumentId={article.documentId} />

        <div className={styles.heroWrap}>
          <div className={styles.hero}>
            <ArticleCover
              slug={article.slug}
              cover={article.cover}
              alt={article.title}
              fallbackLabel={article.category ?? article.title}
              sizes="(min-width: 1024px) 900px, 100vw"
            />
          </div>
        </div>

        <div className={styles.body}>
          <ArticleProse content={intro} className="prose" photos={introPhotos} />
          {middle ? <ArticleLeadBlock block={LEAD_BLOCKS.podbor} photo={podborPhoto} /> : null}
          {middle ? <ArticleProse content={middle} className="prose" photos={middlePhotos} /> : null}
          {rest && midBlock ? <ArticleLeadBlock block={midBlock} photo={midPhoto} /> : null}
          {rest ? <ArticleProse content={rest} className="prose" photos={restPhotos} /> : null}
          <ArticleCatalogLinks projects={mentionedProjects} picks={mentionedPicks} />
          {end ? <ArticleLeadBlock block={end.block} href={end.href} photo={endPhoto} /> : null}
        </div>

        <CommentSection articleDocumentId={article.documentId} />
      </article>

      {related.length ? (
        <div className={styles.relatedWrap}>
          <div className={styles.relatedEyebrow}>Читайте также</div>
          <div className={styles.relatedGrid}>
            {related.map((p) => (
              <Link key={`/blog/${p.slug}`} data-post="" href={`/blog/${p.slug}`} className={styles.relatedCard}>
                <div className={styles.relatedPhoto}>
                  <ArticleCover
                    slug={p.slug}
                    cover={p.cover}
                    alt={p.title}
                    fallbackLabel={p.category ?? "Статья"}
                    sizes="(min-width: 1024px) 380px, 90vw"
                  />
                </div>
                <div className={styles.relatedBody}>
                  {p.category ? <div className={styles.relatedCategory}>{p.category}</div> : null}
                  <div className={styles.relatedTitle}>{p.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}


      <SiteFooter />
    </div>
  );
}
