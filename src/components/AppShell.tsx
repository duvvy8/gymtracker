import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { NoticeBar } from './NoticeBar';
import { IconHistory, IconLog, IconPrivacy, IconSettings, IconToday } from './icons';

type NavItem = {
  to: string;
  label: string;
  /** Shorter label for the tab bar, where five items share the width. */
  shortLabel: string;
  Icon: typeof IconToday;
};

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Today', shortLabel: 'Today', Icon: IconToday },
  { to: '/log', label: 'Log food', shortLabel: 'Log', Icon: IconLog },
  { to: '/history', label: 'History', shortLabel: 'History', Icon: IconHistory },
  { to: '/settings', label: 'Settings', shortLabel: 'Settings', Icon: IconSettings },
  { to: '/privacy', label: 'Privacy', shortLabel: 'Privacy', Icon: IconPrivacy },
];

function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="font-semibold tracking-tight text-ink">gym</span>
      <span className="font-semibold tracking-tight text-accent">tracker</span>
    </span>
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
  const current = NAV_ITEMS.find((item) => item.to === pathname);

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-raised"
      >
        Skip to content
      </a>

      {/* Wide layout: a fixed rail on the left. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-14 items-center border-b border-line px-4">
          <Wordmark className="text-lg" />
        </div>
        <nav aria-label="Sections" className="flex flex-col py-3">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={railLinkClass}>
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto border-t border-line px-4 py-4 text-xs text-ink-3">
          Everything you log is stored in this browser only.
        </p>
      </aside>

      {/* Narrow layout: a compact header. */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface px-4 lg:hidden">
        <Wordmark className="text-base" />
        <span className="truncate text-sm font-medium text-ink-3">{current?.label ?? ''}</span>
      </header>

      <main id="main" className="min-w-0 lg:pl-56">
        <div className="mx-auto w-full max-w-(--container-wide) px-4 py-6 pb-tab-bar sm:px-6 lg:px-8 lg:pb-12">
          <Outlet />
        </div>
      </main>

      {/* Narrow layout: a fixed tab bar. */}
      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-30 flex h-15 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {NAV_ITEMS.map(({ to, shortLabel, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={tabLinkClass}>
            <Icon />
            <span className="max-w-full truncate">{shortLabel}</span>
          </NavLink>
        ))}
      </nav>

      <NoticeBar />
    </div>
  );
}
