/**
 * One definition per route, used for navigation, document metadata and the
 * sitemap generator. Keeping them together is what stops the nav label, the
 * page heading, the document title and the sitemap drifting apart.
 */

/** The production origin. Canonical URLs must never point anywhere else. */
export const SITE_ORIGIN = 'https://gymtracker.kucera.uk';

export interface RouteMeta {
  path: string;
  /** Document title. Kept aligned with the visible h1 on the page. */
  title: string;
  /** Full label, used in the rail and the mobile menu. */
  navLabel: string;
  /** Short label for the bottom tab bar, where five items share the width. */
  tabLabel: string;
  description: string;
  /**
   * Whether the route is worth putting in front of a search engine.
   *
   * Log food, Programs, History and Settings depend on local data and stay out
   * of the index. The home page introduces the app, Machines documents the
   * available equipment, and Privacy explains its storage boundary.
   */
  indexable: boolean;
}

export const ROUTES = {
  today: {
    path: '/',
    title: 'gymtracker: nutrition and workout planning in your browser',
    navLabel: 'Today',
    tabLabel: 'Today',
    description:
      'Track grouped meals, calories and macros, build workout programs and browse gym machines. Saved personal data stays in your browser with no account or cloud sync.',
    indexable: true,
  },
  meals: {
    path: '/meals',
    title: 'Meals: gymtracker',
    navLabel: 'Meals',
    tabLabel: 'Meals',
    description:
      'Create grouped meals from a photo, barcode, saved foods, drinks or manual nutrition, then review every item before saving.',
    indexable: false,
  },
  legacyLog: {
    path: '/log',
    title: 'Meals: gymtracker',
    navLabel: 'Meals',
    tabLabel: 'Meals',
    description: 'The former Log food page now opens Meals.',
    indexable: false,
  },
  foods: {
    path: '/foods',
    title: 'Saved foods: gymtracker',
    navLabel: 'Saved foods',
    tabLabel: 'Foods',
    description:
      'Create, review and manage reusable foods, including optional Open Food Facts barcode lookup.',
    indexable: false,
  },
  history: {
    path: '/history',
    title: 'History: gymtracker',
    navLabel: 'History',
    tabLabel: 'History',
    description:
      'Daily calories against your target, macros over time, and your body weight trend across the last week, month or thirteen weeks.',
    indexable: false,
  },
  programs: {
    path: '/programs',
    title: 'Workout programs: gymtracker',
    navLabel: 'Programs',
    tabLabel: 'Programs',
    description:
      'Build and edit a local workout program by hand or create a deterministic draft from your schedule, goals and available equipment.',
    indexable: false,
  },
  machines: {
    path: '/machines',
    title: 'Gym machines and muscle emphasis: gymtracker',
    navLabel: 'Machines',
    tabLabel: 'Machines',
    description:
      'Browse the confirmed gym machine catalogue, exercise instructions and approximate muscle emphasis for each station.',
    indexable: true,
  },
  settings: {
    path: '/settings',
    title: 'Settings: gymtracker',
    navLabel: 'Settings',
    tabLabel: 'Settings',
    description:
      'Set daily calorie and macro targets, record body weight, and export, import or delete everything stored in this browser.',
    indexable: false,
  },
  privacy: {
    path: '/privacy',
    title: 'Privacy: what gymtracker stores and what leaves your device',
    navLabel: 'Privacy',
    tabLabel: 'Privacy',
    description:
      'How gymtracker stores saved data locally and handles optional Open Food Facts lookups, transient Gemini meal-photo analysis, website delivery and backups.',
    indexable: true,
  },
  notFound: {
    path: '*',
    title: 'Page not found: gymtracker',
    navLabel: 'Page not found',
    tabLabel: 'Not found',
    description: 'That page does not exist in gymtracker.',
    indexable: false,
  },
} as const satisfies Record<string, RouteMeta>;

/** The five destinations reachable in one tap from the bottom tab bar. */
export const PRIMARY_ROUTES: RouteMeta[] = [
  ROUTES.today,
  ROUTES.meals,
  ROUTES.programs,
  ROUTES.machines,
  ROUTES.history,
];

/** Everything a person can navigate to, in the order the menu lists them. */
export const ALL_ROUTES: RouteMeta[] = [...PRIMARY_ROUTES, ROUTES.settings, ROUTES.privacy];
export const STATIC_ROUTES: RouteMeta[] = [...ALL_ROUTES, ROUTES.legacyLog, ROUTES.foods];

/** Routes that belong in sitemap.xml, which is exactly the indexable ones. */
export const INDEXABLE_ROUTES: RouteMeta[] = ALL_ROUTES.filter((route) => route.indexable);

export function findRoute(pathname: string): RouteMeta {
  return STATIC_ROUTES.find((route) => route.path === pathname) ?? ROUTES.notFound;
}

export function canonicalFor(path: string): string {
  if (path === '/') return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}${path === '/log' ? '/meals' : path}`;
}
