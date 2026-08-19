"use client";

import { useState } from "react";
import Image from "next/image";
import { useLightbox } from "./lightbox-provider";
import styles from "./gallery-carousel.module.css";

export interface GalleryPhoto {
  src: string;
  kind: string;
}

export function GalleryCarousel({ photos }: { photos: GalleryPhoto[] }) {
  const [idx, setIdx] = useState(0);
  const openLightbox = useLightbox();
  const current = photos[idx];

  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);

  return (
    <div style={{ minWidth: 0 }}>
      <div data-mainwrap="" className={styles.mainWrap}>
        <Image
          data-mainimg=""
          src={current.src}
          alt="Фото квартиры и ЖК"
          fill
          sizes="(min-width: 1280px) 860px, 66vw"
          priority={idx === 0}
          className={styles.mainImg}
          onClick={() => openLightbox(current.src)}
        />
        <div className={styles.kindBadge}>{current.kind}</div>
        <button
          type="button"
          aria-label="Предыдущее фото"
          className={`${styles.navBtn} ${styles.navBtnPrev}`}
          onClick={prev}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#18181B"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Следующее фото"
          className={`${styles.navBtn} ${styles.navBtnNext}`}
          onClick={next}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#18181B"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className={styles.posBadge}>
          {idx + 1} / {photos.length}
        </div>
      </div>
      <div data-thumbstrip="" className={styles.thumbstrip}>
        {photos.map((p, i) => (
          <Image
            key={p.src + i}
            data-thumb=""
            data-on={i === idx ? "true" : "false"}
            src={p.src}
            alt=""
            width={96}
            height={70}
            className={styles.thumb}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
    </div>
  );
}
