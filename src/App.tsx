import { Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import * as LazyComponents from "@/routes/routes";

export default function App() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        // Only attempt refresh if there's no active session
        if (!session) {
          console.log("No active session, attempting refresh...");
          const { data: { session: refreshedSession }, error: refreshError } = 
            await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error("Session refresh failed:", refreshError);
            // Don't redirect on refresh failure, just return null
            return null;
          }
          
          return refreshedSession;
        }

        return session;
      } catch (error) {
        console.error("Auth error:", error);
        // Only redirect to auth page if we're certain the session is invalid
        if (error.message?.includes('JWT expired') || error.message?.includes('invalid token')) {
          await supabase.auth.signOut();
          navigate('/auth');
        }
        return null;
      }
    },
    retry: 1,
    refetchInterval: 5 * 60 * 1000, // Check session every 5 minutes instead of continuous polling
    refetchOnWindowFocus: true, // Only refetch on window focus
    refetchOnReconnect: true, // Refetch on reconnect to ensure session is still valid
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      
      if (event === "SIGNED_IN") {
        toast({
          title: "Welcome back!",
          variant: "default",
        });
        // Only navigate to dashboard if we're on the auth page
        if (window.location.pathname === '/auth') {
          navigate('/');
        }
      } else if (event === "SIGNED_OUT") {
        toast({
          title: "You have been logged out.",
          variant: "default",
        });
        navigate('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast, navigate]);

  if (loadingSession) {
    return <Skeleton className="h-screen w-screen" />;
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="rental-solutions-theme">
      <div className="min-h-screen bg-background">
        <Toaster />
        <Routes>
          {/* Public Routes */}
          <Route
            path="/auth"
            element={
              <Suspense fallback={<Skeleton className="h-screen w-screen" />}>
                <LazyComponents.Auth />
              </Suspense>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute session={session}>
                <LazyComponents.Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vehicles"
            element={
              <ProtectedRoute session={session}>
                <LazyComponents.Vehicles />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vehicles/:id"
            element={
              <ProtectedRoute session={session}>
                <LazyComponents.VehicleDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <ProtectedRoute session={session}>
                <LazyComponents.Customers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute session={session}>
                <LazyComponents.CustomerProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agreements"
            element={
              <ProtectedRoute session={session}>
                <LazyComponents.Agreements />
              </ProtectedRoute>
            }
          />

          <Route
            path="/remaining-amount"
            element={
              <ProtectedRoute session={session}>
                <LazyComponents.RemainingAmount />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute session={session}>
                <LazyComponents.Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/maintenance/*"
            element={
              <ProtectedRoute session={session}>
                <LazyComponents.Maintenance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/traffic-fines"
            element={
              <ProtectedRoute session={session}>
                <LazyComponents.TrafficFines />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute session={session}>
                <LazyComponents.Reports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finance"
            element={
              <ProtectedRoute session={session}>
                <LazyComponents.Finance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/help"
            element={
              <ProtectedRoute session={session}>
                <LazyComponents.Help />
              </ProtectedRoute>
            }
          />

          <Route
            path="/legal"
            element={
              <ProtectedRoute session={session}>
                <LazyComponents.Legal />
              </ProtectedRoute>
            }
          />

          <Route
            path="/audit"
            element={
              <ProtectedRoute session={session}>
                <LazyComponents.Audit />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}