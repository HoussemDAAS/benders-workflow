import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, Users, Building2, Calendar, CheckSquare, X } from 'lucide-react';
import { useRecentItems, RecentItem } from '../hooks/useRecentItems';

interface RecentItemsProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export const RecentItems: React.FC<RecentItemsProps> = ({ 
  limit = 5, 
  showHeader = true, 
  className = '' 
}) => {
  const { recentItems, removeRecentItem, clearRecentItems } = useRecentItems();

  const displayItems = limit ? recentItems.slice(0, limit) : recentItems;

  const getItemIcon = (type: RecentItem['type']) => {
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

  const getItemTypeColor = (type: RecentItem['type']) => {
    switch (type) {
      case 'workflow':
        return 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30';
      case 'client':
        return 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30';
      case 'task':
        return 'text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30';
      case 'meeting':
        return 'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30';
      case 'team-member':
        return 'text-pink-600 bg-pink-100 dark:text-pink-300 dark:bg-pink-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (displayItems.length === 0) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Items</h3>
          </div>
        )}
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent items</p>
          <p className="text-xs">Items you view will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Items</h3>
          </div>
          {recentItems.length > 0 && (
            <button
              onClick={clearRecentItems}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Clear all recent items"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      <div className="space-y-1">
        {displayItems.map((item) => (
          <div
            key={`${item.type}-${item.id}-${item.timestamp}`}
            className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className={`p-1.5 rounded-md ${getItemTypeColor(item.type)}`}>
              {getItemIcon(item.type)}
            </div>
            
            <Link
              to={item.path}
              className="flex-1 min-w-0 text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                  {formatTimeAgo(item.timestamp)}
                </span>
              </div>
            </Link>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeRecentItem(item.id, item.type);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
              title="Remove from recent items"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {recentItems.length > limit && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
            View all {recentItems.length} items
          </button>
        </div>
      )}
    </div>
  );
};

// Compact version for use in dropdowns or small spaces
export const RecentItemsCompact: React.FC<{
  limit?: number;
  onItemClick?: () => void;
}> = ({ limit = 3, onItemClick }) => {
  const { recentItems } = useRecentItems();
  const displayItems = recentItems.slice(0, limit);

  if (displayItems.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No recent items</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {displayItems.map((item) => (
        <Link
          key={`${item.type}-${item.id}-${item.timestamp}`}
          to={item.path}
          onClick={onItemClick}
          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className={`p-1 rounded ${getItemTypeColor(item.type)}`}>
            {getItemIcon(item.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {item.title}
            </p>
            {item.subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {item.subtitle}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
};

const getItemTypeColor = (type: RecentItem['type']) => {
  switch (type) {
    case 'workflow':
      return 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30';
    case 'client':
      return 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30';
    case 'task':
      return 'text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30';
    case 'meeting':
      return 'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30';
    case 'team-member':
      return 'text-pink-600 bg-pink-100 dark:text-pink-300 dark:bg-pink-900/30';
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700';
  }
};

const getItemIcon = (type: RecentItem['type']) => {
  switch (type) {
    case 'workflow':
      return <FileText className="w-3 h-3" />;
    case 'client':
      return <Building2 className="w-3 h-3" />;
    case 'task':
      return <CheckSquare className="w-3 h-3" />;
    case 'meeting':
      return <Calendar className="w-3 h-3" />;
    case 'team-member':
      return <Users className="w-3 h-3" />;
    default:
      return <FileText className="w-3 h-3" />;
  }
}; 