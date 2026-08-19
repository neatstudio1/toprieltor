import { ViewingCtaButton } from "@/components/lead-modal/viewing-cta-button";

export function FinalCta() {
  return (
    <section style={{ background: "var(--dark)", color: "var(--dark-text)" }}>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "80px 32px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontWeight: 600,
            letterSpacing: "-.03em",
            lineHeight: 1.06,
            fontSize: "clamp(30px,3.4vw,50px)",
            margin: "0 0 18px",
          }}
        >
          Посмотрим эту квартиру вместе
        </h2>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.55,
            color: "var(--dark-muted)",
            maxWidth: 560,
            margin: "0 auto 34px",
          }}
        >
          Проверим документы, подберём этаж и посчитаем ипотеку под ваш
          капитал. Подбор и сопровождение — бесплатно.
        </p>
        <ViewingCtaButton
          className="tpl-btn-prim"
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 58,
            padding: "0 36px",
            borderRadius: 14,
            background: "#fff",
            color: "var(--ink)",
            fontWeight: 600,
            fontSize: 17,
          }}
        />
      </div>
    </section>
  );
}
