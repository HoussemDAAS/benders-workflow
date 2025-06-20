import { Handle, Position, type NodeProps } from '@xyflow/react';
import { type InputOutputNode } from './types';

export function InputOutputNode({ data, selected }: NodeProps<InputOutputNode>) {
  return (
    <div className={`input-output-node ${selected ? 'selected' : ''}`}>
      <div className="parallelogram-shape">
        <div className="node-content">
          {data.label}
          {data.description && <div className="node-description">{data.description}</div>}
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
} 