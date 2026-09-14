import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function isInternalHref(href: string | undefined): boolean {
  if (!href) return false;
  return href.startsWith("/") || href.startsWith("#") || href.includes("ysrealty.ru");
}

/**
 * Renders article `content` (Strapi richtext = Markdown) with full GFM support —
 * headings, bold/italic, tables, ordered/unordered lists, blockquotes, code,
 * links, and images inserted by URL (content-factory posts `![alt](url)`,
 * no Strapi Media upload needed).
 *
 * A `#` heading inside the content renders as H2: the page already renders the
 * article title as its H1, and a second H1 dilutes it. H2/H3 keep their level —
 * they carry the article's real structure.
 * Internal links stay in the same tab — only genuinely external ones open a new one.
 */
export function Prose({ content, className }: { content: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary content-factory image URLs, not known at build time
          img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" />,
          a: ({ href, children }) =>
            isInternalHref(href) ? (
              <a href={href}>{children}</a>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
