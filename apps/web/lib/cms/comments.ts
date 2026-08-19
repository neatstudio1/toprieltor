const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export interface ArticleComment {
  id: number;
  documentId: string;
  author_name: string;
  text: string;
  createdAt: string;
}

export async function getApprovedComments(articleDocumentId: string): Promise<ArticleComment[]> {
  const qs = new URLSearchParams();
  qs.set("filters[article][documentId][$eq]", articleDocumentId);
  qs.set("sort", "createdAt:desc");
  const res = await fetch(`${STRAPI_URL}/api/comments?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) return [];
  const body = await res.json();
  return body.data ?? [];
}

export interface CommentInput {
  authorName: string;
  text: string;
  articleDocumentId: string;
  website: string;
  elapsedMs: number;
}

export type CommentResult = { ok: true } | { ok: false; message: string };

export async function submitComment(input: CommentInput): Promise<CommentResult> {
  try {
    const res = await fetch(`${STRAPI_URL}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          author_name: input.authorName,
          text: input.text,
          article: input.articleDocumentId,
        },
        website: input.website,
        elapsed_ms: input.elapsedMs,
      }),
    });

    if (res.ok) return { ok: true };
    if (res.status === 429) {
      return { ok: false, message: "Слишком много попыток. Попробуйте через минуту." };
    }
    const body = await res.json().catch(() => null);
    const message: string | undefined = body?.error?.message;
    return { ok: false, message: message ?? "Не удалось отправить комментарий. Попробуйте ещё раз." };
  } catch {
    return { ok: false, message: "Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз." };
  }
}

export function trackArticleView(articleDocumentId: string) {
  fetch(`${STRAPI_URL}/api/articles/${articleDocumentId}/view`, { method: "POST" }).catch(() => {
    // Best-effort — a failed view count shouldn't disrupt reading the article.
  });
}
