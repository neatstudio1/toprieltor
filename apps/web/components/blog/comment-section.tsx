import { getApprovedComments } from "@/lib/cms/comments";
import { CommentForm } from "./comment-form";
import styles from "./comment-section.module.css";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}

export async function CommentSection({ articleDocumentId }: { articleDocumentId: string }) {
  const comments = await getApprovedComments(articleDocumentId);

  return (
    <div className={styles.section}>
      <div className={styles.eyebrow}>Комментарии{comments.length ? ` (${comments.length})` : ""}</div>

      {comments.length ? (
        <div className={styles.list}>
          {comments.map((c) => (
            <div key={c.documentId} className={styles.comment}>
              <div className={styles.commentHead}>
                <span className={styles.commentAuthor}>{c.author_name}</span>
                <span className={styles.commentDate}>{formatDate(c.createdAt)}</span>
              </div>
              <div className={styles.commentText}>{c.text}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>Пока нет комментариев — будьте первым.</div>
      )}

      <CommentForm articleDocumentId={articleDocumentId} />
    </div>
  );
}
