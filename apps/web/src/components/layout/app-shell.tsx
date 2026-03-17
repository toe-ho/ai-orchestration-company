import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar.js';
import { TopBar } from './top-bar.js';
import { useLiveEvents } from '../../hooks/use-live-events.js';

export function AppShell(): React.ReactElement {
  // Activate real-time WebSocket event subscription for the authenticated company
  useLiveEvents();

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
