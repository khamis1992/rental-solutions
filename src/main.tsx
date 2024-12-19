import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Initialize the app with session
const initializeApp = async () => {
  try {
    // Get the initial session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error fetching initial session:', error);
      // If there's an error, try to refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Error refreshing session:', refreshError);
        renderApp(null);
        return;
      }
      renderApp(refreshedSession);
      return;
    }

    console.log('Initial session:', session);

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event);
      console.log('New session:', session);
      
      if (_event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      
      renderApp(session);
    });

    // Initial render with session
    renderApp(session);

    // Cleanup subscription when the window unloads
    window.addEventListener('unload', () => {
      subscription.unsubscribe();
    });

  } catch (error) {
    console.error('Failed to initialize app:', error);
    renderApp(null);
  }
};

// Helper function to render the app
const renderApp = (session: any) => {
  root.render(
    <React.StrictMode>
      <SessionContextProvider 
        supabaseClient={supabase}
        initialSession={session}
      >
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <SidebarProvider>
              <App />
            </SidebarProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </SessionContextProvider>
    </React.StrictMode>
  );
};

// Start the application
initializeApp();