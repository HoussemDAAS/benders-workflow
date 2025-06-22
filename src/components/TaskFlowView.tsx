import React, { useMemo, useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../flowchart-nodes.css';

import { X, Download, RotateCcw, Maximize2 } from 'lucide-react';
import { KanbanTask, TeamMember, Workflow } from '../types';
import { nodeTypes } from '../nodes';
import type { TaskNodeData } from '../nodes/TaskNode';

interface TaskFlowViewProps {
  workflow: Workflow;
  tasks: KanbanTask[];
  teamMembers: TeamMember[];
  onClose: () => void;
}

// Auto-layout algorithm to position tasks based on their status with better spreading
const calculateTaskPositions = (tasks: KanbanTask[]) => {
  const statusColumns = {
    'todo': { x: 50, y: 50 },
    'in-progress': { x: 450, y: 50 },
    'review': { x: 850, y: 50 },
    'done': { x: 1250, y: 50 }
  };

  // Group tasks by status
  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, KanbanTask[]>);

  const positions: { x: number; y: number }[] = [];
  const taskToIndex = new Map<string, number>();

  // Calculate positions for each status column
  Object.entries(tasksByStatus).forEach(([status, statusTasks]) => {
    const basePosition = statusColumns[status as keyof typeof statusColumns] || statusColumns['todo'];
    
    // Spread tasks vertically with more spacing
    statusTasks.forEach((task, index) => {
      const taskIndex = tasks.indexOf(task);
      taskToIndex.set(task.id, taskIndex);
      
      // Create a staggered layout for better visual flow
      const yOffset = index * 200; // Increased vertical spacing
      const xOffset = (index % 2) * 50; // Alternate slight horizontal offset
      
      positions[taskIndex] = {
        x: basePosition.x + xOffset,
        y: basePosition.y + yOffset
      };
    });
  });

  return positions;
};

// Create edges based on task workflow progression and logical connections
const createTaskEdges = (tasks: KanbanTask[]): Edge[] => {
  const edges: Edge[] = [];
  
  // Sort tasks by creation date to establish logical flow
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  const statusOrder = ['todo', 'in-progress', 'review', 'done'];
  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, KanbanTask[]>);

  // Strategy 1: Connect tasks within same status (workflow continuation)
  Object.entries(tasksByStatus).forEach(([status, statusTasks]) => {
    if (statusTasks.length > 1) {
      // Sort by creation date within status
      const sortedStatusTasks = statusTasks.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      for (let i = 0; i < sortedStatusTasks.length - 1; i++) {
        edges.push({
          id: `${sortedStatusTasks[i].id}-${sortedStatusTasks[i + 1].id}`,
          source: sortedStatusTasks[i].id,
          target: sortedStatusTasks[i + 1].id,
          type: 'smoothstep',
          animated: status === 'done',
          style: { 
            stroke: status === 'done' ? '#22c55e' : '#94a3b8', 
            strokeWidth: status === 'done' ? 3 : 2,
            strokeDasharray: status === 'done' ? '0' : '5,5'
          }
        });
      }
    }
  });

  // Strategy 2: Connect tasks across status progression
  statusOrder.forEach((status, index) => {
    if (index < statusOrder.length - 1) {
      const currentTasks = tasksByStatus[status] || [];
      const nextTasks = tasksByStatus[statusOrder[index + 1]] || [];
      
      if (currentTasks.length > 0 && nextTasks.length > 0) {
        // Connect tasks based on priority and creation time
        currentTasks.forEach((currentTask, i) => {
          const nextTask = nextTasks[i % nextTasks.length]; // Cycle through next status tasks
          
          edges.push({
            id: `flow-${currentTask.id}-${nextTask.id}`,
            source: currentTask.id,
            target: nextTask.id,
            type: 'smoothstep',
            animated: nextTask.status === 'done',
            style: { 
              stroke: nextTask.status === 'done' ? '#22c55e' : '#64748b', 
              strokeWidth: nextTask.status === 'done' ? 3 : 1.5,
              opacity: 0.7
            },
            label: nextTask.status === 'done' ? '✓' : undefined
          });
        });
      }
    }
  });

  // Strategy 3: Connect tasks with same assignees (collaboration flow)
  tasks.forEach(task => {
    if (task.assignedMembers.length > 0) {
      const relatedTasks = tasks.filter(otherTask => 
        otherTask.id !== task.id && 
        otherTask.assignedMembers.some(member => task.assignedMembers.includes(member))
      );
      
      relatedTasks.slice(0, 1).forEach(relatedTask => { // Limit to prevent too many edges
        edges.push({
          id: `collab-${task.id}-${relatedTask.id}`,
          source: task.id,
          target: relatedTask.id,
          type: 'straight',
          animated: false,
          style: { 
            stroke: '#8b5cf6', 
            strokeWidth: 1,
            strokeDasharray: '3,3',
            opacity: 0.4
          }
        });
      });
    }
  });

  return edges;
};

export function TaskFlowView({ workflow, tasks, teamMembers, onClose }: TaskFlowViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Convert tasks to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    const positions = calculateTaskPositions(tasks);
    
    return tasks.map((task, index) => ({
      id: task.id,
      type: 'task',
      position: positions[index],
      data: {
        task,
        teamMembers
      } satisfies TaskNodeData,
    }));
  }, [tasks, teamMembers]);

  // Create edges between tasks
  const initialEdges: Edge[] = useMemo(() => {
    return createTaskEdges(tasks);
  }, [tasks]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleExport = useCallback(() => {
    const exportData = {
      workflow: workflow.name,
      nodes: nodes.map(node => ({
        id: node.id,
        position: node.position,
        data: {
          task: (node.data as any).task
        }
      })),
      edges: edges,
      timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflow.name}-task-flow.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [workflow.name, nodes, edges]);

  const handleReset = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const statusColors = {
    'todo': '#6b7280',
    'in-progress': '#3b82f6',
    'review': '#8b5cf6',
    'done': '#22c55e'
  };

  const getNodeColor = (node: Node) => {
    const task = (node.data as any).task;
    return statusColors[task?.status as keyof typeof statusColors] || '#6b7280';
  };

  const containerClass = isFullscreen 
    ? 'task-flow-container fullscreen' 
    : 'task-flow-container';

  return (
    <div className={containerClass}>
      <div className="task-flow-header">
        <div className="task-flow-title">
          <h2>{workflow.name} - Task Flow</h2>
          <p>Visual representation of {tasks.length} tasks in workflow</p>
        </div>
        
        <div className="task-flow-actions">
          <button 
            className="action-btn secondary"
            onClick={handleReset}
            title="Reset Layout"
          >
            <RotateCcw size={16} />
          </button>
          
          <button 
            className="action-btn secondary"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            <Maximize2 size={16} />
          </button>
          
          <button 
            className="action-btn secondary"
            onClick={handleExport}
            title="Export Flow"
          >
            <Download size={16} />
          </button>
          
          <button 
            className="action-btn secondary" 
            onClick={onClose}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="task-flow-legend">
        <div className="legend-section">
          <div className="legend-title">Task Status:</div>
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: color }}
              />
              <span>{status.replace('-', ' ')}</span>
            </div>
          ))}
        </div>
        
        <div className="legend-section">
          <div className="legend-title">Connections:</div>
          <div className="legend-item">
            <div className="legend-line solid" style={{ backgroundColor: '#22c55e' }} />
            <span>Done Tasks (animated)</span>
          </div>
          <div className="legend-item">
            <div className="legend-line dashed" style={{ backgroundColor: '#94a3b8' }} />
            <span>Workflow Progress</span>
          </div>
          <div className="legend-item">
            <div className="legend-line dotted" style={{ backgroundColor: '#8b5cf6' }} />
            <span>Team Collaboration</span>
          </div>
        </div>
      </div>
      
      <div className="task-flow-viewport">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background 
            color="#f1f5f9" 
            gap={20}
            size={1}
          />
          <MiniMap 
            nodeColor={getNodeColor}
            maskColor="rgba(255, 255, 255, 0.2)"
            position="bottom-right"
            style={{
              width: 200,
              height: 150,
            }}
          />
          <Controls 
            position="bottom-right" 
            style={{ bottom: 170 }}
            showInteractive={false}
          />
        </ReactFlow>
      </div>
    </div>
  );
} 