import React from 'react';
import { FlowchartNodeData } from '../nodes/types';

interface ToolbarProps {
  onAddNode: (type: string, data: FlowchartNodeData) => void;
  onClearCanvas: () => void;
  onExportFlow: () => void;
  onImportFlow: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Toolbar({ onAddNode, onClearCanvas, onExportFlow, onImportFlow }: ToolbarProps) {
  const nodeTypes = [
    { type: 'start-end', label: 'Start/End', icon: '⭕', color: '#22c55e' },
    { type: 'process', label: 'Process', icon: '▭', color: '#3b82f6' },
    { type: 'decision', label: 'Decision', icon: '◊', color: '#f59e0b' },
    { type: 'input-output', label: 'Input/Output', icon: '▱', color: '#8b5cf6' },
    { type: 'position-logger', label: 'Debug Node', icon: '📍', color: '#ec4899' },
  ];

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>Add Nodes</h3>
        <div className="node-buttons">
          {nodeTypes.map((nodeType) => (
            <button
              key={nodeType.type}
              className="node-button"
              style={{ borderLeftColor: nodeType.color }}
              onClick={() => onAddNode(nodeType.type, { label: `New ${nodeType.label}` })}
              title={`Add ${nodeType.label} node`}
            >
              <span className="node-icon">{nodeType.icon}</span>
              {nodeType.label}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <h3>Actions</h3>
        <div className="action-buttons">
          <button className="action-button clear" onClick={onClearCanvas}>
            🗑️ Clear Canvas
          </button>
          <button className="action-button export" onClick={onExportFlow}>
            💾 Export Flow
          </button>
          <label className="action-button import">
            📁 Import Flow
            <input
              type="file"
              accept=".json"
              onChange={onImportFlow}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="toolbar-section">
        <h3>Instructions</h3>
        <div className="instructions">
          <p>• Drag nodes to reposition them</p>
          <p>• Connect nodes by dragging from handles</p>
          <p>• Select and press Delete to remove nodes</p>
          <p>• Double-click nodes to edit labels</p>
        </div>
      </div>
    </div>
  );
} 