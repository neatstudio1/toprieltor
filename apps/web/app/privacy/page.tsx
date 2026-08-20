import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Prose } from "@/components/prose";
import { pageMetadata } from "@/lib/site";
import { PRIVACY_POLICY_MARKDOWN, PRIVACY_POLICY_UPDATED } from "@/lib/privacy-policy";
import styles from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Политика конфиденциальности",
  description: "Политика конфиденциальности и обработки персональных данных сайта TOPиелтор.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SiteHeader />
      <div className={styles.head}>
        <h1 className={styles.title}>Политика конфиденциальности</h1>
        <div className={styles.updated}>Обработка персональных данных · обновлено {PRIVACY_POLICY_UPDATED}</div>
      </div>
      <div className={styles.body}>
        <Prose content={PRIVACY_POLICY_MARKDOWN} className="prose" />
      </div>
      <SiteFooter />
    </div>
  );
}
