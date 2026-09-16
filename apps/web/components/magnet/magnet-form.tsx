"use client";

import { FormEvent, useRef, useState } from "react";
import type { Magnet } from "@/lib/magnets";
import { submitLead } from "@/lib/cms/leads";
import { GOALS, reachGoal, trafficSource } from "@/lib/analytics";
import styles from "./magnet-page.module.css";

/**
 * Форма лид-магнита. Материал открывается сразу после отправки — обещание
 * из ролика закрывается в ту же секунду, без ожидания письма и звонка.
 */
export function MagnetForm({ magnet }: { magnet: Magnet }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const mountedAt = useRef(Date.now());

  const ready = name.trim().length > 0 && phone.trim().length >= 4 && consent;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready || status === "sending") return;
    setStatus("sending");
    setError("");

    const src = trafficSource();
    const result = await submitLead({
      name,
      phone,
      comment: `Запросил материал: ${magnet.title}`,
      website,
      sourcePath: `/materialy/${magnet.slug}`,
      sourceTitle: `Материал «${magnet.title}»`,
      elapsedMs: Date.now() - mountedAt.current,
    });

    if (result.ok) {
      setStatus("done");
      reachGoal(GOALS.leadSubmit, {
        place: "magnet",
        magnet: magnet.slug,
        campaign: src.campaign ?? magnet.campaign,
        medium: src.medium ?? "none",
      });
    } else {
      setStatus("error");
      setError(result.message);
    }
  }

  if (status === "done") {
    return (
      <div className={styles.result}>
        <div className={styles.ok}>
          Готово. Материал ниже — он останется на этой странице, можно вернуться по ссылке.
        </div>
        {magnet.content.map((s) => (
          <section key={s.h} className={styles.section}>
            <h2>{s.h}</h2>
            <ul>
              {s.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.formTitle}>Куда прислать</h2>
      <p className={styles.formSub}>Материал откроется сразу после отправки. Позвоним, только если попросите.</p>

      <div className={styles.row}>
        <input
          id="magnet-name"
          className={styles.input}
          placeholder="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="given-name"
        />
        <input
          id="magnet-phone"
          className={styles.input}
          placeholder="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
        />
      </div>

      {/* ловушка для ботов: люди этого поля не видят */}
      <div className={styles.hp} aria-hidden="true">
        <input id="magnet-website" tabIndex={-1} value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <label className={styles.consent} htmlFor="magnet-consent">
        <input
          id="magnet-consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>Согласен на обработку персональных данных</span>
      </label>

      <button className={styles.button} type="submit" disabled={!ready || status === "sending"}>
        {status === "sending" ? "Отправляем…" : "Получить материал"}
      </button>
      {status === "error" && <p className={styles.error}>{error}</p>}
    </form>
  );
}
