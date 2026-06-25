"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  Camera,
  Check,
  ChevronDown,
  Download,
  Languages,
  Music2,
  PenSquare,
  PlayCircle,
  Presentation,
  ScanLine,
  Sparkles,
  Video,
  Wallet,
} from "lucide-react";

type Locale = "ar" | "en";

type LocalizedText = {
  ar: string;
  en: string;
};

type NavItem = {
  href: string;
  label: LocalizedText;
};

type ProblemCard = {
  icon: LucideIcon;
  title: LocalizedText;
  body: LocalizedText;
  stat: LocalizedText;
};

type FeatureCard = {
  icon: LucideIcon;
  title: LocalizedText;
  body: LocalizedText;
  mockup: LocalizedText;
};

type Semester = {
  id: string;
  title: LocalizedText;
  units: LocalizedText[];
};

type PricingTier = {
  id: string;
  title: LocalizedText;
  price: LocalizedText;
  subtitle: LocalizedText;
  cta: LocalizedText;
  badge?: LocalizedText;
  featured?: boolean;
};

type ComparisonRow = {
  label: LocalizedText;
  snapmath: LocalizedText;
  joAcademy: LocalizedText;
  tutors: LocalizedText;
};

type CommunityCard = {
  title: LocalizedText;
  subtitle: LocalizedText;
  body: LocalizedText;
};

type WaitlistFormState = {
  name: string;
  email: string;
  phone: string;
  role: string;
  interest: string;
  notes: string;
};

const navItems: NavItem[] = [
  {
    href: "#features",
    label: { ar: "المميزات", en: "Features" },
  },
  {
    href: "#demo",
    label: { ar: "الفيديو", en: "Demo" },
  },
  {
    href: "#curriculum",
    label: { ar: "المنهاج", en: "Curriculum" },
  },
  {
    href: "#pricing",
    label: { ar: "الأسعار", en: "Pricing" },
  },
];

const problemCards: ProblemCard[] = [
  {
    icon: Wallet,
    stat: {
      ar: "900+ دينار سنوياً",
      en: "900+ JD / year",
    },
    title: {
      ar: "الدروس الخصوصية تستنزف العائلة",
      en: "Private tutoring drains family budgets",
    },
    body: {
      ar: "الطالب يحتاج دعماً مستمراً، لكن الكلفة السنوية للدروس الخصوصية صارت فوق قدرة معظم العائلات.",
      en: "Students need ongoing support, but yearly private tutoring costs have climbed far beyond what most families can sustain.",
    },
  },
  {
    icon: Presentation,
    stat: {
      ar: "شرائح فقط",
      en: "Slides only",
    },
    title: {
      ar: "المنصات الحالية مملة بصرياً",
      en: "Existing platforms are visually flat",
    },
    body: {
      ar: "معظم المحتوى الحالي يعتمد على شرائح جامدة وتسجيلات طويلة لا تبني الفهم العميق.",
      en: "Most current content relies on static slides and long recordings that do not build deep mathematical intuition.",
    },
  },
  {
    icon: Languages,
    stat: {
      ar: "0 بديل مطابق",
      en: "0 true matches",
    },
    title: {
      ar: "لا يوجد محتوى رياضيات بصري بالعربي",
      en: "There is no visual Arabic-first math platform",
    },
    body: {
      ar: "طالب التوجيهي العربي لا يجد شرحاً بصرياً محترفاً يشبه 3Blue1Brown لكنه مصمم لكتاب الأردن.",
      en: "Arabic-speaking Tawjihi students still do not have a premium visual math experience built around the Jordanian syllabus.",
    },
  },
];

const featureCards: FeatureCard[] = [
  {
    icon: ScanLine,
    title: {
      ar: "MathScan التشخيصي",
      en: "MathScan Diagnostic Test",
    },
    body: {
      ar: "ابدأ بتشخيص سريع يحدد نقاط القوة والضعف ويقترح أين تبدأ فعلياً.",
      en: "Start with a fast diagnostic that identifies strengths, weaknesses, and the best lesson starting point.",
    },
    mockup: {
      ar: "نتيجة تشخيص ذكية",
      en: "Smart scan results",
    },
  },
  {
    icon: PlayCircle,
    title: {
      ar: "دروس فيديو ثلاثية الأبعاد",
      en: "3D Animated Video Lessons",
    },
    body: {
      ar: "شرح بصري واضح بأسلوب 3Blue1Brown لكن بالعربي ومبني للتوجيهي.",
      en: "Clear, visual teaching inspired by 3Blue1Brown, delivered in Arabic and built for Tawjihi.",
    },
    mockup: {
      ar: "أنيميشن توضيحي",
      en: "Animated explanation",
    },
  },
  {
    icon: Bot,
    title: {
      ar: "مدرب AI",
      en: "AI Tutor",
    },
    body: {
      ar: "اسأل، راجع، واطلب تبسيط الفكرة خطوة بخطوة بدعم ذكي داخل التطبيق.",
      en: "Ask, review, and simplify any concept step by step with in-app AI tutoring support.",
    },
    mockup: {
      ar: "محادثة رياضيات ذكية",
      en: "Smart math chat",
    },
  },
  {
    icon: PenSquare,
    title: {
      ar: "أسئلة تدريب مع تصحيح فوري",
      en: "Practice With Instant Feedback",
    },
    body: {
      ar: "بعد كل درس، يتحرك الطالب مباشرة إلى أسئلة تطبيقية مع تفسير للإجابات.",
      en: "After each lesson, students jump into applied questions with immediate explanations.",
    },
    mockup: {
      ar: "تغذية راجعة فورية",
      en: "Instant feedback",
    },
  },
  {
    icon: BarChart3,
    title: {
      ar: "تتبع التقدم",
      en: "Progress Tracking",
    },
    body: {
      ar: "لوحة تقدم واضحة تبين مستوى الطالب عبر الوحدات والدروس والالتزام اليومي.",
      en: "A clean progress dashboard shows mastery across units, lessons, and daily consistency.",
    },
    mockup: {
      ar: "لوحة إنجاز الطالب",
      en: "Student progress board",
    },
  },
];

const curriculum: Semester[] = [
  {
    id: "semester-1",
    title: {
      ar: "الفصل الأول",
      en: "Semester 1",
    },
    units: [
      {
        ar: "الوحدة 1: الدوال والجبر (نظرية الباقي والعامل، الكسور الجزئية)",
        en: "Unit 1: Functions & Algebra (Remainder/Factor Theorem, Partial Fractions)",
      },
      {
        ar: "الوحدة 2: الهويات المثلثية والمعادلات",
        en: "Unit 2: Trig Identities & Equations",
      },
      {
        ar: "الوحدة 3: التفاضل وتطبيقاته",
        en: "Unit 3: Differentiation & Applications",
      },
      {
        ar: "الوحدة 4: الأعداد المركبة",
        en: "Unit 4: Complex Numbers",
      },
    ],
  },
  {
    id: "semester-2",
    title: {
      ar: "الفصل الثاني",
      en: "Semester 2",
    },
    units: [
      {
        ar: "الوحدة 5: التكامل",
        en: "Unit 5: Integration",
      },
      {
        ar: "الوحدة 6: المتجهات",
        en: "Unit 6: Vectors",
      },
      {
        ar: "الوحدة 7: الإحصاء والاحتمالات",
        en: "Unit 7: Statistics & Probability",
      },
    ],
  },
];

const pricingTiers: PricingTier[] = [
  {
    id: "free",
    title: {
      ar: "مجاني",
      en: "Free",
    },
    price: {
      ar: "0 JD",
      en: "0 JD",
    },
    subtitle: {
      ar: "MathScan + درس واحد لكل فصل + سؤالان يومياً",
      en: "MathScan + 1 lesson per chapter + 2 questions per day",
    },
    cta: {
      ar: "ابدأ مجاناً",
      en: "Start Free",
    },
  },
  {
    id: "monthly",
    title: {
      ar: "شهري",
      en: "Monthly",
    },
    price: {
      ar: "39.99 JD",
      en: "39.99 JD",
    },
    subtitle: {
      ar: "فتح كامل للمحتوى والدعم الذكي على أساس شهري",
      en: "Full access to lessons, practice, and AI tutoring on a monthly plan",
    },
    cta: {
      ar: "اشترك شهري",
      en: "Subscribe Monthly",
    },
  },
  {
    id: "semester",
    title: {
      ar: "فصلي",
      en: "Semester",
    },
    price: {
      ar: "199.99 JD",
      en: "199.99 JD",
    },
    subtitle: {
      ar: "أفضل توازن بين السعر والتغطية لطلاب التوجيهي",
      en: "The best balance of price and coverage for serious Tawjihi students",
    },
    cta: {
      ar: "اشترك فصلي",
      en: "Subscribe Semester",
    },
    badge: {
      ar: "الأكثر شعبية",
      en: "Most Popular",
    },
    featured: true,
  },
  {
    id: "annual",
    title: {
      ar: "سنوي",
      en: "Annual",
    },
    price: {
      ar: "349.99 JD",
      en: "349.99 JD",
    },
    subtitle: {
      ar: "الخطة الكاملة للعام كله مع أفضل قيمة طويلة المدى",
      en: "The complete year-long plan with the strongest long-term value",
    },
    cta: {
      ar: "اشترك سنوي",
      en: "Subscribe Annual",
    },
  },
];

const comparisonRows: ComparisonRow[] = [
  {
    label: {
      ar: "السعر",
      en: "Price",
    },
    snapmath: {
      ar: "39.99 دينار / شهرياً",
      en: "39.99 JD / month",
    },
    joAcademy: {
      ar: "متغير",
      en: "Varies",
    },
    tutors: {
      ar: "900+ دينار / سنوياً",
      en: "900+ JD / year",
    },
  },
  {
    label: {
      ar: "جودة الفيديو",
      en: "Video Quality",
    },
    snapmath: {
      ar: "دروس ثلاثية الأبعاد بالعربية",
      en: "3D Arabic-first lessons",
    },
    joAcademy: {
      ar: "محاضرات مسجلة",
      en: "Recorded lectures",
    },
    tutors: {
      ar: "يعتمد على المدرس",
      en: "Depends on tutor",
    },
  },
  {
    label: {
      ar: "دعم AI",
      en: "AI Support",
    },
    snapmath: {
      ar: "مدعوم بـ Claude",
      en: "Claude-powered",
    },
    joAcademy: {
      ar: "لا يوجد",
      en: "No",
    },
    tutors: {
      ar: "لا يوجد",
      en: "No",
    },
  },
  {
    label: {
      ar: "الأنيميشن",
      en: "Animations",
    },
    snapmath: {
      ar: "بأسلوب 3Blue1Brown",
      en: "3Blue1Brown-style",
    },
    joAcademy: {
      ar: "شرائح محدودة",
      en: "Minimal slides",
    },
    tutors: {
      ar: "لا يوجد",
      en: "None",
    },
  },
  {
    label: {
      ar: "تطبيق موبايل",
      en: "Mobile App",
    },
    snapmath: {
      ar: "تطبيق iOS أصلي",
      en: "Native iOS app",
    },
    joAcademy: {
      ar: "محدود",
      en: "Limited",
    },
    tutors: {
      ar: "بدون تطبيق",
      en: "No app",
    },
  },
];

const communityCards: CommunityCard[] = [
  {
    title: {
      ar: "أولوية الدخول لأول دفعة",
      en: "Priority access to the first cohort",
    },
    subtitle: {
      ar: "دعوات مبكرة قبل الإطلاق العام",
      en: "Early invitations before the public launch",
    },
    body: {
      ar: "التسجيل في القائمة يعني أن روابط الوصول الأولى وتحديثات الإطلاق ستصل إليك قبل فتح التطبيق للعامة.",
      en: "Joining the waitlist means the first access links and launch updates reach you before the wider public rollout.",
    },
  },
  {
    title: {
      ar: "وضوح كامل للأهل قبل الاشتراك",
      en: "Clear plan for families before they commit",
    },
    subtitle: {
      ar: "تفاصيل الاشتراك وما الذي يتضمنه كل خيار",
      en: "Pricing, coverage, and what each plan unlocks",
    },
    body: {
      ar: "سنرسل توقيت الإطلاق، ما الذي يتضمنه كل اشتراك، وكيف يبدأ الوصول الفعلي حتى يكون القرار واضحاً للعائلة.",
      en: "We will share launch timing, what each subscription includes, and how access opens so families can decide with confidence.",
    },
  },
  {
    title: {
      ar: "متابعة حقيقية من أول يوم",
      en: "Real launch updates from day one",
    },
    subtitle: {
      ar: "مقاطع دروس، تحديثات منتج، ولحظات الإطلاق",
      en: "Lesson clips, product updates, and launch milestones",
    },
    body: {
      ar: "إنستغرام، تيك توك، ويوتيوب ستكون مكاننا لنشر المقاطع القصيرة، التحديثات، وأخبار التقدم أولاً بأول.",
      en: "Instagram, TikTok, and YouTube are where we will share short lesson previews, product updates, and launch progress as it happens.",
    },
  },
];

const launchInterestHref = "#waitlist";
const subscriptionInterestHref = "#waitlist";
const socialHandle = "@snapmathacademy";
const formSubmitEndpoint = "https://formsubmit.co/ajax/hello@snapmathacademy.com";
const lessonDemoVideoUrl = "/demo-video.mp4";
const lessonDemoPosterUrl = "/demo-poster.png";
const emptyWaitlistForm: WaitlistFormState = {
  name: "",
  email: "",
  phone: "",
  role: "",
  interest: "early-access",
  notes: "",
};

function copyFor(locale: Locale, text: LocalizedText) {
  return text[locale];
}

function Section({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={["scroll-mt-28", className].filter(Boolean).join(" ")}
    >
      {children}
    </motion.section>
  );
}

export function SnapMathLanding() {
  const [locale, setLocale] = useState<Locale>("ar");
  const [openSemester, setOpenSemester] = useState<string>(curriculum[0].id);
  const [waitlistForm, setWaitlistForm] = useState<WaitlistFormState>(emptyWaitlistForm);
  const [waitlistState, setWaitlistState] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [waitlistMessage, setWaitlistMessage] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("snapmath-locale");
    if (stored === "ar" || stored === "en") {
      setLocale(stored);
      return;
    }

    const detected = navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en";
    setLocale(detected);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("snapmath-locale", locale);
  }, [locale]);

  const isArabic = locale === "ar";
  const direction = isArabic ? "rtl" : "ltr";
  const headingClass = isArabic ? "font-arabic" : "font-heading";
  const textAlign = isArabic ? "text-right" : "text-left";
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const waitlistCopy = useMemo(
    () => ({
      kicker: isArabic ? "قائمة الانتظار" : "Waitlist",
      title: isArabic
        ? "احجز مكانك في أول دفعة من سناب ماث"
        : "Reserve a spot in the first SnapMath cohort",
      description: isArabic
        ? "اكتب بياناتك وسنرسل لك تحديثات الإطلاق، الدعوات المبكرة، وأولوية الوصول للتطبيق."
        : "Share your details and we will send you launch updates, early invitations, and first access to the app.",
      responseTime: isArabic ? "نرد عادة خلال 24 ساعة" : "Usually replies within 24 hours",
      noCharge: isArabic ? "لا يوجد أي دفع من هذه الصفحة" : "No payment is taken on this page",
      name: isArabic ? "الاسم الكامل" : "Full name",
      email: isArabic ? "البريد الإلكتروني" : "Email address",
      phone: isArabic ? "رقم الهاتف أو واتساب" : "Phone or WhatsApp",
      role: isArabic ? "أنا..." : "I am a...",
      interest: isArabic ? "أهتم بـ" : "Interested in",
      notes: isArabic ? "ملاحظات إضافية" : "Anything else?",
      notesPlaceholder: isArabic
        ? "مثلاً: الصف الحالي، الوحدة الأصعب، أو نوع الاشتراك المناسب لك."
        : "For example: current grade, hardest unit, or which plan you want first.",
      submit: isArabic ? "انضم إلى قائمة الانتظار" : "Join the waitlist",
      submitting: isArabic ? "جارٍ الإرسال..." : "Submitting...",
      success: isArabic
        ? "تم تسجيلك بنجاح. سنراسلك أول ما نفتح الوصول."
        : "You are on the list. We will contact you as soon as access opens.",
      error: isArabic
        ? "تعذر إرسال الطلب الآن. جرّب مرة أخرى أو راسلنا مباشرة على hello@snapmathacademy.com"
        : "We could not submit right now. Please try again or email us directly at hello@snapmathacademy.com.",
      roleOptions: [
        { value: "", label: isArabic ? "اختر الفئة المناسبة" : "Select the best fit" },
        { value: "student", label: isArabic ? "طالب / طالبة" : "Student" },
        { value: "parent", label: isArabic ? "ولي أمر" : "Parent" },
        { value: "teacher", label: isArabic ? "معلم / معلمة" : "Teacher" },
      ],
      interestOptions: [
        { value: "early-access", label: isArabic ? "الوصول المبكر" : "Early access" },
        { value: "monthly-plan", label: isArabic ? "الاشتراك الشهري" : "Monthly plan" },
        { value: "semester-plan", label: isArabic ? "الاشتراك الفصلي" : "Semester plan" },
        { value: "annual-plan", label: isArabic ? "الاشتراك السنوي" : "Annual plan" },
      ],
      disclaimer: isArabic
        ? "نستخدم هذه المعلومات فقط للتواصل حول الإطلاق والاشتراك. لن نشارك بياناتك مع أي طرف خارجي."
        : "We only use this information for launch and subscription updates. We do not share your details with third parties.",
    }),
    [isArabic]
  );

  const updateWaitlistField = (field: keyof WaitlistFormState, value: string) => {
    setWaitlistForm((current) => ({ ...current, [field]: value }));
  };

  const submitWaitlist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWaitlistState("submitting");
    setWaitlistMessage("");

    try {
      const response = await fetch(formSubmitEndpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: waitlistForm.name,
          email: waitlistForm.email,
          phone: waitlistForm.phone,
          role: waitlistForm.role,
          interest: waitlistForm.interest,
          notes: waitlistForm.notes,
          locale,
          _subject: "SnapMath Academy waitlist signup",
          _template: "table",
          _captcha: "false",
        }),
      });

      if (!response.ok) {
        throw new Error("waitlist-submit-failed");
      }

      setWaitlistState("success");
      setWaitlistMessage(waitlistCopy.success);
      setWaitlistForm(emptyWaitlistForm);
    } catch {
      setWaitlistState("error");
      setWaitlistMessage(waitlistCopy.error);
    }
  };

  const heroContent = useMemo(
    () => ({
      kicker: isArabic ? "رياضيات التوجيهي بشكل جديد تماماً" : "A new standard for Tawjihi math",
      title: isArabic
        ? "أول تطبيق يقدم دروس رياضيات التوجيهي بأنيميشن ثلاثي الأبعاد"
        : "The first Tawjihi math app with cinematic 3D animation in Arabic",
      subtitle: isArabic
        ? "أنيميشن رياضيات بأسلوب بصري قوي، لكن بالعربي ومصمم فعلياً لكتاب التوجيهي."
        : "3Blue1Brown-style math animations — in Arabic. Built for Tawjihi.",
      description: isArabic
        ? "سناب ماث يجمع التشخيص الذكي، الدروس البصرية، والمدرب الذكي داخل تجربة موبايل مصممة لطالب الأردن."
        : "SnapMath combines smart diagnostics, visual lessons, and AI coaching inside a premium mobile experience designed for Jordanian students.",
      primaryCta: isArabic ? "اطلب الوصول المبكر" : "Get Early Access",
      secondaryCta: isArabic ? "شاهد العرض" : "Watch Demo",
      stats: isArabic
        ? ["7 وحدات تغطي التوجيهي", "مدرب AI داخل التطبيق", "أنيميشن عربي ثلاثي الأبعاد"]
        : ["7 curriculum units", "In-app AI tutor", "Arabic 3D animations"],
    }),
    [isArabic]
  );

  return (
    <div
      dir={direction}
      className="relative overflow-x-hidden bg-background text-white selection:bg-accent selection:text-background"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="page-glow absolute inset-0" />
        <div className="grain-overlay" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/75 backdrop-blur-xl">
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 ${
            isArabic ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <a
            href="#hero"
            className={`flex items-center gap-3 ${isArabic ? "flex-row-reverse" : ""}`}
          >
            <Image
              src="/snapmath-logo-placeholder.svg"
                alt="SnapMath Academy logo"
              width={48}
              height={48}
              priority
              className="h-12 w-12 rounded-2xl"
            />
            <div className={textAlign}>
              <p className={`${headingClass} text-lg font-semibold tracking-wide text-white`}>
                SnapMath Academy
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">Tawjihi</p>
            </div>
          </a>

          <div className={`flex items-center gap-3 ${isArabic ? "flex-row-reverse" : ""}`}>
            <nav className="hidden items-center gap-6 lg:flex">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm text-white/70 transition hover:text-accent-light"
                >
                  {copyFor(locale, item.label)}
                </a>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => setLocale((current) => (current === "ar" ? "en" : "ar"))}
              className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-accent/60 hover:text-white ${
                isArabic ? "flex-row-reverse" : ""
              }`}
            >
              <Languages className="h-4 w-4 text-accent" />
              {isArabic ? "English" : "العربية"}
            </button>

            <a
              href={launchInterestHref}
              className={`inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-accent-hover ${
                isArabic ? "flex-row-reverse" : ""
              }`}
            >
              <Download className="h-4 w-4" />
              {isArabic ? "اطلب الوصول" : "Get Access"}
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section
          id="hero"
          className="mx-auto max-w-7xl scroll-mt-28 px-6 pb-24 pt-12 md:pb-32 md:pt-20"
        >
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={textAlign}
            >
              <div
                className={`inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent-light ${
                  isArabic ? "flex-row-reverse" : ""
                }`}
              >
                <Sparkles className="h-4 w-4" />
                {heroContent.kicker}
              </div>

              <h1
                className={`mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-7xl ${
                  headingClass
                }`}
              >
                {heroContent.title}
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
                {heroContent.subtitle}
              </p>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/62 sm:text-lg">
                {heroContent.description}
              </p>

              <div
                className={`mt-8 flex flex-col gap-4 sm:flex-row ${isArabic ? "sm:flex-row-reverse" : ""}`}
              >
                <a
                  href={launchInterestHref}
                  className={`inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:scale-[1.02] hover:bg-accent-hover ${
                    isArabic ? "flex-row-reverse" : ""
                  }`}
                >
                  {heroContent.primaryCta}
                  <ArrowIcon className="h-4 w-4" />
                </a>
                <a
                  href="#demo"
                  className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-base font-semibold text-white transition hover:border-accent/50 hover:bg-white/10 ${
                    isArabic ? "flex-row-reverse" : ""
                  }`}
                >
                  <PlayCircle className="h-5 w-5 text-accent" />
                  {heroContent.secondaryCta}
                </a>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {heroContent.stats.map((stat) => (
                  <div
                    key={stat}
                    className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75 shadow-accent-xs"
                  >
                    {stat}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="absolute inset-x-8 top-6 h-72 rounded-full bg-accent/20 blur-3xl" />
              <div className="relative mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-md">
                <div className="rounded-[1.6rem] border border-white/10 bg-surface p-4">
                  <div className="gradient-phone rounded-[1.4rem] border border-accent/20 p-5">
                    <div
                      className={`flex items-center justify-between gap-4 ${isArabic ? "flex-row-reverse" : ""}`}
                    >
                      <div className={textAlign}>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                          {isArabic ? "معاينة التطبيق" : "App Preview"}
                        </p>
                        <h2 className={`mt-2 text-2xl font-semibold text-white ${headingClass}`}>
                          {isArabic ? "واجهة مصممة للطالب" : "Built for students"}
                        </h2>
                      </div>
                      <div className="rounded-2xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-accent-light">
                        {isArabic ? "تطبيق iPhone" : "iPhone App"}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4">
                      <div className="rounded-[1.4rem] border border-white/10 bg-black/30 p-4">
                        <div className="mb-4 h-3 w-24 rounded-full bg-accent/60" />
                        <div className="grid gap-3">
                          <div className="mockup-radial h-24 rounded-3xl border border-accent/20" />
                          <div className="grid grid-cols-2 gap-3">
                            <div className="h-24 rounded-3xl border border-white/10 bg-white/5" />
                            <div className="h-24 rounded-3xl border border-white/10 bg-white/5" />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm text-white/55">{isArabic ? "المدرب الذكي" : "AI Tutor"}</p>
                          <p className="mt-2 text-base text-white">
                            {isArabic ? "اشرح لي نظرية العامل بصرياً" : "Show me factor theorem visually"}
                          </p>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm text-white/55">
                            {isArabic ? "التقدّم" : "Progress"}
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-accent-light">82%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <Section id="problem" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className={textAlign}>
            <p className="section-label">{isArabic ? "لماذا سناب ماث؟" : "Why SnapMath?"}</p>
            <h2 className={`mt-4 text-3xl font-semibold text-white sm:text-5xl ${headingClass}`}>
              {isArabic
                ? "لأن طالب التوجيهي يستحق تجربة تعليمية أقوى من الشرائح والتلقين"
                : "Because Tawjihi students deserve more than slides and memorisation"}
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {problemCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={copyFor(locale, card.title)}
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.65, delay: index * 0.08 }}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-accent-sm"
                >
                  <div
                    className={`flex items-start justify-between gap-4 ${isArabic ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`rounded-2xl border border-accent/30 bg-accent/12 p-3`}>
                      <Icon className="h-6 w-6 text-accent-light" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/55">
                      {copyFor(locale, card.stat)}
                    </span>
                  </div>
                  <h3 className={`mt-6 text-2xl font-semibold text-white ${headingClass} ${textAlign}`}>
                    {copyFor(locale, card.title)}
                  </h3>
                  <p className={`mt-4 text-base leading-8 text-white/65 ${textAlign}`}>
                    {copyFor(locale, card.body)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </Section>

        <Section id="features" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className={textAlign}>
            <p className="section-label">
              {isArabic ? "كل اللي بتحتاجه للتوجيهي" : "Everything you need for Tawjihi"}
            </p>
            <h2 className={`mt-4 text-3xl font-semibold text-white sm:text-5xl ${headingClass}`}>
              {isArabic
                ? "من التشخيص إلى التتبع اليومي داخل تجربة واحدة"
                : "From diagnosis to daily mastery in one premium flow"}
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={copyFor(locale, feature.title)}
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.16 }}
                  transition={{ duration: 0.65, delay: index * 0.05 }}
                  whileHover={{ y: -6 }}
                  className="group rounded-[2rem] border border-white/10 bg-white/5 p-6 transition duration-300 hover:border-accent/40 shadow-accent-hover"
                >
                  <div
                    className={`flex items-center gap-3 ${isArabic ? "flex-row-reverse justify-end" : ""}`}
                  >
                    <div className="rounded-2xl border border-accent/30 bg-accent/10 p-3">
                      <Icon className="h-6 w-6 text-accent-light" />
                    </div>
                    <h3 className={`text-2xl font-semibold text-white ${headingClass} ${textAlign}`}>
                      {copyFor(locale, feature.title)}
                    </h3>
                  </div>

                  <p className={`mt-5 text-base leading-8 text-white/65 ${textAlign}`}>
                    {copyFor(locale, feature.body)}
                  </p>

                  <div className="mt-6 rounded-[1.8rem] border border-white/10 bg-surface-elevated p-4">
                    <div className="gradient-mockup rounded-[1.5rem] border border-accent/20 p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="h-3 w-16 rounded-full bg-accent/55" />
                        <div className="h-3 w-10 rounded-full bg-white/15" />
                      </div>
                      <div className="space-y-3">
                        <div className="h-32 rounded-[1.2rem] border border-white/10 bg-white/5" />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="h-14 rounded-2xl border border-white/10 bg-black/25" />
                          <div className="h-14 rounded-2xl border border-white/10 bg-black/25" />
                        </div>
                      </div>
                      <p className={`mt-4 text-sm text-accent-light ${textAlign}`}>
                        {copyFor(locale, feature.mockup)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Section>

        <Section id="demo" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className={textAlign}>
            <p className="section-label">
              {isArabic ? "شوف الفرق بنفسك" : "See the difference yourself"}
            </p>
            <h2 className={`mt-4 text-3xl font-semibold text-white sm:text-5xl ${headingClass}`}>
              {isArabic
                ? "شاهد كيف تبدو حصة سناب ماث قبل الإطلاق"
                : "Preview the SnapMath lesson experience before launch"}
            </h2>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75 }}
            className="mt-10 rounded-[2.2rem] border border-white/10 bg-white/5 p-4 shadow-accent-md"
          >
            <div className="relative aspect-video overflow-hidden rounded-[1.8rem] border border-accent/20 bg-black">
              <video
                controls
                playsInline
                preload="metadata"
                poster={lessonDemoPosterUrl}
                className="h-full w-full object-cover"
              >
                <source src={lessonDemoVideoUrl} type="video/mp4" />
              </video>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.88))] px-6 py-5">
                <p className={`text-sm uppercase tracking-[0.25em] text-accent-light ${textAlign}`}>
                  {isArabic ? "عرض فعلي من الدرس" : "Real lesson preview"}
                </p>
                <p className={`mt-2 max-w-2xl text-sm leading-7 text-white/72 ${textAlign}`}>
                  {isArabic
                    ? "هذه معاينة حقيقية من أول درس داخل سناب ماث حتى ترى الإيقاع، الأسلوب البصري، وطريقة الشرح قبل الإطلاق."
                    : "This is a real preview from the first SnapMath lesson so visitors can experience the pacing, visual style, and explanation quality before launch."}
                </p>
              </div>
            </div>
          </motion.div>
        </Section>

        <Section id="curriculum" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className={textAlign}>
            <p className="section-label">{isArabic ? "منهاج التوجيهي الكامل" : "Full Tawjihi Syllabus"}</p>
            <h2 className={`mt-4 text-3xl font-semibold text-white sm:text-5xl ${headingClass}`}>
              {isArabic
                ? "كل فصل وكل وحدة داخل مسار واضح وقابل للتوسع"
                : "Every semester and every unit inside one expandable learning map"}
            </h2>
          </div>

          <div className="mt-10 space-y-4">
            {curriculum.map((semester) => {
              const isOpen = openSemester === semester.id;
              return (
                <div key={semester.id} className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSemester((current) => (current === semester.id ? "" : semester.id))
                    }
                    className={`flex w-full items-center justify-between gap-4 px-6 py-5 ${isArabic ? "flex-row-reverse" : ""}`}
                  >
                    <div className={textAlign}>
                      <p className={`text-2xl font-semibold text-white ${headingClass}`}>
                        {copyFor(locale, semester.title)}
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-accent-light transition ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-4 px-6 pb-6">
                        {semester.units.map((unit) => (
                          <div
                            key={copyFor(locale, unit)}
                            className={`flex items-start gap-3 rounded-3xl border border-white/10 bg-black/20 p-4 ${isArabic ? "flex-row-reverse" : ""}`}
                          >
                            <span className="mt-1 rounded-full bg-accent p-1 text-white">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                            <p className={`text-base leading-8 text-white/75 ${textAlign}`}>
                              {copyFor(locale, unit)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section id="pricing" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className={textAlign}>
            <p className="section-label">{isArabic ? "اشترك الآن" : "Subscribe Now"}</p>
            <h2 className={`mt-4 text-3xl font-semibold text-white sm:text-5xl ${headingClass}`}>
              {isArabic
                ? "اختر الخطة المناسبة وابدأ ببناء فهم حقيقي للرياضيات"
                : "Choose the plan that fits and start building real mathematical confidence"}
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pricingTiers.map((tier) => (
              <motion.div
                key={tier.id}
                whileHover={{ y: -6 }}
                className={`relative rounded-[2rem] border p-6 transition ${
                  tier.featured
                    ? "gradient-featured border-accent/60 shadow-accent-lg"
                    : "border-white/10 bg-white/5"
                }`}
              >
                {tier.badge ? (
                  <div
                    className={`absolute ${isArabic ? "left-5" : "right-5"} top-5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white`}
                  >
                    {copyFor(locale, tier.badge)}
                  </div>
                ) : null}

                <p className={`text-sm uppercase tracking-[0.25em] text-white/45 ${textAlign}`}>
                  {copyFor(locale, tier.title)}
                </p>
                <p className={`mt-6 text-4xl font-semibold text-white ${headingClass} ${textAlign}`}>
                  {copyFor(locale, tier.price)}
                </p>
                <p className={`mt-4 min-h-[88px] text-base leading-8 text-white/65 ${textAlign}`}>
                  {copyFor(locale, tier.subtitle)}
                </p>

                <a
                  href={subscriptionInterestHref}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-semibold transition ${
                    tier.featured
                      ? "bg-accent text-white hover:bg-accent-hover"
                      : "border border-white/15 bg-white/5 text-white hover:border-accent/50 hover:bg-white/10"
                  } ${isArabic ? "flex-row-reverse" : ""}`}
                >
                  {copyFor(locale, tier.cta)}
                  <ArrowIcon className="h-4 w-4" />
                </a>
              </motion.div>
            ))}
          </div>

          <p className={`mt-6 text-sm text-white/45 ${textAlign}`}>
            {isArabic
              ? "ملاحظة: الاشتراك مخصص لجهاز واحد لكل حساب."
              : "Note: each subscription is intended for a single device per account."}
          </p>
          <p className={`mt-2 text-sm text-white/45 ${textAlign}`}>
            {isArabic
              ? "لا يوجد دفع من هذه الصفحة الآن. التسجيل هنا فقط لطلب الوصول ومعرفة تفاصيل الباقات عند الإطلاق."
              : "There is no payment on this page today. This form is only for access requests and launch updates when plans go live."}
          </p>
        </Section>

        <Section id="waitlist" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className={textAlign}>
              <p className="section-label">{waitlistCopy.kicker}</p>
              <h2 className={`mt-4 text-3xl font-semibold text-white sm:text-5xl ${headingClass}`}>
                {waitlistCopy.title}
              </h2>
              <p className={`mt-6 max-w-xl text-lg leading-8 text-white/68 ${textAlign}`}>
                {waitlistCopy.description}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  isArabic ? "أولوية الوصول قبل الإطلاق العام" : "Priority access before public launch",
                  isArabic ? "تحديثات مباشرة حول الدروس والباقات" : "Direct updates on lessons and pricing",
                  isArabic ? "دعوات مبكرة لأول التجارب" : "Early invitations for the first cohort",
                  isArabic ? "رد سريع لفهم ما يحتاجه الطالب" : "Fast follow-up to match the right student plan",
                  waitlistCopy.responseTime,
                  waitlistCopy.noCharge,
                ].map((item) => (
                  <div
                    key={item}
                    className={`rounded-[1.6rem] border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/72 ${
                      isArabic ? "text-right" : "text-left"
                    }`}
                  >
                    <span className={`inline-flex items-center gap-2 ${isArabic ? "flex-row-reverse" : ""}`}>
                      <Check className="h-4 w-4 text-accent-light" />
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="gradient-waitlist rounded-[2rem] border border-accent/20 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <form className="space-y-4" onSubmit={submitWaitlist}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className={`mb-2 block text-sm text-white/65 ${textAlign}`}>{waitlistCopy.name}</span>
                    <input
                      required
                      value={waitlistForm.name}
                      onChange={(event) => updateWaitlistField("name", event.target.value)}
                      className={`w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/25 focus:border-accent/60 focus:bg-black/35 ${textAlign}`}
                      placeholder={waitlistCopy.name}
                    />
                  </label>

                  <label className="block">
                    <span className={`mb-2 block text-sm text-white/65 ${textAlign}`}>{waitlistCopy.email}</span>
                    <input
                      required
                      type="email"
                      value={waitlistForm.email}
                      onChange={(event) => updateWaitlistField("email", event.target.value)}
                      dir="ltr"
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/25 focus:border-accent/60 focus:bg-black/35"
                      placeholder="name@example.com"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className={`mb-2 block text-sm text-white/65 ${textAlign}`}>{waitlistCopy.phone}</span>
                    <input
                      value={waitlistForm.phone}
                      onChange={(event) => updateWaitlistField("phone", event.target.value)}
                      dir="ltr"
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/25 focus:border-accent/60 focus:bg-black/35"
                      placeholder="+962 7X XXX XXXX"
                    />
                  </label>

                  <label className="block">
                    <span className={`mb-2 block text-sm text-white/65 ${textAlign}`}>{waitlistCopy.role}</span>
                    <select
                      required
                      value={waitlistForm.role}
                      onChange={(event) => updateWaitlistField("role", event.target.value)}
                      className={`w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none transition focus:border-accent/60 focus:bg-black/35 ${textAlign}`}
                    >
                      {waitlistCopy.roleOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-surface">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className={`mb-2 block text-sm text-white/65 ${textAlign}`}>{waitlistCopy.interest}</span>
                  <div className="grid gap-3 md:grid-cols-2">
                    {waitlistCopy.interestOptions.map((option) => {
                      const selected = waitlistForm.interest === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateWaitlistField("interest", option.value)}
                          className={`rounded-2xl border px-4 py-3 text-sm transition ${
                            selected
                              ? "border-accent/60 bg-accent/12 text-accent-light"
                              : "border-white/10 bg-black/20 text-white/72 hover:border-white/20 hover:text-white"
                          } ${isArabic ? "text-right" : "text-left"}`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </label>

                <label className="block">
                  <span className={`mb-2 block text-sm text-white/65 ${textAlign}`}>{waitlistCopy.notes}</span>
                  <textarea
                    value={waitlistForm.notes}
                    onChange={(event) => updateWaitlistField("notes", event.target.value)}
                    rows={4}
                    className={`w-full rounded-[1.6rem] border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/25 focus:border-accent/60 focus:bg-black/35 ${textAlign}`}
                    placeholder={waitlistCopy.notesPlaceholder}
                  />
                </label>

                <div className={`flex flex-wrap items-center gap-4 ${isArabic ? "justify-end" : "justify-between"}`}>
                  <button
                    type="submit"
                    disabled={waitlistState === "submitting"}
                    className={`inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70 ${
                      isArabic ? "flex-row-reverse" : ""
                    }`}
                  >
                    {waitlistState === "submitting" ? waitlistCopy.submitting : waitlistCopy.submit}
                    <ArrowIcon className="h-4 w-4" />
                  </button>

                  <a
                    href="mailto:hello@snapmathacademy.com"
                    className={`text-sm text-white/58 transition hover:text-accent-light ${textAlign}`}
                  >
                    hello@snapmathacademy.com
                  </a>
                </div>

                <p className={`text-sm leading-7 text-white/45 ${textAlign}`}>{waitlistCopy.disclaimer}</p>

                {waitlistMessage ? (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      waitlistState === "success"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                        : "border-red-400/20 bg-red-400/10 text-red-100"
                    } ${textAlign}`}
                  >
                    {waitlistMessage}
                  </div>
                ) : null}
              </form>
            </div>
          </div>
        </Section>

        <Section id="comparison" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className={textAlign}>
            <p className="section-label">
              {isArabic ? "مقارنة مباشرة" : "Direct comparison"}
            </p>
            <h2 className={`mt-4 text-3xl font-semibold text-white sm:text-5xl ${headingClass}`}>
              {isArabic
                ? "سناب ماث مقابل الخيارات التقليدية"
                : "SnapMath versus the traditional alternatives"}
            </h2>
          </div>

          <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-black/20 text-white/65">
                    <th className={`px-6 py-4 ${textAlign}`}>{isArabic ? "المعيار" : "Category"}</th>
                    <th className="bg-accent/12 px-6 py-4 text-accent-light">SnapMath</th>
                    <th className="px-6 py-4">Jo Academy</th>
                    <th className="px-6 py-4">{isArabic ? "الدروس الخصوصية" : "Private Tutors"}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={copyFor(locale, row.label)} className="border-t border-white/10">
                      <td className={`border-t border-white/10 px-6 py-5 text-white/75 ${textAlign}`}>
                        {copyFor(locale, row.label)}
                      </td>
                      <td className="border-t border-white/10 bg-accent/10 px-6 py-5 font-medium text-accent-light">
                        {copyFor(locale, row.snapmath)}
                      </td>
                      <td className="border-t border-white/10 px-6 py-5 text-white/65">
                        {copyFor(locale, row.joAcademy)}
                      </td>
                      <td className="border-t border-white/10 px-6 py-5 text-white/65">
                        {copyFor(locale, row.tutors)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <Section id="community" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className={textAlign}>
            <p className="section-label">{isArabic ? "الدفعة الأولى" : "First Cohort"}</p>
            <h2 className={`mt-4 text-3xl font-semibold text-white sm:text-5xl ${headingClass}`}>
              {isArabic
                ? "ماذا يحصل المنضمون مبكراً عندما يسجلون الآن؟"
                : "What early students and families get by joining now"}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
              {isArabic
                ? "بدلاً من شهادات مؤقتة قبل الإطلاق، هذا ما نعد به فعلياً لأول دفعة من سناب ماث."
                : "Instead of filling this section with placeholder testimonials before launch, here is what the first SnapMath cohort actually gets."}
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {communityCards.map((card) => (
              <div
                key={copyFor(locale, card.title)}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <div
                  className={`inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent-light ${
                    isArabic ? "flex-row-reverse" : ""
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isArabic ? "ميزة مبكرة" : "Early access"}</span>
                </div>
                <div className={`mt-5 ${textAlign}`}>
                  <p className={`text-lg font-semibold text-white ${headingClass}`}>
                    {copyFor(locale, card.title)}
                  </p>
                  <p className="mt-2 text-sm text-accent-light/80">{copyFor(locale, card.subtitle)}</p>
                </div>
                <p className={`mt-5 text-base leading-8 text-white/68 ${textAlign}`}>
                  {copyFor(locale, card.body)}
                </p>
                <div className={`mt-6 text-sm text-white/45 ${textAlign}`}>
                  {isArabic ? "أولوية وصول + تحديثات إطلاق" : "Priority access + launch updates"}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="https://instagram.com/snapmathacademy"
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm text-white/80 transition hover:border-accent/50 hover:text-white ${
                isArabic ? "flex-row-reverse" : ""
              }`}
            >
              <Camera className="h-4 w-4 text-accent-light" />
              <span dir="ltr">Instagram · {socialHandle}</span>
            </a>
            <a
              href="https://www.tiktok.com/@snapmathacademy"
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm text-white/80 transition hover:border-accent/50 hover:text-white ${
                isArabic ? "flex-row-reverse" : ""
              }`}
            >
              <Music2 className="h-4 w-4 text-accent-light" />
              <span dir="ltr">TikTok · {socialHandle}</span>
            </a>
            <a
              href="https://youtube.com/@snapmathacademy"
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm text-white/80 transition hover:border-accent/50 hover:text-white ${
                isArabic ? "flex-row-reverse" : ""
              }`}
            >
              <Video className="h-4 w-4 text-accent-light" />
              <span dir="ltr">YouTube · {socialHandle}</span>
            </a>
          </div>
        </Section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/25">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className={textAlign}>
            <div className={`flex items-center gap-3 ${isArabic ? "flex-row-reverse justify-end" : ""}`}>
              <Image
                src="/snapmath-logo-placeholder.svg"
                alt="SnapMath Academy logo"
                width={44}
                height={44}
                className="h-11 w-11 rounded-2xl"
              />
              <div>
                <p className={`text-lg font-semibold text-white ${headingClass}`}>SnapMath Academy</p>
                <p className="text-sm text-white/45">
                  {isArabic ? "تطبيق رياضيات التوجيهي" : "Tawjihi Math App"}
                </p>
              </div>
            </div>

            <div
              className={`mt-6 flex flex-wrap gap-4 text-sm text-white/55 ${isArabic ? "justify-end" : ""}`}
            >
              <a href="/privacy" className="transition hover:text-accent-light">
                {isArabic ? "سياسة الخصوصية" : "Privacy Policy"}
              </a>
              <a href="/terms" className="transition hover:text-accent-light">
                {isArabic ? "الشروط والأحكام" : "Terms"}
              </a>
              <a href="mailto:hello@snapmathacademy.com" className="transition hover:text-accent-light">
                {isArabic ? "تواصل معنا" : "Contact"}
              </a>
            </div>

            <p className="mt-6 text-sm text-white/45">Made with ❤️ in Pennsylvania & Jordan</p>
          </div>

          <div className={`flex flex-col gap-4 ${isArabic ? "items-end" : "items-start"}`}>
            <a
              href={launchInterestHref}
              className={`inline-flex items-center gap-3 rounded-[1.4rem] border border-white/12 bg-white/5 px-5 py-4 text-sm text-white/78 transition hover:border-accent/50 hover:text-white ${
                isArabic ? "flex-row-reverse" : ""
              }`}
            >
              <Download className="h-5 w-5 text-accent-light" />
              <span className={textAlign}>
                <span className="block text-xs uppercase tracking-[0.25em] text-white/45">
                  {isArabic ? "App Store" : "App Store"}
                </span>
                <span className="mt-1 block font-medium">
                  {isArabic ? "احصل على تنبيهات الإطلاق" : "Get launch alerts"}
                </span>
              </span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
