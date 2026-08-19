import styles from "./marquee.module.css";

export function Marquee({
  items,
  direction = "left",
  duration = 32,
  gap = 56,
  fontSize = 19,
  color = "var(--ink2)",
}: {
  items: string[];
  direction?: "left" | "right";
  duration?: number;
  gap?: number;
  fontSize?: number;
  color?: string;
}) {
  const doubled = [...items, ...items];
  return (
    <div className={styles.viewport}>
      <div
        className={styles.track}
        style={{
          gap,
          fontFamily: "var(--mono)",
          fontSize,
          color,
          animation: `${direction === "left" ? "tpl-marq-l" : "tpl-marq-r"} ${duration}s linear infinite`,
        }}
      >
        {doubled.map((item, i) => (
          <span key={i}>{item}</span>
        ))}
      </div>
    </div>
  );
}
