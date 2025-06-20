import { Handle, Position, type NodeProps } from '@xyflow/react';
import { type DecisionNode } from './types';

export function DecisionNode({ data, selected }: NodeProps<DecisionNode>) {
  return (
    <div className={`decision-node ${selected ? 'selected' : ''}`}>
      <div className="diamond-shape">
        <div className="node-content">
          {data.label}
          {data.description && <div className="node-description">{data.description}</div>}
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} id="no" />
      <Handle type="source" position={Position.Right} id="yes" />
    </div>
  );
} 