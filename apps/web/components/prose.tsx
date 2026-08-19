import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders article `content` (Strapi richtext = Markdown) with full GFM support —
 * headings, bold/italic, tables, ordered/unordered lists, blockquotes, code,
 * links, and images inserted by URL (content-factory posts `![alt](url)`,
 * no Strapi Media upload needed).
 */
export function Prose({ content, className }: { content: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary content-factory image URLs, not known at build time
          img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" />,
          a: ({ href, children }) => (
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
