import React from 'react';
import { Link, useMatches } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbHandle {
  crumb?: string;
}

export function Breadcrumbs(): React.ReactElement {
  const matches = useMatches();

  const crumbs = matches
    .filter((m) => (m.handle as BreadcrumbHandle | null)?.crumb)
    .map((m) => ({ label: (m.handle as BreadcrumbHandle).crumb!, pathname: m.pathname }));

  if (crumbs.length === 0) return <></>;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      {crumbs.map((crumb, i) => (
        <React.Fragment key={crumb.pathname}>
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          {i < crumbs.length - 1 ? (
            <Link to={crumb.pathname} className="hover:text-foreground">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{crumb.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
