import type { Node, BuiltInNode } from '@xyflow/react';
import type { TaskNodeData } from './TaskNode';

export type FlowchartNodeData = {
  label: string;
  description?: string;
};

export type PositionLoggerNode = Node<{ label: string }, 'position-logger'>;
export type StartEndNode = Node<{ label: string }, 'start-end'>;
export type ProcessNode = Node<FlowchartNodeData, 'process'>;
export type DecisionNode = Node<FlowchartNodeData, 'decision'>;
export type InputOutputNode = Node<FlowchartNodeData, 'input-output'>;
export type TaskNode = Node<TaskNodeData, 'task'>;

export type FlowchartNode = 
  | PositionLoggerNode 
  | StartEndNode 
  | ProcessNode 
  | DecisionNode 
  | InputOutputNode;

export type AppNode = 
  | PositionLoggerNode 
  | StartEndNode 
  | ProcessNode 
  | DecisionNode 
  | InputOutputNode
  | BuiltInNode;
