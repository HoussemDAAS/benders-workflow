import { useState, useEffect } from 'react';
import { 
  Shield, 
  Smartphone, 
  Key, 
  Download, 
  Copy, 
  Check, 
  AlertTriangle,
  RefreshCw,
  QrCode,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getApiBaseUrl } from '../utils/api';

interface TwoFactorSettingsProps {
  onClose?: () => void;
}

export function TwoFactorSettings({ onClose }: TwoFactorSettingsProps) {
  const { getAuthHeaders } = useAuth();
  const apiBaseUrl = getApiBaseUrl();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [setupStep, setSetupStep] = useState<'initial' | 'setup' | 'verify' | 'complete'>('initial');
  
  // Setup states
  const [qrCodeData, setQrCodeData] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  
  // UI states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  useEffect(() => {
    fetchTwoFactorStatus();
  }, []);

  const fetchTwoFactorStatus = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/2fa/status`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setIs2FAEnabled(data.twoFactorEnabled);
      }
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTwoFactorSetup = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/auth/2fa/setup`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to setup 2FA');
      }

      const data = await response.json();
      setQrCodeData(data.qrCodeDataURL);
      setManualEntryKey(data.manualEntryKey);
      setSetupStep('setup');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to setup 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/auth/2fa/enable`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enable 2FA');
      }

      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setIs2FAEnabled(true);
      setSetupStep('complete');
      setSuccess('Two-factor authentication has been enabled successfully!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to enable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const disable2FA = async () => {
    const code = prompt('Enter your current 2FA code to disable two-factor authentication:');
    if (!code) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disable 2FA');
      }

      setIs2FAEnabled(false);
      setSetupStep('initial');
      setSuccess('Two-factor authentication has been disabled.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    const code = prompt('Enter your current 2FA code to regenerate backup codes:');
    if (!code) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/auth/2fa/regenerate-backup-codes`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate backup codes');
      }

      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setSuccess('Backup codes regenerated successfully!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to regenerate backup codes');
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const downloadBackupCodes = () => {
    const codesText = `Benders Workflow - 2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes secure. Each code can only be used once.`;
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benders-workflow-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading && setupStep === 'initial') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h2>
                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Status messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Initial state - 2FA disabled */}
          {setupStep === 'initial' && !is2FAEnabled && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2FA is not enabled</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Two-factor authentication adds an extra layer of security to your account by requiring 
                  a code from your phone in addition to your password.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Benefits of 2FA:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Protects against password theft</li>
                  <li>• Secures your account even if your password is compromised</li>
                  <li>• Industry-standard security practice</li>
                </ul>
              </div>

              <button
                onClick={startTwoFactorSetup}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Smartphone className="w-4 h-4" />
                )}
                Enable Two-Factor Authentication
              </button>
            </div>
          )}

          {/* Setup step - Show QR code */}
          {setupStep === 'setup' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Set up your authenticator app</h3>
                <p className="text-gray-600">
                  Scan the QR code with your authenticator app or enter the key manually
                </p>
              </div>

              <div className="flex flex-col items-center space-y-4">
                {qrCodeData && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <img src={qrCodeData} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                )}

                <button
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <QrCode className="w-4 h-4" />
                  {showManualEntry ? 'Show QR code' : 'Enter key manually'}
                </button>

                {showManualEntry && (
                  <div className="w-full max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manual entry key:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={manualEntryKey}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(manualEntryKey)}
                        className="p-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter the 6-digit code from your app:
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 6) {
                        setVerificationCode(value);
                        setError('');
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSetupStep('initial')}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={verifyAndEnable2FA}
                    disabled={isLoading || verificationCode.length !== 6}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'Verify & Enable'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Complete step - Show backup codes */}
          {setupStep === 'complete' && backupCodes.length > 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2FA Enabled Successfully!</h3>
                <p className="text-gray-600">
                  Save these backup codes in a secure location. You can use them to access your account if you lose your phone.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Important:</p>
                    <p>Each backup code can only be used once. Store them securely and treat them like passwords.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="text-center py-1">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={copyBackupCodes}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {copiedCodes ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedCodes ? 'Copied!' : 'Copy Codes'}
                  </button>
                  <button
                    onClick={downloadBackupCodes}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>

                <button
                  onClick={() => setSetupStep('initial')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  I've saved my backup codes
                </button>
              </div>
            </div>
          )}

          {/* 2FA enabled state */}
          {setupStep === 'initial' && is2FAEnabled && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2FA is enabled</h3>
                <p className="text-gray-600">
                  Your account is protected with two-factor authentication
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">View backup codes</span>
                  </div>
                  {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                {showBackupCodes && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-gray-600">
                      These are your current backup codes. Each can only be used once.
                    </p>
                    <button
                      onClick={regenerateBackupCodes}
                      disabled={isLoading}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate backup codes
                    </button>
                  </div>
                )}

                <button
                  onClick={disable2FA}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 p-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  Disable Two-Factor Authentication
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}