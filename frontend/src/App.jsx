import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './hooks/useStore';
import Layout from './components/Layout';
import EditorPage from './pages/EditorPage';
import ComparisonPage from './pages/ComparisonPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<EditorPage />} />
          <Route path="compare" element={<PrivateRoute><ComparisonPage /></PrivateRoute>} />
          <Route path="history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
          <Route path="dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
