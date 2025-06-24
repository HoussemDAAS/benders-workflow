import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, FileText, Users, Building2, Calendar, CheckSquare, BarChart3 } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ElementType;
  current?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const location = useLocation();

  // Generate breadcrumbs from current path if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Home for app routes
    if (pathSegments[0] === 'app') {
      breadcrumbs.push({
        label: 'Dashboard',
        path: '/app/dashboard',
        icon: Home
      });

      if (pathSegments.length > 1) {
        const section = pathSegments[1];
        const sectionConfig = getSectionConfig(section);
        
        if (sectionConfig) {
          breadcrumbs.push({
            label: sectionConfig.label,
            path: `/app/${section}`,
            icon: sectionConfig.icon
          });

          // Add specific item breadcrumb if there's an ID
          if (pathSegments.length > 2) {
            const itemId = pathSegments[2];
            breadcrumbs.push({
              label: getItemLabel(section, itemId),
              current: true
            });
          }
        }
      }
    }

    return breadcrumbs;
  };

  const getSectionConfig = (section: string) => {
    const configs: Record<string, { label: string; icon: React.ElementType }> = {
      dashboard: { label: 'Dashboard', icon: BarChart3 },
      workflows: { label: 'Workflows', icon: FileText },
      kanban: { label: 'Kanban Board', icon: CheckSquare },
      team: { label: 'Team', icon: Users },
      clients: { label: 'Clients', icon: Building2 },
      meetings: { label: 'Meetings', icon: Calendar }
    };

    return configs[section];
  };

  const getItemLabel = (section: string, itemId: string): string => {
    // In a real app, you'd fetch the actual item name
    // For now, return a generic label
    const sectionLabels: Record<string, string> = {
      workflows: 'Workflow',
      clients: 'Client',
      team: 'Team Member',
      meetings: 'Meeting',
      kanban: 'Task'
    };

    return `${sectionLabels[section] || 'Item'} Details`;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav 
      className={`flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" />
              )}
              
              {item.path && !isLast ? (
                <Link
                  to={item.path}
                  className="flex items-center gap-1.5 hover:text-primary transition-colors duration-200 font-medium"
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={`flex items-center gap-1.5 ${
                    isLast || item.current
                      ? 'text-gray-900 dark:text-white font-semibold'
                      : 'font-medium'
                  }`}
                  aria-current={isLast || item.current ? 'page' : undefined}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Helper component for custom breadcrumbs
export const BreadcrumbItem: React.FC<{
  children: React.ReactNode;
  href?: string;
  icon?: React.ElementType;
  current?: boolean;
}> = ({ children, href, icon: Icon, current }) => {
  const content = (
    <span className={`flex items-center gap-1.5 ${current ? 'text-gray-900 dark:text-white font-semibold' : 'font-medium'}`}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </span>
  );

  if (href && !current) {
    return (
      <Link
        to={href}
        className="hover:text-primary transition-colors duration-200"
      >
        {content}
      </Link>
    );
  }

  return content;
}; 