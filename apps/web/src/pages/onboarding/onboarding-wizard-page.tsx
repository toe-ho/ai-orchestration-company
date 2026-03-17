import React, { useState } from 'react';
import type { CompanyTemplate } from '../../lib/api/templates-api.js';
import { GoalStep, type GoalStepData } from './steps/goal-step.js';
import { TemplateStep } from './steps/template-step.js';
import { ApiKeyStep } from './steps/api-key-step.js';
import { LaunchStep } from './steps/launch-step.js';

const STEPS = ['Goal', 'Template', 'API Key', 'Launch'] as const;

export function OnboardingWizardPage(): React.ReactElement {
  const [step, setStep] = useState(0);
  const [goalData, setGoalData] = useState<GoalStepData>({ companyName: '', description: '', goal: '' });
  const [template, setTemplate] = useState<CompanyTemplate | null>(null);
  const [apiKey, setApiKey] = useState('');

  function next(): void { setStep((s) => Math.min(s + 1, STEPS.length - 1)); }
  function back(): void { setStep((s) => Math.max(s - 1, 0)); }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Set up your company</span>
          <span className="text-sm text-muted-foreground">{step + 1} / {STEPS.length}</span>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-lg px-6 py-3">
          <div className="flex gap-1">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={[
                    'h-1.5 w-full rounded-full transition-colors',
                    i <= step ? 'bg-primary' : 'bg-muted',
                  ].join(' ')}
                />
                <span className={`text-xs ${i === step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        {step === 0 && (
          <GoalStep data={goalData} onChange={setGoalData} onNext={next} />
        )}
        {step === 1 && (
          <TemplateStep
            selectedId={template?.id ?? ''}
            onSelect={setTemplate}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 2 && (
          <ApiKeyStep apiKey={apiKey} onChange={setApiKey} onNext={next} onBack={back} />
        )}
        {step === 3 && (
          <LaunchStep
            goalData={goalData}
            template={template}
            apiKey={apiKey}
            onClearApiKey={() => setApiKey('')}
            onBack={back}
          />
        )}
      </main>
    </div>
  );
}
