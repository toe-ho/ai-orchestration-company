import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '../../hooks/use-company.js';
import { companiesApi } from '../../lib/api/companies-api.js';
import { queryKeys } from '../../lib/query-keys.js';
import { EmptyState } from '../../components/shared/empty-state.js';
import { ApiError } from '../../lib/api-client.js';

export function CompanySettingsPage(): React.ReactElement {
  const { companyId } = useCompany();
  const qc = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: queryKeys.companies.detail(companyId ?? ''),
    queryFn: () => companiesApi.get(companyId!),
    enabled: !!companyId,
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (company) {
      setName(company.name);
      setDescription(company.description ?? '');
    }
  }, [company]);

  useEffect(() => {
    return () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current); };
  }, []);

  const updateMutation = useMutation({
    mutationFn: () => companiesApi.update(companyId!, { name, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.companies.detail(companyId!) });
      setSaved(true);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Update failed'),
  });

  if (!companyId) {
    return <EmptyState title="No company selected" description="Select a company to edit settings." />;
  }

  if (isLoading) return <div className="h-48 animate-pulse rounded-lg bg-muted" />;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-xl font-bold text-foreground">Company Settings</h1>
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="cname">
            Name
          </label>
          <input
            id="cname"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="cdesc">
            Description
          </label>
          <textarea
            id="cdesc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="text-sm text-green-600">Saved!</span>}
        </div>
      </div>
    </div>
  );
}
