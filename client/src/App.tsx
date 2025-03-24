import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import Dashboard from './pages/Dashboard';
import Cameras from './pages/Cameras';
import Recordings from './pages/Recordings';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import { Layout } from './components/Layout';

const App = () => {
  return (
    <>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/cameras" component={Cameras} />
          <Route path="/recordings" component={Recordings} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/settings" component={Settings} />
          <Route>
            <div className="container py-20 text-center">
              <h1 className="text-4xl font-bold mb-4">404 - Trang không tìm thấy</h1>
              <p className="text-muted-foreground">Trang bạn đang tìm kiếm không tồn tại.</p>
            </div>
          </Route>
        </Switch>
      </Layout>
      <Toaster />
    </>
  );
};

export default App;