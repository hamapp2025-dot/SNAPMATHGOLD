const INLINE_LTR_OR_MATH =
  /([A-Za-z0-9\u0660-\u0669\u06F0-\u06F9\u0370-\u03FFπ∞∫√∆∑∏∂∇([{\[][A-Za-z0-9\u0660-\u0669\u06F0-\u06F9\u0370-\u03FFπ∞∫√∆∑∏∂∇()[\]{}+\-−=÷×/*^<>,.:;!?'"%&|~·_\u00B0\u00B1-\u00B3\u00B9\u00D7\u00F7\u2070-\u209F\u2190-\u21FF\s]*)/g;

const FSI = '\u2068';
const PDI = '\u2069';

export function stabilizeMixedMathText(text: string, isAr: boolean): string {
  if (!isAr || !text) return text;

  return text.replace(INLINE_LTR_OR_MATH, (match) => {
    const leading = match.match(/^\s*/)?.[0] ?? '';
    const trailing = match.match(/\s*$/)?.[0] ?? '';
    const core = match.trim();

    if (!core) return match;

    return `${leading}${FSI}${core}${PDI}${trailing}`;
  });
}
