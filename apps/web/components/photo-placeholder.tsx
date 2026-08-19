export function PhotoPlaceholder({
  label,
  className,
  style,
}: {
  label: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--dark2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        textAlign: "center",
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11.5,
          color: "var(--dark-muted)",
          letterSpacing: ".02em",
        }}
      >
        {label}
      </span>
    </div>
  );
}
