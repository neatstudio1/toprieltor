"use client";

import { useRef } from "react";
import type { TeamMember } from "@/lib/cms/client";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import styles from "./team-section.module.css";

export function TeamCard({ member }: { member: TeamMember }) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    card.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    glow.style.opacity = "1";
  };

  const handleMouseLeave = () => {
    if (glowRef.current) glowRef.current.style.opacity = "0";
  };

  return (
    <div
      ref={cardRef}
      data-team=""
      className={styles.card}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={glowRef} className={styles.glow} />
      <div data-teamphoto="" className={styles.photo} style={{ filter: "grayscale(1) contrast(.95)" }}>
        <PhotoPlaceholder label={`Фото: ${member.name}`} />
      </div>
      <div className={styles.body}>
        <div className={styles.role}>{member.role}</div>
        <div className={styles.name}>{member.name}</div>
        <div className={styles.exp}>{member.exp}</div>
        <div className={styles.fact}>{member.fact}</div>
      </div>
    </div>
  );
}
