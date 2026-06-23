import type {
  Subject,
  Chapter,
  Topic,
  TopicDetail,
  HomeData,
  RecallItem,
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

// ── Topics — spread across all five chapters ───────────────────────────────

export const mockTopics: Topic[] = [
  // ── ch-001 · Number & Numeration ──────────────────────────────────────
  {
    id: 'top-101',
    chapter_id: 'ch-001',
    title: 'Fractions & Decimals',
    status: 'published',
    mastery_percent: 88,
    last_studied_at: '2026-06-20T08:00:00.000Z',
  },
  {
    id: 'top-102',
    chapter_id: 'ch-001',
    title: 'Indices & Surds',
    status: 'published',
    mastery_percent: 79,
    last_studied_at: '2026-06-18T10:15:00.000Z',
  },
  {
    id: 'top-103',
    chapter_id: 'ch-001',
    title: 'Logarithms',
    status: 'published',
    mastery_percent: 80,
    last_studied_at: '2026-06-17T14:30:00.000Z',
  },
  {
    id: 'top-104',
    chapter_id: 'ch-001',
    title: 'Number Bases',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
  {
    id: 'top-105',
    chapter_id: 'ch-001',
    title: 'Standard Form & Approximation',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },

  // ── ch-002 · Algebraic Processes ──────────────────────────────────────
  {
    id: 'top-201',
    chapter_id: 'ch-002',
    title: 'Algebraic Expressions',
    status: 'published',
    mastery_percent: 75,
    last_studied_at: '2026-06-21T09:00:00.000Z',
  },
  {
    id: 'top-202',
    chapter_id: 'ch-002',
    title: 'Factorisation',
    status: 'published',
    mastery_percent: 68,
    last_studied_at: '2026-06-20T11:45:00.000Z',
  },
  {
    id: 'top-203',
    chapter_id: 'ch-002',
    title: 'Algebraic Fractions',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
  {
    id: 'top-204',
    chapter_id: 'ch-002',
    title: 'Functions & Relations',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
  {
    id: 'top-205',
    chapter_id: 'ch-002',
    title: 'Binary Operations',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
  {
    id: 'top-206',
    chapter_id: 'ch-002',
    title: 'Polynomial Division',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },

  // ── ch-003 · Equations & Inequalities ─────────────────────────────────
  // top-001 through top-005 are the primary topics used for learning flow
  // testing and are also referenced by mockHomeData.
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
    title: 'Acids & Bases',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
  {
    id: 'top-005',
    chapter_id: 'ch-003',
    title: 'Comprehension',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },

  // ── ch-004 · Geometry ─────────────────────────────────────────────────
  {
    id: 'top-401',
    chapter_id: 'ch-004',
    title: 'Lines & Angles',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
  {
    id: 'top-402',
    chapter_id: 'ch-004',
    title: 'Triangles & Congruence',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
  {
    id: 'top-403',
    chapter_id: 'ch-004',
    title: 'Circles & Circle Theorems',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
  {
    id: 'top-404',
    chapter_id: 'ch-004',
    title: 'Polygons & Quadrilaterals',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
  {
    id: 'top-405',
    chapter_id: 'ch-004',
    title: 'Loci & Constructions',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },

  // ── ch-005 · Statistics ───────────────────────────────────────────────
  {
    id: 'top-501',
    chapter_id: 'ch-005',
    title: 'Data Collection & Presentation',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
  {
    id: 'top-502',
    chapter_id: 'ch-005',
    title: 'Measures of Central Tendency',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
  {
    id: 'top-503',
    chapter_id: 'ch-005',
    title: 'Measures of Dispersion',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
  {
    id: 'top-504',
    chapter_id: 'ch-005',
    title: 'Probability',
    status: 'published',
    mastery_percent: null,
    last_studied_at: null,
  },
];

// ── Topic Detail — keyed by topic_id ──────────────────────────────────────

export const mockTopicDetail: Record<string, TopicDetail> = {

  // ── top-001 · Quadratic Equations ─────────────────────────────────────
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

  // ── top-002 · Linear Equations ────────────────────────────────────────
  'top-002': {
    step1: {
      title: 'Simple Definition',
      content:
        'A linear equation is an equation in which the highest power of the unknown variable is 1. It takes the general form ax + b = 0, where a ≠ 0. The solution is a single value of the variable that makes both sides equal. Linear equations may involve fractions, brackets, or variables on both sides — but once simplified they always reduce to this basic form.',
    },
    step2: {
      title: 'Nigerian Example',
      content:
        'A danfo bus driver in Lagos charges ₦500 per passenger. His daily expenses — fuel, conductor\'s share, and park levy — total ₦8,500. His daily profit is modelled by P = 500x − 8,500, where x is the number of passengers. Setting P = 0 to find his break-even point gives 500x = 8,500, so x = 17. He must carry at least 17 passengers just to cover his costs before making any profit. WAEC sets this exact type of word problem every year.',
    },
    step3: {
      title: 'Visual Breakdown',
      content:
        'Standard form: ax + b = 0\n├── a = coefficient of x (must not be 0)\n├── b = constant term\n└── Solution: x = −b ÷ a\n\nSteps to solve any linear equation:\n├── 1. Expand all brackets\n├── 2. Move all x terms to the left side\n├── 3. Move all constants to the right side\n└── 4. Divide both sides by the coefficient of x\n\nExample: 3x + 7 = x − 5\n├── 3x − x = −5 − 7\n├── 2x = −12\n└── x = −6\n\nExample with fractions: (2x + 4)/3 = (x + 2)/2\n├── Multiply both sides by LCM (6): 2(2x + 4) = 3(x + 2)\n├── 4x + 8 = 3x + 6\n└── x = −2',
    },
    practice_questions: [
      {
        type: 'mcq',
        question: 'Solve: 5x − 3 = 2x + 9',
        options: {
          A: 'x = 2',
          B: 'x = 3',
          C: 'x = 4',
          D: 'x = 6',
        },
        answer: 'C',
        explanation:
          'Collect x terms: 5x − 2x = 9 + 3, giving 3x = 12. Divide both sides by 3: x = 4. You can verify: 5(4) − 3 = 17 and 2(4) + 9 = 17. Both sides are equal.',
      },
      {
        type: 'mcq',
        question:
          'A suya seller charges ₦800 per skewer. His daily costs are ₦5,600. How many skewers must he sell to break even?',
        options: {
          A: '5',
          B: '6',
          C: '7',
          D: '8',
        },
        answer: 'C',
        explanation:
          'Set revenue equal to cost: 800x = 5,600. Divide both sides by 800: x = 7. The seller must sell exactly 7 skewers to cover his daily costs — any fewer and he makes a loss.',
      },
      {
        type: 'mcq',
        question: 'Solve: (2x + 4)/3 = (x + 2)/2',
        options: {
          A: 'x = −2',
          B: 'x = 2',
          C: 'x = −4',
          D: 'x = 4',
        },
        answer: 'A',
        explanation:
          'Multiply both sides by 6 (the LCM of 3 and 2): 2(2x + 4) = 3(x + 2). Expand: 4x + 8 = 3x + 6. Collect terms: 4x − 3x = 6 − 8, giving x = −2.',
      },
    ],
  },

  // ── top-003 · Simultaneous Equations ─────────────────────────────────
  'top-003': {
    step1: {
      title: 'Simple Definition',
      content:
        'Simultaneous equations are two or more equations that contain the same unknowns and must all be satisfied at the same time. For two equations in two unknowns (x and y), the solution is the unique pair of values (x, y) that satisfies both equations together. They are solved by elimination (adding or subtracting equations to remove one variable) or substitution (expressing one variable in terms of the other).',
    },
    step2: {
      title: 'Nigerian Example',
      content:
        'A Mama Put seller at a Abuja market sells rice and beans. One day a customer pays ₦10,500 for 2 plates of rice and 3 plates of beans. The next customer pays ₦6,500 for 1 plate of rice and 2 plates of beans. To find the price of each plate, set up two equations: 2r + 3b = 10,500 and r + 2b = 6,500. Solving simultaneously gives rice = ₦1,500 and beans = ₦2,500. This two-equation word problem is a standard WAEC question type.',
    },
    step3: {
      title: 'Visual Breakdown',
      content:
        'Two equations, two unknowns:\n  ax + by = p  ... (1)\n  cx + dy = q  ... (2)\n\nMethod 1 — Elimination:\n├── Multiply equations so one variable has equal coefficients\n├── Add or subtract to eliminate that variable\n└── Solve the remaining single-variable equation\n\nMethod 2 — Substitution:\n├── Rearrange one equation to make x (or y) the subject\n└── Substitute the expression into the other equation\n\nWorked example: 2x + y = 8  ...(1)\n               x − y = 1   ...(2)\n├── Add (1) and (2): 3x = 9 → x = 3\n├── Substitute into (2): 3 − y = 1 → y = 2\n└── Solution: x = 3, y = 2',
    },
    practice_questions: [
      {
        type: 'mcq',
        question: 'Solve the simultaneous equations: x + y = 10 and x − y = 4',
        options: {
          A: 'x = 7, y = 3',
          B: 'x = 6, y = 4',
          C: 'x = 8, y = 2',
          D: 'x = 5, y = 5',
        },
        answer: 'A',
        explanation:
          'Add the two equations: (x + y) + (x − y) = 10 + 4, giving 2x = 14, so x = 7. Substitute back into x + y = 10: 7 + y = 10, giving y = 3. The solution is x = 7, y = 3.',
      },
      {
        type: 'mcq',
        question: 'Given 2x + y = 8 and x − y = 1, find the value of y.',
        options: {
          A: 'y = 1',
          B: 'y = 2',
          C: 'y = 3',
          D: 'y = 4',
        },
        answer: 'B',
        explanation:
          'Add the equations to eliminate y: 3x = 9, so x = 3. Substitute into x − y = 1: 3 − y = 1, giving y = 2.',
      },
      {
        type: 'mcq',
        question:
          'A Mama Put buyer pays ₦10,500 for 2 plates of rice and 3 plates of beans. Another buyer pays ₦6,500 for 1 plate of rice and 2 plates of beans. What is the price of one plate of rice?',
        options: {
          A: '₦1,500',
          B: '₦2,000',
          C: '₦2,500',
          D: '₦3,000',
        },
        answer: 'A',
        explanation:
          'Let r = rice, b = beans. Equations: 2r + 3b = 10,500 and r + 2b = 6,500. From the second: r = 6,500 − 2b. Substitute: 2(6,500 − 2b) + 3b = 10,500 → 13,000 − b = 10,500 → b = 2,500. Then r = 6,500 − 5,000 = ₦1,500.',
      },
    ],
  },

  // ── top-004 · Acids & Bases ───────────────────────────────────────────
  'top-004': {
    step1: {
      title: 'Simple Definition',
      content:
        'An acid is a substance that releases hydrogen ions (H⁺) when dissolved in water, giving a pH less than 7. A base is a substance that releases hydroxide ions (OH⁻) in water, giving a pH greater than 7. When an acid reacts with a base, they neutralise each other to produce a salt and water. The strength of an acid or base is measured on the pH scale, which runs from 0 (strongly acidic) to 14 (strongly alkaline), with 7 being neutral.',
    },
    step2: {
      title: 'Nigerian Example',
      content:
        'Acids and bases are present all around Nigerian daily life. Palm wine turns sour as it ferments because lactic acid builds up — that sourness is the taste of an acid. Car batteries used for NEPA-alternative power in Nigerian homes contain sulphuric acid (H₂SO₄). When a white school uniform gets stained, washing it with OMO detergent (which is slightly alkaline) neutralises acidic stains. Baking soda used by mama to make puff-puff rise is sodium bicarbonate — a base. WAEC Chemistry routinely tests which household substances are acidic or alkaline.',
    },
    step3: {
      title: 'Visual Breakdown',
      content:
        'ACIDS (pH < 7)\n├── Release H⁺ ions in water\n├── Turn litmus paper red\n├── React with metals → salt + hydrogen gas\n├── React with carbonates → salt + water + CO₂\n└── Examples: HCl, H₂SO₄, HNO₃, CH₃COOH\n\nBASES (pH > 7)\n├── Release OH⁻ ions in water\n├── Turn litmus paper blue\n├── Feel soapy to touch\n└── Examples: NaOH, Ca(OH)₂, NH₃, Na₂CO₃\n\nNEUTRALISATION:\n  Acid + Base → Salt + Water\n  HCl  + NaOH → NaCl + H₂O\n\npH SCALE:\n  0 ──────────── 7 ──────────── 14\n  (acidic)   (neutral)   (alkaline)',
    },
    practice_questions: [
      {
        type: 'mcq',
        question: 'Which of the following is a property of acids?',
        options: {
          A: 'They turn litmus paper blue',
          B: 'They feel soapy to touch',
          C: 'They have a pH less than 7',
          D: 'They release OH⁻ ions in water',
        },
        answer: 'C',
        explanation:
          'Acids have a pH less than 7 and turn litmus paper red (not blue). They taste sour and release H⁺ ions (not OH⁻ — those are released by bases). The soapy feel is a property of bases such as NaOH.',
      },
      {
        type: 'mcq',
        question:
          'What are the products when hydrochloric acid (HCl) reacts with sodium hydroxide (NaOH)?',
        options: {
          A: 'Sodium chloride and hydrogen gas',
          B: 'Sodium chloride and water',
          C: 'Sodium oxide and water',
          D: 'Sodium chloride and oxygen',
        },
        answer: 'B',
        explanation:
          'HCl + NaOH → NaCl + H₂O. This is a neutralisation reaction: acid + base → salt + water. The salt produced is sodium chloride (NaCl, common table salt) and water (H₂O). No gas is produced in this reaction.',
      },
      {
        type: 'mcq',
        question:
          'A WAEC student tests an unknown liquid and finds it has a pH of 2. What can she correctly conclude?',
        options: {
          A: 'The liquid is a strong base',
          B: 'The liquid is neutral',
          C: 'The liquid is a weak acid',
          D: 'The liquid is a strong acid',
        },
        answer: 'D',
        explanation:
          'A pH of 2 is far below 7, indicating a strongly acidic solution. The lower the pH below 7, the stronger the acid. A weak acid would have a pH of 4–6. pH 7 is neutral, and pH above 7 indicates a base.',
      },
    ],
  },

  // ── top-005 · Comprehension ───────────────────────────────────────────
  'top-005': {
    step1: {
      title: 'Simple Definition',
      content:
        'Comprehension is the skill of reading a passage, understanding its meaning, and answering questions about it accurately and in good English. In WAEC English Language Paper 2, the comprehension section presents a passage of about 400–600 words followed by questions that test your understanding of the main idea, specific details, the meaning of words as used in context, implied meaning (inference), and the author\'s attitude or purpose. All answers must be written in complete sentences.',
    },
    step2: {
      title: 'Nigerian Example',
      content:
        'Imagine a passage about the Lagos-Ibadan Expressway rehabilitation project. The text explains the project\'s importance to interstate commerce, describes the challenges (flooding near Sagamu, community resistance around Ibadan), and quotes the Honourable Minister of Works on the expected completion date. A WAEC question might ask: "What two challenges are mentioned in the passage?", "What does the word \'rehabilitation\' mean as used in paragraph two?", or "What can you infer about the government\'s priorities from this passage?". Nigerian students who read newspapers such as Punch and Vanguard regularly perform better on these passages.',
    },
    step3: {
      title: 'Visual Breakdown',
      content:
        'WAEC COMPREHENSION — APPROACH\n├── Before reading\n│   └── Skim the questions first so you know what to look for\n├── During reading\n│   ├── 1st read — grasp the overall main idea\n│   └── 2nd read — note specific details and key vocabulary\n└── Answering questions\n    ├── Factual ("According to the passage...")\n    │   └── The answer is directly stated — locate and paraphrase\n    ├── Vocabulary ("...as used in paragraph X")\n    │   └── Use context clues, not a dictionary definition\n    ├── Inference ("What can be concluded...")\n    │   └── The answer is implied — read between the lines\n    └── Summary\n        └── Paraphrase the main points in your own words\n\nCommon mistakes to avoid:\n  ✗ Copying sentences directly from the passage\n  ✗ Writing incomplete sentences (e.g. "Because it is cheap.")\n  ✗ Answering beyond what the passage supports',
    },
    practice_questions: [
      {
        type: 'mcq',
        question:
          'In a comprehension exercise, the instruction "read between the lines" means you should:',
        options: {
          A: 'Copy sentences directly from the passage',
          B: 'Count and identify the number of lines',
          C: 'Understand what is implied but not directly stated',
          D: 'Re-read every line of the passage more than once',
        },
        answer: 'C',
        explanation:
          '"Reading between the lines" is an expression that means understanding the implied or suggested meaning — what the writer hints at without saying outright. This is the basis of inference questions, which are a standard part of WAEC comprehension.',
      },
      {
        type: 'mcq',
        question:
          'A student writes the following answer to a comprehension question: "Because the road was bad." What is the main problem with this answer?',
        options: {
          A: 'It is too long and should be shorter',
          B: 'It does not directly quote the passage',
          C: 'It is not a complete sentence',
          D: 'It uses the wrong tense',
        },
        answer: 'C',
        explanation:
          '"Because the road was bad" is a dependent clause, not a complete sentence — it has no main clause. WAEC examiners require complete sentences. A correct answer would be: "The journey was difficult because the road was bad."',
      },
      {
        type: 'mcq',
        question:
          'You encounter the word "perennial" in a comprehension passage about floods in Anambra. The best way to determine its meaning is to:',
        options: {
          A: 'Skip the question and move on',
          B: 'Use the surrounding sentences to work out the meaning',
          C: 'Write the word\'s standard dictionary definition',
          D: 'Copy the sentence containing the word as your answer',
        },
        answer: 'B',
        explanation:
          'Context clues — the words and ideas surrounding an unfamiliar word — are the most reliable guide to its meaning as used in the passage. WAEC vocabulary questions always ask for the meaning "as used in the passage," so a standard dictionary definition may be too broad or wrong for that specific context.',
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
      topic_id: 'top-004',
      topic_title: 'Acids & Bases',
      subject: 'Chemistry',
    },
    {
      topic_id: 'top-001',
      topic_title: 'Quadratic Equations',
      subject: 'Mathematics',
    },
    {
      topic_id: 'top-005',
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
      topic_id: 'top-004',
      topic_title: 'Acids & Bases',
      subject: 'Chemistry',
      mastery_percent: 38,
    },
    {
      topic_id: 'top-005',
      topic_title: 'Comprehension',
      subject: 'English Language',
      mastery_percent: 80,
    },
  ],
};

// ── Recall Queue ──────────────────────────────────────────────────────────

export const mockRecallQueue: RecallItem[] = [
  {
    id: 'rq-001',
    topic_id: 'top-004',
    topic_title: 'Acids & Bases',
    subject: 'Chemistry',
    question:
      'What is the pH range of a strong acid, and give a Nigerian everyday example of one?',
    model_answer:
      'Strong acids have a pH of 0–2. Battery acid (H₂SO₄) found in car batteries — those powering generators during NEPA outages — is a common Nigerian example. It turns litmus paper red and reacts violently with metals to produce hydrogen gas.',
  },
  {
    id: 'rq-002',
    topic_id: 'top-001',
    topic_title: 'Quadratic Equations',
    subject: 'Mathematics',
    question:
      'State the three methods for solving a quadratic equation, and write out the quadratic formula.',
    model_answer:
      'The three methods are: (1) Factorisation — split ax² + bx + c into two brackets; (2) Completing the square — rewrite as (x + p)² = q; (3) The quadratic formula: x = (−b ± √(b² − 4ac)) / 2a. The formula works for all quadratic equations including those that do not factorise neatly.',
  },
  {
    id: 'rq-003',
    topic_id: 'top-005',
    topic_title: 'Comprehension',
    subject: 'English Language',
    question:
      'Describe the correct approach to answering a WAEC comprehension vocabulary question (the "as used in the passage" type).',
    model_answer:
      'Use context clues — the words and sentences surrounding the unfamiliar word — to determine its meaning as used in that specific passage. WAEC requires the contextual meaning, not the standard dictionary definition. Read the sentence before and after the word, consider what makes logical sense, and write your answer in a complete sentence.',
  },
];
