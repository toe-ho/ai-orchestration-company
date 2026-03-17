import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { templatesApi, type CompanyTemplate } from '../../lib/api/templates-api.js';
import { TemplateGrid } from '../../components/templates/template-grid.js';

export function PublicTemplatesPage(): React.ReactElement {
  const [templates, setTemplates] = useState<CompanyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    templatesApi.listPublic()
      .then(setTemplates)
      .catch(() => setError('Failed to load templates.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">AI Company Templates</h1>
          <Link
            to="/sign-up"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h2 className="mb-2 text-2xl font-bold text-foreground">Start with a template</h2>
          <p className="text-muted-foreground">
            Choose a pre-built team of AI agents to get started quickly. Each template includes
            agents with defined roles, responsibilities, and reporting structures.
          </p>
        </div>

        {loading && (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading templates…</div>
        )}
        {error && (
          <div className="py-12 text-center text-sm text-destructive">{error}</div>
        )}
        {!loading && !error && (
          <TemplateGrid templates={templates} />
        )}

        <div className="mt-12 rounded-lg border border-border bg-card p-6 text-center">
          <h3 className="mb-2 font-semibold text-foreground">Ready to build your AI company?</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Sign up and launch your team in minutes.
          </p>
          <Link
            to="/sign-up"
            className="inline-flex rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create your company
          </Link>
        </div>
      </main>
    </div>
  );
}
