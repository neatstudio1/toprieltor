import { Marquee } from "./marquee";

export function PartnersSection({
  developers,
  materials,
}: {
  developers: string[];
  materials: string[];
}) {
  return (
    <section
      style={{
        padding: "34px 0",
        background: "var(--card)",
        borderBottom: "1px solid var(--line)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto 20px",
          padding: "0 32px",
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "var(--faint)",
        }}
      >
        Застройщики · партнёры
      </div>
      <Marquee items={developers} direction="left" duration={34} />
      <div style={{ marginTop: 18 }}>
        <Marquee items={materials} direction="right" duration={30} color="var(--faint)" />
      </div>
    </section>
  );
}
