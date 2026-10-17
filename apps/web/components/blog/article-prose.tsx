import { Fragment } from "react";
import { Prose } from "@/components/prose";
import { ArticleInlineForm } from "./article-inline-form";

/**
 * Текст статьи с формами заявки внутри (2026-10-17).
 *
 * Отдельная строка `[[форма]]` в Markdown из CMS выводится как форма заявки —
 * так в статье можно поставить форму ровно туда, где текст зовёт её оставить
 * («…оставьте заявку ниже»), а не только в общие блоки по краям статьи.
 */
const FORM_MARKER = /^[ \t]*\[\[форма\]\][ \t]*$/m;

/** Сколько форм-меток в куске статьи — странице, чтобы раздать им разные фото. */
export function countForms(content: string): number {
  return content.match(new RegExp(FORM_MARKER.source, "gm"))?.length ?? 0;
}

export function ArticleProse({
  content,
  className,
  photos = [],
}: {
  content: string;
  className?: string;
  /** Портреты Яны для форм по порядку. */
  photos?: string[];
}) {
  const parts = content.split(new RegExp(FORM_MARKER.source, "gm"));
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 ? <ArticleInlineForm photo={photos[i - 1]} /> : null}
          {part.trim() ? <Prose content={part} className={className} /> : null}
        </Fragment>
      ))}
    </>
  );
}
