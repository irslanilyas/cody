// components/LicenseKeyInput.tsx
import React, { useState } from 'react';
import { activateLicense } from '../utils/licenseManager';

interface LicenseKeyInputProps {
  onActivated: () => void;
}

const LicenseKeyInput: React.FC<LicenseKeyInputProps> = ({ onActivated }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleActivation = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }
    
    setIsActivating(true);
    setError(null);
    
    try {
      const result = await activateLicense(licenseKey.trim());
      
      if (result.success) {
        // Call the callback to inform parent component
        onActivated();
      } else {
        setError(result.message || 'Invalid license key');
      }
    } catch (err) {
      setError('Error activating license');
      console.error('License activation error:', err);
    } finally {
      setIsActivating(false);
    }
  };
  
  return (
    <div className="license-key-input">
      <h3>Enter Your License Key</h3>
      
      <div className="input-group">
        <input
          type="text"
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
          placeholder="Enter your license key"
          disabled={isActivating}
        />
        
        <button 
          className="activate-button"
          onClick={handleActivation}
          disabled={isActivating}
        >
          {isActivating ? 'Activating...' : 'Activate'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default LicenseKeyInput;