import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Bot, CircleDot, Settings } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { useCompany } from '../../hooks/use-company.js';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/agents', label: 'Agents', Icon: Bot },
  { to: '/issues', label: 'Issues', Icon: CircleDot },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export function Sidebar(): React.ReactElement {
  const { companyId } = useCompany();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card">
      {/* Brand / company name */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          AI
        </span>
        <span className="truncate text-sm font-semibold text-foreground">
          {companyId ? 'My Company' : 'AI Platform'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:block">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
