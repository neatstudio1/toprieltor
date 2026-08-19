export function formatRub(value: number): string {
  const rounded = Math.round(value).toString();
  const groups: string[] = [];
  for (let i = rounded.length; i > 0; i -= 3) {
    groups.unshift(rounded.slice(Math.max(0, i - 3), i));
  }
  return groups.join(String.fromCharCode(32));
}

/** Like formatRub, but keeps kopecks when the value has them (e.g. maternity capital sums). */
export function formatRubPrecise(value: number): string {
  const rubles = Math.trunc(value);
  const kopecks = Math.round((value - rubles) * 100);
  const rublesStr = formatRub(rubles);
  return kopecks > 0 ? `${rublesStr},${String(kopecks).padStart(2, "0")}` : rublesStr;
}

export function pluralizeRu(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
