import type { NodeTypes } from '@xyflow/react';

import { PositionLoggerNode } from './PositionLoggerNode';
import { StartEndNode } from './StartEndNode';
import { ProcessNode } from './ProcessNode';
import { DecisionNode } from './DecisionNode';
import { InputOutputNode } from './InputOutputNode';
import { TaskNode } from './TaskNode';
import { AppNode } from './types';

export const initialNodes: AppNode[] = [
  { 
    id: 'start', 
    type: 'start-end', 
    position: { x: 250, y: 50 }, 
    data: { label: 'Start' } 
  },
  {
    id: 'process1',
    type: 'process',
    position: { x: 200, y: 150 },
    data: { label: 'Initialize Variables' },
  },
  {
    id: 'decision1',
    type: 'decision',
    position: { x: 200, y: 250 },
    data: { label: 'Is condition met?' },
  },
  {
    id: 'input1',
    type: 'input-output',
    position: { x: 400, y: 250 },
    data: { label: 'Get User Input' },
  },
  { 
    id: 'end', 
    type: 'start-end', 
    position: { x: 250, y: 400 }, 
    data: { label: 'End' } 
  },
];

export const initialEdges = [
  { id: 'start->process1', source: 'start', target: 'process1' },
  { id: 'process1->decision1', source: 'process1', target: 'decision1' },
  { 
    id: 'decision1->input1', 
    source: 'decision1', 
    target: 'input1',
    sourceHandle: 'yes',
    label: 'Yes'
  },
  { 
    id: 'decision1->end', 
    source: 'decision1', 
    target: 'end',
    sourceHandle: 'no',
    label: 'No'
  },
  { id: 'input1->end', source: 'input1', target: 'end' },
];

export const nodeTypes: NodeTypes = {
  'position-logger': PositionLoggerNode,
  'start-end': StartEndNode,
  'process': ProcessNode,
  'decision': DecisionNode,
  'input-output': InputOutputNode,
  'task': TaskNode,
};
