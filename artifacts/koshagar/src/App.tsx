import React, { Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/auth";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// Lazy load pages
const Landing = React.lazy(() => import("./pages/landing"));
const Login = React.lazy(() => import("./pages/login"));
const Register = React.lazy(() => import("./pages/register"));
const DriveLayout = React.lazy(() => import("./components/layout/drive-layout"));

const Drive = React.lazy(() => import("./pages/drive/index"));
const Folder = React.lazy(() => import("./pages/drive/folder"));
const Starred = React.lazy(() => import("./pages/drive/starred"));
const Recent = React.lazy(() => import("./pages/drive/recent"));
const Trash = React.lazy(() => import("./pages/drive/trash"));
const Shared = React.lazy(() => import("./pages/drive/shared"));
const Search = React.lazy(() => import("./pages/drive/search"));
const Activity = React.lazy(() => import("./pages/drive/activity"));
const Settings = React.lazy(() => import("./pages/drive/settings"));

const Admin = React.lazy(() => import("./pages/admin/index"));
const PublicShare = React.lazy(() => import("./pages/share/index"));

function Router() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        {/* Drive App Routes */}
        <Route path="/drive">
          <DriveLayout><Drive /></DriveLayout>
        </Route>
        <Route path="/drive/folder/:id">
          {params => <DriveLayout><Folder id={Number(params.id)} /></DriveLayout>}
        </Route>
        <Route path="/drive/starred">
          <DriveLayout><Starred /></DriveLayout>
        </Route>
        <Route path="/drive/recent">
          <DriveLayout><Recent /></DriveLayout>
        </Route>
        <Route path="/drive/trash">
          <DriveLayout><Trash /></DriveLayout>
        </Route>
        <Route path="/drive/shared">
          <DriveLayout><Shared /></DriveLayout>
        </Route>
        <Route path="/drive/search">
          <DriveLayout><Search /></DriveLayout>
        </Route>
        <Route path="/drive/activity">
          <DriveLayout><Activity /></DriveLayout>
        </Route>
        <Route path="/drive/settings">
          <DriveLayout><Settings /></DriveLayout>
        </Route>

        <Route path="/admin" component={Admin} />
        <Route path="/s/:token">
          {params => <PublicShare token={params.token} />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  // Enforce dark mode
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster theme="dark" className="glass-card" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
