/* eslint-disable @typescript-eslint/no-explicit-any */
import  { useMemo, useCallback, useState } from 'react';
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

import { X, Download, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
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

  const statusLabels = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'review': 'Review',
    'done': 'Done'
  };

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-white shadow-2xl w-full h-full flex flex-col overflow-hidden ${isFullscreen ? 'rounded-none' : 'rounded-2xl max-w-7xl max-h-[95vh] mx-auto'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary to-accent text-white">
          <div>
            <h2 className="text-xl font-semibold">{workflow.name} - Task Flow</h2>
            <p className="text-white/80 text-sm">Visual representation of {tasks.length} tasks in workflow</p>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleReset}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
              title="Reset Layout"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            
            <button 
              onClick={handleExport}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
              title="Export Flow"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button 
              onClick={onClose}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 p-4 bg-gray-50 border-b border-gray-200 text-sm">
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-700">Task Status:</span>
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-600">{statusLabels[status as keyof typeof statusLabels]}</span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-700">Connections:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500" />
              <span className="text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gray-400" style={{ backgroundImage: 'repeating-linear-gradient(to right, #94a3b8, #94a3b8 3px, transparent 3px, transparent 6px)' }} />
              <span className="text-gray-600">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-purple-500" style={{ backgroundImage: 'repeating-linear-gradient(to right, #8b5cf6, #8b5cf6 2px, transparent 2px, transparent 4px)' }} />
              <span className="text-gray-600">Collaboration</span>
            </div>
          </div>
        </div>
        
        {/* Flow Viewport */}
        <div className="flex-1 relative">
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
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
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
    </div>
  );
}