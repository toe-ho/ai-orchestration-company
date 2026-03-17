import React from 'react';
import { Users } from 'lucide-react';
import { EmptyState } from '../../components/shared/empty-state.js';

export function MembersPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-xl font-bold text-foreground">Members</h1>
      <EmptyState
        title="Member management coming soon"
        description="Invite and manage team members in a future release."
        action={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Future feature</span>
          </div>
        }
      />
    </div>
  );
}
