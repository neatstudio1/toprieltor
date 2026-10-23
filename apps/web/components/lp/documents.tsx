"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { DOCUMENTS } from "@/lib/landings";
import s from "./lp.module.css";

export function Documents() {
  const scroller = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);

  useEffect(() => {
    if (zoom === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [zoom]);

  function scrollBy(direction: 1 | -1) {
    const el = scroller.current;
    if (el) el.scrollBy({ left: direction * Math.round(el.clientWidth * 0.7), behavior: "smooth" });
  }

  const doc = zoom === null ? null : DOCUMENTS[zoom];

  return (
    <div className={s.docs}>
      <div className={s.docsHead}>
        <div>
          <div className={s.docsLabel}>Образование Яны Чекуловой</div>
          <h3 className={s.docsTitle}>Диплом и сертификаты дизайнера интерьеров</h3>
        </div>
        <div className={s.docsArrows}>
          <button type="button" className={s.docsArrow} onClick={() => scrollBy(-1)} aria-label="Назад">
            ←
          </button>
          <button type="button" className={s.docsArrow} onClick={() => scrollBy(1)} aria-label="Вперёд">
            →
          </button>
        </div>
      </div>
      <div ref={scroller} className={s.docsScroller}>
        {DOCUMENTS.map((d, i) => (
          <button key={d.src} type="button" className={s.docCard} onClick={() => setZoom(i)}>
            <span className={s.docImage}>
              <Image src={d.src} alt="" width={d.width} height={d.height} sizes="(max-width: 767px) 70vw, 420px" />
            </span>
            <span className={s.docTitle}>{d.title}</span>
            <span className={s.docCaption}>{d.caption}</span>
          </button>
        ))}
      </div>

      {doc ? (
        <div
          className={s.docZoom}
          role="dialog"
          aria-modal="true"
          aria-label={doc.title}
          onClick={(e) => {
            if (e.target === e.currentTarget) setZoom(null);
          }}
        >
          <button type="button" className={s.docZoomClose} onClick={() => setZoom(null)} aria-label="Закрыть">
            ×
          </button>
          <Image src={doc.src} alt={doc.title} width={doc.width} height={doc.height} sizes="100vw" className={s.docZoomImage} />
        </div>
      ) : null}
    </div>
  );
}
