"use client";

import { useState } from "react";
import Image from "next/image";
import { useLightbox } from "@/components/apartment/lightbox-provider";
import styles from "./project-gallery.module.css";

export function ProjectGallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const openLightbox = useLightbox();
  const current = photos[idx];

  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);

  return (
    <div className={styles.gallery}>
      <div className={styles.main}>
        <Image
          src={current}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1280px) 1050px, 80vw"
          className={styles.mainImg}
          onClick={() => openLightbox(current)}
        />
        <button type="button" aria-label="Предыдущее фото" className={`${styles.navBtn} ${styles.navBtnPrev}`} onClick={prev}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18181B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button type="button" aria-label="Следующее фото" className={`${styles.navBtn} ${styles.navBtnNext}`} onClick={next}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18181B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className={styles.posBadge}>
          {idx + 1} / {photos.length}
        </div>
      </div>
      <div className={styles.thumbs}>
        {photos.map((p, i) => (
          <Image
            key={p + i}
            data-thumb=""
            data-on={i === idx ? "true" : "false"}
            src={p}
            alt=""
            width={108}
            height={78}
            className={styles.thumb}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
    </div>
  );
}
