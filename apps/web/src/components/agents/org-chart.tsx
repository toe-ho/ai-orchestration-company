import React from 'react';
import { AgentStatusBadge } from './agent-status-badge.js';
import type { OrgTreeNode } from '../../lib/api/agents-api.js';

interface OrgChartNodeProps {
  node: OrgTreeNode;
  depth?: number;
}

function OrgChartNode({ node, depth = 0 }: OrgChartNodeProps): React.ReactElement {
  return (
    <div className={depth > 0 ? 'ml-6 border-l border-border pl-4' : ''}>
      <div className="mb-2 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{node.agent.name}</p>
          <p className="text-xs capitalize text-muted-foreground">{node.agent.role}</p>
        </div>
        <AgentStatusBadge status={node.agent.status} />
      </div>
      {node.children.length > 0 && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <OrgChartNode key={child.agent.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface OrgChartProps {
  root: OrgTreeNode;
}

export function OrgChart({ root }: OrgChartProps): React.ReactElement {
  return (
    <div className="overflow-auto">
      <OrgChartNode node={root} />
    </div>
  );
}
