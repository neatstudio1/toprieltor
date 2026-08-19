"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ViewingCtaButton } from "@/components/lead-modal/viewing-cta-button";
import styles from "./site-header.module.css";

const TELEGRAM_URL = "https://t.me/Yana_Chekulova";

export interface SiteHeaderProps {
  active?: "catalog" | "blog";
  cta?: "quiz" | "viewing";
}

export function SiteHeader({ active, cta = "quiz" }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
          <svg
            width="30"
            height="30"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
          >
            <rect x="3" y="22" width="8" height="15" rx="3" fill="#C4C7F7" />
            <rect x="15" y="9" width="8" height="28" rx="3" fill="var(--accent)" />
            <rect x="27" y="16" width="8" height="21" rx="3" fill="#C4C7F7" />
          </svg>
          <span className={styles.logoText}>TOPиелтор</span>
        </Link>
        <nav className={styles.nav}>
          <Link
            data-navlink=""
            href="/catalog"
            style={active === "catalog" ? { color: "var(--ink)" } : undefined}
          >
            Каталог ЖК
          </Link>
          <Link data-navlink="" href="/#calc">
            Калькулятор
          </Link>
          <Link
            data-navlink=""
            href="/blog"
            style={active === "blog" ? { color: "var(--ink)" } : undefined}
          >
            Блог
          </Link>
          <Link data-navlink="" href="/#team">
            Эксперты
          </Link>
        </nav>
        <div className={styles.actions}>
          <a href={TELEGRAM_URL} className={styles.telegramLink}>
            Telegram
          </a>
          {cta === "viewing" ? (
            <ViewingCtaButton className={`tpl-btn-prim ${styles.ctaButton}`} />
          ) : (
            <Link href="/quiz" className={`tpl-btn-prim ${styles.ctaButton}`}>
              Подобрать квартиру
            </Link>
          )}
        </div>
        <button
          type="button"
          aria-label="Меню"
          className={styles.burger}
          onClick={() => setMenuOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>

    <div className={`${styles.menuOverlay} ${menuOpen ? styles.menuOpen : ""}`}>
      <div className={styles.menuTop}>
        <span className={styles.menuLabel}>Меню</span>
        <button
          type="button"
          aria-label="Закрыть"
          className={styles.menuClose}
          onClick={() => setMenuOpen(false)}
        >
          ×
        </button>
      </div>
      <Link data-navlink="" href="/catalog" className={styles.menuLink} onClick={() => setMenuOpen(false)}>
        Каталог ЖК
      </Link>
      <Link data-navlink="" href="/#calc" className={styles.menuLink} onClick={() => setMenuOpen(false)}>
        Калькулятор
      </Link>
      <Link data-navlink="" href="/blog" className={styles.menuLink} onClick={() => setMenuOpen(false)}>
        Блог
      </Link>
      <Link data-navlink="" href="/#team" className={styles.menuLink} onClick={() => setMenuOpen(false)}>
        Эксперты
      </Link>
      {cta === "viewing" ? (
        <ViewingCtaButton className={`tpl-btn-prim ${styles.menuCta}`} onClick={() => setMenuOpen(false)} />
      ) : (
        <Link href="/quiz" className={`tpl-btn-prim ${styles.menuCta}`} onClick={() => setMenuOpen(false)}>
          Подобрать квартиру
        </Link>
      )}
    </div>
    </>
  );
}
