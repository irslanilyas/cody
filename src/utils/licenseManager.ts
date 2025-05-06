// utils/licenseManager.ts
export const MAX_FREE_SCANS = 3;
const LEMON_SQUEEZY_API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiJjMzlhNzc3MzNlNDkyNmEzN2NiMGM1Mzk0YTQ3ZDBjMTVhNTUwMTc4MjAyMDkxZmNhYTBhYjkyMDMxYmM0NjA1ZDI4NWE4YmFhOTE4ZjQ4MSIsImlhdCI6MTc0NjUxOTEyNy4zMjU2MiwibmJmIjoxNzQ2NTE5MTI3LjMyNTYyMywiZXhwIjoyMDYyMDUxOTI3LjI5MjA4NSwic3ViIjoiMzI2NzY0NCIsInNjb3BlcyI6W119.tae_dMzAfhQnzqSJRrddC3VVfvKSz1e-dlo4CloerSBplav7-ZkTaMXdYwhTt-LxZjYJ4Gzz8LsFeQbnfxZvS2jB9V9YkQ6T9v_jc2MZmvzYqavGRMmwJxkyl-BLBh53ogBwld3dHQA0sM_yKKi2BKbpm4Yem9JA3Qr3RHD8byDLOKSfj4xVkhiuMkfs_8R7LC_X83sAw6sYhdAvTLhRc46FHY__jIcFNFQSXFkiXZiZSmTGijzVn5Y-qwhYREN42jgq1kZOYiIG0uVb4vgrlj6Q8_OCTQ3zy-boXhKzF8EbLc9TLu01lkLHDMuSEVe9s_VgR96TnUFe9De8SbhdZU_pK9B45Wbyy3gePu0OxY8ckUVcmY1KzNMTLJ-49mYbJqOpZwiaWUbVPUMU74lqFQ7DjpJllfW5t0QrvF_IY1RMbFt9GL3QjpihrvULPS9k-jxDaBUPA4tTtkXX_ETDA5q1mJ1H8gKScNetKD_wmg4wnmoYR--FPY6xtWDyS2DF';
const PRODUCT_ID = '507801'; // Your Lemon Squeezy product ID

// Storage keys for better consistency
const STORAGE_KEYS = {
  LICENSE_KEY: 'licenseKey',
  USED_SCANS: 'usedScans',
  INSTANCE_ID: 'accessibilityCheckerInstanceId'
};

// Helper to determine if we're in development mode
const isDevelopment = (): boolean => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.href.includes('framer.com/projects');
};

export function getRemainingScans(): number {
  if (isLicensed()) return Infinity; // Licensed users have unlimited scans
  
  const used = parseInt(localStorage.getItem(STORAGE_KEYS.USED_SCANS) || '0');
  return Math.max(0, MAX_FREE_SCANS - used);
}

export function recordScan(): void {
  if (isLicensed()) return; // Don't count if licensed
  
  const used = parseInt(localStorage.getItem(STORAGE_KEYS.USED_SCANS) || '0');
  localStorage.setItem(STORAGE_KEYS.USED_SCANS, (used + 1).toString());
}

export function isLicensed(): boolean {
  const licenseKey = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
  return !!licenseKey; // If a key exists, consider it valid (it was validated when stored)
}

// Legacy function - synchronous version
export function setLicenseKey(key: string): boolean {
  // In development environment, accept test keys
  if (isDevelopment()) {
    if (key === 'TEST-LICENSE-KEY-123' || key === 'FRAMER-PLUGGED-TEST') {
      localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, key);
      return true;
    }
  }
  
  // For backward compatibility - this will be used less as we transition to async validation
  const validKeys = ['LICENSE-KEY-1', 'LICENSE-KEY-2']; 
  if (validKeys.includes(key)) {
    localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, key);
    return true;
  }
  
  return false;
}

// New async functions for Lemon Squeezy integration

// Validate a license key with Lemon Squeezy API
export async function validateLicenseWithLemonSqueezy(licenseKey: string): Promise<{ 
  valid: boolean; 
  message?: string;
}> {
  try {
    // For test environment, accept test keys
    if (isDevelopment()) {
      console.log("Development mode detected, checking test license keys");
      if (licenseKey === 'TEST-LICENSE-KEY-123' || licenseKey === 'FRAMER-PLUGGED-TEST') {
        console.log("Test license key accepted in development mode");
        return { valid: true };
      }
    }

    console.log("Validating license key with Lemon Squeezy API...");
    
    // Updated endpoint to use the activate endpoint for proper validation
    const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`
      },
      body: JSON.stringify({
        license_key: licenseKey,
        instance_name: 'Framer Accessibility Checker',
        instance_id: generateInstanceId()
      })
    });

    if (!response.ok) {
      console.error("API response not OK:", response.status, response.statusText);
      return { valid: false, message: `API error: ${response.status} ${response.statusText}` };
    }

    const data = await response.json();
    console.log("Lemon Squeezy API response:", data);
    
    if (data && data.activated) {
      return { valid: true };
    } else {
      return { valid: false, message: data.error || 'Invalid license key' };
    }
  } catch (error) {
    console.error('Error validating license:', error);
    return { valid: false, message: 'Error connecting to license server' };
  }
}

// Generate a unique instance ID for this installation
function generateInstanceId(): string {
  let instanceId = localStorage.getItem(STORAGE_KEYS.INSTANCE_ID);
  
  if (!instanceId) {
    instanceId = 'framer-accessibility-' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_KEYS.INSTANCE_ID, instanceId);
  }
  
  return instanceId;
}

// Activate a license (validates and saves if valid)
export async function activateLicense(key: string): Promise<{
  success: boolean;
  message?: string;
}> {
  console.log("Attempting to activate license key:", key);
  
  // First try with our legacy validation for backward compatibility
  if (setLicenseKey(key)) {
    console.log("License activated via legacy validation");
    return { success: true };
  }
  
  // If legacy validation fails, try the API validation
  console.log("Legacy validation failed, trying API validation...");
  const validation = await validateLicenseWithLemonSqueezy(key);
  
  if (validation.valid) {
    console.log("License validated successfully via API");
    localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, key);
    return { success: true };
  }
  
  console.log("License validation failed:", validation.message);
  return { 
    success: false, 
    message: validation.message || 'Invalid license key'
  };
}

// Reset all license-related data (for development and testing)
export function resetLicenseState(): void {
  console.log("Resetting license state...");
  localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
  localStorage.removeItem(STORAGE_KEYS.USED_SCANS);
  localStorage.removeItem(STORAGE_KEYS.INSTANCE_ID);
  console.log("License state reset complete.");
}