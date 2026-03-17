import React from 'react';
import { Key } from 'lucide-react';
import { EmptyState } from '../../components/shared/empty-state.js';

export function ApiKeysPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-xl font-bold text-foreground">API Keys</h1>
      <EmptyState
        title="API keys coming soon"
        description="API key management will be available in a future release."
        action={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Key className="h-4 w-4" />
            <span>Phase 8 feature</span>
          </div>
        }
      />
    </div>
  );
}
