import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './providers/theme-provider.js';
import { AuthProvider } from './providers/auth-provider.js';
import { CompanyProvider } from './providers/company-provider.js';
import { ProtectedRoute } from './components/shared/protected-route.js';
import { AppShell } from './components/layout/app-shell.js';
import { SignInPage } from './pages/auth/sign-in-page.js';
import { SignUpPage } from './pages/auth/sign-up-page.js';
import { DashboardPage } from './pages/dashboard/dashboard-page.js';
import { AgentsListPage } from './pages/agents/agents-list-page.js';
import { AgentDetailPage } from './pages/agents/agent-detail-page.js';
import { IssuesListPage } from './pages/issues/issues-list-page.js';
import { IssueDetailPage } from './pages/issues/issue-detail-page.js';
import { RunDetailPage } from './pages/runs/run-detail-page.js';
import { CompanySettingsPage } from './pages/settings/company-settings-page.js';
import { ApiKeysPage } from './pages/settings/api-keys-page.js';
import { MembersPage } from './pages/settings/members-page.js';
import { CostDashboardPage } from './pages/costs/cost-dashboard-page.js';
import { ApprovalsPage } from './pages/approvals/approvals-page.js';

class RouteErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): { hasError: boolean } { return { hasError: true }; }
  componentDidCatch(err: Error, info: ErrorInfo): void { console.error('[RouteErrorBoundary]', err, info); }
  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold text-destructive">Something went wrong</h1>
            <button className="mt-4 text-sm text-primary underline" onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App(): React.ReactElement {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CompanyProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<RouteErrorBoundary><AppShell /></RouteErrorBoundary>}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/agents" element={<AgentsListPage />} />
                  <Route path="/agents/:id" element={<AgentDetailPage />} />
                  <Route path="/issues" element={<IssuesListPage />} />
                  <Route path="/issues/:id" element={<IssueDetailPage />} />
                  <Route path="/runs/:rid" element={<RunDetailPage />} />
                  <Route path="/costs" element={<CostDashboardPage />} />
                  <Route path="/approvals" element={<ApprovalsPage />} />
                  <Route path="/settings" element={<CompanySettingsPage />} />
                  <Route path="/settings/api-keys" element={<ApiKeysPage />} />
                  <Route path="/settings/members" element={<MembersPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </CompanyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
