import * as React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';
import { Layout } from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Cameras from './pages/Cameras';
import Alerts from './pages/Alerts';
import Recordings from './pages/Recordings';
import Settings from './pages/Settings';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/cameras" component={Cameras} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/recordings" component={Recordings} />
          <Route path="/settings" component={Settings} />
          <Route path="/:rest*">
            {(params) => (
              <div className="flex h-[calc(100vh-64px)] items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold">404</h1>
                  <p className="mb-4">Page not found</p>
                  <a href="/" className="text-blue-600 hover:underline">
                    Return to Dashboard
                  </a>
                </div>
              </div>
            )}
          </Route>
        </Switch>
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}