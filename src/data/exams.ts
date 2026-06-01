import { ALL_UNITS, SEMESTER_1_UNITS, SEMESTER_2_UNITS, type Grade12Unit } from './grade12';

export type ExamDifficulty = 'easy' | 'medium' | 'hard';

export type ExamQuestion = {
  id: string;
  unitId: string;
  lessonId: string;
  unitTitleEn: string;
  unitTitleAr: string;
  lessonTitleEn: string;
  lessonTitleAr: string;
  qEn: string;
  qAr: string;
  options: string[];
  correct: number;
};

export type ExamBlueprint = {
  id: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  difficulty: ExamDifficulty;
  icon: string;
  featured?: boolean;
  questions: number;
  minutes: number;
};

const EXAM_SCOPES = {
  'tawjihi-full': {
    units: ALL_UNITS,
    questionLimit: 40,
    minutes: 75,
    titleEn: 'Tawjihi Mixed Simulator',
    titleAr: 'محاكي التوجيهي المختلط',
    descEn: 'Covers the current Grade 12 question bank from both semesters.',
    descAr: 'يغطي بنك الأسئلة الحالي للصف 12 من الفصلين.',
    difficulty: 'hard' as const,
    icon: 'school-outline',
    featured: true,
  },
  'sem1-full': {
    units: SEMESTER_1_UNITS,
    questionLimit: 40,
    minutes: 42,
    titleEn: 'Semester 1 Mixed Simulator',
    titleAr: 'محاكي الفصل الأول المختلط',
    descEn: 'Functions, trig, differentiation, and complex numbers from the live bank.',
    descAr: 'الدوال والمثلثات والتفاضل والأعداد المركبة من البنك الحالي.',
    difficulty: 'hard' as const,
    icon: 'document-text-outline',
  },
  'sem2-full': {
    units: SEMESTER_2_UNITS,
    questionLimit: 40,
    minutes: 33,
    titleEn: 'Semester 2 Mixed Simulator',
    titleAr: 'محاكي الفصل الثاني المختلط',
    descEn: 'Integration, vectors, and statistics from the live bank.',
    descAr: 'التكامل والمتجهات والإحصاء من البنك الحالي.',
    difficulty: 'hard' as const,
    icon: 'document-text-outline',
  },
  'wb1-drill': {
    units: SEMESTER_1_UNITS,
    questionLimit: 12,
    minutes: 20,
    titleEn: 'Semester 1 Review Drill',
    titleAr: 'تدريب مراجعة الفصل الأول',
    descEn: 'Short mixed practice built only from available Semester 1 questions.',
    descAr: 'تدريب قصير مختلط مبني فقط من أسئلة الفصل الأول المتاحة.',
    difficulty: 'medium' as const,
    icon: 'book-outline',
  },
  'wb2-drill': {
    units: SEMESTER_2_UNITS,
    questionLimit: 12,
    minutes: 20,
    titleEn: 'Semester 2 Review Drill',
    titleAr: 'تدريب مراجعة الفصل الثاني',
    descEn: 'Short mixed practice built only from available Semester 2 questions.',
    descAr: 'تدريب قصير مختلط مبني فقط من أسئلة الفصل الثاني المتاحة.',
    difficulty: 'medium' as const,
    icon: 'book-outline',
  },
  'quick-15': {
    units: ALL_UNITS,
    questionLimit: 10,
    minutes: 15,
    titleEn: '15-Minute Speed Round',
    titleAr: 'جولة السرعة - 15 دقيقة',
    descEn: 'Ten fast mixed questions to sharpen speed without repeating fake content.',
    descAr: 'عشرة أسئلة مختلطة سريعة لتقوية السرعة دون وعود بمحتوى غير موجود.',
    difficulty: 'easy' as const,
    icon: 'timer-outline',
  },
} as const;

function buildPool(units: Grade12Unit[]): ExamQuestion[] {
  const pool: ExamQuestion[] = [];

  for (const unit of units) {
    const unitTitleEn = unit.titleEn.replace(/^Unit \d+ · /, '');
    const unitTitleAr = unit.titleAr.replace(/^الوحدة \d+ · /, '');

    for (const lesson of unit.lessons) {
      for (let questionIndex = 0; questionIndex < lesson.practiceQ.length; questionIndex += 1) {
        const question = lesson.practiceQ[questionIndex];
        pool.push({
          id: `${lesson.id}-exam-${questionIndex}`,
          unitId: unit.id,
          lessonId: lesson.id,
          unitTitleEn,
          unitTitleAr,
          lessonTitleEn: lesson.titleEn,
          lessonTitleAr: lesson.titleAr,
          qEn: question.qEn,
          qAr: question.qAr,
          options: question.options,
          correct: question.correct,
        });
      }
    }
  }

  return pool;
}

const poolsByExamId = Object.fromEntries(
  Object.entries(EXAM_SCOPES).map(([examId, scope]) => [examId, buildPool(scope.units)]),
) as Record<ExamId, ExamQuestion[]>;

export type ExamId = keyof typeof EXAM_SCOPES;

export const EXAM_BLUEPRINTS: ExamBlueprint[] = (Object.entries(EXAM_SCOPES) as [ExamId, (typeof EXAM_SCOPES)[ExamId]][]).map(
  ([id, scope]) => ({
    id,
    titleEn: scope.titleEn,
    titleAr: scope.titleAr,
    descEn: scope.descEn,
    descAr: scope.descAr,
    difficulty: scope.difficulty,
    icon: scope.icon,
    featured: 'featured' in scope ? scope.featured : undefined,
    questions: Math.min(scope.questionLimit, poolsByExamId[id].length),
    minutes: scope.minutes,
  }),
);

const blueprintById = new Map(EXAM_BLUEPRINTS.map((exam) => [exam.id, exam]));

export function getExamBlueprint(examId?: string): ExamBlueprint {
  return blueprintById.get((examId as ExamId) ?? 'tawjihi-full') ?? EXAM_BLUEPRINTS[0];
}

export function getExamPool(examId?: string): ExamQuestion[] {
  const normalizedId = (examId as ExamId) ?? 'tawjihi-full';
  return poolsByExamId[normalizedId] ?? poolsByExamId['tawjihi-full'];
}
