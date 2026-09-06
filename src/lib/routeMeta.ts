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
  /** Short label for the bottom tab bar, where four items share the width. */
  tabLabel: string;
  description: string;
  /**
   * Whether the route is worth putting in front of a search engine.
   *
   * Log food, History and Settings depend on local data and stay out of the
   * index. The home page introduces the app to new visitors and Privacy
   * explains its storage boundary, so those two routes are indexable.
   */
  indexable: boolean;
}

export const ROUTES = {
  today: {
    path: '/',
    title: 'gymtracker: calorie and macro tracker that stays in your browser',
    navLabel: 'Today',
    tabLabel: 'Today',
    description:
      'Track calories and macros with a food log stored in your browser. No account or cloud sync. Search saved foods or look up a barcode, then review daily progress.',
    indexable: true,
  },
  log: {
    path: '/log',
    title: 'Log food: gymtracker',
    navLabel: 'Log food',
    tabLabel: 'Log',
    description:
      'Search your saved foods, scan a barcode, or add a food by hand, then log it against the day you are viewing.',
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
      'How gymtracker stores your food log locally, uses Open Food Facts for barcode lookups, and handles website delivery and exported backups.',
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

/** The four destinations reachable in one tap from the bottom tab bar. */
export const PRIMARY_ROUTES: RouteMeta[] = [
  ROUTES.today,
  ROUTES.log,
  ROUTES.history,
  ROUTES.settings,
];

/** Everything a person can navigate to, in the order the menu lists them. */
export const ALL_ROUTES: RouteMeta[] = [...PRIMARY_ROUTES, ROUTES.privacy];

/** Routes that belong in sitemap.xml, which is exactly the indexable ones. */
export const INDEXABLE_ROUTES: RouteMeta[] = ALL_ROUTES.filter((route) => route.indexable);

export function findRoute(pathname: string): RouteMeta {
  return ALL_ROUTES.find((route) => route.path === pathname) ?? ROUTES.notFound;
}

export function canonicalFor(path: string): string {
  return path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
}
