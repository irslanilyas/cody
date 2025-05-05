// components/PremiumPrompt.tsx
import React from 'react';
import { getRemainingScans } from '../utils/licenseManager';
import LicenseKeyInput from './LicenseKeyInput';

// Define the props interface
interface PremiumPromptProps {
  onClose: () => void;
  onLicenseActivated: () => void;
}

const PremiumPrompt: React.FC<PremiumPromptProps> = ({ onClose, onLicenseActivated }) => {
  const remaining = getRemainingScans();
  
  return (
    <div className="premium-prompt">
      <div className="premium-header">
        <h2>Upgrade to Premium</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <p>You have {remaining} free scans remaining.</p>
      <p>Upgrade to premium for unlimited scans and additional features!</p>
      
      <button 
        className="upgrade-button"
        onClick={() => window.open('https://your-payment-page.com', '_blank')}
      >
        Purchase License
      </button>
      
      <div className="divider">OR</div>
      
      <LicenseKeyInput onActivated={onLicenseActivated} />
    </div>
  );
};

export default PremiumPrompt;