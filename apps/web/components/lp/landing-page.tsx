import Image from "next/image";
import Link from "next/link";
import {
  AUDIENCE,
  CLIENT_CASES,
  CLIENT_PHOTOS,
  DEVELOPERS,
  FAQ,
  HERO_BADGES,
  PAIN_CARDS,
  HERO_SUB,
  YANA_AVATAR,
  PERKS,
  type PriceCard,
  type AudienceIcon,
  type LandingVariant,
} from "@/lib/landings";
import { AGENT_PHOTO, PHONE_DISPLAY, PHONE_TEL, TELEGRAM_HANDLE, TELEGRAM_URL } from "@/lib/site";
import { Reveal } from "@/components/reveal";
import { LpShell } from "./lp-shell";
import { OpenFormButton } from "./open-button";
import { TrackedLink } from "./tracked-link";
import { PainCards } from "./pain-cards";
import { ProcessSteps } from "./process-steps";
import { FinalForm } from "./final-form";
import { Documents } from "./documents";
import { HeroVideo } from "./hero-video";
import s from "./lp.module.css";

export const ICON = { stroke: "#4f46e5", strokeWidth: 1.5, fill: "none" } as const;

export function AudienceGlyph({ name }: { name: AudienceIcon }) {
  if (name === "family") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...ICON}>
        <circle cx="8" cy="6" r="2.5" />
        <circle cx="16.5" cy="9" r="2" />
        <path d="M3.5 20v-4.5A4.5 4.5 0 018 11a4.5 4.5 0 014.5 4.5V20M13 20v-3a3.5 3.5 0 017 0v3" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "military") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...ICON}>
        <path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6l7-3z" strokeLinejoin="round" />
        <path d="M12 8l1.2 2.5 2.7.4-2 1.9.5 2.7L12 14.2l-2.4 1.3.5-2.7-2-1.9 2.7-.4L12 8z" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ICON}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

interface LandingPageProps {
  variant: LandingVariant;
  heroAccent: string;
  prices: PriceCard[];
}

export function LandingPage({ variant, heroAccent, prices }: LandingPageProps) {
  const marqueeLoop = [...CLIENT_PHOTOS, ...CLIENT_PHOTOS];

  return (
    <LpShell roomHints={prices.map((p) => p.from)} landing={{ key: variant.key, label: variant.label, path: variant.path }}>
      <div className={s.page}>
        <header className={s.header}>
          <div className={s.headerInner}>
            <div className={s.logo}>
              <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <rect x="3" y="22" width="8" height="15" rx="3" fill="#C4C7F7" />
                <rect x="15" y="9" width="8" height="28" rx="3" fill="#4f46e5" />
                <rect x="27" y="16" width="8" height="21" rx="3" fill="#C4C7F7" />
              </svg>
              <span>TOPиелтор</span>
            </div>
            <div className={s.headerActions}>
              <TrackedLink href={`tel:${PHONE_TEL}`} kind="phone" block="header" className={s.headerPhone}>
                {PHONE_DISPLAY}
              </TrackedLink>
              <OpenFormButton block="header" className={s.headerCta}>Подобрать</OpenFormButton>
            </div>
          </div>
        </header>

        <main>
          <section className={s.hero}>
            <HeroVideo />
            <div className={s.heroInner}>
              <div className={s.heroPhoto}>
                <Image
                  src={AGENT_PHOTO}
                  alt="Яна Чекулова"
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 767px) 100vw, 45vw"
                  style={{ objectFit: "cover", objectPosition: "50% 20%" }}
                />
                <div className={s.heroFade} aria-hidden="true" />
                <div className={s.badges}>
                  {HERO_BADGES.map((b, i) => (
                    <div
                      key={b.value}
                      className={`${s.badge} ${b.accent ? s.badgeAccent : ""}`}
                      style={{ animationDelay: `${250 + i * 140}ms` }}
                    >
                      <div className={s.badgeValue}>{b.value}</div>
                      <div className={s.badgeLabel}>{b.label}</div>
                    </div>
                  ))}
                </div>
                <div className={s.heroCaption}>
                  <span>Яна Чекулова</span> · риелтор и дизайнер интерьеров
                </div>
              </div>
              <div className={s.heroText}>
                <div className={s.heroEyebrow}>Экосистема покупки новостройки под ключ</div>
                <h1 className={s.heroTitle}>
                  {variant.hero.h1Main}{" "}
                  <span className={variant.hero.accentNoWrap ? s.noWrap : undefined}>{heroAccent}</span>
                </h1>
                <p className={s.heroSub}>{HERO_SUB}</p>
                <div className={s.heroButtons}>
                  <OpenFormButton block="hero" className={s.btnPrimary}>{variant.heroCta ?? "Подобрать квартиры"}</OpenFormButton>
                  <TrackedLink href={TELEGRAM_URL} kind="tg" block="hero" className={s.btnGhost}>
                    Написать в Telegram
                  </TrackedLink>
                </div>
                <p className={s.heroNote}>Подбор и сопровождение бесплатно для покупателя: платит застройщик.</p>
              </div>
            </div>
          </section>

          <section className={`${s.section} ${s.sectionPain}`}>
            <div className={s.container}>
              <h2 className={`${s.h2} ${s.h2Pad}`}>Почему выбрать новостройку самому так сложно</h2>
              <PainCards cards={[...(variant.painLead ?? []), ...PAIN_CARDS]} />
            </div>
          </section>

          <section className={`${s.section} ${s.sectionAudience}`}>
            <div className={s.container}>
              <h2 className={s.h2}>Для кого мы работаем?</h2>
              <div className={s.audienceGrid}>
                {AUDIENCE.map((a, i) => (
                  <Reveal key={a.title} delayMs={i * 140} className={s.audienceCard}>
                    <div className={s.audienceIcon}>
                      <AudienceGlyph name={a.icon} />
                    </div>
                    <div>
                      <div className={s.audienceTitle}>{a.title}</div>
                      <div className={s.audienceText}>{a.text}</div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          <section className={`${s.section} ${s.sectionSolution}`}>
            <div className={s.container}>
              <h2 className={s.h2}>Ведём от подбора до новоселья</h2>
              <p className={s.solutionLead}>
                Не придётся искать ипотечного брокера, юриста, приёмщика и дизайнера по отдельности.
              </p>
              <ProcessSteps />
              <OpenFormButton block="process" className={`${s.btnPrimary} ${s.solutionCta}`}>Начать с подбора</OpenFormButton>
            </div>
          </section>

          <section className={`${s.section} ${s.sectionPerks}`}>
            <div className={s.container}>
              <h2 className={s.h2}>
                Что <span className={s.accent}>вы получите</span>, кроме подбора
              </h2>
              <div className={s.perks}>
                <Reveal className={`${s.perk} ${s.perkFree}`}>
                  <div>
                    <div className={s.perkFreeTitle}>{PERKS.free.title}</div>
                    <div className={s.perkFreeText}>{PERKS.free.text}</div>
                  </div>
                  <div className={s.perkFreeBig}>0 ₽</div>
                </Reveal>
                <Reveal className={`${s.perk} ${s.perkSmall} ${s.perkPromos}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" {...ICON}>
                    <path d="M3 12.2V4a1 1 0 011-1h8.2a1 1 0 01.7.3l7.8 7.8a1 1 0 010 1.4l-8.2 8.2a1 1 0 01-1.4 0L3.3 12.9a1 1 0 01-.3-.7z" />
                    <circle cx="8" cy="8" r="1.6" />
                  </svg>
                  <div className={s.perkTitle}>{PERKS.promos.title}</div>
                  <div className={s.perkText}>{PERKS.promos.text}</div>
                </Reveal>
                <Reveal delayMs={120} className={`${s.perk} ${s.perkSmall} ${s.perkRate}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" {...ICON}>
                    <path d="M3 9l9-5 9 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className={s.perkTitle}>{PERKS.rate.title}</div>
                  <div className={s.perkText}>{PERKS.rate.text}</div>
                </Reveal>
                <Reveal delayMs={120} className={`${s.perk} ${s.perkYana}`}>
                  <div className={s.perkAvatar}>
                    <Image
                      src={YANA_AVATAR.src}
                      alt="Яна Чекулова"
                      fill
                      sizes="120px"
                      style={{ objectFit: "cover", objectPosition: YANA_AVATAR.position }}
                    />
                  </div>
                  <div>
                    <div className={s.perkYanaTitle}>{PERKS.designer.title}</div>
                    <div className={s.perkYanaText}>{PERKS.designer.text}</div>
                  </div>
                </Reveal>
                <Reveal className={`${s.perk} ${s.perkSmall} ${s.perkDesigner}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" {...ICON}>
                    <path d="M15.5 4.5l4 4L9 19H5v-4L15.5 4.5zM13 7l4 4" strokeLinejoin="round" />
                  </svg>
                  <div className={s.perkTitle}>{PERKS.noSearch.title}</div>
                  <div className={s.perkText}>{PERKS.noSearch.text}</div>
                </Reveal>
                <Reveal delayMs={120} className={`${s.perk} ${s.perkSmall} ${s.perkDiscounts}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" {...ICON}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8.5 15.5l7-7" strokeLinecap="round" />
                    <circle cx="9" cy="9" r="1.3" fill="#4f46e5" />
                    <circle cx="15" cy="15" r="1.3" fill="#4f46e5" />
                  </svg>
                  <div className={s.perkTitle}>{PERKS.discounts.title}</div>
                  <div className={s.perkText}>{PERKS.discounts.text}</div>
                </Reveal>
              </div>
            </div>
          </section>

          <section className={`${s.section} ${s.sectionTrust}`}>
            <div className={s.container}>
              <h2 className={`${s.h2} ${s.h2Pad}`}>Семьи, которые уже переехали</h2>
              <div className={s.cases}>
                {CLIENT_CASES.map((c, i) => (
                  <Reveal key={c.tag} delayMs={i * 120} className={s.caseCard}>
                    <div className={s.casePhoto}>
                      <Image
                        src={c.photo}
                        alt={c.tag}
                        fill
                        sizes="(max-width: 767px) 300px, 340px"
                        style={{ objectFit: "cover", objectPosition: c.position }}
                      />
                      <span className={s.caseTag}>{c.tag}</span>
                    </div>
                    <div className={s.caseBody}>
                      <div className={s.caseValue}>{c.value}</div>
                      <div className={s.caseText}>{c.text}</div>
                      <div className={s.caseMeta}>{c.meta}</div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            <div className={s.marqueeBlock}>
              <div className={`${s.container} ${s.marqueeLabel}`}>Ещё клиенты</div>
              <div className={s.marqueeClip}>
                <div className={s.marqueeTrack}>
                  {marqueeLoop.map((p, i) => (
                    <div
                      key={`${p.src}-${i}`}
                      className={`${s.marqueeItem} ${i % CLIENT_PHOTOS.length >= 4 ? s.marqueeExtra : ""}`}
                    >
                      <Image src={p.src} alt="" fill sizes="220px" style={{ objectFit: "cover", objectPosition: p.position }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Documents />

            <div className={`${s.container} ${s.developers}`}>
              <div className={s.developersRow}>
                <div className={s.developersLabel}>Работаем с застройщиками</div>
                <div className={s.developersNames}>
                  {DEVELOPERS.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={`${s.section} ${s.sectionPrices}`}>
            <div className={s.container}>
              <h2 className={s.h2}>Сколько стоят квартиры сейчас</h2>
              <div className={s.prices}>
                {prices.map((card, i) => (
                  <Reveal key={card.title} delayMs={i * 100} className={s.priceCell}>
                    <OpenFormButton block="prices" className={`${s.priceCard} ${variant.highlightPrice === i ? s.priceCardOn : ""}`}>
                      <span className={s.priceTitle}>{card.title}</span>
                      <span className={s.priceFrom}>{card.from}</span>
                      <span className={s.pricePayment}>
                        платёж <br />
                        {card.payment.replace(/ /g, "\u00a0")}
                      </span>
                      <span className={s.priceLink}>Подобрать →</span>
                    </OpenFormButton>
                  </Reveal>
                ))}
              </div>
              <div className={s.pricesFree}>
                Подбор квартиры: <span className={s.accent}>0 ₽</span>
              </div>
            </div>
          </section>

          <section className={`${s.section} ${s.sectionFaq}`}>
            <div className={`${s.container} ${s.faqGrid}`}>
              <h2 className={`${s.h2} ${s.faqTitle}`}>Частые вопросы</h2>
              <div className={s.faqList}>
                {FAQ.map((f) => (
                  <details key={f.q} className={s.faqItem}>
                    <summary className={s.faqSummary}>
                      {f.q}
                      <span className={s.faqPlus} aria-hidden="true">
                        +
                      </span>
                    </summary>
                    <p className={s.faqAnswer}>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className={`${s.section} ${s.sectionFinal}`}>
            <div className={`${s.container} ${s.finalGrid}`}>
              <div>
                <h2 className={`${s.h2} ${s.finalTitle}`}>Пришлём первые варианты сегодня</h2>
                <p className={s.finalLead}>
                  Оставьте телефон и выберите, где удобнее переписываться.
                </p>
              </div>
              <FinalForm />
            </div>
          </section>

        </main>

        <footer className={s.footer}>
          <div className={s.footerInner}>
            TOPиелтор · Екатеринбург · <TrackedLink href={`tel:${PHONE_TEL}`} kind="phone" block="footer">
              {PHONE_DISPLAY}
            </TrackedLink>{" "}
            · Telegram{" "}
            <TrackedLink href={TELEGRAM_URL} kind="tg" block="footer">
              {TELEGRAM_HANDLE}
            </TrackedLink> · ИП Хакимьянов Сергей Вадимович, ИНН 665893651809 · Проектные
            декларации на <a href="https://наш.дом.рф">наш.дом.рф</a> ·{" "}
            <Link href="/privacy">Политика конфиденциальности</Link>
          </div>
        </footer>
      </div>
    </LpShell>
  );
}
