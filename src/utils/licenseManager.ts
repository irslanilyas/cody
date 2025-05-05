// licenseManager.ts
export const MAX_FREE_SCANS = 3;

export function getRemainingScans(): number {
  const used = parseInt(localStorage.getItem('usedScans') || '0');
  return Math.max(0, MAX_FREE_SCANS - used);
}

export function recordScan(): void {
  if (isLicensed()) return; // Don't count if licensed
  
  const used = parseInt(localStorage.getItem('usedScans') || '0');
  localStorage.setItem('usedScans', (used + 1).toString());
}

export function isLicensed(): boolean {
  const licenseKey = localStorage.getItem('licenseKey');
  return !!licenseKey && validateLicenseKey(licenseKey);
}

export function setLicenseKey(key: string): boolean {
  if (validateLicenseKey(key)) {
    localStorage.setItem('licenseKey', key);
    return true;
  }
  return false;
}

// Simple validation - just a placeholder until you implement a real system
function validateLicenseKey(key: string): boolean {
  // You could start with a hardcoded list of valid keys
  const validKeys = [
    'LICENSE-KEY-1', 
    'LICENSE-KEY-2'
  ];
  
  return validKeys.includes(key);
}