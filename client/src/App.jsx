import React from 'react'
import { Route, Switch } from 'wouter'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'

import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Cameras from './pages/Cameras'
import Recordings from './pages/Recordings'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'
import { Toaster } from './components/ui/toaster'

import './index.css'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/cameras" component={Cameras} />
          <Route path="/recordings" component={Recordings} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/settings" component={Settings} />
          <Route>
            <div className="not-found">
              <h1>404 - Không tìm thấy trang</h1>
              <p>Trang bạn đang tìm kiếm không tồn tại.</p>
            </div>
          </Route>
        </Switch>
      </Layout>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App