// src/components/ScanButton.tsx
import React from "react";

interface ScanButtonProps {
  onScan: () => void;
  isScanning: boolean;
  disabled?: boolean;
}

const ScanButton: React.FC<ScanButtonProps> = ({ onScan, isScanning, disabled = false }) => {
  return (
    <button 
      className="scan-button" 
      onClick={onScan} 
      disabled={isScanning || disabled}
    >
      {isScanning ? "Scanning..." : "Scan for Accessibility Issues"}
    </button>
  );
};

export default ScanButton;