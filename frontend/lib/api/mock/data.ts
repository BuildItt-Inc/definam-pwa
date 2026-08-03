import type {
  Subject,
  Chapter,
  Topic,
  TopicDetail,
  HomeData,
  RecallItem,
  ProgressData,
} from '@/types/topics';

// â”€â”€ Subjects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const mockSubjects: Subject[] = [
  {
    name: 'Mathematics',
    chapter_count: 18,
    topic_count: 94,
    mastery_percent: 78,
  },
  {
    name: 'English Language',
    chapter_count: 12,
    topic_count: 60,
    mastery_percent: 65,
  },
  {
    name: 'Chemistry',
    chapter_count: 16,
    topic_count: 80,
    mastery_percent: 41,
  },
  {
    name: 'Physics',
    chapter_count: 14,
    topic_count: 70,
    mastery_percent: null,
  },
  {
    name: 'Economics',
    chapter_count: 10,
    topic_count: 48,
    mastery_percent: null,
  },
];

// â”€â”€ Chapters â€” Mathematics (sub-001) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const mockChapters: Chapter[] = [
  {
    id: 'ch-001',
    subject_id: 'sub-001',
    class_level: 'SS1',
    title: 'Ch.1 â€” Number & Numeration',
    topic_count: 5,
    mastery_percent: 82,
  },
  {
    id: 'ch-002',
    subject_id: 'sub-001',
    class_level: 'SS1',
    title: 'Ch.2 â€” Algebraic Processes',
    topic_count: 6,
    mastery_percent: 71,
  },
  {
    id: 'ch-003',
    subject_id: 'sub-001',
    class_level: 'SS1',
    title: 'Ch.3 â€” Equations & Inequalities',
    topic_count: 8,
    mastery_percent: 65,
  },
  {
    id: 'ch-004',
    subject_id: 'sub-001',
    class_level: 'SS1',
    title: 'Ch.4 â€” Geometry',
    topic_count: 7,
    mastery_percent: null,
  },
  {
    id: 'ch-005',
    subject_id: 'sub-001',
    class_level: 'SS1',
    title: 'Ch.5 â€” Statistics',
    topic_count: 6,
    mastery_percent: null,
  },
];

// â”€â”€ Topics â€” spread across all five chapters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const mockTopics: Topic[] = [
  // â”€â”€ ch-001 Â· Number & Numeration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ ch-002 Â· Algebraic Processes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ ch-003 Â· Equations & Inequalities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ ch-004 Â· Geometry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ ch-005 Â· Statistics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Topic Detail â€” keyed by topic_id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const mockTopicDetail: Record<string, TopicDetail> = {

  // â”€â”€ top-001 Â· Quadratic Equations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  'top-001': {
    step1: {
      title: 'Simple Definition',
      content:
        'A quadratic equation is any equation where the highest power of the unknown is 2. It always takes the form axÂ² + bx + c = 0, where a â‰  0, and b and c are any real numbers. The variable x is what you solve for. Every quadratic has at most two solutions â€” called the roots.',
    },
    step2: {
      title: 'Nigerian Example',
      content:
        'A trader at Alaba Market, Lagos sells generators. Her monthly profit P (in thousands of naira) is modelled by P = âˆ’2xÂ² + 20x âˆ’ 30, where x is the number of generators sold. To find her break-even points she sets P = 0 and solves the quadratic. This exact type of problem appears regularly in WAEC Mathematics and Economics papers.',
    },
    step3: {
      title: 'Visual Breakdown',
      content:
        'axÂ² + bx + c = 0\nâ”œâ”€â”€ a = coefficient of xÂ² (must not be 0)\nâ”œâ”€â”€ b = coefficient of x\nâ”œâ”€â”€ c = constant term\nâ””â”€â”€ Solve by:\n    â”œâ”€â”€ Factorisation â€” split into two brackets\n    â”œâ”€â”€ Completing the square â€” rewrite as (x + p)Â² = q\n    â””â”€â”€ Quadratic formula: x = (âˆ’b Â± âˆš(bÂ² âˆ’ 4ac)) / 2a\n\nThe discriminant bÂ² âˆ’ 4ac tells you how many roots exist:\n  > 0 â†’ two real roots\n  = 0 â†’ one repeated root\n  < 0 â†’ no real roots',
    },
    practice_questions: [
      {
        type: 'mcq',
        question: 'Which of the following is a quadratic equation?',
        options: {
          A: '3x + 7 = 0',
          B: 'xÂ² + 5x âˆ’ 6 = 0',
          C: 'xÂ³ âˆ’ 2x = 0',
          D: '2/x + 1 = 0',
        },
        answer: 'B',
        explanation:
          'A quadratic equation has the highest power of the variable equal to 2. Only option B, xÂ² + 5x âˆ’ 6 = 0, satisfies this condition. Option A is linear (power 1), option C is cubic (power 3), and option D is not a polynomial.',
      },
      {
        type: 'mcq',
        question: 'Solve: xÂ² âˆ’ 5x + 6 = 0',
        options: {
          A: 'x = âˆ’2 and x = âˆ’3',
          B: 'x = 2 and x = 3',
          C: 'x = 1 and x = 6',
          D: 'x = âˆ’1 and x = âˆ’6',
        },
        answer: 'B',
        explanation:
          'Factorise: find two numbers that multiply to +6 and add to âˆ’5. Those are âˆ’2 and âˆ’3, giving (x âˆ’ 2)(x âˆ’ 3) = 0. Setting each bracket to zero gives x = 2 or x = 3.',
      },
      {
        type: 'mcq',
        question:
          "A trader's profit P (in thousands of naira) is given by P = âˆ’xÂ² + 6x âˆ’ 5, where x is units sold. At which values of x does she break even (P = 0)?",
        options: {
          A: 'x = 1 and x = 5',
          B: 'x = 2 and x = 3',
          C: 'x = âˆ’1 and x = âˆ’5',
          D: 'x = 0 and x = 6',
        },
        answer: 'A',
        explanation:
          'Set P = 0: âˆ’xÂ² + 6x âˆ’ 5 = 0. Multiply through by âˆ’1: xÂ² âˆ’ 6x + 5 = 0. Factorise: (x âˆ’ 1)(x âˆ’ 5) = 0, giving x = 1 or x = 5. At these sales volumes her profit is exactly zero â€” the break-even points.',
      },
    ],
  },

  // â”€â”€ top-002 Â· Linear Equations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  'top-002': {
    step1: {
      title: 'Simple Definition',
      content:
        'A linear equation is an equation in which the highest power of the unknown variable is 1. It takes the general form ax + b = 0, where a â‰  0. The solution is a single value of the variable that makes both sides equal. Linear equations may involve fractions, brackets, or variables on both sides â€” but once simplified they always reduce to this basic form.',
    },
    step2: {
      title: 'Nigerian Example',
      content:
        'A danfo bus driver in Lagos charges â‚¦500 per passenger. His daily expenses â€” fuel, conductor\'s share, and park levy â€” total â‚¦8,500. His daily profit is modelled by P = 500x âˆ’ 8,500, where x is the number of passengers. Setting P = 0 to find his break-even point gives 500x = 8,500, so x = 17. He must carry at least 17 passengers just to cover his costs before making any profit. WAEC sets this exact type of word problem every year.',
    },
    step3: {
      title: 'Visual Breakdown',
      content:
        'Standard form: ax + b = 0\nâ”œâ”€â”€ a = coefficient of x (must not be 0)\nâ”œâ”€â”€ b = constant term\nâ””â”€â”€ Solution: x = âˆ’b Ã· a\n\nSteps to solve any linear equation:\nâ”œâ”€â”€ 1. Expand all brackets\nâ”œâ”€â”€ 2. Move all x terms to the left side\nâ”œâ”€â”€ 3. Move all constants to the right side\nâ””â”€â”€ 4. Divide both sides by the coefficient of x\n\nExample: 3x + 7 = x âˆ’ 5\nâ”œâ”€â”€ 3x âˆ’ x = âˆ’5 âˆ’ 7\nâ”œâ”€â”€ 2x = âˆ’12\nâ””â”€â”€ x = âˆ’6\n\nExample with fractions: (2x + 4)/3 = (x + 2)/2\nâ”œâ”€â”€ Multiply both sides by LCM (6): 2(2x + 4) = 3(x + 2)\nâ”œâ”€â”€ 4x + 8 = 3x + 6\nâ””â”€â”€ x = âˆ’2',
    },
    practice_questions: [
      {
        type: 'mcq',
        question: 'Solve: 5x âˆ’ 3 = 2x + 9',
        options: {
          A: 'x = 2',
          B: 'x = 3',
          C: 'x = 4',
          D: 'x = 6',
        },
        answer: 'C',
        explanation:
          'Collect x terms: 5x âˆ’ 2x = 9 + 3, giving 3x = 12. Divide both sides by 3: x = 4. You can verify: 5(4) âˆ’ 3 = 17 and 2(4) + 9 = 17. Both sides are equal.',
      },
      {
        type: 'mcq',
        question:
          'A suya seller charges â‚¦800 per skewer. His daily costs are â‚¦5,600. How many skewers must he sell to break even?',
        options: {
          A: '5',
          B: '6',
          C: '7',
          D: '8',
        },
        answer: 'C',
        explanation:
          'Set revenue equal to cost: 800x = 5,600. Divide both sides by 800: x = 7. The seller must sell exactly 7 skewers to cover his daily costs â€” any fewer and he makes a loss.',
      },
      {
        type: 'mcq',
        question: 'Solve: (2x + 4)/3 = (x + 2)/2',
        options: {
          A: 'x = âˆ’2',
          B: 'x = 2',
          C: 'x = âˆ’4',
          D: 'x = 4',
        },
        answer: 'A',
        explanation:
          'Multiply both sides by 6 (the LCM of 3 and 2): 2(2x + 4) = 3(x + 2). Expand: 4x + 8 = 3x + 6. Collect terms: 4x âˆ’ 3x = 6 âˆ’ 8, giving x = âˆ’2.',
      },
    ],
  },

  // â”€â”€ top-003 Â· Simultaneous Equations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  'top-003': {
    step1: {
      title: 'Simple Definition',
      content:
        'Simultaneous equations are two or more equations that contain the same unknowns and must all be satisfied at the same time. For two equations in two unknowns (x and y), the solution is the unique pair of values (x, y) that satisfies both equations together. They are solved by elimination (adding or subtracting equations to remove one variable) or substitution (expressing one variable in terms of the other).',
    },
    step2: {
      title: 'Nigerian Example',
      content:
        'A Mama Put seller at a Abuja market sells rice and beans. One day a customer pays â‚¦10,500 for 2 plates of rice and 3 plates of beans. The next customer pays â‚¦6,500 for 1 plate of rice and 2 plates of beans. To find the price of each plate, set up two equations: 2r + 3b = 10,500 and r + 2b = 6,500. Solving simultaneously gives rice = â‚¦1,500 and beans = â‚¦2,500. This two-equation word problem is a standard WAEC question type.',
    },
    step3: {
      title: 'Visual Breakdown',
      content:
        'Two equations, two unknowns:\n  ax + by = p  ... (1)\n  cx + dy = q  ... (2)\n\nMethod 1 â€” Elimination:\nâ”œâ”€â”€ Multiply equations so one variable has equal coefficients\nâ”œâ”€â”€ Add or subtract to eliminate that variable\nâ””â”€â”€ Solve the remaining single-variable equation\n\nMethod 2 â€” Substitution:\nâ”œâ”€â”€ Rearrange one equation to make x (or y) the subject\nâ””â”€â”€ Substitute the expression into the other equation\n\nWorked example: 2x + y = 8  ...(1)\n               x âˆ’ y = 1   ...(2)\nâ”œâ”€â”€ Add (1) and (2): 3x = 9 â†’ x = 3\nâ”œâ”€â”€ Substitute into (2): 3 âˆ’ y = 1 â†’ y = 2\nâ””â”€â”€ Solution: x = 3, y = 2',
    },
    practice_questions: [
      {
        type: 'mcq',
        question: 'Solve the simultaneous equations: x + y = 10 and x âˆ’ y = 4',
        options: {
          A: 'x = 7, y = 3',
          B: 'x = 6, y = 4',
          C: 'x = 8, y = 2',
          D: 'x = 5, y = 5',
        },
        answer: 'A',
        explanation:
          'Add the two equations: (x + y) + (x âˆ’ y) = 10 + 4, giving 2x = 14, so x = 7. Substitute back into x + y = 10: 7 + y = 10, giving y = 3. The solution is x = 7, y = 3.',
      },
      {
        type: 'mcq',
        question: 'Given 2x + y = 8 and x âˆ’ y = 1, find the value of y.',
        options: {
          A: 'y = 1',
          B: 'y = 2',
          C: 'y = 3',
          D: 'y = 4',
        },
        answer: 'B',
        explanation:
          'Add the equations to eliminate y: 3x = 9, so x = 3. Substitute into x âˆ’ y = 1: 3 âˆ’ y = 1, giving y = 2.',
      },
      {
        type: 'mcq',
        question:
          'A Mama Put buyer pays â‚¦10,500 for 2 plates of rice and 3 plates of beans. Another buyer pays â‚¦6,500 for 1 plate of rice and 2 plates of beans. What is the price of one plate of rice?',
        options: {
          A: 'â‚¦1,500',
          B: 'â‚¦2,000',
          C: 'â‚¦2,500',
          D: 'â‚¦3,000',
        },
        answer: 'A',
        explanation:
          'Let r = rice, b = beans. Equations: 2r + 3b = 10,500 and r + 2b = 6,500. From the second: r = 6,500 âˆ’ 2b. Substitute: 2(6,500 âˆ’ 2b) + 3b = 10,500 â†’ 13,000 âˆ’ b = 10,500 â†’ b = 2,500. Then r = 6,500 âˆ’ 5,000 = â‚¦1,500.',
      },
    ],
  },

  // â”€â”€ top-004 Â· Acids & Bases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  'top-004': {
    step1: {
      title: 'Simple Definition',
      content:
        'An acid is a substance that releases hydrogen ions (Hâº) when dissolved in water, giving a pH less than 7. A base is a substance that releases hydroxide ions (OHâ») in water, giving a pH greater than 7. When an acid reacts with a base, they neutralise each other to produce a salt and water. The strength of an acid or base is measured on the pH scale, which runs from 0 (strongly acidic) to 14 (strongly alkaline), with 7 being neutral.',
    },
    step2: {
      title: 'Nigerian Example',
      content:
        'Acids and bases are present all around Nigerian daily life. Palm wine turns sour as it ferments because lactic acid builds up â€” that sourness is the taste of an acid. Car batteries used for NEPA-alternative power in Nigerian homes contain sulphuric acid (Hâ‚‚SOâ‚„). When a white school uniform gets stained, washing it with OMO detergent (which is slightly alkaline) neutralises acidic stains. Baking soda used by mama to make puff-puff rise is sodium bicarbonate â€” a base. WAEC Chemistry routinely tests which household substances are acidic or alkaline.',
    },
    step3: {
      title: 'Visual Breakdown',
      content:
        'ACIDS (pH < 7)\nâ”œâ”€â”€ Release Hâº ions in water\nâ”œâ”€â”€ Turn litmus paper red\nâ”œâ”€â”€ React with metals â†’ salt + hydrogen gas\nâ”œâ”€â”€ React with carbonates â†’ salt + water + COâ‚‚\nâ””â”€â”€ Examples: HCl, Hâ‚‚SOâ‚„, HNOâ‚ƒ, CHâ‚ƒCOOH\n\nBASES (pH > 7)\nâ”œâ”€â”€ Release OHâ» ions in water\nâ”œâ”€â”€ Turn litmus paper blue\nâ”œâ”€â”€ Feel soapy to touch\nâ””â”€â”€ Examples: NaOH, Ca(OH)â‚‚, NHâ‚ƒ, Naâ‚‚COâ‚ƒ\n\nNEUTRALISATION:\n  Acid + Base â†’ Salt + Water\n  HCl  + NaOH â†’ NaCl + Hâ‚‚O\n\npH SCALE:\n  0 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ 7 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ 14\n  (acidic)   (neutral)   (alkaline)',
    },
    practice_questions: [
      {
        type: 'mcq',
        question: 'Which of the following is a property of acids?',
        options: {
          A: 'They turn litmus paper blue',
          B: 'They feel soapy to touch',
          C: 'They have a pH less than 7',
          D: 'They release OHâ» ions in water',
        },
        answer: 'C',
        explanation:
          'Acids have a pH less than 7 and turn litmus paper red (not blue). They taste sour and release Hâº ions (not OHâ» â€” those are released by bases). The soapy feel is a property of bases such as NaOH.',
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
          'HCl + NaOH â†’ NaCl + Hâ‚‚O. This is a neutralisation reaction: acid + base â†’ salt + water. The salt produced is sodium chloride (NaCl, common table salt) and water (Hâ‚‚O). No gas is produced in this reaction.',
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
          'A pH of 2 is far below 7, indicating a strongly acidic solution. The lower the pH below 7, the stronger the acid. A weak acid would have a pH of 4â€“6. pH 7 is neutral, and pH above 7 indicates a base.',
      },
    ],
  },

  // â”€â”€ top-005 Â· Comprehension â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  'top-005': {
    step1: {
      title: 'Simple Definition',
      content:
        'Comprehension is the skill of reading a passage, understanding its meaning, and answering questions about it accurately and in good English. In WAEC English Language Paper 2, the comprehension section presents a passage of about 400â€“600 words followed by questions that test your understanding of the main idea, specific details, the meaning of words as used in context, implied meaning (inference), and the author\'s attitude or purpose. All answers must be written in complete sentences.',
    },
    step2: {
      title: 'Nigerian Example',
      content:
        'Imagine a passage about the Lagos-Ibadan Expressway rehabilitation project. The text explains the project\'s importance to interstate commerce, describes the challenges (flooding near Sagamu, community resistance around Ibadan), and quotes the Honourable Minister of Works on the expected completion date. A WAEC question might ask: "What two challenges are mentioned in the passage?", "What does the word \'rehabilitation\' mean as used in paragraph two?", or "What can you infer about the government\'s priorities from this passage?". Nigerian students who read newspapers such as Punch and Vanguard regularly perform better on these passages.',
    },
    step3: {
      title: 'Visual Breakdown',
      content:
        'WAEC COMPREHENSION â€” APPROACH\nâ”œâ”€â”€ Before reading\nâ”‚   â””â”€â”€ Skim the questions first so you know what to look for\nâ”œâ”€â”€ During reading\nâ”‚   â”œâ”€â”€ 1st read â€” grasp the overall main idea\nâ”‚   â””â”€â”€ 2nd read â€” note specific details and key vocabulary\nâ””â”€â”€ Answering questions\n    â”œâ”€â”€ Factual ("According to the passage...")\n    â”‚   â””â”€â”€ The answer is directly stated â€” locate and paraphrase\n    â”œâ”€â”€ Vocabulary ("...as used in paragraph X")\n    â”‚   â””â”€â”€ Use context clues, not a dictionary definition\n    â”œâ”€â”€ Inference ("What can be concluded...")\n    â”‚   â””â”€â”€ The answer is implied â€” read between the lines\n    â””â”€â”€ Summary\n        â””â”€â”€ Paraphrase the main points in your own words\n\nCommon mistakes to avoid:\n  âœ -  Copying sentences directly from the passage\n  âœ -  Writing incomplete sentences (e.g. "Because it is cheap.")\n  âœ -  Answering beyond what the passage supports',
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
          '"Reading between the lines" is an expression that means understanding the implied or suggested meaning â€” what the writer hints at without saying outright. This is the basis of inference questions, which are a standard part of WAEC comprehension.',
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
          '"Because the road was bad" is a dependent clause, not a complete sentence â€” it has no main clause. WAEC examiners require complete sentences. A correct answer would be: "The journey was difficult because the road was bad."',
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
          'Context clues â€” the words and ideas surrounding an unfamiliar word â€” are the most reliable guide to its meaning as used in the passage. WAEC vocabulary questions always ask for the meaning "as used in the passage," so a standard dictionary definition may be too broad or wrong for that specific context.',
      },
    ],
  },

};

// â”€â”€ Home Dashboard Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const mockHomeData: HomeData = {
  student_name: 'Ada Okonkwo',
  school_name: 'Kings Secondary School',
  streak_days: 7,
  completion_percent: 24,
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

// â”€â”€ Recall Queue â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const mockRecallQueue: RecallItem[] = [
  {
    id: 'rq-001',
    topic_id: 'top-004',
    topic_title: 'Acids & Bases',
    subject: 'Chemistry',
    question:
      'What is the pH range of a strong acid, and give a Nigerian everyday example of one?',
    model_answer:
      'Strong acids have a pH of 0â€“2. Battery acid (Hâ‚‚SOâ‚„) found in car batteries â€” those powering generators during NEPA outages â€” is a common Nigerian example. It turns litmus paper red and reacts violently with metals to produce hydrogen gas.',
  },
  {
    id: 'rq-002',
    topic_id: 'top-001',
    topic_title: 'Quadratic Equations',
    subject: 'Mathematics',
    question:
      'State the three methods for solving a quadratic equation, and write out the quadratic formula.',
    model_answer:
      'The three methods are: (1) Factorisation â€” split axÂ² + bx + c into two brackets; (2) Completing the square â€” rewrite as (x + p)Â² = q; (3) The quadratic formula: x = (âˆ’b Â± âˆš(bÂ² âˆ’ 4ac)) / 2a. The formula works for all quadratic equations including those that do not factorise neatly.',
  },
  {
    id: 'rq-003',
    topic_id: 'top-005',
    topic_title: 'Comprehension',
    subject: 'English Language',
    question:
      'Describe the correct approach to answering a WAEC comprehension vocabulary question (the "as used in the passage" type).',
    model_answer:
      'Use context clues â€” the words and sentences surrounding the unfamiliar word â€” to determine its meaning as used in that specific passage. WAEC requires the contextual meaning, not the standard dictionary definition. Read the sentence before and after the word, consider what makes logical sense, and write your answer in a complete sentence.',
  },
];

// â”€â”€ Progress Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const mockProgressData: ProgressData = {
  streak_days: 8,
  topics_studied: 24,
  avg_accuracy: 71,
  due_tomorrow: 3,
  subject_mastery: [
    { subject: 'Mathematics', mastery_percent: 78 },
    { subject: 'English Language', mastery_percent: 65 },
    { subject: 'Chemistry', mastery_percent: 41 },
  ],
  upcoming_reviews: [
    { topic_title: 'Acids & Bases', due: 'Today', urgency: 'high' },
    { topic_title: 'Quadratic Equations', due: 'Tomorrow', urgency: 'medium' },
    { topic_title: 'Linear Equations', due: 'In 4 days', urgency: 'low' },
  ],
  // 63 values: 9 weeks Ã -  7 days (Monâ€“Sun). Activity levels 0â€“4.
  // Reads left-to-right as weeks; each group of 7 is Monâ€“Sun.
  heatmap_data: [
    // Week 1 (oldest)
    0, 0, 1, 0, 2, 0, 0,
    // Week 2
    0, 1, 0, 2, 0, 1, 0,
    // Week 3
    0, 2, 1, 0, 2, 1, 0,
    // Week 4
    1, 0, 2, 1, 3, 0, 1,
    // Week 5
    0, 2, 1, 2, 1, 0, 1,
    // Week 6
    1, 2, 3, 1, 2, 0, 1,
    // Week 7
    0, 2, 1, 3, 2, 1, 0,
    // Week 8
    2, 3, 2, 4, 1, 2, 0,
    // Week 9 (most recent)
    1, 3, 2, 4, 3, 2, 1,
  ],
};
