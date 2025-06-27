import { useState } from 'react';
import { Shield, Lock, Key, Bell, Activity, AlertTriangle } from 'lucide-react';
import { TwoFactorSettings } from '../components/TwoFactorSettings';

export function SecurityPage() {
  const [activeTab, setActiveTab] = useState<'2fa' | 'sessions' | 'activity' | 'notifications'>('2fa');

  const securityTabs = [
    {
      id: '2fa' as const,
      label: 'Two-Factor Auth',
      icon: Shield,
      description: 'Secure your account with 2FA'
    },
    {
      id: 'sessions' as const,
      label: 'Active Sessions',
      icon: Activity,
      description: 'Manage your login sessions'
    },
    {
      id: 'activity' as const,
      label: 'Security Activity',
      icon: Key,
      description: 'View recent security events'
    },
    {
      id: 'notifications' as const,
      label: 'Security Alerts',
      icon: Bell,
      description: 'Configure security notifications'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case '2fa':
        return <TwoFactorSettings />;
      
      case 'sessions':
        return (
          <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Active Sessions</h2>
                    <p className="text-sm text-gray-600">Manage devices logged into your account</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Coming Soon</p>
                      <p>Session management features are currently being developed and will be available in a future update.</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Lock className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Current Session</p>
                        <p className="text-sm text-gray-600">This device - Active now</p>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Current
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'activity':
        return (
          <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Key className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Security Activity</h2>
                    <p className="text-sm text-gray-600">Monitor recent security events on your account</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Coming Soon</p>
                      <p>Security activity logging is currently being developed and will be available in a future update.</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center py-8 text-gray-500">
                  <Key className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No security events to display</p>
                  <p className="text-sm mt-1">Security activity will appear here once logging is enabled</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Security Notifications</h2>
                    <p className="text-sm text-gray-600">Configure when to receive security alerts</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Coming Soon</p>
                      <p>Security notification preferences are currently being developed and will be available in a future update.</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-50">
                    <div>
                      <p className="font-medium text-gray-900">Login Notifications</p>
                      <p className="text-sm text-gray-600">Get notified when someone signs into your account</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      disabled 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-50">
                    <div>
                      <p className="font-medium text-gray-900">2FA Changes</p>
                      <p className="text-sm text-gray-600">Get notified when 2FA settings are modified</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      disabled 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-50">
                    <div>
                      <p className="font-medium text-gray-900">Suspicious Activity</p>
                      <p className="text-sm text-gray-600">Get notified of potential security threats</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      disabled 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Security Settings</h1>
          <p className="text-gray-600">
            Manage your account security and authentication preferences
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {securityTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${
                      activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}