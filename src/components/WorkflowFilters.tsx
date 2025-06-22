import React from 'react';
import { Search } from 'lucide-react';
import { Client } from '../types';

interface WorkflowFiltersProps {
  searchTerm: string;
  statusFilter: string;
  clientFilter: string;
  statusCounts: Record<string, number>;
  totalWorkflows: number;
  clients: Client[];
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (status: string) => void;
  onClientFilterChange: (clientId: string) => void;
}

export const WorkflowFilters: React.FC<WorkflowFiltersProps> = ({
  searchTerm,
  statusFilter,
  clientFilter,
  statusCounts,
  totalWorkflows,
  clients,
  onSearchChange,
  onStatusFilterChange,
  onClientFilterChange
}) => {
  const filterTabs = [
    { id: 'all', label: 'All', count: totalWorkflows, color: 'bg-primary' },
    { id: 'active', label: 'Active', count: statusCounts.active || 0, color: 'bg-green-500' },
    { id: 'draft', label: 'Draft', count: statusCounts.draft || 0, color: 'bg-gray-500' },
    { id: 'on-hold', label: 'On Hold', count: statusCounts['on-hold'] || 0, color: 'bg-yellow-500' },
    { id: 'completed', label: 'Completed', count: statusCounts.completed || 0, color: 'bg-blue-500' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 -mt-6 mb-6 relative z-10">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm bg-white transition-all duration-200 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
          />
        </div>

        {/* Client Filter */}
        <select 
          value={clientFilter}
          onChange={(e) => onClientFilterChange(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white transition-all duration-200 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 min-w-[200px]"
        >
          <option value="all">All Clients</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.company}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mt-6">
        {filterTabs.map((tab) => (
          <button 
            key={tab.id}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              statusFilter === tab.id 
                ? `${tab.color} text-white shadow-lg transform scale-105` 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
            }`}
            onClick={() => onStatusFilterChange(tab.id)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
    </div>
  );
};