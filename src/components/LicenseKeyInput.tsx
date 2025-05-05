// components/LicenseKeyInput.tsx
import React, { useState } from 'react';
import { setLicenseKey } from '../utils/licenseManager';

// Define props interface
interface LicenseKeyInputProps {
  onActivated?: () => void;
}

const LicenseKeyInput: React.FC<LicenseKeyInputProps> = ({ onActivated }) => {
  const [key, setKey] = useState('');
  const [message, setMessage] = useState('');
  
  const handleActivate = () => {
    if (setLicenseKey(key)) {
      setMessage('License activated successfully!');
      // Call the callback if provided
      if (onActivated) {
        onActivated();
      }
    } else {
      setMessage('Invalid license key');
    }
  };
  
  return (
    <div className="license-key-container">
      <h3>Enter License Key</h3>
      <input 
        type="text" 
        value={key} 
        onChange={(e) => setKey(e.target.value)}
        placeholder="XXXX-XXXX-XXXX-XXXX"
      />
      <button onClick={handleActivate}>Activate</button>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default LicenseKeyInput;