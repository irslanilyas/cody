/**
 * Utilities for color manipulation and analysis
 */

// Color interface for RGBA values
interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
  }
  
  /**
   * Parses a color string into RGBA components
   * @param color Color string (hex, rgb, rgba)
   * @returns RGBA object
   */
  export function getColorFromRGBA(color: string): RGBA {
    // Default to black if color is not provided
    if (!color) {
      return { r: 0, g: 0, b: 0, a: 1 };
    }
  
    let r = 0, g = 0, b = 0, a = 1;
  
    // Handle hex colors
    if (color.startsWith('#')) {
      let hex = color.substring(1);
  
      if (hex.length === 3) {
        // Expand shorthand hex
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
  
      if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      } else if (hex.length === 8) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
        a = parseInt(hex.substring(6, 8), 16) / 255;
      }
    } 
    // Handle rgb/rgba colors
    else if (color.startsWith('rgb')) {
      const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (rgbMatch) {
        r = parseInt(rgbMatch[1], 10);
        g = parseInt(rgbMatch[2], 10);
        b = parseInt(rgbMatch[3], 10);
        a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
      }
    }
  
    return { r, g, b, a };
  }
  
  /**
   * Converts RGB color to luminance value
   * @param r Red (0-255)
   * @param g Green (0-255)
   * @param b Blue (0-255)
   * @returns Luminance value
   */
  function getLuminance(r: number, g: number, b: number): number {
    // Convert RGB to sRGB
    const sR = r / 255;
    const sG = g / 255;
    const sB = b / 255;
  
    // Convert sRGB to luminance
    const R = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
    const G = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
    const B = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);
  
    // Calculate luminance
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }
  
  /**
   * Calculates contrast ratio between two colors
   * @param color1 First color (RGBA)
   * @param color2 Second color (RGBA)
   * @returns Contrast ratio
   */
  export function calculateContrastRatio(color1: RGBA, color2: RGBA): number {
    // Calculate luminance for each color
    const lum1 = getLuminance(color1.r, color1.g, color1.b);
    const lum2 = getLuminance(color2.r, color2.g, color2.b);
    
    // Calculate contrast ratio
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  /**
   * Calculates color difference using the CIEDE2000 algorithm (simplified)
   * @param color1 First color (any format)
   * @param color2 Second color (any format)
   * @returns Color difference value
   */
  export function calculateColorDifference(color1: string, color2: string): number {
    const rgba1 = getColorFromRGBA(color1);
    const rgba2 = getColorFromRGBA(color2);
    
    // Simple Euclidean distance in RGB space (simplified version)
    // A better implementation would use LAB color space and CIEDE2000
    const rDiff = rgba1.r - rgba2.r;
    const gDiff = rgba1.g - rgba2.g;
    const bDiff = rgba1.b - rgba2.b;
    
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
  }
  
  /**
   * Simulates how a color appears to someone with protanopia (red-blind)
   * @param color Original color
   * @returns Simulated color
   */
  export function simulateProtanopia(color: string): string {
    const rgba = getColorFromRGBA(color);
    
    // Protanopia simulation matrix
    const simR = 0.567 * rgba.r + 0.433 * rgba.g + 0.0 * rgba.b;
    const simG = 0.558 * rgba.r + 0.442 * rgba.g + 0.0 * rgba.b;
    const simB = 0.0 * rgba.r + 0.242 * rgba.g + 0.758 * rgba.b;
    
    return `rgb(${Math.round(simR)}, ${Math.round(simG)}, ${Math.round(simB)})`;
  }
  
  /**
   * Simulates how a color appears to someone with deuteranopia (green-blind)
   * @param color Original color
   * @returns Simulated color
   */
  export function simulateDeuteranopia(color: string): string {
    const rgba = getColorFromRGBA(color);
    
    // Deuteranopia simulation matrix
    const simR = 0.625 * rgba.r + 0.375 * rgba.g + 0.0 * rgba.b;
    const simG = 0.7 * rgba.r + 0.3 * rgba.g + 0.0 * rgba.b;
    const simB = 0.0 * rgba.r + 0.3 * rgba.g + 0.7 * rgba.b;
    
    return `rgb(${Math.round(simR)}, ${Math.round(simG)}, ${Math.round(simB)})`;
  }
  
  /**
   * Simulates how a color appears to someone with tritanopia (blue-blind)
   * @param color Original color
   * @returns Simulated color
   */
  export function simulateTritanopia(color: string): string {
    const rgba = getColorFromRGBA(color);
    
    // Tritanopia simulation matrix
    const simR = 0.95 * rgba.r + 0.05 * rgba.g + 0.0 * rgba.b;
    const simG = 0.0 * rgba.r + 0.433 * rgba.g + 0.567 * rgba.b;
    const simB = 0.0 * rgba.r + 0.475 * rgba.g + 0.525 * rgba.b;
    
    return `rgb(${Math.round(simR)}, ${Math.round(simG)}, ${Math.round(simB)})`;
  }
  
  /**
   * Darkens a color by a specified amount
   * @param color Color to darken
   * @param amount Amount to darken (0-1)
   * @returns Darkened color
   */
  export function darkenColor(color: string, amount: number): string {
    const rgba = getColorFromRGBA(color);
    
    const r = Math.max(0, Math.round(rgba.r * (1 - amount)));
    const g = Math.max(0, Math.round(rgba.g * (1 - amount)));
    const b = Math.max(0, Math.round(rgba.b * (1 - amount)));
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  /**
   * Lightens a color by a specified amount
   * @param color Color to lighten
   * @param amount Amount to lighten (0-1)
   * @returns Lightened color
   */
  export function lightenColor(color: string, amount: number): string {
    const rgba = getColorFromRGBA(color);
    
    const r = Math.min(255, Math.round(rgba.r + (255 - rgba.r) * amount));
    const g = Math.min(255, Math.round(rgba.g + (255 - rgba.g) * amount));
    const b = Math.min(255, Math.round(rgba.b + (255 - rgba.b) * amount));
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  /**
   * Calculates a color with suitable contrast against a background
   * @param backgroundColor Background color
   * @param targetContrastRatio Target contrast ratio
   * @returns Color with suitable contrast
   */
  export function getColorWithSuitableContrast(backgroundColor: string, targetContrastRatio: number): string {
    const bgRgba = getColorFromRGBA(backgroundColor);
    const bgLuminance = getLuminance(bgRgba.r, bgRgba.g, bgRgba.b);
    
    // Determine if we need a light or dark color
    if (bgLuminance > 0.5) {
      // Dark background needs a light color
      let testColor = { r: 0, g: 0, b: 0, a: 1 }; // Start with black
      
      // Gradually lighten until we reach the target contrast
      for (let i = 0; i < 255; i += 5) {
        testColor = { r: i, g: i, b: i, a: 1 };
        const contrastRatio = calculateContrastRatio(bgRgba, testColor);
        
        if (contrastRatio >= targetContrastRatio) {
          return `rgb(${i}, ${i}, ${i})`;
        }
      }
      
      return '#000000'; // Return black if we can't reach target contrast
    } else {
      // Light background needs a dark color
      let testColor = { r: 255, g: 255, b: 255, a: 1 }; // Start with white
      
      // Gradually darken until we reach the target contrast
      for (let i = 255; i >= 0; i -= 5) {
        testColor = { r: i, g: i, b: i, a: 1 };
        const contrastRatio = calculateContrastRatio(bgRgba, testColor);
        
        if (contrastRatio >= targetContrastRatio) {
          return `rgb(${i}, ${i}, ${i})`;
        }
      }
      
      return '#FFFFFF'; // Return white if we can't reach target contrast
    }
  }