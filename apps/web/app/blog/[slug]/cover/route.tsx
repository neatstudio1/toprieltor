import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getArticleBySlug } from "@/lib/cms/client";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 86400;

/**
 * Обложка статьи без своей картинки: заголовок и рубрика на фирменном фоне.
 * У 40 из 44 статей обложки не было — в ленте блога и в Яндекс.Картинках
 * вместо них стояла серая заглушка, а в соцсетях ссылка уходила без превью.
 *
 * Шрифт — Inter (OFL), лежит в assets/fonts: шрифт по умолчанию у next/og без кириллицы.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return new Response("Not found", { status: 404 });

  const font = await readFile(join(process.cwd(), "assets/fonts/Inter-SemiBold.otf"));
  const title = article.title.length > 110 ? `${article.title.slice(0, 107).trimEnd()}…` : article.title;
  const category = (article.category ?? "Новостройки Екатеринбурга").toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #131316 0%, #1e1b4b 100%)",
          color: "#fafafa",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 44, height: 6, background: "#818cf8", borderRadius: 3 }} />
          <div style={{ fontSize: 24, letterSpacing: 3, color: "#a5b4fc" }}>{category}</div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 70 ? 54 : 64,
            lineHeight: 1.12,
            letterSpacing: -1.5,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#a1a1aa" }}>
          <div style={{ display: "flex", color: "#fafafa" }}>{SITE_NAME}</div>
          <div style={{ display: "flex" }}>новостройки Екатеринбурга</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Inter", data: font, weight: 600, style: "normal" }],
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    },
  );
}
