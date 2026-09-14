import type { FaqItem } from "@/lib/cms/client";

// No \b after the Russian alternatives: JS word boundaries are ASCII-only, so
// \b never matches after a Cyrillic letter and the heading would be missed.
const FAQ_HEADING = /^(#{2,4})\s*(?:частые\s+вопросы|вопросы\s+и\s+ответы|faq)/i;

/**
 * Pulls a "Частые вопросы" section out of the article markdown so it can be
 * emitted as FAQPage structured data.
 *
 * The content factory writes the section as ordinary markdown — an H2/H3
 * "Частые вопросы" followed by one heading per question — so articles need no
 * extra CMS field and no change to the publishing API. Articles without such a
 * section simply yield an empty list.
 */
export function extractFaqFromMarkdown(markdown: string | null | undefined): FaqItem[] {
  if (!markdown) return [];

  const lines = markdown.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => FAQ_HEADING.test(line));
  if (startIndex === -1) return [];

  const sectionLevel = (lines[startIndex].match(/^#+/) ?? ["##"])[0].length;
  const questionLevel = sectionLevel + 1;

  const faq: FaqItem[] = [];
  let question: string | null = null;
  let answer: string[] = [];

  const flush = () => {
    if (!question) return;
    const text = answer.join(" ").replace(/\s+/g, " ").trim();
    if (text) faq.push({ q: question, a: text });
    question = null;
    answer = [];
  };

  for (const line of lines.slice(startIndex + 1)) {
    const heading = line.match(/^(#+)\s*(.+?)\s*$/);

    if (heading) {
      const level = heading[1].length;
      // A heading at the section's own level (or higher) ends the FAQ block.
      if (level <= sectionLevel) break;
      if (level === questionLevel) {
        flush();
        question = stripMarkdown(heading[2]);
        continue;
      }
    }

    if (question) answer.push(stripMarkdown(line));
  }

  flush();
  return faq;
}

function stripMarkdown(value: string): string {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>]/g, "")
    .replace(/^\s*[-–—]\s*/, "")
    .trim();
}
