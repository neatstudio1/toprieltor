import Image from "next/image";
import Link from "next/link";
import {
  AUDIENCE,
  CLIENT_CASES,
  CLIENT_PHOTOS,
  DEVELOPERS,
  HERO_BADGES,
  PAIN_CARDS,
  PERKS,
  YANA_AVATAR,
} from "@/lib/landings";
import {
  COMPARE,
  FAQ_PODBORY,
  FINAL_LEAD,
  FINAL_TITLE,
  FREE_FINE,
  FREE_LINE,
  HERO_NOTE_PODBORY,
  HERO_SUB_PODBORY,
  STEPS_PODBORY,
  type PodboryContent,
} from "@/lib/podbory";
import type { PickTab } from "@/lib/podbory-picks";
import type { MortgageConfig } from "@/lib/cms/client";
import { AGENT_PHOTO, PHONE_DISPLAY, PHONE_TEL, TELEGRAM_HANDLE, TELEGRAM_URL } from "@/lib/site";
import { Reveal } from "@/components/reveal";
import { AudienceGlyph, ICON } from "../landing-page";
import { OpenFormButton } from "../open-button";
import { TrackedLink } from "../tracked-link";
import { PainCards } from "../pain-cards";
import { ProcessSteps } from "../process-steps";
import { Documents } from "../documents";
import { HeroVideo } from "../hero-video";
import { PodboryShell } from "./podbory-shell";
import { FinalRequest } from "./final-block";
import { Selection } from "./selection";
import { CompareSwipe } from "./compare-swipe";
import s from "../lp.module.css";
import p from "./podbory.module.css";

const CheckMark = () => (
  <svg className={p.compareMark} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.2)" />
    <path d="M7 12.5l3.2 3.2L17 8.8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CrossMark = () => (
  <svg className={p.compareMark} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#e4e4e7" />
    <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#71717a" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export function PodboryPage({
  content,
  tabs,
  mortgage,
}: {
  content: PodboryContent;
  tabs: PickTab[];
  mortgage: MortgageConfig;
}) {
  const marqueeLoop = [...CLIENT_PHOTOS, ...CLIENT_PHOTOS];
  const steps = STEPS_PODBORY.map((step) => ({
    ...step,
    badge: (
      <span className={`${p.badge} ${step.access === "free" ? p.badgeFree : p.badgePaid}`}>
        {step.access === "free" ? "Бесплатно" : "Платно"}
      </span>
    ),
  }));

  return (
    <PodboryShell
      group={content.group}
      landing={{
        key: `podbory/${content.group}`,
        label: `Подбор / ${content.group}`,
        path: "/lp/podbory",
      }}
    >
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
              <OpenFormButton block="header" className={s.headerCta}>Оставить заявку</OpenFormButton>
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
                <h1 className={s.heroTitle}>{content.h1}</h1>
                <p className={s.heroSub}>{HERO_SUB_PODBORY}</p>
                <div className={s.heroButtons}>
                  <OpenFormButton block="hero" className={s.btnPrimary}>Оставить заявку</OpenFormButton>
                  <TrackedLink href={TELEGRAM_URL} kind="tg" block="hero" className={s.btnGhost}>
                    Написать в Telegram
                  </TrackedLink>
                </div>
                <p className={s.heroNote}>{HERO_NOTE_PODBORY}</p>
              </div>
            </div>
          </section>

          <section className={`${s.section} ${s.sectionPain}`}>
            <div className={s.container}>
              <h2 className={`${s.h2} ${s.h2Pad}`}>Почему выбрать новостройку самому так сложно</h2>
              <PainCards cards={PAIN_CARDS} />
            </div>
          </section>

          <section id="compare" className={s.section}>
            <div className={s.container}>
              <h2 className={s.h2}>{COMPARE.title}</h2>
              <div className={p.compareDesk}>
                <div className={p.compare}>
                  <div className={`${p.compareCol} ${p.compareLeft}`}>
                    <div className={p.compareHead}>{COMPARE.left}</div>
                    <ul className={p.compareList}>
                      {COMPARE.rows.map((row) => (
                        <li key={row.left} className={p.compareItem}>
                          <CrossMark />
                          {row.left}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`${p.compareCol} ${p.compareRight}`}>
                    <div className={p.compareHead}>{COMPARE.right}</div>
                    <ul className={p.compareList}>
                      {COMPARE.rows.map((row) => (
                        <li key={row.right} className={p.compareItem}>
                          <CheckMark />
                          {row.right}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <CompareSwipe left={COMPARE.left} right={COMPARE.right} rows={COMPARE.rows} />
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

          <section id="steps" className={`${s.section} ${s.sectionSolution}`}>
            <div className={s.container}>
              <h2 className={s.h2}>Ведём от подбора до новоселья</h2>
              <p className={s.solutionLead}>
                Не придётся искать ипотечного брокера, юриста, приёмщика и дизайнера по отдельности.
              </p>
              <ProcessSteps steps={steps} />
              <div className={p.freeNote}>
                <p className={p.freeLine}>{FREE_LINE}</p>
                <p className={p.freeFine}>{FREE_FINE}</p>
              </div>
              <OpenFormButton block="process" className={`${s.btnPrimary} ${s.solutionCta}`}>Начать с подбора</OpenFormButton>
            </div>
          </section>

          {tabs.length ? (
            <section id="prices" className={`${s.section} ${s.sectionPrices}`}>
              <div className={s.container}>
                <h2 className={s.h2}>Что можно купить за ваш бюджет</h2>
                <p className={p.pickLead}>Актуальные цены. Выберите тип квартиры и посмотрите, какой будет платёж по ипотеке.</p>
                <Selection tabs={tabs} config={mortgage} />
              </div>
            </section>
          ) : null}

          <section id="perks" className={`${s.section} ${s.sectionPerks}`}>
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

          <section id="cases" className={`${s.section} ${s.sectionTrust}`}>
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
                  {marqueeLoop.map((photo, i) => (
                    <div
                      key={`${photo.src}-${i}`}
                      className={`${s.marqueeItem} ${i % CLIENT_PHOTOS.length >= 4 ? s.marqueeExtra : ""}`}
                    >
                      <Image src={photo.src} alt="" fill sizes="220px" style={{ objectFit: "cover", objectPosition: photo.position }} />
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
                  <span>и другие</span>
                </div>
              </div>
            </div>
          </section>

          <section id="faq" className={`${s.section} ${s.sectionFaq}`}>
            <div className={`${s.container} ${s.faqGrid}`}>
              <h2 className={`${s.h2} ${s.faqTitle}`}>Частые вопросы</h2>
              <div className={s.faqList}>
                {FAQ_PODBORY.map((f) => (
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

          <section id="podbory-final" className={`${s.section} ${s.sectionFinal}`}>
            <div className={`${s.container} ${s.finalGrid}`}>
              <div>
                <h2 className={`${s.h2} ${s.finalTitle}`}>{FINAL_TITLE}</h2>
                <p className={s.finalLead}>{FINAL_LEAD}</p>
              </div>
              <FinalRequest />
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
    </PodboryShell>
  );
}
