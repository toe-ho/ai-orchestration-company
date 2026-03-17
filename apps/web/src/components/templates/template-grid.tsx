import React from 'react';
import type { CompanyTemplate } from '../../lib/api/templates-api.js';
import { TemplateCard } from './template-card.js';

interface TemplateGridProps {
  templates: CompanyTemplate[];
  selectedId?: string;
  onSelect?: (template: CompanyTemplate) => void;
}

export function TemplateGrid({ templates, selectedId, onSelect }: TemplateGridProps): React.ReactElement {
  if (templates.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No templates available.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          selected={template.id === selectedId}
          onClick={onSelect ? () => onSelect(template) : undefined}
        />
      ))}
    </div>
  );
}
