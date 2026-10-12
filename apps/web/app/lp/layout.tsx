import { Inter } from "next/font/google";

// Макеты лендингов набраны Inter 800; в корневом layout этого начертания нет,
// а тянуть его всему сайту ради /lp не нужно.
const interExtra = Inter({
  variable: "--font-inter-extra",
  subsets: ["latin", "cyrillic"],
  weight: ["800"],
  display: "swap",
});

export default function LpLayout({ children }: { children: React.ReactNode }) {
  return <div className={interExtra.variable}>{children}</div>;
}
