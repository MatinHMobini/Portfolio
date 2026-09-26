/*
 * ─────────────────────────────────────────────────────────────
 *  PIXEL QUEST · ALL SITE CONTENT LIVES IN THIS ONE FILE
 * ─────────────────────────────────────────────────────────────
 *  Edit anything below and the whole site updates (text, links,
 *  projects, skills...). Anything wrapped in [PLACEHOLDER ...]
 *  is a guess or a gap: replace it with your real info.
 *
 *  Paths like "photo.jpg" or "projects/x.jpg" point to files in
 *  the /public folder.
 */

export interface Job {
  team: string;
  role: string;
  years: string;
  /** Shown under the row (all rows start open). */
  achievements: string[];
  tech: string[];
  /** School rather than a job: not counted in the hero's JOBS stat. */
  education?: boolean;
  /** Small tag under the company name, e.g. "CO-OP". */
  type?: string;
}

export type ProjectCategory = 'WEB' | 'MOBILE' | 'AI/ML' | 'GAMES & ALGOS';

export interface Project {
  id: string;
  name: string;
  year: string;
  category: ProjectCategory;
  tagline: string;
  description: string;
  tech: string[];
  /** Screenshot paths inside /public. Leave empty for a pixel-art placeholder. */
  screenshots: string[];
  /** Live demo link. Not shown on the site at the moment (only VIEW CODE is). */
  playUrl?: string;
  /** Source code link (CODE). */
  codeUrl?: string;
  /** Sticker colour on the cartridge label. */
  color: 'yellow' | 'pink' | 'cyan';
}

export interface Skill {
  name: string;
  /** 1 to 10 blocks. */
  level: number;
}

export interface Quest {
  name: string;
  text: string;
}

export const content = {
  name: 'MATIN MOBINI',
  firstName: 'matin',
  /** Name used in page metadata and image descriptions. */
  fullName: 'Matin Mobini',
  gamertag: 'MATINM',
  role: 'CS STUDENT @ UOTTAWA',
  builds: 'AI/ML, WEB & ANDROID APPS',
  /**
   * Lines the character types out in the hero dialog box. They loop
   * forever, one after another (click ▼ to skip ahead).
   */
  dialog: [
    "HI! I'M MATIN. I BUILD AI/ML, WEB & ANDROID APPS.",
    'I STUDY COMPUTER SCIENCE AT UOTTAWA, CONCENTRATING IN AI & ML.',
    "FUN FACT: I'M NOT PRESSING ANY BUTTONS. A NEURAL NET IS PLAYING ME.",
    "IF I FALL IN A PIT, THAT'S NOT A BUG. IT'S A LEARNING OPPORTUNITY.",
    'I TRAINED FOR HUNDREDS OF GENERATIONS AND STILL FORGET TO JUMP SOMETIMES.',
    'THIS HEADSET IS 100% FOR THE AESTHETIC.',
    'MY CODE WORKS ON THE FIRST TRY. MOSTLY. SOMETIMES. ONCE.',
    "SCROLL DOWN AND I'LL JUMP INTO THE NEXT WORLD. NO PRESSURE.",
    'THE ENEMIES HERE TALK TRASH. IGNORE THEM.',
    'WANT THE CONTROLLER? OPEN THE AI BRAIN AND PRESS PLAY IT YOURSELF.',
  ],
  location: 'OTTAWA, CANADA',
  className: 'HONOURS CS · AI & ML',
  likes: 'GAMING, BASKETBALL, GYM',
  bio:
    'A passionate developer with a knack for problem solving and teamwork. ' +
    'Honours Computer Science at the University of Ottawa (GPA 3.9/4.0), ' +
    "nine-time Dean's Honour List and a Merit Scholarship. Levels up in Artificial " +
    'Intelligence & Machine Learning, Web Development and Android Development.',
  stats: [
    { label: 'GPA', value: '3.9/4' },
    { label: 'PROJECTS', value: '' /* filled in automatically */ },
    { label: 'JOBS', value: '' /* filled in automatically (roles, not school) */ },
  ],

  photo: 'photo.jpg',
  cv: 'cv.pdf',
  cvLabel: "LOAD MATIN'S RESUME",

  openTo: 'INTERNSHIPS / FULL-TIME / FREELANCE',
  wantedRole: 'SOFTWARE / AI & ML DEV',

  links: {
    linkedin: 'https://www.linkedin.com/in/matin-mobini-56aa56277/',
    github: 'https://github.com/MatinHMobini',
    email: 'hmobinimatin@gmail.com',
  },

  /**
   * Formspree form id (the part after https://formspree.io/f/).
   * Leave empty and the form falls back to opening the visitor's email app.
   */
  formspreeId: '',

  skills: [
    { name: 'PYTHON', level: 10 },
    { name: 'JAVA', level: 9 },
    { name: 'JAVASCRIPT / TS', level: 8 },
    { name: 'SQL', level: 8 },
    { name: 'AI / ML', level: 8 },
    { name: 'REACT + NODE', level: 7 },
    { name: 'ANDROID', level: 7 },
  ] as Skill[],

  /** Other languages and tools (from the resume). */
  alsoSpeaks: ['C++', 'GO', 'HTML/CSS', 'EXPRESS.JS', 'POSTGRESQL', 'FIREBASE', 'PROLOG', 'RACKET', 'GIT', 'JUPYTER'],

  /** ACTIVE QUESTS: what I'm building or planning next. */
  quests: [
    { name: 'RALLY', text: 'A social app that brings people together through shared interests.' },
    {
      name: 'MENTAL HEALTH ASSISTANT',
      text: 'A context-aware RAG phone app that reads your smartwatch data to track your health and help you through stressful times, built on real therapist methods.',
    },
    { name: 'CROPPILOT', text: 'An autonomous robot for crop detection, precision harvesting and storage organization.' },
  ] as Quest[],

  /** Newest first. Leave achievements/tech empty and the row shows no details. */
  experience: [
    {
      team: 'ADAPTRON INC.',
      type: 'CO-OP',
      role: 'AI RESEARCH & ROBOTICS ENGINEER',
      years: 'MAY 2026-NOW',
      // [PLACEHOLDER] Add what you work on at Adaptron (bullets) and the tools you use.
      achievements: [],
      tech: [],
    },
    {
      team: 'HEALTH CANADA',
      type: 'CO-OP',
      role: 'SOFTWARE DEVELOPER, DATA SCIENCE & ANALYTICS',
      years: 'MAY 2025-JAN 2026',
      achievements: [
        'Engineered a scalable, multi-government-branch automated Case Management Tool, expanding across branches with the vision to supersede legacy systems and unify workflows and information storage organization-wide',
        'Integrated an intelligent local decision assistant into the tool that analyzes proprietary, complex JSON datasets and recommends optimal solutions in real time, while answering inquiries about protected or online data',
        'Worked independently on multiple concurrent projects with Python, SQL and data processing libraries in a hybrid government environment',
      ],
      tech: ['Python', 'SQL', 'Machine Learning', 'Lead Developer', 'Data Processing'],
    },
    {
      team: 'HEALTH CANADA',
      type: 'CO-OP',
      role: 'JUNIOR ANALYST, DATA SCIENCE & ANALYTICS',
      years: 'JAN-APR 2025',
      achievements: [
        'Engineered a chemistry identification tool that runs 881 substructure tests on molecular data to generate binary fingerprints, helping chemists identify and understand undocumented compounds',
        'Developed ChemPath, an app for visualizing and analyzing chemical synthesis pathways, used to inform officers about potentially hazardous molecules such as fentanyl and methamphetamine',
        'Worked independently on multiple concurrent projects with Python, SQL and data processing libraries',
        'Collaborated with chemists and data analysts so the tools met scientific and operational requirements',
      ],
      tech: ['Python', 'SQL', 'Data Science', 'Cheminformatics'],
    },
    {
      team: 'CRISPERME (STARTUP)',
      role: 'WEBSITE DEVELOPER',
      years: 'SEP 2022-NOV 2023',
      achievements: [
        'Implemented new features and enhancements to the company website: optimized user interfaces, refined navigation menus, interactive components',
        'Contributed to server maintenance and backend development, including data collection and management with MySQL',
      ],
      tech: ['JavaScript', 'TypeScript', 'Node.js', 'Java', 'Python', 'SQL', 'MySQL', 'GitLab'],
    },
    {
      team: 'UNIVERSITY OF OTTAWA',
      role: 'HONOURS BSC COMPUTER SCIENCE',
      years: 'GRAD DEC 2026',
      education: true,
      achievements: [
        'Concentration in Artificial Intelligence & Machine Learning',
        "GPA 3.9 / 4.0, nine-time Dean's Honour List, Merit Scholarship",
        'Vice President of HKFC, a uOttawa student club',
        'Coursework: data structures & algorithms, OOP, computer architecture, programming paradigms, probability & statistics, databases',
      ],
      tech: ['Python', 'Java', 'SQL', 'C++', 'Racket', 'Prolog'],
    },
  ] as Job[],

  projects: [
    {
      id: 'pixel-quest',
      name: 'PIXEL QUEST',
      year: '2026',
      category: 'AI/ML',
      tagline: 'This site. A neural net trained by neuroevolution plays every level.',
      description:
        'The portfolio you are playing. A small neural network (8 senses → 10 → 8 → 5 actions) was trained ' +
        'offline with a genetic algorithm on hundreds of seeded levels, and it drives the runner in every ' +
        'section. The Training Lab lets you watch a population learn live in a Web Worker. Canvas 2D, ' +
        'TypeScript, zero runtime dependencies.',
      tech: ['TypeScript', 'Canvas 2D', 'Neuroevolution', 'Web Workers', 'Vite'],
      screenshots: [],
      codeUrl: 'https://github.com/MatinHMobini/Portfolio',
      color: 'yellow',
    },
    {
      id: 'gambling-buddy',
      name: 'MY GAMBLING BUDDY',
      year: '2026',
      category: 'AI/ML',
      tagline: 'uOttawaHack 8: sports stats explained by an AI buddy with personality.',
      description:
        'A multi-sport assistant (NBA, NFL, NHL, MLB, La Liga) built at uOttawaHack 8. It analyses player ' +
        'and team data, compares players, shows upcoming games and gives over/under insights, then explains ' +
        'them with AI-generated, slang-filled commentary. Built as an informational companion, not a push ' +
        'to gamble. Python FastAPI + Uvicorn backend, HTML/CSS/JS frontend.',
      tech: ['Python', 'FastAPI', 'AI', 'JavaScript', 'HTML/CSS'],
      screenshots: [],
      playUrl: 'https://www.mygamblingbuddy.tech/',
      codeUrl: 'https://github.com/MatinHMobini/My-Gambling-Buddy',
      color: 'pink',
    },
    {
      id: 'house-price',
      name: 'HOUSE PRICE PREDICTOR',
      year: '2024',
      category: 'AI/ML',
      tagline: 'ML model that predicts house prices (Random Forest, RMSE 50,414).',
      description:
        'A machine learning model that predicts house prices from a Kaggle dataset using features such as ' +
        'location, population and proximity to water. Data preprocessing, feature scaling and model training, ' +
        'then a Random Forest tuned with GridSearchCV reached an RMSE of 50,414. Key relationships are ' +
        'visualised with scatterplots, heatmaps and histograms in Jupyter Notebook.',
      tech: ['Python', 'pandas', 'NumPy', 'Scikit-learn', 'Matplotlib', 'Seaborn'],
      screenshots: ['projects/house-price.jpg'],
      codeUrl: 'https://github.com/MatinHMobini/House-Price-Prediction',
      color: 'cyan',
    },
    {
      id: 'seg-lab',
      name: 'SEGMENTATION LAB',
      year: '2026',
      category: 'AI/ML',
      tagline: 'Applied ML: segmentation model training, secrets injection and CI/CD.',
      description:
        'SEG4180 applied machine learning lab: training a segmentation model and wiring it into a CI/CD ' +
        'pipeline with secrets injection. [PLACEHOLDER: add a line about the dataset and results.]',
      tech: ['Python', 'Deep Learning', 'CI/CD'],
      screenshots: [],
      codeUrl:
        'https://github.com/MatinHMobini/SEG4180_A00_Applied_Machine_Learning_Secrets_Injection_CICD_and_Segmentation_Model_Training_Lab',
      color: 'yellow',
    },
    {
      id: 'hotel-booking',
      name: 'HOTEL BOOKING SERVICE',
      year: '2024',
      category: 'WEB',
      tagline: 'SQL-powered hotel search, booking and reservation manager.',
      description:
        'A comprehensive SQL database at the core of a hotel booking system, with a web app for searching, ' +
        'booking and managing reservations efficiently.',
      tech: ['TypeScript', 'PostgreSQL', 'React', 'Vite', 'Node.js', 'Bootstrap'],
      screenshots: ['projects/hotel-booking.jpg'],
      playUrl: 'https://matinhmobini.github.io/CSI_2132_Databases_1/',
      codeUrl: 'https://github.com/MatinHMobini/CSI_2132_Databases_1',
      color: 'pink',
    },
    {
      id: 'hkfc',
      name: 'UOTTAWA HKFC CLUB',
      year: '2024',
      category: 'WEB',
      tagline: "Live website for HKFC, a uOttawa club I'm part of.",
      description:
        "The website of HKFC, a University of Ottawa student club I'm part of. It gives students an " +
        "overview of the club's mission, upcoming events, announcements and team members. Visitors can " +
        'join the club and browse past and future events.',
      tech: ['JavaScript', 'HTML', 'CSS'],
      screenshots: [],
      playUrl: 'https://uo-hkfc.com/',
      codeUrl: 'https://github.com/MatinHMobini/UOttawa_HKFC_Club',
      color: 'cyan',
    },
    {
      id: 'cycling-club',
      name: 'CYCLING CLUB APP',
      year: '2023',
      category: 'MOBILE',
      tagline: 'Android app to run cycling club events and members.',
      description:
        'A cycling club event management app built with Java and Android Studio. It manages different ' +
        'types of cycling events, user accounts and participation tracking inside a cycling community, ' +
        'backed by Firebase. Delivered by a team of 4 in a 4-month timeframe.',
      tech: ['Java', 'Android Studio', 'Firebase', 'UML'],
      screenshots: ['projects/cycling-club.jpg'],
      codeUrl: 'https://github.com/MatinHMobini/Cycling-Club-Event-Management-App',
      color: 'yellow',
    },
    {
      id: 'parking-lot',
      name: 'PARKING LOT OPTIMIZER',
      year: '2024',
      category: 'GAMES & ALGOS',
      tagline: 'Simulation that finds the minimum spots to stop queues forming.',
      description:
        'Simulates a parking lot to find the optimal number of spots: the minimum needed to handle car ' +
        'arrivals and departures without excessive queues at the entrance and without leaving spots unused.',
      tech: ['Java', 'Simulation', 'Queues'],
      screenshots: [],
      codeUrl: 'https://github.com/MatinHMobini/Parking-Lot-Capacity-Optimizer',
      color: 'pink',
    },
    {
      id: 'path-finder',
      name: 'PATH FINDER',
      year: '2024',
      category: 'GAMES & ALGOS',
      tagline: 'Maze solver that finds a route through obstacle grids.',
      description:
        'A maze solver game: it reads a maze as a grid of characters and computes a valid path from the ' +
        'entrance on the left to the exit on the right, around the obstacles.',
      tech: ['Python', 'Search', 'Grids'],
      screenshots: [],
      codeUrl: 'https://github.com/MatinHMobini/Path-Finder',
      color: 'cyan',
    },
  ] as Project[],

  footerNote: 'BUILT WITH TYPESCRIPT, CANVAS AND A TINY NEURAL NET',
};

export type Content = typeof content;
