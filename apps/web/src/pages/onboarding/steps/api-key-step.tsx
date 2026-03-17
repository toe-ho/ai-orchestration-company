import React, { useState } from 'react';

interface ApiKeyStepProps {
  apiKey: string;
  onChange: (key: string) => void;
  onNext: () => void;
  onBack: () => void;
}

/** Validates Anthropic API key format (sk-ant-*) */
function isValidAnthropicKey(key: string): boolean {
  return key.trim().startsWith('sk-ant-') && key.trim().length > 20;
}

export function ApiKeyStep({ apiKey, onChange, onNext, onBack }: ApiKeyStepProps): React.ReactElement {
  const [touched, setTouched] = useState(false);
  const valid = isValidAnthropicKey(apiKey);
  const showError = touched && apiKey.length > 0 && !valid;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Set up your API key</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your agents use Anthropic Claude. Enter your API key to power them.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="api-key">
          Anthropic API key <span className="text-destructive">*</span>
        </label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          className={[
            'w-full rounded-md border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
            showError ? 'border-destructive' : 'border-input',
          ].join(' ')}
          placeholder="sk-ant-api03-…"
        />
        {showError && (
          <p className="mt-1 text-xs text-destructive">
            Key must start with <code>sk-ant-</code>. Get yours at console.anthropic.com.
          </p>
        )}
        {valid && (
          <p className="mt-1 text-xs text-green-600">Key format looks good.</p>
        )}
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        Your key is encrypted and stored securely. It is never logged or exposed.
      </div>

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
          disabled={!valid}
          onClick={onNext}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Next: Review
        </button>
      </div>
    </div>
  );
}
