import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ErdProvider } from '@/modules/erd/store';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const ErdPage = lazy(() => import('@/modules/erd/ErdPage').then((m) => ({ default: m.ErdPage })));
const SqlPage = lazy(() => import('@/modules/sql/SqlPage').then((m) => ({ default: m.SqlPage })));
const DojoPage = lazy(() => import('@/modules/dojo/DojoPage').then((m) => ({ default: m.DojoPage })));
const BlueprintPage = lazy(() =>
  import('@/modules/blueprint/BlueprintPage').then((m) => ({ default: m.BlueprintPage })),
);

function Loading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-3 w-full max-w-lg" />
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        <Skeleton className="h-[60vh] min-h-[420px]" />
        <Skeleton className="hidden h-[60vh] lg:block" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErdProvider>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="erd" element={<ErdPage />} />
            <Route path="sql" element={<SqlPage />} />
            <Route path="dojo" element={<DojoPage />} />
            <Route path="blueprint" element={<BlueprintPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErdProvider>
  );
}
