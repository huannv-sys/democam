import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Playback from "@/pages/playback";
import Alerts from "@/pages/alerts";
import Recordings from "@/pages/recordings";
import Settings from "@/pages/settings";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-secondary-100 text-secondary-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {children}
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <AppLayout>
          <Home />
        </AppLayout>
      )} />
      <Route path="/playback" component={() => (
        <AppLayout>
          <Playback />
        </AppLayout>
      )} />
      <Route path="/alerts" component={() => (
        <AppLayout>
          <Alerts />
        </AppLayout>
      )} />
      <Route path="/recordings" component={() => (
        <AppLayout>
          <Recordings />
        </AppLayout>
      )} />
      <Route path="/settings" component={() => (
        <AppLayout>
          <Settings />
        </AppLayout>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
