import Link from "next/link";

export interface BreadcrumbsProps {
  projectName: string;
  projectSlug: string;
  apartmentTitle: string;
}

export function Breadcrumbs({
  projectName,
  projectSlug,
  apartmentTitle,
}: BreadcrumbsProps) {
  return (
    <div
      style={{
        fontFamily: "var(--mono)",
        fontSize: 12.5,
        color: "var(--muted)",
        padding: "16px 0 22px",
      }}
    >
      <Link href="/" style={{ color: "var(--muted)" }}>
        Главная
      </Link>{" "}
      / <Link href="/catalog" style={{ color: "var(--muted)" }}>
        Каталог ЖК
      </Link>{" "}
      /{" "}
      <Link href={`/zhk/${projectSlug}`} style={{ color: "var(--muted)" }}>
        {projectName}
      </Link>{" "}
      / <span style={{ color: "var(--ink)" }}>{apartmentTitle}</span>
    </div>
  );
}
