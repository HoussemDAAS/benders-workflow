import React from 'react';
import { 
  Plus,
  Workflow as WorkflowIcon,
  BarChart3,
  Zap
} from 'lucide-react';

interface WorkflowHeaderProps {
  totalWorkflows: number;
  activeWorkflows: number;
  onCreateWorkflow: () => void;
}

export const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({
  totalWorkflows,
  activeWorkflows,
  onCreateWorkflow
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary text-white pt-16 lg:pt-0">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/10 pointer-events-none"></div>
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-tertiary/10 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="relative z-10 px-6 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-tertiary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                <WorkflowIcon className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-white">
                Workflow Management
              </h1>
            </div>
            <p className="text-lg text-white/90 font-medium">
              Create and manage project workflows for your clients
            </p>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-white/70" />
                <span className="text-sm text-white/80">{totalWorkflows} Total Workflows</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-white/70" />
                <span className="text-sm text-white/80">{activeWorkflows} Active</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onCreateWorkflow}
              className="flex items-center gap-2 px-6 py-3 bg-tertiary hover:bg-tertiary/90 text-primary rounded-2xl font-semibold transition-all duration-200 shadow-xl hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Create Workflow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};