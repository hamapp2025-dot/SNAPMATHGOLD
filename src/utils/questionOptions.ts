const ARABIC_OPTION_LABELS: Record<string, string> = {
  Remainder: 'الباقي',
  Factor: 'عامل',
  Quotient: 'ناتج القسمة',
  Coefficient: 'معامل',
  'Circle radius 4': 'دائرة نصف قطرها 4',
  Line: 'مستقيم',
  Point: 'نقطة',
  Ellipse: 'قطع ناقص',
  Increasing: 'متزايدة',
  Decreasing: 'متناقصة',
  True: 'صحيحة',
  False: 'خاطئة',
  Always: 'دائماً',
  Never: 'أبداً',
};

export function getLocalizedQuestionOption(option: string, isAr: boolean): string {
  if (!isAr) return option;
  return ARABIC_OPTION_LABELS[option] ?? option;
}
