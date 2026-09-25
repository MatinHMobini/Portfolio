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
  /** Shown when the row is expanded. */
  achievements: string[];
  tech: string[];
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
  /** Live demo link (▶ PLAY). Leave empty to hide the button. */
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

export const content = {
  name: 'MATIN MOBINI',
  firstName: 'matin',
  fullName: 'Matin Hassanzadeh Mobini',
  gamertag: 'MATINHM',
  role: 'CS STUDENT @ UOTTAWA',
  builds: 'AI, WEB & ANDROID APPS',
  /** Short one-liner used in the hero dialog box. */
  dialog: [
    'HI! I BUILD AI, WEB & ANDROID APPS.',
    'I STUDY COMPUTER SCIENCE AT THE UNIVERSITY OF OTTAWA.',
    'THE RUNNER DOWN THERE? A NEURAL NET I TRAINED IS PLAYING IT.',
    'WANNA SEE MY LOOT?',
  ],
  location: 'OTTAWA, CANADA',
  className: 'HONOURS CS STUDENT',
  likes: '[PLACEHOLDER: GAMES, HOBBIES]',
  bio:
    'A passionate developer with a knack for problem solving and teamwork. ' +
    'Honours Computer Science at the University of Ottawa (GPA 3.9/4.0), ' +
    "Dean's Honour List and a Merit Scholarship. Levels up in Artificial " +
    'Intelligence, Web Development and Android Development.',
  stats: [
    { label: 'GPA', value: '3.9' },
    { label: 'PROJECTS', value: '' /* filled in automatically */ },
    { label: 'JOBS', value: '' /* filled in automatically */ },
  ],

  photo: 'photo.jpg',
  cv: 'cv.pdf',

  openTo: 'INTERNSHIPS / FULL-TIME / FREELANCE',
  wantedRole: 'SOFTWARE / AI DEV',

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
    { name: 'JAVA', level: 9 },
    { name: 'PYTHON', level: 9 },
    { name: 'JAVASCRIPT / TS', level: 8 },
    { name: 'SQL', level: 8 },
    { name: 'REACT + VITE', level: 7 },
    { name: 'ANDROID', level: 7 },
    { name: 'ML / SCIKIT', level: 7 },
  ] as Skill[],

  /** Also known as: languages mentioned on the old site. */
  alsoSpeaks: ['HTML', 'CSS', 'GO', 'PROLOG', 'SCHEME', 'RACKET', 'NODE.JS', 'FIREBASE'],

  quests: [
    'NEUROEVOLUTION: THE BRAIN THAT PLAYS THIS SITE',
    'APPLIED ML: SEGMENTATION MODELS + CI/CD',
    '[PLACEHOLDER: A SIDE PROJECT IDEA]',
  ],

  experience: [
    {
      team: 'CRISPERME',
      role: 'WEBSITE DEVELOPER',
      years: '2022-2023',
      achievements: [
        'Ran server maintenance for an upcoming startup',
        'Shipped new frontend features: faster UIs, cleaner navigation menus, interactive components',
        'Built backend data collection and management with MySQL',
      ],
      tech: ['Java', 'Python', 'JavaScript', 'TypeScript', 'Node.js', 'SQL', 'MySQL', 'XAMPP', 'GitLab'],
    },
    {
      team: 'SHOPPERS DRUG MART',
      role: 'RETAIL SUPERVISOR',
      years: '2022-NOW',
      achievements: [
        'Supervising the floor team',
        'Customer service and assistance',
        'Restocking and organisation',
      ],
      tech: ['Communication', 'Teamwork', 'Customer Service', 'Organisation'],
    },
    {
      team: 'UNIVERSITY OF OTTAWA',
      role: 'HONOURS CS STUDENT',
      years: '[PLACEHOLDER: YEAR]-NOW',
      achievements: [
        "GPA 3.9 / 4.0, Dean's Honour List",
        'Merit Scholarship',
        'Coursework: data structures, databases, programming paradigms, applied ML',
      ],
      tech: ['Java', 'Python', 'SQL', 'Racket', 'Prolog', 'Go'],
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
      tagline: 'Machine learning model that predicts house prices.',
      description:
        'A machine learning model that predicts house prices from features such as location and population. ' +
        'Covers data preprocessing, feature engineering, model training, evaluation and visualisation of ' +
        'the results in Jupyter Notebook.',
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
      tagline: "Live website for the uOttawa HKFC club: events, news, team.",
      description:
        "The HKFC Club website gives students an overview of the club's mission, upcoming events, " +
        'announcements and team members. Visitors can join the club and browse past and future events.',
      tech: ['JavaScript', 'HTML', 'CSS'],
      screenshots: [],
      playUrl: 'https://uo-hkfc.com/',
      codeUrl: 'https://github.com/MatinHMobini/UOttawa_HKFC_Club',
      color: 'cyan',
    },
    {
      id: 'cycling-club',
      name: 'CYCLING CLUB APP',
      year: '2024',
      category: 'MOBILE',
      tagline: 'Android app to run cycling club events and members.',
      description:
        'A cycling club event management app built with Java and Android Studio. It manages different ' +
        'types of cycling events, user accounts and the interactions inside a cycling community, backed ' +
        'by Firebase.',
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
