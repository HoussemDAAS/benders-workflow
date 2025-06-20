import type { Node, BuiltInNode } from '@xyflow/react';

export type FlowchartNodeData = {
  label: string;
  description?: string;
};

export type StartEndNode = Node<FlowchartNodeData, 'start-end'>;
export type ProcessNode = Node<FlowchartNodeData, 'process'>;
export type DecisionNode = Node<FlowchartNodeData, 'decision'>;
export type InputOutputNode = Node<FlowchartNodeData, 'input-output'>;
export type PositionLoggerNode = Node<FlowchartNodeData, 'position-logger'>;

export type FlowchartNode = 
  | StartEndNode 
  | ProcessNode 
  | DecisionNode 
  | InputOutputNode 
  | PositionLoggerNode;

export type AppNode = BuiltInNode | FlowchartNode;
