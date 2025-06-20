import { Handle, Position, type NodeProps } from '@xyflow/react';
import { type StartEndNode } from './types';

export function StartEndNode({ data, selected }: NodeProps<StartEndNode>) {
  return (
    <div className={`start-end-node ${selected ? 'selected' : ''}`}>
      <div className="node-content">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  );
} 