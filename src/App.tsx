import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RightPanel } from './components/RightPanel';
import { useAppStore } from './stores/app';
import HomePage from './pages/HomePage';
import GraphPage from './pages/GraphPage';
import SettingsPage from './pages/SettingsPage';
import FilePage from './pages/FilePage';

function FilePageWithPanel() {
  const currentFileId = useAppStore((s) => s.currentFileId);
  return (
    <Layout rightPanel={<RightPanel fileId={currentFileId} />}>
      <FilePage />
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route path="/repo/:owner/:name/*" element={<FilePageWithPanel />} />
        <Route
          path="/graph"
          element={
            <Layout>
              <GraphPage />
            </Layout>
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
