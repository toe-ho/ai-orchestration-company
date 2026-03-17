import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { Moon, Sun, ChevronDown, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/use-auth.js';
import { useTheme } from '../../hooks/use-theme.js';
import { useCompany } from '../../hooks/use-company.js';
import { companiesApi } from '../../lib/api/companies-api.js';
import { queryKeys } from '../../lib/query-keys.js';

export function TopBar(): React.ReactElement {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { companyId, setCompanyId } = useCompany();
  const navigate = useNavigate();
  const [companiesOpen, setCompaniesOpen] = useState(false);

  const { data: companies = [] } = useQuery({
    queryKey: queryKeys.companies.all(),
    queryFn: () => companiesApi.list(),
  });

  async function handleSignOut(): Promise<void> {
    await signOut();
    navigate('/sign-in');
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="fixed left-64 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4">
      {/* Company switcher */}
      <DropdownMenu.Root open={companiesOpen} onOpenChange={setCompaniesOpen}>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            <Building2 className="h-4 w-4" />
            <span className="max-w-32 truncate">
              {companies.find((c) => c.id === companyId)?.name ?? 'Select company'}
            </span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="z-50 min-w-48 rounded-md border border-border bg-card p-1 shadow-md">
            {companies.map((company) => (
              <DropdownMenu.Item
                key={company.id}
                onSelect={() => setCompanyId(company.id)}
                className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-foreground hover:bg-muted outline-none"
              >
                {company.id === companyId && <span className="text-primary">✓</span>}
                {company.name}
              </DropdownMenu.Item>
            ))}
            {companies.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No companies yet</div>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
              <Avatar.Root className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                <Avatar.Fallback>{initials}</Avatar.Fallback>
              </Avatar.Root>
              <span className="hidden text-sm text-foreground md:block">{user?.name}</span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="z-50 min-w-40 rounded-md border border-border bg-card p-1 shadow-md">
              <div className="px-3 py-2 text-xs text-muted-foreground">{user?.email}</div>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                onSelect={handleSignOut}
                className="cursor-pointer rounded px-3 py-2 text-sm text-foreground hover:bg-muted outline-none"
              >
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
