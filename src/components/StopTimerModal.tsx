import React from 'react';
import { X, AlertTriangle, Clock, Save } from 'lucide-react';
import { timeUtils } from '../services/timeTrackingService';

interface StopTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  elapsedSeconds: number;
  taskTitle?: string;
}

export const StopTimerModal: React.FC<StopTimerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  elapsedSeconds,
  taskTitle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Stop Timer</h3>
              <p className="text-sm text-gray-600 mt-1">Are you sure you want to stop the timer?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {taskTitle && (
                <div className="flex items-center gap-2">
                  <Save size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Task:</span>
                  <span className="text-sm text-gray-900">{taskTitle}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Time tracked:</span>
                <span className="text-sm font-mono font-bold text-gray-900">
                  {timeUtils.formatDuration(elapsedSeconds)}
                </span>
                <span className="text-xs text-gray-500">
                  ({timeUtils.formatDurationHuman(elapsedSeconds)})
                </span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex gap-3">
                <AlertTriangle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">This action will save your time entry</p>
                  <p>Your tracked time will be permanently recorded and the timer will be reset.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Stopping...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Stop & Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StopTimerModal;