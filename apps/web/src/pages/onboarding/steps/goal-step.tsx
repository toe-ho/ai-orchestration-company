import React from 'react';

export interface GoalStepData {
  companyName: string;
  description: string;
  goal: string;
}

interface GoalStepProps {
  data: GoalStepData;
  onChange: (data: GoalStepData) => void;
  onNext: () => void;
}

export function GoalStep({ data, onChange, onNext }: GoalStepProps): React.ReactElement {
  const valid = data.companyName.trim().length > 0 && data.goal.trim().length > 0;

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (valid) onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Define your company</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Give your AI company a name and a primary goal.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="company-name">
          Company name <span className="text-destructive">*</span>
        </label>
        <input
          id="company-name"
          type="text"
          required
          value={data.companyName}
          onChange={(e) => onChange({ ...data, companyName: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Acme AI"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          rows={2}
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="What does your company do?"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="goal">
          Primary goal <span className="text-destructive">*</span>
        </label>
        <textarea
          id="goal"
          rows={3}
          required
          value={data.goal}
          onChange={(e) => onChange({ ...data, goal: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Build and ship a product that solves X for Y users…"
        />
      </div>

      <button
        type="submit"
        disabled={!valid}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        Next: Choose template
      </button>
    </form>
  );
}
