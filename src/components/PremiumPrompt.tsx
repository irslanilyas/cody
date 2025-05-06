// components/PremiumPrompt.tsx
import React, { useState } from 'react';
import { getRemainingScans } from '../utils/licenseManager';
import LicenseKeyInput from './LicenseKeyInput';
import './PremiumPrompt.css';

// Define the props interface
interface PremiumPromptProps {
  onClose: () => void;
  onLicenseActivated: () => void;
}

const PremiumPrompt: React.FC<PremiumPromptProps> = ({ onClose, onLicenseActivated }) => {
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  
  // Function to reset license and scan count for testing
  const resetLicense = () => {
    try {
      localStorage.removeItem('licenseKey');
      localStorage.removeItem('usedScans');
      localStorage.removeItem('accessibilityCheckerInstanceId');
      
      // Set success message
      setResetStatus('License reset successful! The page will reload in 1 second...');
      
      // Reload the page after a brief delay to ensure localStorage changes are applied
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error resetting license:', error);
      setResetStatus('Error resetting license state.');
    }
  };
  
  return (
    <div className="premium-prompt">
      <div className="premium-header">
        <h2>Upgrade to Premium</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <p>You have {getRemainingScans()} free scans remaining.</p>
      <p>Upgrade to premium for unlimited scans and additional features!</p>
      
      <button 
        className="upgrade-button"
        onClick={() => window.open('https://your-payment-page.com', '_blank')}
      >
        Purchase License
      </button>
      
      <div className="divider">OR</div>
      
      <LicenseKeyInput onActivated={onLicenseActivated} />
      
      {/* Dev tools section with reset status */}
      <div className="dev-tools">
        <hr className="dev-separator" />
        <h3>Developer Tools</h3>
        <button 
          className="reset-license-button"
          onClick={resetLicense}
        >
          Reset License State
        </button>
        {resetStatus && <div className="reset-status">{resetStatus}</div>}
      </div>
    </div>
  );
};

export default PremiumPrompt;