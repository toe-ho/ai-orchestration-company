import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

export function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
        <Route path="*" element={<NotFoundPlaceholder />} />
      </Routes>
    </BrowserRouter>
  );
}

function DashboardPlaceholder(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">AI Company Platform</h1>
        <p className="text-muted-foreground mt-2">Dashboard coming in Phase 6</p>
      </div>
    </div>
  );
}

function NotFoundPlaceholder(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">404 — Not Found</h1>
      </div>
    </div>
  );
}
