import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteWrapper } from "@/components/layout/RouteWrapper";

// Lazy load components
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Index"));
const Vehicles = lazy(() => import("@/pages/Vehicles"));
const VehicleDetails = lazy(() => import("@/components/vehicles/VehicleDetails"));
const Customers = lazy(() => import("@/pages/Customers"));
const CustomerProfile = lazy(() => import("@/pages/CustomerProfile"));
const Agreements = lazy(() => import("@/pages/Agreements"));
const Settings = lazy(() => import("@/pages/Settings"));
const Maintenance = lazy(() => import("@/pages/Maintenance"));
const TrafficFines = lazy(() => import("@/pages/TrafficFines"));
const Reports = lazy(() => import("@/pages/Reports"));
const Finance = lazy(() => import("@/pages/Finance"));
const Help = lazy(() => import("@/pages/Help"));
const Legal = lazy(() => import("@/pages/Legal"));
const Audit = lazy(() => import("@/pages/Audit"));

// Define protected route interface
interface ProtectedRouteConfig {
  path: string;
  component: React.ComponentType;
}

const protectedRoutes: ProtectedRouteConfig[] = [
  { path: "/", component: Dashboard },
  { path: "/vehicles", component: Vehicles },
  { path: "/vehicles/:id", component: VehicleDetails },
  { path: "/customers", component: Customers },
  { path: "/customers/:id", component: CustomerProfile },
  { path: "/agreements", component: Agreements },
  { path: "/settings", component: Settings },
  { path: "/maintenance/*", component: Maintenance },
  { path: "/traffic-fines", component: TrafficFines },
  { path: "/reports", component: Reports },
  { path: "/finance", component: Finance },
  { path: "/help", component: Help },
  { path: "/legal", component: Legal },
  { path: "/audit", component: Audit },
];

export default function App() {
  const { toast } = useToast();
  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
  });

  if (loadingSession) {
    return <Skeleton className="h-screen w-screen" />;
  }

  return (
    <>
      <Toaster />
      <Routes>
        {!session && (
          <Route
            path="/auth"
            element={
              <Suspense fallback={<Skeleton className="h-screen w-screen" />}>
                <Auth />
              </Suspense>
            }
          />
        )}
        {protectedRoutes.map(({ path, component: Component }) => (
          <Route
            key={path}
            path={path}
            element={
              session ? (
                <Suspense fallback={<Skeleton className="h-screen w-screen" />}>
                  <RouteWrapper>
                    <Component />
                  </RouteWrapper>
                </Suspense>
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
        ))}
        <Route 
          path="*" 
          element={<Navigate to={session ? "/" : "/auth"} replace />} 
        />
      </Routes>
    </>
  );
}