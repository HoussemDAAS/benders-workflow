import { Handle, Position, type NodeProps } from '@xyflow/react';

import { type PositionLoggerNode } from './types';

export function PositionLoggerNode({
  positionAbsoluteX,
  positionAbsoluteY,
  data,
  selected,
}: NodeProps<PositionLoggerNode>) {
  const x = `${Math.round(positionAbsoluteX)}px`;
  const y = `${Math.round(positionAbsoluteY)}px`;

  return (
    <div className={`position-logger-node ${selected ? 'selected' : ''}`}>
      <div className="node-content">
        {data.label}
        <div className="position-info">
          {x} {y}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  );
}
