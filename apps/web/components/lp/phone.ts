export function fmtPhone(raw: string): string {
  let d = String(raw || "").replace(/\D/g, "");
  if (d[0] === "7" || d[0] === "8") d = d.slice(1);
  d = d.slice(0, 10);
  if (!d) return "";
  let s = "+7 (" + d.slice(0, 3);
  if (d.length >= 3) s += ") " + d.slice(3, 6);
  if (d.length >= 6) s += "-" + d.slice(6, 8);
  if (d.length >= 8) s += "-" + d.slice(8, 10);
  return s;
}

export function phoneComplete(value: string): boolean {
  return value.replace(/\D/g, "").length === 11;
}
