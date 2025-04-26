// src/components/ScanButton.tsx
import React from "react";

interface ScanButtonProps {
  onScan: () => void;
  isScanning: boolean;
  disabled?: boolean;
  freeScanCount?: number;
  totalScans?: number;
  showFreeScans?: boolean;
}

const ScanButton: React.FC<ScanButtonProps> = ({ 
  onScan, 
  isScanning, 
  disabled = false,
  freeScanCount = 2,
  totalScans = 3,
  showFreeScans = true
}) => {
  return (
    <button 
      className="scan-button" 
      onClick={onScan} 
      disabled={isScanning || disabled}
    >
      <span className="accessibility-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 1.33337C8.73333 1.33337 9.33333 1.93337 9.33333 2.66671C9.33333 3.40004 8.73333 4.00004 8 4.00004C7.26667 4.00004 6.66667 3.40004 6.66667 2.66671C6.66667 1.93337 7.26667 1.33337 8 1.33337ZM14 6.00004H10V14.6667H8.66667V10.6667H7.33333V14.6667H6V6.00004H2V4.66671H14V6.00004Z" fill="white"/>
        </svg>
      </span>
      <span className="scan-button-text">
        {isScanning ? "Scanning..." : "Scan for accessibility issues"}
      </span>
      {showFreeScans && (
        <span className="scans-remaining">{freeScanCount}/{totalScans} Free Scans Left</span>
      )}
    </button>
  );
};

export default ScanButton;