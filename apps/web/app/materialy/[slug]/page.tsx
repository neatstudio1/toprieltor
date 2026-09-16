import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MagnetForm } from "@/components/magnet/magnet-form";
import { MAGNETS, findMagnet } from "@/lib/magnets";
import { pageMetadata } from "@/lib/site";
import styles from "@/components/magnet/magnet-page.module.css";

/**
 * Страница лид-магнита — посадочная для роликов, которые обещают материал.
 * Ссылка в описании ведёт сюда с utm_campaign, форма отдаёт материал сразу.
 */

export const revalidate = 3600;

interface RouteParams {
  slug: string;
}

export async function generateStaticParams(): Promise<RouteParams[]> {
  return MAGNETS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { slug } = await params;
  const m = findMagnet(slug);
  if (!m) return {};
  return pageMetadata({ title: m.title, description: m.lede, path: `/materialy/${slug}` });
}

export default async function MagnetPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const magnet = findMagnet(slug);
  if (!magnet) notFound();

  return (
    <>
      <SiteHeader />
      <main className={styles.wrap}>
        <div className={styles.eyebrow}>Материал по слову «{magnet.word}»</div>
        <h1 className={styles.title}>{magnet.title}</h1>
        <p className={styles.lede}>{magnet.lede}</p>

        <ul className={styles.teaser}>
          {magnet.teaser.map((t) => (
            <li key={t}>
              <span className={styles.tick}>→</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>

        <MagnetForm magnet={magnet} />
      </main>
      <SiteFooter />
    </>
  );
}
