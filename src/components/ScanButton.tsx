import React from "react";

interface ScanButtonProps {
  onScan: () => void;
  isScanning: boolean;
}

const ScanButton: React.FC<ScanButtonProps> = ({ onScan, isScanning }) => {
  return (
    <button 
      className="scan-button" 
      onClick={onScan} 
      disabled={isScanning}
    >
      {isScanning ? "Scanning..." : "Scan for Accessibility Issues"}
    </button>
  );
};

export default ScanButton;