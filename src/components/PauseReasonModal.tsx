import React, { useState } from 'react';
import { X, Clock, Coffee, Phone, Users, MessageSquare } from 'lucide-react';

interface PauseReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

const commonReasons = [
  { id: 'break', label: 'Short Break', icon: Coffee, description: '5-15 minutes' },
  { id: 'lunch', label: 'Lunch Break', icon: Coffee, description: '30-60 minutes' },
  { id: 'meeting', label: 'Meeting', icon: Users, description: 'Scheduled meeting' },
  { id: 'call', label: 'Phone Call', icon: Phone, description: 'Important call' },
  { id: 'interruption', label: 'Interruption', icon: MessageSquare, description: 'Unexpected interruption' },
  { id: 'other', label: 'Other', icon: Clock, description: 'Custom reason' }
];

export const PauseReasonModal: React.FC<PauseReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    let reason = selectedReason;
    if (selectedReason === 'other' && customReason.trim()) {
      reason = customReason.trim();
    } else if (selectedReason === 'other') {
      reason = 'Other';
    }
    
    onConfirm(reason || 'No reason provided');
  };

  const handleReasonSelect = (reasonId: string) => {
    setSelectedReason(reasonId);
    if (reasonId !== 'other') {
      setCustomReason('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pause Timer</h3>
            <p className="text-sm text-gray-600 mt-1">Why are you pausing the timer?</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-3 mb-6">
            {commonReasons.map((reason) => {
              const IconComponent = reason.icon;
              return (
                <button
                  key={reason.id}
                  onClick={() => handleReasonSelect(reason.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedReason === reason.id
                      ? 'border-orange-300 bg-orange-50 text-orange-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedReason === reason.id
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <IconComponent size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{reason.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{reason.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedReason === 'other' && (
            <div className="mb-6">
              <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-2">
                Custom Reason
              </label>
              <textarea
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter your reason for pausing..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || !selectedReason}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
            >
              {isLoading ? 'Pausing...' : 'Pause Timer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PauseReasonModal;