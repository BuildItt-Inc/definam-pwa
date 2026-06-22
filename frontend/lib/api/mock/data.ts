import type {
  Subject,
  Chapter,
  Topic,
  TopicDetail,
  HomeData,
} from '@/types/topics';

// ── Subjects ───────────────────────────────────────────────────────────────

export const mockSubjects: Subject[] = [
  {
    id: 'sub-001',
    name: 'Mathematics',
    chapter_count: 18,
    topic_count: 94,
    mastery_percent: 78,
  },
  {
    id: 'sub-002',
    name: 'English Language',
    chapter_count: 12,
    topic_count: 60,
    mastery_percent: 65,
  },
  {
    id: 'sub-003',
    name: 'Chemistry',
    chapter_count: 16,
    topic_count: 80,
    mastery_percent: 41,
  },
  {
    id: 'sub-004',
    name: 'Physics',
    chapter_count: 14,
    topic_count: 70,
    mastery_percent: null,
  },
  {
    id: 'sub-005',
    name: 'Economics',
    chapter_count: 10,
    topic_count: 48,
    mastery_percent: null,
  },
];

// ── Chapters — Mathematics (sub-001) ──────────────────────────────────────

export const mockChapters: Chapter[] = [
  {
    id: 'ch-001',
    subject_id: 'sub-001',
    title: 'Ch.1 — Number & Numeration',
    topic_count: 5,
    mastery_percent: 82,
  },
  {
    id: 'ch-002',
    subject_id: 'sub-001',
    title: 'Ch.2 — Algebraic Processes',
    topic_count: 6,
    mastery_percent: 71,
  },
  {
    id: 'ch-003',
    subject_id: 'sub-001',
    title: 'Ch.3 — Equations & Inequalities',
    topic_count: 8,
    mastery_percent: 65,
  },
  {
    id: 'ch-004',
    subject_id: 'sub-001',
    title: 'Ch.4 — Geometry',
    topic_count: 7,
    mastery_percent: null,
  },
  {
    id: 'ch-005',
    subject_id: 'sub-001',
    title: 'Ch.5 — Statistics',
    topic_count: 6,
    mastery_percent: null,
  },
];

// ── Topics — Ch.3 Equations & Inequalities (ch-003) ──────────────────────

export const mockTopics: Topic[] = [
  {
    id: 'top-001',
    chapter_id: 'ch-003',
    title: 'Quadratic Equations',
    status: 'published',
    mastery_percent: 65,
    last_studied_at: '2026-06-19T07:30:00.000Z',
  },
  {
    id: 'top-002',
    chapter_id: 'ch-003',
    title: 'Linear Equations',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
  {
    id: 'top-003',
    chapter_id: 'ch-003',
    title: 'Simultaneous Equations',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
  {
    id: 'top-004',
    chapter_id: 'ch-003',
    title: 'Inequalities',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
  {
    id: 'top-005',
    chapter_id: 'ch-003',
    title: 'Completing the Square',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
];

// ── Topic Detail — keyed by topic_id ─────────────────────────────────────
// Worked example: Quadratic Equations (top-001)

export const mockTopicDetail: Record<string, TopicDetail> = {
  'top-001': {
    step1: {
      title: 'Simple Definition',
      content:
        'A quadratic equation is any equation where the highest power of the unknown is 2. It always takes the form ax² + bx + c = 0, where a ≠ 0, and b and c are any real numbers. The variable x is what you solve for. Every quadratic has at most two solutions — called the roots.',
    },
    step2: {
      title: 'Nigerian Example',
      content:
        'A trader at Alaba Market, Lagos sells generators. Her monthly profit P (in thousands of naira) is modelled by P = −2x² + 20x − 30, where x is the number of generators sold. To find her break-even points she sets P = 0 and solves the quadratic. This exact type of problem appears regularly in WAEC Mathematics and Economics papers.',
    },
    step3: {
      title: 'Visual Breakdown',
      content:
        'ax² + bx + c = 0\n├── a = coefficient of x² (must not be 0)\n├── b = coefficient of x\n├── c = constant term\n└── Solve by:\n    ├── Factorisation — split into two brackets\n    ├── Completing the square — rewrite as (x + p)² = q\n    └── Quadratic formula: x = (−b ± √(b² − 4ac)) / 2a\n\nThe discriminant b² − 4ac tells you how many roots exist:\n  > 0 → two real roots\n  = 0 → one repeated root\n  < 0 → no real roots',
    },
    practice_questions: [
      {
        type: 'mcq',
        question: 'Which of the following is a quadratic equation?',
        options: {
          A: '3x + 7 = 0',
          B: 'x² + 5x − 6 = 0',
          C: 'x³ − 2x = 0',
          D: '2/x + 1 = 0',
        },
        answer: 'B',
        explanation:
          'A quadratic equation has the highest power of the variable equal to 2. Only option B, x² + 5x − 6 = 0, satisfies this condition. Option A is linear (power 1), option C is cubic (power 3), and option D is not a polynomial.',
      },
      {
        type: 'mcq',
        question: 'Solve: x² − 5x + 6 = 0',
        options: {
          A: 'x = −2 and x = −3',
          B: 'x = 2 and x = 3',
          C: 'x = 1 and x = 6',
          D: 'x = −1 and x = −6',
        },
        answer: 'B',
        explanation:
          'Factorise: find two numbers that multiply to +6 and add to −5. Those are −2 and −3, giving (x − 2)(x − 3) = 0. Setting each bracket to zero gives x = 2 or x = 3.',
      },
      {
        type: 'mcq',
        question:
          "A trader's profit P (in thousands of naira) is given by P = −x² + 6x − 5, where x is units sold. At which values of x does she break even (P = 0)?",
        options: {
          A: 'x = 1 and x = 5',
          B: 'x = 2 and x = 3',
          C: 'x = −1 and x = −5',
          D: 'x = 0 and x = 6',
        },
        answer: 'A',
        explanation:
          'Set P = 0: −x² + 6x − 5 = 0. Multiply through by −1: x² − 6x + 5 = 0. Factorise: (x − 1)(x − 5) = 0, giving x = 1 or x = 5. At these sales volumes her profit is exactly zero — the break-even points.',
      },
    ],
  },
};

// ── Home Dashboard Data ───────────────────────────────────────────────────

export const mockHomeData: HomeData = {
  student_name: 'Ada Okonkwo',
  school_name: 'Kings Secondary School',
  streak_days: 7,
  recall_queue: [
    {
      topic_id: 'top-chem-001',
      topic_title: 'Acids & Bases',
      subject: 'Chemistry',
    },
    {
      topic_id: 'top-001',
      topic_title: 'Quadratic Equations',
      subject: 'Mathematics',
    },
    {
      topic_id: 'top-eng-001',
      topic_title: 'Comprehension',
      subject: 'English Language',
    },
  ],
  recent_topics: [
    {
      topic_id: 'top-001',
      topic_title: 'Quadratic Equations',
      subject: 'Mathematics',
      mastery_percent: 65,
    },
    {
      topic_id: 'top-chem-001',
      topic_title: 'Acids & Bases',
      subject: 'Chemistry',
      mastery_percent: 38,
    },
    {
      topic_id: 'top-eng-001',
      topic_title: 'Comprehension',
      subject: 'English Language',
      mastery_percent: 80,
    },
  ],
};
