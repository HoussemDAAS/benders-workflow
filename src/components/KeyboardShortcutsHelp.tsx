import React, { useState, useEffect } from 'react';
import { X, Keyboard, Command, Search, BarChart3, FileText, CheckSquare, Users, Building2, Calendar } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
    icon?: React.ElementType;
  }[];
}

export const KeyboardShortcutsHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShowShortcuts = () => {
      setIsOpen(true);
    };

    window.addEventListener('show-shortcuts-help', handleShowShortcuts);
    return () => window.removeEventListener('show-shortcuts-help', handleShowShortcuts);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Navigation',
      shortcuts: [
        {
          keys: ['⌘', 'D'],
          description: 'Go to Dashboard',
          icon: BarChart3
        },
        {
          keys: ['⌘', 'W'],
          description: 'Go to Workflows',
          icon: FileText
        },
        {
          keys: ['⌘', 'K'],
          description: 'Go to Kanban Board',
          icon: CheckSquare
        },
        {
          keys: ['⌘', 'T'],
          description: 'Go to Team',
          icon: Users
        },
        {
          keys: ['⌘', 'C'],
          description: 'Go to Clients',
          icon: Building2
        },
        {
          keys: ['⌘', 'M'],
          description: 'Go to Meetings',
          icon: Calendar
        }
      ]
    },
    {
      title: 'Search & Actions',
      shortcuts: [
        {
          keys: ['⌘', '/'],
          description: 'Open Global Search',
          icon: Search
        },
        {
          keys: ['?'],
          description: 'Show Keyboard Shortcuts',
          icon: Keyboard
        },
        {
          keys: ['Esc'],
          description: 'Close Modal/Dialog'
        }
      ]
    },
    {
      title: 'General',
      shortcuts: [
        {
          keys: ['↑', '↓'],
          description: 'Navigate through lists'
        },
        {
          keys: ['Enter'],
          description: 'Select/Confirm action'
        },
        {
          keys: ['Tab'],
          description: 'Navigate between elements'
        }
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Keyboard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Navigate faster with these shortcuts</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-8">
            {shortcutGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {group.title}
                </h3>
                <div className="space-y-3">
                  {group.shortcuts.map((shortcut, shortcutIndex) => (
                    <div
                      key={shortcutIndex}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {shortcut.icon && (
                          <div className="p-1.5 bg-white dark:bg-gray-600 rounded-md">
                            <shortcut.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          </div>
                        )}
                        <span className="text-gray-900 dark:text-white font-medium">
                          {shortcut.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && (
                              <span className="text-gray-400 mx-1">+</span>
                            )}
                            <kbd className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm font-mono text-gray-700 dark:text-gray-200 shadow-sm">
                              {key === '⌘' ? (
                                <Command className="w-3 h-3 inline" />
                              ) : (
                                key
                              )}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Platform Note */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> On Windows and Linux, use <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">Ctrl</kbd> instead of <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">⌘</kbd>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Press <kbd className="px-1 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs">?</kbd> anytime to see shortcuts</span>
            <span>Press <kbd className="px-1 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs">Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};