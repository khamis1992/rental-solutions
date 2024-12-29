import { Card } from "@/components/ui/card";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

export const AuthContainer = () => {
  const { isLoading, session } = useSessionContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (session && location.pathname === '/auth') {
      const importInProgress = sessionStorage.getItem('importInProgress');
      if (!importInProgress) {
        navigate('/');
      }
    }
  }, [session, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="m-auto w-full max-w-md">
          <Card className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="m-auto w-full max-w-md">
        <Card className="p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Welcome to Rental Solutions</h1>
            <p className="text-gray-600">Please sign in to continue</p>
          </div>
          
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb',
                    brandAccent: '#1d4ed8',
                  }
                }
              },
              className: {
                container: 'w-full',
                button: 'w-full px-4 py-2 rounded',
                input: 'w-full px-3 py-2 border rounded',
              }
            }}
            providers={[]}
            redirectTo={window.location.origin}
          />
        </Card>
      </div>
    </div>
  );
};