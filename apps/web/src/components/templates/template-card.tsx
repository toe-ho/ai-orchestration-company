import React from 'react';
import type { CompanyTemplate } from '../../lib/api/templates-api.js';

interface TemplateCardProps {
  template: CompanyTemplate;
  selected?: boolean;
  onClick?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  tech: 'bg-blue-100 text-blue-700',
  marketing: 'bg-purple-100 text-purple-700',
};

export function TemplateCard({ template, selected, onClick }: TemplateCardProps): React.ReactElement {
  const agentCount = Array.isArray(template.agentConfigs) ? template.agentConfigs.length : 0;
  const categoryColor = CATEGORY_COLORS[template.category ?? ''] ?? 'bg-muted text-muted-foreground';

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full rounded-lg border p-4 text-left transition-all hover:border-primary/60 hover:shadow-sm',
        selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card',
        onClick ? 'cursor-pointer' : 'cursor-default',
      ].join(' ')}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground">{template.name}</h3>
        {template.category && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor}`}>
            {template.category}
          </span>
        )}
      </div>

      {template.description && (
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{template.description}</p>
      )}

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{agentCount}</span>
        <span>{agentCount === 1 ? 'agent' : 'agents'}</span>
      </div>
    </button>
  );
}
