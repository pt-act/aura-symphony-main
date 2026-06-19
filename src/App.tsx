import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Workspace from './Workspace';
import LandingPage from './components/landing/LandingPage';
import DocsPage from './components/docs/DocsPage';
import { ThemeProvider } from './components/shared/ThemeProvider';
import { ToastProvider } from './components/shared/ToastProvider';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/app" element={<Workspace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}