import { Marquee } from "./marquee";

export function BanksSection({ banks }: { banks: string[] }) {
  return (
    <section
      style={{
        background: "var(--dark)",
        overflow: "hidden",
        padding: "20px 0",
        borderBottom: "1px solid var(--dark-line)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 40,
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 32px",
        }}
      >
        <div
          style={{
            flex: "none",
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "#52525B",
          }}
        >
          Банки-партнёры
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Marquee items={banks} direction="left" duration={28} fontSize={16} color="var(--dark-muted)" />
        </div>
      </div>
    </section>
  );
}
