import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { useEffect } from "react";

// Pages
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import SignalsPage from "@/pages/signals";
import StatsPage from "@/pages/stats";
import AdminPage from "@/pages/admin";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/");
      } else if (adminOnly && user.role !== "admin") {
        setLocation("/dashboard");
      }
    }
  }, [user, isLoading, adminOnly, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-primary">Initializing...</div>;
  }

  if (!user || (adminOnly && user.role !== "admin")) return null;

  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-primary">Initializing...</div>;
  }

  return (
    <Switch>
      <Route path="/">
        {user ? () => {
          // Immediately redirect if already logged in
          window.location.href = import.meta.env.BASE_URL.replace(/\/$/, "") + "/dashboard";
          return null;
        } : <LoginPage />}
      </Route>
      <Route path="/dashboard"><ProtectedRoute component={DashboardPage} /></Route>
      <Route path="/signals"><ProtectedRoute component={SignalsPage} /></Route>
      <Route path="/stats"><ProtectedRoute component={StatsPage} /></Route>
      <Route path="/admin"><ProtectedRoute component={AdminPage} adminOnly /></Route>
      <Route path="/settings"><ProtectedRoute component={SettingsPage} adminOnly /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <div className="dark">
              <Router />
            </div>
            <Toaster theme="dark" position="bottom-right" />
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
