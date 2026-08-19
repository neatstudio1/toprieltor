"use client";

import { useRef, useState, type FormEvent } from "react";
import { submitComment } from "@/lib/cms/comments";
import styles from "./comment-section.module.css";

export function CommentForm({ articleDocumentId }: { articleDocumentId: string }) {
  const mountedAtRef = useRef(Date.now());
  const [authorName, setAuthorName] = useState("");
  const [text, setText] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage("");

    const result = await submitComment({
      authorName,
      text,
      website,
      articleDocumentId,
      elapsedMs: Date.now() - mountedAtRef.current,
    });

    if (result.ok) {
      setStatus("success");
      setAuthorName("");
      setText("");
    } else {
      setStatus("error");
      setErrorMessage(result.message);
    }
  }

  if (status === "success") {
    return <div className={styles.thanksBox}>Спасибо! Комментарий отправлен и появится после проверки модератором.</div>;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formRow}>
        <input
          className={styles.input}
          type="text"
          placeholder="Ваше имя"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>
      <textarea
        className={styles.textarea}
        placeholder="Ваш комментарий"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        required
      />
      {/* Honeypot: hidden from real users via CSS, only bots that autofill every field touch it. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className={styles.honeypot}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      {status === "error" ? <div className={styles.errorText}>{errorMessage}</div> : null}
      <button type="submit" className={`tpl-btn-prim ${styles.submitBtn}`} disabled={status === "submitting"}>
        {status === "submitting" ? "Отправляем…" : "Оставить комментарий"}
      </button>
    </form>
  );
}
