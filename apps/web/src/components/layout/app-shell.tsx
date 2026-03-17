import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar.js';
import { TopBar } from './top-bar.js';

export function AppShell(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />
      <main className="pl-64 pt-14">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
