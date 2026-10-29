import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ErdProvider } from '@/modules/erd/store';
import { WanniMark } from '@/components/brand/marks';

const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const ErdPage = lazy(() => import('@/modules/erd/ErdPage').then((m) => ({ default: m.ErdPage })));
const SqlPage = lazy(() => import('@/modules/sql/SqlPage').then((m) => ({ default: m.SqlPage })));
const DojoPage = lazy(() => import('@/modules/dojo/DojoPage').then((m) => ({ default: m.DojoPage })));
const BlueprintPage = lazy(() =>
  import('@/modules/blueprint/BlueprintPage').then((m) => ({ default: m.BlueprintPage })),
);
const DesignSystem = lazy(() =>
  import('@/pages/DesignSystem').then((m) => ({ default: m.DesignSystem })),
);

/**
 * Cold boot only. Every route boundary lives in AppShell, so this one fires
 * only if a provider (not a page) suspends — i.e. essentially never. It is
 * centred and full-bleed on purpose: a page skeleton rendered outside the
 * shell is what produced the original "no outer margin" bug.
 */
function BootSplash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-bob">
          <WanniMark size={64} />
        </div>
        <p className="font-mono text-2xs uppercase tracking-[0.22em] text-muted-foreground">
          fullstack wannabe
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErdProvider>
      <Suspense fallback={<BootSplash />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="erd" element={<ErdPage />} />
            <Route path="sql" element={<SqlPage />} />
            <Route path="dojo" element={<DojoPage />} />
            <Route path="blueprint" element={<BlueprintPage />} />
            <Route path="design-system" element={<DesignSystem />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErdProvider>
  );
}
