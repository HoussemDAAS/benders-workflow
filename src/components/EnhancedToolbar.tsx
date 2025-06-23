import React, { useState } from 'react';
import { Search, Sun, Moon, Monitor, Clock, Menu, X, Bell, User, Settings, LogOut } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAuth } from '../hooks/useAuth';
import { Breadcrumb } from './Breadcrumb';
import { GlobalSearch } from './GlobalSearch';
import { RecentItemsCompact } from './RecentItems';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

interface EnhancedToolbarProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export const EnhancedToolbar: React.FC<EnhancedToolbarProps> = ({
  onMobileMenuToggle,
  isMobileMenuOpen = false
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  
  const { theme, changeTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: '/',
        metaKey: true,
        ctrlKey: true,
        action: () => setIsSearchOpen(true),
        description: 'Open Search'
      }
    ]
  });

  const handleThemeChange = () => {
    if (theme === 'light') {
      changeTheme('dark');
    } else if (theme === 'dark') {
      changeTheme('system');
    } else {
      changeTheme('light');
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'system':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Sun className="w-4 h-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'dark':
        return 'Dark Mode';
      case 'system':
        return 'System Theme';
      default:
        return 'Light Mode';
    }
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4 gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Mobile Menu Toggle */}
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {/* Breadcrumb Navigation */}
            <div className="hidden sm:block flex-1 min-w-0">
              <Breadcrumb />
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-600 dark:text-gray-400 min-w-0"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm hidden sm:block">Search...</span>
              <kbd className="hidden md:block px-1 py-0.5 bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Recent Items */}
            <div className="relative">
              <button
                onClick={() => setIsRecentOpen(!isRecentOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
                title="Recent Items"
              >
                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {isRecentOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsRecentOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-medium text-gray-900 dark:text-white">Recent Items</h3>
                    </div>
                    <RecentItemsCompact 
                      limit={5} 
                      onItemClick={() => setIsRecentOpen(false)} 
                    />
                    <div className="p-2 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700">
                      Recent items will appear here as you navigate
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={handleThemeChange}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={getThemeLabel()}
            >
              {getThemeIcon()}
            </button>

            {/* Notifications */}
            <button
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.name || 'User'}
                </span>
              </button>

              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                    </div>
                    
                    <div className="py-1">
                      <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <User className="w-4 h-4" />
                        Profile
                      </button>
                      <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <hr className="my-1 border-gray-200 dark:border-gray-600" />
                      <button 
                        onClick={logout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Breadcrumb */}
        <div className="sm:hidden px-4 pb-3">
          <Breadcrumb />
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp />
    </>
  );
}; 