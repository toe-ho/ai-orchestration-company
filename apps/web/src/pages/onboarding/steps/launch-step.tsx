import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../../lib/api-client.js';
import { templatesApi } from '../../../lib/api/templates-api.js';
import { useCompanyContext } from '../../../providers/company-provider.js';
import type { GoalStepData } from './goal-step.js';
import type { CompanyTemplate } from '../../../lib/api/templates-api.js';

interface LaunchStepProps {
  goalData: GoalStepData;
  template: CompanyTemplate | null;
  apiKey: string;
  onClearApiKey: () => void;
  onBack: () => void;
}

export function LaunchStep({ goalData, template, apiKey, onClearApiKey, onBack }: LaunchStepProps): React.ReactElement {
  const navigate = useNavigate();
  const { setCompanyId } = useCompanyContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLaunch(): Promise<void> {
    if (!template) return;
    setError('');
    setLoading(true);
    try {
      // 1. Create company from template
      const result = await templatesApi.createCompany({
        templateSlug: template.id,
        companyName: goalData.companyName,
        description: goalData.description || undefined,
        goal: goalData.goal || undefined,
      }) as { company: { id: string } };

      const companyId = result.company.id;

      // 2. Store API key in vault
      await api.post(`/companies/${companyId}/api-keys`, {
        provider: 'anthropic',
        key: apiKey,
        label: 'Anthropic (onboarding)',
      });

      // 3. Clear key from memory, set company context, navigate
      onClearApiKey();
      setCompanyId(companyId);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create company. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const agentCount = Array.isArray(template?.agentConfigs) ? template!.agentConfigs.length : 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Review & launch</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm your setup and launch your AI company.
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between">
          <span className="text-sm text-muted-foreground">Company</span>
          <span className="text-sm font-medium text-foreground">{goalData.companyName}</span>
        </div>
        {goalData.description && (
          <div className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-sm text-muted-foreground">Description</span>
            <span className="text-right text-sm text-foreground">{goalData.description}</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
          <span className="shrink-0 text-sm text-muted-foreground">Goal</span>
          <span className="text-right text-sm text-foreground">{goalData.goal}</span>
        </div>
        <div className="flex items-start justify-between">
          <span className="text-sm text-muted-foreground">Template</span>
          <span className="text-sm font-medium text-foreground">{template?.name ?? '—'}</span>
        </div>
        <div className="flex items-start justify-between">
          <span className="text-sm text-muted-foreground">Agents</span>
          <span className="text-sm text-foreground">{agentCount} agents</span>
        </div>
        <div className="flex items-start justify-between">
          <span className="text-sm text-muted-foreground">API key</span>
          <span className="text-sm text-foreground">
            {apiKey ? `${apiKey.slice(0, 12)}…` : '—'}
          </span>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          disabled={loading || !template}
          onClick={handleLaunch}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create company'}
        </button>
      </div>
    </div>
  );
}
