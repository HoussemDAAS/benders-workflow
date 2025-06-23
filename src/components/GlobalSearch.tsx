import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, FileText, Users, Building2, Calendar, CheckSquare } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';

interface SearchResult {
  id: string;
  type: 'workflow' | 'client' | 'task' | 'meeting' | 'team-member';
  title: string;
  subtitle?: string;
  path: string;
  matchedText?: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEARCH_DEBOUNCE_MS = 300;

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { workflows, clients, kanbanTasks, teamMembers } = useAppContext();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const searchResults: SearchResult[] = [];
      const lowerQuery = searchQuery.toLowerCase();
      
      // Debug logging
      console.log('🔍 Searching for:', searchQuery);
      console.log('📊 Available data:', { 
        workflows: workflows.length, 
        clients: clients.length, 
        kanbanTasks: kanbanTasks.length, 
        teamMembers: teamMembers.length 
      });

             // Search workflows
       workflows.forEach(workflow => {
         if (workflow.name.toLowerCase().includes(lowerQuery) ||
             (workflow.description && workflow.description.toLowerCase().includes(lowerQuery))) {
           searchResults.push({
             id: workflow.id,
             type: 'workflow',
             title: workflow.name,
             subtitle: workflow.description || 'No description',
             path: `/app/workflows/${workflow.id}`,
             matchedText: workflow.name.toLowerCase().includes(lowerQuery) ? 'name' : 'description'
           });
         }
       });

      // Search clients
      clients.forEach(client => {
        if (client.name.toLowerCase().includes(lowerQuery) ||
            client.company.toLowerCase().includes(lowerQuery) ||
            client.email.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: client.id,
            type: 'client',
            title: client.name,
            subtitle: client.company,
            path: `/app/clients/${client.id}`,
            matchedText: client.name.toLowerCase().includes(lowerQuery) ? 'name' : 'company'
          });
        }
      });

             // Search tasks
       kanbanTasks.forEach(task => {
         if (task.title.toLowerCase().includes(lowerQuery) ||
             (task.description && task.description.toLowerCase().includes(lowerQuery))) {
           searchResults.push({
             id: task.id,
             type: 'task',
             title: task.title,
             subtitle: task.description || 'No description',
             path: `/app/kanban?task=${task.id}`,
             matchedText: task.title.toLowerCase().includes(lowerQuery) ? 'title' : 'description'
           });
         }
       });

      // Search team members
      teamMembers.forEach(member => {
        if (member.name.toLowerCase().includes(lowerQuery) ||
            member.email.toLowerCase().includes(lowerQuery) ||
            member.role.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: member.id,
            type: 'team-member',
            title: member.name,
            subtitle: member.role,
            path: `/app/team/${member.id}`,
            matchedText: member.name.toLowerCase().includes(lowerQuery) ? 'name' : 'role'
          });
        }
      });

      // Sort by relevance (exact matches first, then partial matches)
      searchResults.sort((a, b) => {
        const aExact = a.title.toLowerCase() === lowerQuery;
        const bExact = b.title.toLowerCase() === lowerQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.title.localeCompare(b.title);
      });

      setResults(searchResults.slice(0, 10)); // Limit to top 10 results
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [workflows, clients, kanbanTasks, teamMembers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    onClose();
    setQuery('');
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'workflow':
        return <FileText className="w-4 h-4" />;
      case 'client':
        return <Building2 className="w-4 h-4" />;
      case 'task':
        return <CheckSquare className="w-4 h-4" />;
      case 'meeting':
        return <Calendar className="w-4 h-4" />;
      case 'team-member':
        return <Users className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getResultTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'workflow':
        return 'Workflow';
      case 'client':
        return 'Client';
      case 'task':
        return 'Task';
      case 'meeting':
        return 'Meeting';
      case 'team-member':
        return 'Team Member';
      default:
        return 'Item';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-32">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-96 overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            data-search-input
            type="text"
            placeholder="Search workflows, clients, tasks, team members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 text-lg"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Search Results */}
        <div ref={resultsRef} className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-primary/10 border-r-2 border-primary'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    index === selectedIndex 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {getResultIcon(result.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {result.title}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full">
                        {getResultTypeLabel(result.type)}
                      </span>
                    </div>
                    {result.subtitle && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-gray-400">
                    {index === selectedIndex && '↵'}
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-8 text-center">
              <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-300 mb-1">No results found</p>
              <p className="text-sm text-gray-500">Try different keywords or check your spelling</p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-300 mb-1">Start typing to search</p>
              <p className="text-sm text-gray-500">Search across workflows, clients, tasks, and team members</p>
            </div>
          )}
        </div>

        {/* Search Tips */}
        {!query && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>⌘K Open Search</span>
              </div>
              <span>ESC Close</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 