import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsProps {
  shortcuts?: KeyboardShortcut[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({ 
  shortcuts = [], 
  enabled = true 
}: UseKeyboardShortcutsProps = {}) => {
  const navigate = useNavigate();

  // Default shortcuts for navigation
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: 'd',
      metaKey: true,
      ctrlKey: true,
      action: () => navigate('/app/dashboard'),
      description: 'Go to Dashboard'
    },
    {
      key: 'w',
      metaKey: true,
      ctrlKey: true,
      action: () => navigate('/app/workflows'),
      description: 'Go to Workflows'
    },
    {
      key: 'k',
      metaKey: true,
      ctrlKey: true,
      action: () => navigate('/app/kanban'),
      description: 'Go to Kanban Board'
    },
    {
      key: 't',
      metaKey: true,
      ctrlKey: true,
      action: () => navigate('/app/team'),
      description: 'Go to Team'
    },
    {
      key: 'c',
      metaKey: true,
      ctrlKey: true,
      action: () => navigate('/app/clients'),
      description: 'Go to Clients'
    },
    {
      key: 'm',
      metaKey: true,
      ctrlKey: true,
      action: () => navigate('/app/meetings'),
      description: 'Go to Meetings'
    },
    {
      key: '/',
      metaKey: true,
      ctrlKey: true,
      action: () => {
        // Trigger search - will be implemented with search component
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Open Search'
    },
    {
      key: '?',
      shiftKey: true,
      action: () => {
        // Show shortcuts help - will be implemented
        const event = new CustomEvent('show-shortcuts-help');
        window.dispatchEvent(event);
      },
      description: 'Show Keyboard Shortcuts'
    }
  ];

  const allShortcuts = [...defaultShortcuts, ...shortcuts];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('[contenteditable="true"]')
    ) {
      // Exception for search shortcut
      if (!(event.key === '/' && (event.metaKey || event.ctrlKey))) {
        return;
      }
    }

    for (const shortcut of allShortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
      const metaMatches = !!shortcut.metaKey === event.metaKey;
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const altMatches = !!shortcut.altKey === event.altKey;

      if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
        console.log('⌨️ Keyboard shortcut triggered:', shortcut.description);
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        break;
      }
    }
  }, [allShortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);

  return {
    shortcuts: allShortcuts,
    addShortcut: (shortcut: KeyboardShortcut) => {
      // This would need to be implemented with state management
      // For now, shortcuts are static
    }
  };
}; 