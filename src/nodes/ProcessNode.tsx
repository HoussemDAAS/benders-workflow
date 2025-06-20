import { Handle, Position, type NodeProps } from '@xyflow/react';
import { type ProcessNode } from './types';

export function ProcessNode({ data, selected }: NodeProps<ProcessNode>) {
  return (
    <div className={`process-node ${selected ? 'selected' : ''}`}>
      <div className="node-content">
        {data.label}
        {data.description && <div className="node-description">{data.description}</div>}
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
} 