import * as React from 'react';
import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader, MobileNav } from './MobileChrome';
import { PageSkeleton } from './PageSkeleton';
import { usePersistentState } from '@/lib/storage';
import { cn } from '@/lib/utils';

export function AppShell() {
  const [collapsed, setCollapsed] = usePersistentState('sidebar:collapsed', false);
  const location = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <MobileHeader />

      <main
        className={cn(
          'min-h-dvh transition-[padding] duration-300 ease-out-expo',
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[252px]',
        )}
      >
        <div className="mx-auto w-full max-w-[1520px] px-4 pb-28 pt-4 sm:px-6 lg:pb-8 lg:pt-7">
          {/*
           * The boundary lives HERE, not in App.tsx. AppShell is eager, the
           * pages are lazy, so this is the narrowest boundary that still lets
           * the chrome render — you keep the sidebar you were just using while
           * the next chunk arrives.
           */}
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
