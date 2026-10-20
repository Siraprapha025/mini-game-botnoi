export function cleanWolfName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ');
  const length = Array.from(name).length;
  return length >= 1 && length <= 24 ? name : null;
}