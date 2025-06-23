import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useRecentItems } from '../hooks/useRecentItems';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useTheme } from '../hooks/useTheme';
import { GlobalSearch } from './GlobalSearch';

export const DebugNavFeatures: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { workflows, clients, kanbanTasks, teamMembers } = useAppContext();
  const { recentItems, addRecentItem, clearRecentItems } = useRecentItems();
  const { theme, changeTheme } = useTheme();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const testAddRecentItem = () => {
    addRecentItem({
      id: 'test-' + Date.now(),
      type: 'workflow',
      title: 'Test Workflow',
      subtitle: 'This is a test workflow',
      path: '/app/workflows/test'
    });
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="text-sm font-bold mb-3 text-gray-900 dark:text-white">Navigation Debug</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Data Available:</strong>
          <ul className="ml-2">
            <li>Workflows: {workflows?.length || 0}</li>
            <li>Clients: {clients?.length || 0}</li>
            <li>Tasks: {kanbanTasks?.length || 0}</li>
            <li>Team: {teamMembers?.length || 0}</li>
          </ul>
        </div>

        <div>
          <strong>Recent Items: {recentItems.length}</strong>
          {recentItems.slice(0, 3).map((item, i) => (
            <div key={i} className="text-xs text-gray-600 dark:text-gray-400 ml-2">
              {item.title}
            </div>
          ))}
        </div>

        <div>
          <strong>Theme:</strong> {theme}
        </div>

        <div className="space-y-1 pt-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full px-2 py-1 bg-blue-500 text-white rounded text-xs"
          >
            Test Search
          </button>
          
          <button
            onClick={testAddRecentItem}
            className="w-full px-2 py-1 bg-green-500 text-white rounded text-xs"
          >
            Add Test Recent Item
          </button>
          
          <button
            onClick={clearRecentItems}
            className="w-full px-2 py-1 bg-red-500 text-white rounded text-xs"
          >
            Clear Recent Items
          </button>
          
          <button
            onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-full px-2 py-1 bg-purple-500 text-white rounded text-xs"
          >
            Toggle Theme
          </button>
        </div>

        <div className="text-xs text-gray-500 pt-2">
          <div>Try shortcuts:</div>
          <div>Cmd/Ctrl + D = Dashboard</div>
          <div>Cmd/Ctrl + / = Search</div>
          <div>? = Show shortcuts</div>
        </div>
      </div>

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};