import type { Edge, EdgeTypes } from '@xyflow/react';

export const initialEdges: Edge[] = [
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

export const edgeTypes = {
  // Add your custom edge types here!
} satisfies EdgeTypes;
