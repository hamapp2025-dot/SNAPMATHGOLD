const SUPER_MAP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  n: 'ⁿ',
  i: 'ⁱ',
};

function toSuperscript(raw: string): string {
  return raw.split('').map((char) => SUPER_MAP[char] ?? char).join('');
}

export function formatMathDisplayText(text: string): string {
  return text
    .replace(/\^([0-9n+\-()]+)/g, (_, exp) => toSuperscript(exp))
    .replace(/\(([^()\s]+)\/([^()\s]+)\)/g, (_, a, b) => `${a}⁄${b}`);
}

export function hasMathText(text: string): boolean {
  return /[=^∫√πθ]|\b(sin|cos|tan|log|lim|dx)\b/i.test(text);
}
