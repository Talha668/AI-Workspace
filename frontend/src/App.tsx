import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import WorkspaceDetail from './pages/WorkSpaceDetail';
import Workspaces from './pages/WorkSpaces';
import Conversations from './pages/Conversations';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="workspaces" element={<Workspaces />} />
            <Route path="workspaces/:id" element={<WorkspaceDetail />} />
            <Route path="conversations" element={<Conversations />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;