import { useState, useEffect, useCallback } from 'react';

export interface RecentItem {
  id: string;
  type: 'workflow' | 'client' | 'task' | 'meeting' | 'team-member';
  title: string;
  subtitle?: string;
  path: string;
  timestamp: number;
  icon?: string;
}

const RECENT_ITEMS_KEY = 'benders-recent-items';
const MAX_RECENT_ITEMS = 10;

export const useRecentItems = () => {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  // Load recent items from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_ITEMS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out items older than 7 days
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const filtered = parsed.filter((item: RecentItem) => item.timestamp > weekAgo);
        setRecentItems(filtered);
      }
    } catch (error) {
      console.warn('Failed to load recent items from localStorage:', error);
    }
  }, []);

  // Save recent items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(recentItems));
    } catch (error) {
      console.warn('Failed to save recent items to localStorage:', error);
    }
  }, [recentItems]);

  const addRecentItem = useCallback((item: Omit<RecentItem, 'timestamp'>) => {
    console.log('📝 Adding recent item:', item);
    setRecentItems(currentItems => {
      // Remove existing item if it exists
      const filtered = currentItems.filter(existing => 
        !(existing.id === item.id && existing.type === item.type)
      );

      // Add new item at the beginning
      const newItem: RecentItem = {
        ...item,
        timestamp: Date.now()
      };

      // Keep only the most recent items
      const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);
      
      console.log('📋 Updated recent items:', updated);
      return updated;
    });
  }, []);

  const removeRecentItem = useCallback((id: string, type: RecentItem['type']) => {
    setRecentItems(currentItems => 
      currentItems.filter(item => !(item.id === id && item.type === type))
    );
  }, []);

  const clearRecentItems = useCallback(() => {
    setRecentItems([]);
  }, []);

  const getRecentItemsByType = useCallback((type: RecentItem['type']) => {
    return recentItems.filter(item => item.type === type);
  }, [recentItems]);

  return {
    recentItems,
    addRecentItem,
    removeRecentItem,
    clearRecentItems,
    getRecentItemsByType
  };
}; 