export function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('rgba(')) {
    const parts = color.slice(5, -1).split(',').map((part) => part.trim());
    if (parts.length >= 3) {
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    }
    return color;
  }

  if (color.startsWith('rgb(')) {
    const parts = color.slice(4, -1).split(',').map((part) => part.trim());
    if (parts.length >= 3) {
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    }
    return color;
  }

  if (!color.startsWith('#')) return color;

  const raw = color.slice(1);
  const normalized = raw.length === 3
    ? raw.split('').map((char) => char + char).join('')
    : raw;

  if (normalized.length !== 6) return color;

  const int = Number.parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
