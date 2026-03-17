import React, { useEffect, useState } from 'react';
import type { CompanyTemplate } from '../../../lib/api/templates-api.js';
import { templatesApi } from '../../../lib/api/templates-api.js';
import { TemplateGrid } from '../../../components/templates/template-grid.js';

interface TemplateStepProps {
  selectedId: string;
  onSelect: (template: CompanyTemplate) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TemplateStep({ selectedId, onSelect, onNext, onBack }: TemplateStepProps): React.ReactElement {
  const [templates, setTemplates] = useState<CompanyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CompanyTemplate | null>(null);

  useEffect(() => {
    templatesApi.listPublic()
      .then((list) => {
        setTemplates(list);
        const pre = list.find((t) => t.id === selectedId);
        if (pre) setSelected(pre);
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  function handleSelect(template: CompanyTemplate): void {
    setSelected(template);
    onSelect(template);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Choose a template</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a pre-built team. You can adjust agent roles later.
        </p>
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Loading templates…</p>
      ) : (
        <TemplateGrid
          templates={templates}
          selectedId={selected?.id}
          onSelect={handleSelect}
        />
      )}

      {selected && (
        <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">{selected.name}</span>
          <span className="ml-2 text-muted-foreground">
            — {Array.isArray(selected.agentConfigs) ? selected.agentConfigs.length : 0} agents
          </span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!selected}
          onClick={onNext}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Next: API key
        </button>
      </div>
    </div>
  );
}
