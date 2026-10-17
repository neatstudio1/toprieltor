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

export function ArticleProse({ content, className }: { content: string; className?: string }) {
  const parts = content.split(new RegExp(FORM_MARKER.source, "gm"));
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 ? <ArticleInlineForm /> : null}
          {part.trim() ? <Prose content={part} className={className} /> : null}
        </Fragment>
      ))}
    </>
  );
}
