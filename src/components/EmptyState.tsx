import React from 'react';
import { Plus, Workflow as WorkflowIcon } from 'lucide-react';

interface EmptyStateProps {
  hasFilters: boolean;
  onCreateWorkflow: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  hasFilters,
  onCreateWorkflow
}) => {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <WorkflowIcon className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">No workflows found</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {hasFilters
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Get started by creating your first workflow to organize your project processes.'
        }
      </p>
      {!hasFilters && (
        <button 
          onClick={onCreateWorkflow}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Create First Workflow
        </button>
      )}
    </div>
  );
};