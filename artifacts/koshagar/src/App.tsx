import React, { Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/auth";
import NotFound from "@/pages/not-found";
import DriveLayout from "./components/layout/drive-layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const FullPageLoader = (
  <div className="min-h-screen w-full flex items-center justify-center bg-background">
    <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const ContentLoader = (
  <div className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const Landing = React.lazy(() => import("./pages/landing"));
const Login = React.lazy(() => import("./pages/login"));
const Register = React.lazy(() => import("./pages/register"));
const ForgotPassword = React.lazy(() => import("./pages/forgot-password"));

const Drive = React.lazy(() => import("./pages/drive/index"));
const Folder = React.lazy(() => import("./pages/drive/folder"));
const Starred = React.lazy(() => import("./pages/drive/starred"));
const Recent = React.lazy(() => import("./pages/drive/recent"));
const Trash = React.lazy(() => import("./pages/drive/trash"));
const Shared = React.lazy(() => import("./pages/drive/shared"));
const Search = React.lazy(() => import("./pages/drive/search"));
const Activity = React.lazy(() => import("./pages/drive/activity"));
const Settings = React.lazy(() => import("./pages/drive/settings"));

const AdminOverview = React.lazy(() => import("./pages/admin/index"));
const AdminUsers = React.lazy(() => import("./pages/admin/users"));
const AdminAnalytics = React.lazy(() => import("./pages/admin/analytics"));
const AdminHealth = React.lazy(() => import("./pages/admin/health"));
const PublicShare = React.lazy(() => import("./pages/share/index"));

// DriveSection renders a stable DriveLayout wrapper so the sidebar never
// unmounts when switching between drive tabs. Only inner page content changes.
function DriveSection() {
  return (
    <DriveLayout>
      <Switch>
        <Route path="/drive/folder/:id">
          {(params: { id: string }) => (
            <Suspense fallback={ContentLoader}>
              <Folder id={Number(params.id)} />
            </Suspense>
          )}
        </Route>
        <Route path="/drive/starred">
          <Suspense fallback={ContentLoader}><Starred /></Suspense>
        </Route>
        <Route path="/drive/recent">
          <Suspense fallback={ContentLoader}><Recent /></Suspense>
        </Route>
        <Route path="/drive/trash">
          <Suspense fallback={ContentLoader}><Trash /></Suspense>
        </Route>
        <Route path="/drive/shared">
          <Suspense fallback={ContentLoader}><Shared /></Suspense>
        </Route>
        <Route path="/drive/search">
          <Suspense fallback={ContentLoader}><Search /></Suspense>
        </Route>
        <Route path="/drive/activity">
          <Suspense fallback={ContentLoader}><Activity /></Suspense>
        </Route>
        <Route path="/drive/settings">
          <Suspense fallback={ContentLoader}><Settings /></Suspense>
        </Route>
        <Route>
          <Suspense fallback={ContentLoader}><Drive /></Suspense>
        </Route>
      </Switch>
    </DriveLayout>
  );
}

// Location-based router: for drive paths, always renders DriveSection at the
// same position in the tree so React never unmounts/remounts the sidebar.
function Router() {
  const [location] = useLocation();

  // Non-drive routes — use a Switch for exact matching
  if (!location.startsWith("/drive")) {
    return (
      <Suspense fallback={FullPageLoader}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/admin" component={AdminOverview} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/analytics" component={AdminAnalytics} />
          <Route path="/admin/health" component={AdminHealth} />
          <Route path="/s/:token">
            {(params: { token: string }) => <PublicShare token={params.token} />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    );
  }

  // Drive routes — DriveSection is always at this same tree position,
  // so React preserves it (and the sidebar) across all /drive/* navigations.
  return <DriveSection />;
}

function App() {
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "glass-card border-white/10 rounded-xl text-sm",
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
