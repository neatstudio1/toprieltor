"use client";

import Image from "next/image";
import { useLightbox } from "./lightbox-provider";
import styles from "./plan-section.module.css";

export function PlanImage({ src, alt }: { src: string; alt: string }) {
  const openLightbox = useLightbox();
  return (
    <div className={styles.imageWrap} onClick={() => openLightbox(src)}>
      <Image src={src} alt={alt} fill sizes="50vw" style={{ objectFit: "contain" }} />
    </div>
  );
}
