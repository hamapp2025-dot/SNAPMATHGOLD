export type Grade12Unit = {
  id: string;
  titleEn: string;
  titleAr: string;
  /** kept for legacy callers */
  title: string;
  icon: string;
  lessons: Grade12Lesson[];
};

export type Grade12LessonExample = {
  qEn: string;
  qAr: string;
  answer?: string;
  answerEn?: string;
  answerAr?: string;
};

export type Grade12PracticeQuestion = {
  qEn: string;
  qAr: string;
  options: string[];
  correct: number;
  explanationEn?: string;
  explanationAr?: string;
};

export type Grade12Lesson = {
  id: string;
  titleEn: string;
  titleAr: string;
  /** YouTube video ID for the lesson intro video (optional) */
  videoId?: string;
  keyFormulas: { label: string; formula: string }[];
  examples: Grade12LessonExample[];
  practiceQ: Grade12PracticeQuestion[];
};

const FORMULA_LABEL_AR: Record<string, string> = {
  'Remainder Theorem': 'نظرية الباقي',
  'Factor Theorem': 'نظرية العامل',
  'Linear factors': 'عوامل خطية',
  'Repeated factor': 'عامل مكرر',
  Pythagorean: 'فيثاغورس',
  'Double angle sin': 'ضعف الزاوية للجيب',
  'Double angle cos': 'ضعف الزاوية لجيب التمام',
  'Sum formula sin': 'صيغة مجموع الجيب',
  'Sum formula cos': 'صيغة مجموع جيب التمام',
  'General solution sin': 'الحل العام للجيب',
  'General solution cos': 'الحل العام لجيب التمام',
  'd/dx[sin x]': 'مشتقة sin x',
  'd/dx[cos x]': 'مشتقة cos x',
  'd/dx[eˣ]': 'مشتقة eˣ',
  'd/dx[ln x]': 'مشتقة ln x',
  'Product Rule': 'قاعدة الضرب',
  'Quotient Rule': 'قاعدة القسمة',
  'Chain Rule': 'قاعدة السلسلة',
  Implicit: 'التفاضل الضمني',
  Strategy: 'الاستراتيجية',
  'Standard form': 'الصورة القياسية',
  Modulus: 'المعيار',
  Multiply: 'الضرب',
  Conjugate: 'المرافق',
  Circle: 'دائرة',
  Line: 'مستقيم',
  '∫ xⁿ dx': 'تكامل xⁿ',
  '∫ eˣ dx': 'تكامل eˣ',
  '∫ sin x dx': 'تكامل sin x',
  '∫ cos x dx': 'تكامل cos x',
  Substitution: 'التعويض',
  Method: 'الطريقة',
  'Integration by Parts': 'التكامل بالتجزئة',
  'Area under curve': 'المساحة تحت المنحنى',
  'Volume of revolution': 'حجم الدوران',
  Separable: 'قابل للفصل',
  Magnitude: 'المقدار',
  'Unit vector': 'متجه وحدة',
  'Vector equation': 'المعادلة المتجهة',
  Parametric: 'التمثيل البارامتري',
  'Dot product': 'الجداء النقطي',
  Angle: 'الزاوية',
  'Binomial P(X=k)': 'احتمال ذو الحدين P(X=k)',
  'Geometric P(X=k)': 'احتمال الهندسي P(X=k)',
  'Standard Z': 'الدرجة المعيارية Z',
  'Bell curve': 'المنحنى الجرسي',
};

export const SEMESTER_1_UNITS: Grade12Unit[] = [
  {
    id: 'u1',
    titleEn: 'Unit 1 · Functions & Algebraic Expressions',
    titleAr: 'الوحدة 1 · الدوال والتعابير الجبرية',
    title: 'Unit 1 · Functions and Algebraic Expressions',
    icon: 'git-branch-outline',
    lessons: [
      {
        id: 'u1-l1',
        titleEn: 'Remainder & Factor Theorems',
        titleAr: 'نظريتا الباقي والعامل',
        videoId: '9-6wFXQr5d8',
        keyFormulas: [
          { label: 'Remainder Theorem', formula: 'P(a) = remainder when P(x) ÷ (x − a)' },
          { label: 'Factor Theorem', formula: 'If P(a) = 0, then (x − a) is a factor' },
        ],
        examples: [
          {
            qEn: 'Find the remainder when P(x) = x³ − 2x + 1 is divided by (x − 1)',
            qAr: 'أوجد الباقي عند قسمة P(x) = x³ − 2x + 1 على (x − 1)',
            answerEn: 'a = 1\nP(1) = 1 − 2 + 1 = 0\nRemainder = 0',
            answerAr: 'a = 1\nP(1) = 1 − 2 + 1 = 0\nإذن الباقي = 0',
          },
          {
            qEn: 'Show that (x + 2) is a factor of x³ + 2x² − x − 2',
            qAr: 'بيّن أن (x + 2) عامل في x³ + 2x² − x − 2',
            answerEn: 'a = −2\nP(−2) = −8 + 8 + 2 − 2 = 0\nSo (x + 2) is a factor',
            answerAr: 'a = −2\nP(−2) = −8 + 8 + 2 − 2 = 0\nإذن (x + 2) عامل',
          },
          {
            qEn: 'Find the remainder when P(x) = x² + 4x − 1 is divided by (x + 1)',
            qAr: 'أوجد الباقي عند قسمة P(x) = x² + 4x − 1 على (x + 1)',
            answerEn: 'a = −1\nP(−1) = 1 − 4 − 1 = −4\nRemainder = −4',
            answerAr: 'a = −1\nP(−1) = 1 − 4 − 1 = −4\nإذن الباقي = −4',
          },
          {
            qEn: 'Test whether (x − 3) is a factor of x³ − 6x² + 11x − 6',
            qAr: 'تحقق هل (x − 3) عامل في x³ − 6x² + 11x − 6',
            answerEn: 'a = 3\nP(3) = 27 − 54 + 33 − 6 = 0\nSo (x − 3) is a factor',
            answerAr: 'a = 3\nP(3) = 27 − 54 + 33 − 6 = 0\nإذن (x − 3) عامل',
          },
        ],
        practiceQ: [
          {
            qEn: 'What is P(2) if P(x) = x² − 3x + 2?',
            qAr: 'ما قيمة P(2) إذا كانت P(x) = x² − 3x + 2؟',
            options: ['0', '2', '4', '−1'],
            correct: 0,
            explanationEn: 'Substitute x = 2: P(2) = 4 − 6 + 2 = 0.',
            explanationAr: 'عوّض x = 2: ‏P(2) = 4 − 6 + 2 = 0.',
          },
          {
            qEn: 'What is the remainder when P(x) = x² + 4x − 1 is divided by (x + 1)?',
            qAr: 'ما الباقي عند قسمة P(x) = x² + 4x − 1 على (x + 1)؟',
            options: ['−4', '0', '2', '4'],
            correct: 0,
            explanationEn: 'Because (x + 1) = (x − (−1)), we use a = −1. Then P(−1) = 1 − 4 − 1 = −4.',
            explanationAr: 'لأن (x + 1) = (x − (−1)) نأخذ a = −1. ثم نحسب P(−1) = 1 − 4 − 1 = −4.',
          },
          {
            qEn: 'If P(a) = 0, then (x − a) is a...',
            qAr: 'إذا كانت P(a) = 0 فإن (x − a) هو...',
            options: ['Remainder', 'Factor', 'Quotient', 'Coefficient'],
            correct: 1,
            explanationEn: 'Zero remainder means exact division, so (x − a) is a factor.',
            explanationAr: 'إذا كان الباقي صفراً فهذا يعني أن القسمة تامة، ولذلك يكون (x − a) عاملاً.',
          },
          {
            qEn: 'Which value of a makes (x − a) a factor of x² − 5x + 6?',
            qAr: 'أي قيمة لـ a تجعل (x − a) عاملاً في x² − 5x + 6؟',
            options: ['1', '2', '4', '6'],
            correct: 1,
            explanationEn: 'Test the choices with P(a). P(2) = 4 − 10 + 6 = 0, so (x − 2) is a factor.',
            explanationAr: 'اختبر القيم بالتعويض. ‏P(2) = 4 − 10 + 6 = 0، إذن (x − 2) عامل.',
          },
          {
            qEn: 'If the remainder on division by (x − 4) is 7, then P(4) = ...',
            qAr: 'إذا كان الباقي عند القسمة على (x − 4) يساوي 7، فما قيمة P(4)؟',
            options: ['0', '4', '7', '16'],
            correct: 2,
            explanationEn: 'By the Remainder Theorem, P(4) equals the remainder directly.',
            explanationAr: 'بحسب نظرية الباقي فإن P(4) تساوي قيمة الباقي مباشرة.',
          },
        ],
      },
      {
        id: 'u1-l2',
        titleEn: 'Partial Fractions',
        titleAr: 'الكسور الجزئية',
        videoId: 'QKkdYW77xNI',
        keyFormulas: [
          { label: 'Linear factors', formula: 'A/(x−a) + B/(x−b)' },
          { label: 'Repeated factor', formula: 'A/(x−a) + B/(x−a)²' },
        ],
        examples: [
          { qEn: 'Decompose (3x + 1)/((x−1)(x+2)) into partial fractions', qAr: 'حلّل (3x + 1)/((x−1)(x+2)) إلى كسور جزئية', answer: '4/3·(1/(x−1)) − 1/3·(1/(x+2))' },
        ],
        practiceQ: [
          { qEn: 'Partial fractions of 1/(x(x+1))?', qAr: 'الكسور الجزئية لـ 1/(x(x+1))؟', options: ['1/x − 1/(x+1)', '1/x + 1/(x+1)', '−1/x + 1/(x+1)', '2/x − 2/(x+1)'], correct: 0 },
        ],
      },
    ],
  },
  {
    id: 'u2',
    titleEn: 'Unit 2 · Trig Identities & Equations',
    titleAr: 'الوحدة 2 · المتطابقات والمعادلات المثلثية',
    title: 'Unit 2 · Trig Identities and Equations',
    icon: 'sync-outline',
    lessons: [
      {
        id: 'u2-l1',
        titleEn: 'Trig Identities (1)',
        titleAr: 'المتطابقات المثلثية (1)',
        videoId: 'zHswnV-Na40',
        keyFormulas: [
          { label: 'Pythagorean', formula: 'sin²θ + cos²θ = 1' },
          { label: 'Double angle sin', formula: 'sin 2θ = 2 sin θ cos θ' },
          { label: 'Double angle cos', formula: 'cos 2θ = cos²θ − sin²θ' },
        ],
        examples: [
          { qEn: 'Prove: sin²θ + cos²θ = 1', qAr: 'برهن: sin²θ + cos²θ = 1', answer: 'Follows from Pythagorean theorem on unit circle' },
          { qEn: 'Simplify: (1 − cos 2θ) / sin 2θ', qAr: 'بسّط: (1 − cos 2θ) / sin 2θ', answer: '= tan θ' },
        ],
        practiceQ: [
          { qEn: 'sin 2θ = ?', qAr: 'sin 2θ = ؟', options: ['2 sin θ cos θ', 'sin²θ − cos²θ', '2 cos²θ − 1', 'cos 2θ'], correct: 0 },
        ],
      },
      {
        id: 'u2-l2',
        titleEn: 'Trig Identities (2)',
        titleAr: 'المتطابقات المثلثية (2)',
        keyFormulas: [
          { label: 'Sum formula sin', formula: 'sin(A+B) = sinA cosB + cosA sinB' },
          { label: 'Sum formula cos', formula: 'cos(A+B) = cosA cosB − sinA sinB' },
        ],
        examples: [
          { qEn: 'Find sin 75° using sum formula', qAr: 'أوجد sin 75° باستخدام صيغة المجموع', answer: 'sin(45°+30°) = (√6+√2)/4' },
        ],
        practiceQ: [
          { qEn: 'cos(A+B) = ?', qAr: 'cos(A+B) = ؟', options: ['cosA cosB − sinA sinB', 'cosA cosB + sinA sinB', 'sinA cosB + cosA sinB', 'sinA sinB − cosA cosB'], correct: 0 },
        ],
      },
      {
        id: 'u2-l3',
        titleEn: 'Solving Trig Equations',
        titleAr: 'حل المعادلات المثلثية',
        keyFormulas: [
          { label: 'General solution sin', formula: 'sin θ = k  ⟹  θ = nπ + (−1)ⁿ arcsin k' },
          { label: 'General solution cos', formula: 'cos θ = k  ⟹  θ = 2nπ ± arccos k' },
        ],
        examples: [
          { qEn: 'Solve sin θ = 1/2 for 0 ≤ θ ≤ 2π', qAr: 'حل sin θ = 1/2 حيث 0 ≤ θ ≤ 2π', answer: 'θ = π/6 or 5π/6' },
        ],
        practiceQ: [
          { qEn: 'Solutions of cos θ = 0 in [0, 2π]?', qAr: 'حلول cos θ = 0 في [0, 2π]؟', options: ['π/2 and 3π/2', '0 and π', 'π/4 and 3π/4', 'π/3 and 2π/3'], correct: 0 },
        ],
      },
    ],
  },
  {
    id: 'u3',
    titleEn: 'Unit 3 · Differentiation & Applications',
    titleAr: 'الوحدة 3 · التفاضل وتطبيقاته',
    title: 'Unit 3 · Differentiation and Applications',
    icon: 'trending-up-outline',
    lessons: [
      {
        id: 'u3-l1',
        titleEn: 'Derivative of Special Functions',
        titleAr: 'مشتقة الدوال الخاصة',
        videoId: 'rAof9Ld5sOg',
        keyFormulas: [
          { label: 'd/dx[sin x]', formula: 'cos x' },
          { label: 'd/dx[cos x]', formula: '− sin x' },
          { label: 'd/dx[eˣ]', formula: 'eˣ' },
          { label: 'd/dx[ln x]', formula: '1/x' },
        ],
        examples: [
          { qEn: "Find f'(x) if f(x) = sin x + eˣ", qAr: "أوجد f'(x) إذا كانت f(x) = sin x + eˣ", answer: "f'(x) = cos x + eˣ" },
        ],
        practiceQ: [
          { qEn: 'd/dx[ln(2x)] = ?', qAr: 'd/dx[ln(2x)] = ؟', options: ['1/x', '2/x', '1/(2x)', 'x'], correct: 0 },
        ],
      },
      {
        id: 'u3-l2',
        titleEn: 'Product/Quotient Rules',
        titleAr: 'قاعدتا الضرب والقسمة',
        keyFormulas: [
          { label: 'Product Rule', formula: "(fg)' = f'g + fg'" },
          { label: 'Quotient Rule', formula: "(f/g)' = (f'g − fg') / g²" },
        ],
        examples: [
          { qEn: "Differentiate y = x² sin x", qAr: "اشتق y = x² sin x", answer: "y' = 2x sin x + x² cos x" },
        ],
        practiceQ: [
          { qEn: 'd/dx[x · eˣ] = ?', qAr: 'd/dx[x · eˣ] = ؟', options: ['eˣ + x eˣ', 'x eˣ', 'eˣ', '(x+1)eˣ'], correct: 3 },
        ],
      },
      {
        id: 'u3-l3',
        titleEn: 'Chain Rule',
        titleAr: 'قاعدة السلسلة',
        videoId: 'H-ybCx8gt-8',
        keyFormulas: [
          { label: 'Chain Rule', formula: "d/dx[f(g(x))] = f'(g(x)) · g'(x)" },
        ],
        examples: [
          { qEn: "Differentiate y = sin(3x²)", qAr: "اشتق y = sin(3x²)", answer: "y' = 6x cos(3x²)" },
          { qEn: "Differentiate y = (2x + 1)⁵", qAr: "اشتق y = (2x + 1)⁵", answer: "y' = 10(2x + 1)⁴" },
        ],
        practiceQ: [
          { qEn: "d/dx[cos(5x)] = ?", qAr: "d/dx[cos(5x)] = ؟", options: ['−5 sin(5x)', '5 sin(5x)', '−sin(5x)', '5 cos(5x)'], correct: 0 },
        ],
      },
      {
        id: 'u3-l4',
        titleEn: 'Implicit Differentiation',
        titleAr: 'التفاضل الضمني',
        keyFormulas: [
          { label: 'Implicit', formula: "Differentiate both sides w.r.t. x, treat y as f(x)" },
        ],
        examples: [
          { qEn: "Find dy/dx if x² + y² = 25", qAr: "أوجد dy/dx إذا كانت x² + y² = 25", answer: "dy/dx = −x/y" },
        ],
        practiceQ: [
          { qEn: "For xy = 1, dy/dx = ?", qAr: "لـ xy = 1، dy/dx = ؟", options: ['−y/x', 'y/x', '−x/y', '1/x'], correct: 0 },
        ],
      },
      {
        id: 'u3-l5',
        titleEn: 'Related Rates',
        titleAr: 'معدلات مترابطة',
        keyFormulas: [
          { label: 'Strategy', formula: 'Relate variables, differentiate w.r.t. time t' },
        ],
        examples: [
          { qEn: 'A sphere radius grows at 2 cm/s. Find rate of volume change at r = 3 cm', qAr: 'ينمو نصف قطر كرة بمعدل 2 سم/ث. أوجد معدل تغير الحجم عند r = 3 سم', answer: 'dV/dt = 4πr²·(dr/dt) = 4π(9)(2) = 72π cm³/s' },
        ],
        practiceQ: [
          { qEn: 'If A = πr² and dr/dt = 3, find dA/dt when r = 2.', qAr: 'إذا كانت A = πr² و dr/dt = 3، أوجد dA/dt عند r = 2.', options: ['12π', '6π', '4π', '3π'], correct: 0 },
        ],
      },
    ],
  },
  {
    id: 'u4',
    titleEn: 'Unit 4 · Complex Numbers',
    titleAr: 'الوحدة 4 · الأعداد المركبة',
    title: 'Unit 4 · Complex Numbers',
    icon: 'infinite-outline',
    lessons: [
      {
        id: 'u4-l1',
        titleEn: 'Complex Numbers',
        titleAr: 'الأعداد المركبة',
        keyFormulas: [
          { label: 'Standard form', formula: 'z = a + bi,  i² = −1' },
          { label: 'Modulus', formula: '|z| = √(a² + b²)' },
        ],
        examples: [
          { qEn: 'Find |3 + 4i|', qAr: 'أوجد |3 + 4i|', answer: '|z| = √(9+16) = 5' },
        ],
        practiceQ: [
          { qEn: 'i² = ?', qAr: 'i² = ؟', options: ['−1', '1', 'i', '−i'], correct: 0 },
        ],
      },
      {
        id: 'u4-l2',
        titleEn: 'Operations on Complex Numbers',
        titleAr: 'العمليات على الأعداد المركبة',
        keyFormulas: [
          { label: 'Multiply', formula: '(a+bi)(c+di) = (ac−bd) + (ad+bc)i' },
          { label: 'Conjugate', formula: 'z̄ = a − bi,  z·z̄ = |z|²' },
        ],
        examples: [
          { qEn: 'Multiply (2+3i)(1−i)', qAr: 'اضرب (2+3i)(1−i)', answer: '= 2 − 2i + 3i − 3i² = 5 + i' },
        ],
        practiceQ: [
          { qEn: 'Conjugate of (3 − 2i) = ?', qAr: 'مرافق (3 − 2i) = ؟', options: ['3 + 2i', '−3 + 2i', '3 − 2i', '−3 − 2i'], correct: 0 },
        ],
      },
      {
        id: 'u4-l3',
        titleEn: 'Locus in Complex Plane',
        titleAr: 'المحل الهندسي في مستوى الأعداد المركبة',
        keyFormulas: [
          { label: 'Circle', formula: '|z − z₀| = r  →  circle centre z₀, radius r' },
          { label: 'Line', formula: 'arg(z − z₁) = θ  →  ray from z₁' },
        ],
        examples: [
          { qEn: 'Describe the locus |z − (2+i)| = 3', qAr: 'صف المحل الهندسي |z − (2+i)| = 3', answer: 'Circle, centre (2,1), radius 3' },
        ],
        practiceQ: [
          { qEn: '|z| = 4 represents a...?', qAr: '|z| = 4 تمثل...؟', options: ['Circle radius 4', 'Line', 'Point', 'Ellipse'], correct: 0 },
        ],
      },
    ],
  },
];

export const SEMESTER_2_UNITS: Grade12Unit[] = [
  {
    id: 'u5',
    titleEn: 'Unit 5 · Integration',
    titleAr: 'الوحدة 5 · التكامل',
    title: 'Unit 5 · Integration',
    icon: 'pulse-outline',
    lessons: [
      {
        id: 'u5-l1',
        titleEn: 'Integration of Special Functions',
        titleAr: 'تكامل الدوال الخاصة',
        videoId: 'o75AqTInKDU',
        keyFormulas: [
          { label: '∫ xⁿ dx', formula: 'xⁿ⁺¹/(n+1) + C  (n ≠ −1)' },
          { label: '∫ eˣ dx', formula: 'eˣ + C' },
          { label: '∫ sin x dx', formula: '−cos x + C' },
          { label: '∫ cos x dx', formula: 'sin x + C' },
        ],
        examples: [
          { qEn: 'Evaluate ∫(3x² + 2) dx', qAr: 'احسب ∫(3x² + 2) dx', answer: 'x³ + 2x + C' },
        ],
        practiceQ: [
          { qEn: '∫ cos x dx = ?', qAr: '∫ cos x dx = ؟', options: ['sin x + C', '−sin x + C', 'cos x + C', '−cos x + C'], correct: 0 },
        ],
      },
      {
        id: 'u5-l2',
        titleEn: 'Integration by Substitution',
        titleAr: 'التكامل بالتعويض',
        keyFormulas: [
          { label: 'Substitution', formula: 'Let u = g(x), du = g\'(x) dx' },
        ],
        examples: [
          { qEn: 'Evaluate ∫ 2x(x²+1)⁵ dx', qAr: 'احسب ∫ 2x(x²+1)⁵ dx', answer: 'Let u = x²+1 → (x²+1)⁶/6 + C' },
        ],
        practiceQ: [
          { qEn: '∫ 2x · eˣ² dx = ?', qAr: '∫ 2x · eˣ² dx = ؟', options: ['eˣ² + C', '2eˣ² + C', 'x²eˣ + C', 'eˣ + C'], correct: 0 },
        ],
      },
      {
        id: 'u5-l3',
        titleEn: 'Integration by Partial Fractions',
        titleAr: 'التكامل بالكسور الجزئية',
        keyFormulas: [
          { label: 'Method', formula: '∫ A/(x−a) dx = A ln|x−a| + C' },
        ],
        examples: [
          { qEn: '∫ 1/((x+1)(x−1)) dx', qAr: '∫ 1/((x+1)(x−1)) dx', answer: '½ ln|x−1| − ½ ln|x+1| + C' },
        ],
        practiceQ: [
          { qEn: '∫ 1/(x−2) dx = ?', qAr: '∫ 1/(x−2) dx = ؟', options: ['ln|x−2| + C', '1/(x−2)² + C', '(x−2)² + C', '−ln|x−2| + C'], correct: 0 },
        ],
      },
      {
        id: 'u5-l4',
        titleEn: 'Integration by Parts',
        titleAr: 'التكامل بالتجزئة',
        keyFormulas: [
          { label: 'Integration by Parts', formula: '∫ u dv = uv − ∫ v du' },
        ],
        examples: [
          { qEn: '∫ x eˣ dx', qAr: '∫ x eˣ dx', answer: 'u=x, dv=eˣdx → x eˣ − eˣ + C' },
        ],
        practiceQ: [
          { qEn: '∫ x cos x dx — which choice for u?', qAr: '∫ x cos x dx — ما الاختيار المناسب لـ u؟', options: ['u = x', 'u = cos x', 'u = x cos x', 'u = 1'], correct: 0 },
        ],
      },
      {
        id: 'u5-l5',
        titleEn: 'Areas and Volumes',
        titleAr: 'المساحات والأحجام',
        keyFormulas: [
          { label: 'Area under curve', formula: 'A = ∫[a,b] f(x) dx' },
          { label: 'Volume of revolution', formula: 'V = π ∫[a,b] [f(x)]² dx' },
        ],
        examples: [
          { qEn: 'Find area under y = x² from 0 to 3', qAr: 'أوجد المساحة تحت y = x² من 0 إلى 3', answer: '[x³/3]₀³ = 9 sq. units' },
        ],
        practiceQ: [
          { qEn: '∫₀¹ x dx = ?', qAr: '∫₀¹ x dx = ؟', options: ['1/2', '1', '2', '1/4'], correct: 0 },
        ],
      },
      {
        id: 'u5-l6',
        titleEn: 'Differential Equations',
        titleAr: 'المعادلات التفاضلية',
        keyFormulas: [
          { label: 'Separable', formula: 'dy/dx = f(x)g(y)  ⟹  ∫ dy/g(y) = ∫ f(x) dx' },
        ],
        examples: [
          { qEn: 'Solve dy/dx = 2x, y(0)=1', qAr: 'حل dy/dx = 2x, y(0)=1', answer: 'y = x² + 1' },
        ],
        practiceQ: [
          { qEn: 'dy/dx = y  →  general solution?', qAr: 'dy/dx = y → الحل العام؟', options: ['y = Ceˣ', 'y = Cx', 'y = eˣ + C', 'y = x + C'], correct: 0 },
        ],
      },
    ],
  },
  {
    id: 'u6',
    titleEn: 'Unit 6 · Vectors',
    titleAr: 'الوحدة 6 · المتجهات',
    title: 'Unit 6 · Vectors',
    icon: 'navigate-outline',
    lessons: [
      {
        id: 'u6-l1',
        titleEn: 'Vectors in Space',
        titleAr: 'المتجهات في الفراغ',
        keyFormulas: [
          { label: 'Magnitude', formula: '|v| = √(x² + y² + z²)' },
          { label: 'Unit vector', formula: 'v̂ = v / |v|' },
        ],
        examples: [
          { qEn: 'Find |v| for v = (3, 4, 0)', qAr: 'أوجد |v| للمتجه v = (3, 4, 0)', answer: '|v| = √(9+16) = 5' },
        ],
        practiceQ: [
          { qEn: '|v| for v = (1, 1, 1) = ?', qAr: '|v| للمتجه v = (1, 1, 1) = ؟', options: ['√3', '3', '1', '√2'], correct: 0 },
        ],
      },
      {
        id: 'u6-l2',
        titleEn: 'Lines in Space',
        titleAr: 'المستقيمات في الفراغ',
        keyFormulas: [
          { label: 'Vector equation', formula: 'r = a + t·d' },
          { label: 'Parametric', formula: 'x = x₀ + td₁,  y = y₀ + td₂,  z = z₀ + td₃' },
        ],
        examples: [
          { qEn: 'Write vector eq. of line through (1,2,3) with direction (4,5,6)', qAr: 'اكتب معادلة المستقيم المار في (1,2,3) باتجاه (4,5,6)', answer: 'r = (1,2,3) + t(4,5,6)' },
        ],
        practiceQ: [
          { qEn: 'A line through origin with direction (1,1,1): position at t=2?', qAr: 'مستقيم عبر الأصل باتجاه (1,1,1): موضعه عند t=2؟', options: ['(2,2,2)', '(1,1,1)', '(0,0,0)', '(4,4,4)'], correct: 0 },
        ],
      },
      {
        id: 'u6-l3',
        titleEn: 'Dot Product',
        titleAr: 'الضرب القياسي',
        keyFormulas: [
          { label: 'Dot product', formula: 'a·b = a₁b₁ + a₂b₂ + a₃b₃' },
          { label: 'Angle', formula: 'cos θ = (a·b) / (|a||b|)' },
        ],
        examples: [
          { qEn: 'Find angle between (1,0,0) and (0,1,0)', qAr: 'أوجد الزاوية بين (1,0,0) و (0,1,0)', answer: 'a·b = 0  →  θ = 90°' },
        ],
        practiceQ: [
          { qEn: '(1,2)·(3,4) = ?', qAr: '(1,2)·(3,4) = ؟', options: ['11', '7', '14', '5'], correct: 0 },
        ],
      },
    ],
  },
  {
    id: 'u7',
    titleEn: 'Unit 7 · Statistics & Probability',
    titleAr: 'الوحدة 7 · الإحصاء والاحتمال',
    title: 'Unit 7 · Statistics and Probability',
    icon: 'bar-chart-outline',
    lessons: [
      {
        id: 'u7-l1',
        titleEn: 'Geometric & Binomial Distribution',
        titleAr: 'التوزيع الهندسي وثنائي الحد',
        keyFormulas: [
          { label: 'Binomial P(X=k)', formula: 'C(n,k) · pᵏ · (1−p)ⁿ⁻ᵏ' },
          { label: 'Geometric P(X=k)', formula: '(1−p)ᵏ⁻¹ · p' },
        ],
        examples: [
          { qEn: 'P(X=2) for B(5, 0.4)?', qAr: 'P(X=2) لتوزيع B(5, 0.4)؟', answer: 'C(5,2)·0.4²·0.6³ = 10·0.16·0.216 ≈ 0.346' },
        ],
        practiceQ: [
          { qEn: 'In B(n,p), E(X) = ?', qAr: 'في B(n,p)، E(X) = ؟', options: ['np', 'n/p', 'p/n', 'np(1−p)'], correct: 0 },
        ],
      },
      {
        id: 'u7-l2',
        titleEn: 'Normal Distribution',
        titleAr: 'التوزيع الطبيعي',
        videoId: 'rzFX5NWojp0',
        keyFormulas: [
          { label: 'Standard Z', formula: 'Z = (X − μ) / σ' },
          { label: 'Bell curve', formula: 'μ ± σ  covers ≈ 68%, μ ± 2σ  ≈ 95%' },
        ],
        examples: [
          { qEn: 'X~N(50,10²). Find P(X < 60)', qAr: 'X~N(50,10²). أوجد P(X < 60)', answer: 'Z = (60−50)/10 = 1  →  P(Z<1) ≈ 0.8413' },
        ],
        practiceQ: [
          { qEn: 'Z-score formula: Z = ?', qAr: 'صيغة درجة Z: Z = ؟', options: ['(X−μ)/σ', '(X+μ)/σ', 'σ/(X−μ)', 'μ/σ'], correct: 0 },
        ],
      },
    ],
  },
];

export const WORKBOOK_TRACKS = [
  'Workbook 1 · Semester 1',
  'Workbook 2 · Semester 2',
];

function validateGrade12Data(units: Grade12Unit[]) {
  for (const unit of units) {
    for (const lesson of unit.lessons) {
      lesson.practiceQ.forEach((question, index) => {
        if (!Array.isArray(question.options) || question.options.length === 0) {
          throw new Error(
            `Invalid practice question options in ${lesson.id} (${unit.id}) at question ${index + 1}.`,
          );
        }

        if (question.correct < 0 || question.correct >= question.options.length) {
          throw new Error(
            `Invalid correct answer index in ${lesson.id} (${unit.id}) at question ${index + 1}.`,
          );
        }
      });
    }
  }
}

export const ALL_UNITS: Grade12Unit[] = [...SEMESTER_1_UNITS, ...SEMESTER_2_UNITS];
validateGrade12Data(ALL_UNITS);

export function getLocalizedFormulaLabel(label: string, isAr: boolean, fallbackIndex?: number): string {
  if (!isAr) return label;
  return FORMULA_LABEL_AR[label] ?? (fallbackIndex !== undefined ? `الصيغة ${fallbackIndex + 1}` : label);
}

export function findUnitById(unitId?: string): Grade12Unit | undefined {
  if (!unitId) return undefined;
  return ALL_UNITS.find((u) => u.id === unitId);
}

export function findLessonById(lessonId?: string): { unit: Grade12Unit; lesson: Grade12Lesson } | undefined {
  if (!lessonId) return undefined;
  for (const unit of ALL_UNITS) {
    const lesson = unit.lessons.find((l) => l.id === lessonId);
    if (lesson) return { unit, lesson };
  }
  return undefined;
}
