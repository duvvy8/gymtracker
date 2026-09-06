import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { findRoute, PRIMARY_ROUTES, ROUTES } from '../lib/routeMeta';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import { MobileMenu } from './MobileMenu';
import { NoticeBar } from './NoticeBar';
import { SiteFooter } from './SiteFooter';
import {
  IconHistory,
  IconLog,
  IconMachines,
  IconMenu,
  IconPrivacy,
  IconPrograms,
  IconSettings,
  IconToday,
} from './icons';
import { Button } from './ui';

const ROUTE_ICONS: Record<string, typeof IconToday> = {
  '/': IconToday,
  '/log': IconLog,
  '/history': IconHistory,
  '/programs': IconPrograms,
  '/machines': IconMachines,
  '/settings': IconSettings,
  '/privacy': IconPrivacy,
};

/** The brand, and the link home that people expect it to be. */
function Wordmark({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center rounded-sm font-semibold tracking-tight ${className}`}
    >
      <span className="text-ink">gym</span>
      <span className="text-accent">tracker</span>
      <span className="sr-only">, go to Today</span>
    </Link>
  );
}

function railLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'flex items-center gap-3 border-l-2 px-4 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'border-accent bg-accent-weak text-accent'
      : 'border-transparent text-ink-2 hover:bg-sunken hover:text-ink',
  ].join(' ');
}

function tabLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 border-t-2 px-1',
    'text-2xs font-medium transition-colors',
    isActive ? 'border-accent text-accent' : 'border-transparent text-ink-3',
  ].join(' ');
}

export function AppShell() {
  const { pathname } = useLocation();
  const route = findRoute(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);
  const menuId = useId();
  const menuButtonId = useId();

  useDocumentMeta(route, pathname);

  // Close the menu whenever the route changes, including on browser back.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /**
   * A client-side navigation swaps the page without telling anyone. Focus
   * moves to the new main region so a keyboard user continues from the top of
   * the new page rather than from wherever the old page's link was, and the
   * route name is announced.
   *
   * The guard compares the previous path rather than tracking "have I run
   * before". A boolean ref is defeated by StrictMode, which mounts, cleans up
   * and mounts again: the first pass flips the flag and the second pass then
   * steals focus on initial load, putting the skip link behind the user
   * before they have pressed anything. Comparing paths is idempotent, so a
   * repeated effect run for the same route does nothing.
   */
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    mainRef.current?.focus();
    setAnnouncement(route.navLabel);
  }, [pathname, route.navLabel]);

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-raised"
      >
        Skip to content
      </a>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* Wide layout: the rail is the banner, with the primary nav inside it. */}
      <header className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-14 items-center border-b border-line px-4">
          <Wordmark className="text-lg" />
        </div>
        <nav aria-label="Primary" className="flex flex-col py-3">
          {[...PRIMARY_ROUTES, ROUTES.settings, ROUTES.privacy].map(({ path, navLabel }) => {
            const Icon = ROUTE_ICONS[path] ?? IconToday;
            return (
              <NavLink key={path} to={path} end={path === '/'} className={railLinkClass}>
                <Icon />
                <span>{navLabel}</span>
              </NavLink>
            );
          })}
        </nav>
      </header>

      {/* Narrow layout: a compact banner with the brand and the menu trigger. */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 lg:hidden">
        <Wordmark className="text-base" />
        <Button
          id={menuButtonId}
          variant="quiet"
          size="icon"
          onClick={(event) => {
            // The dialog restores focus on close to whatever held it when
            // showModal() ran. Clicking a button does not focus it in every
            // browser, so focus it here: without this the drawer can close
            // with focus on <body>, dumping the user back at the top of the
            // document instead of on the control they just used.
            event.currentTarget.focus();
            setMenuOpen(true);
          }}
          aria-expanded={menuOpen}
          aria-controls={menuId}
        >
          <IconMenu />
          <span className="sr-only">Menu</span>
        </Button>
      </header>

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="min-w-0 flex-1 focus:outline-none lg:pl-56"
      >
        <div className="mx-auto w-full max-w-(--container-wide) px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <div className="pb-tab-bar lg:pb-0 lg:pl-56">
        <SiteFooter />
      </div>

      {/* Narrow layout: the five destinations used most often, in the thumb zone. */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 flex h-15 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {PRIMARY_ROUTES.map(({ path, tabLabel }) => {
          const Icon = ROUTE_ICONS[path] ?? IconToday;
          return (
            <NavLink key={path} to={path} end={path === '/'} className={tabLinkClass}>
              <Icon />
              <span className="max-w-full truncate">{tabLabel}</span>
            </NavLink>
          );
        })}
      </nav>

      <MobileMenu id={menuId} open={menuOpen} onClose={() => setMenuOpen(false)} />

      <NoticeBar />
    </div>
  );
}
