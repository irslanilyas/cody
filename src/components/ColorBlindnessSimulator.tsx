// src/components/ColorBlindnessSimulator.tsx
import React, { useState, useEffect } from "react";
import { framer } from "framer-plugin";
import { 
  simulateProtanopia, 
  simulateDeuteranopia, 
  simulateTritanopia 
} from "../utils/colorUtils";
import "../styles/ColorBlindnessSimulator.css";

type SimulationType = "normal" | "protanopia" | "deuteranopia" | "tritanopia";

interface ColorBlindnessSimulatorProps {
  onClose: () => void;
}

const ColorBlindnessSimulator: React.FC<ColorBlindnessSimulatorProps> = ({ onClose }) => {
  const [simulationType, setSimulationType] = useState<SimulationType>("normal");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get screenshot of current selection or canvas
  useEffect(() => {
    const captureScreenshot = async () => {
      try {
        setErrorMessage(null);
        
        // Since we don't have actual screenshot functionality in Framer API,
        // we'll use a placeholder image for demo purposes
        const placeholderImage = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20width%3D%22500%22%20height%3D%22300%22%3E%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%22500%22%20height%3D%22300%22%20fill%3D%22%23f0f0f0%22%3E%3C%2Frect%3E%3Ctext%20x%3D%22250%22%20y%3D%22150%22%20font-size%3D%2220%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22sans-serif%22%20fill%3D%22%23333333%22%3EPlaceholder%20for%20actual%20screenshot%3C%2Ftext%3E%3C%2Fsvg%3E";
        setScreenshotUrl(placeholderImage);
        
        // Try to get a real screenshot (not implemented in current Framer API)
        // For future implementation when Framer API supports screenshots
        try {
          // Get the selection
          const selection = await framer.getSelection();
          
          // Select node if there's one selected, otherwise get full canvas
          if (selection.length > 0) {
            // Future: await framer.captureNodeScreenshot(selection[0]);
            console.log("Would capture screenshot of node:", selection[0]);
          } else {
            // Future: await framer.captureCanvasScreenshot();
            console.log("Would capture screenshot of entire canvas");
          }
        } catch (e) {
          console.warn("Screenshot functionality not available:", e);
        }
      } catch (error) {
        console.error("Error capturing screenshot:", error);
        setErrorMessage("Unable to capture design screenshot. Please try again.");
      }
    };
    
    captureScreenshot();
  }, []);

  // Apply color blindness simulation when type changes
  useEffect(() => {
    if (!screenshotUrl) {
      return;
    }
    
    setIsProcessing(true);
    
    // For normal vision, just use the original screenshot
    if (simulationType === "normal") {
      setProcessedImageUrl(screenshotUrl);
      setIsProcessing(false);
      return;
    }
    
    // Process image with color blindness simulation
    processImage(screenshotUrl, simulationType)
      .then(processedUrl => {
        setProcessedImageUrl(processedUrl);
        setIsProcessing(false);
      })
      .catch(error => {
        console.error("Error processing image:", error);
        setErrorMessage("Error simulating color blindness. Please try again.");
        setIsProcessing(false);
      });
  }, [screenshotUrl, simulationType]);

  // Process image with color blindness simulation
  const processImage = async (imageUrl: string, type: SimulationType): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image to canvas
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Apply color blindness simulation
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          
          // Convert RGB to color string
          const color = `rgb(${r}, ${g}, ${b})`;
          
          // Apply simulation based on type
          let simulatedColor;
          
          switch (type) {
            case "protanopia":
              simulatedColor = simulateProtanopia(color);
              break;
            case "deuteranopia":
              simulatedColor = simulateDeuteranopia(color);
              break;
            case "tritanopia":
              simulatedColor = simulateTritanopia(color);
              break;
            default:
              simulatedColor = color;
          }
          
          // Parse simulated color back to RGB
          const rgbMatch = simulatedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          
          if (rgbMatch) {
            pixels[i] = parseInt(rgbMatch[1], 10);
            pixels[i + 1] = parseInt(rgbMatch[2], 10);
            pixels[i + 2] = parseInt(rgbMatch[3], 10);
          }
        }
        
        // Put processed image data back to canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas to data URL
        const processedUrl = canvas.toDataURL('image/png');
        resolve(processedUrl);
      };
      
      img.onerror = () => {
        reject(new Error("Could not load image"));
      };
      
      img.src = imageUrl;
    });
  };

  // Get description for the current simulation type
  const getDescription = (): string => {
    switch (simulationType) {
      case "normal":
        return "Normal vision: This is how your design appears to users with typical color vision.";
      case "protanopia":
        return "Protanopia (Red-Blind): People with protanopia have difficulty distinguishing between red and green colors. Reds appear darker and can be confused with black or gray.";
      case "deuteranopia":
        return "Deuteranopia (Green-Blind): People with deuteranopia also have difficulty with red and green colors, but in a different way than protanopia. Greens appear more reddish.";
      case "tritanopia":
        return "Tritanopia (Blue-Blind): People with tritanopia have difficulty distinguishing between blue and yellow colors. Blues may appear greener, and yellows can appear lighter or pinkish.";
      default:
        return "";
    }
  };

  return (
    <div className="simulator-modal-overlay">
      <div className="simulator-modal-content">
        <div className="simulator-header">
          <h3>Color Blindness Simulation</h3>
          <button className="simulator-close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="simulator-options">
          <button 
            className={`simulator-option ${simulationType === "normal" ? "active" : ""}`}
            onClick={() => setSimulationType("normal")}
          >
            Normal Vision
          </button>
          <button 
            className={`simulator-option ${simulationType === "protanopia" ? "active" : ""}`}
            onClick={() => setSimulationType("protanopia")}
          >
            Protanopia (Red-Blind)
          </button>
          <button 
            className={`simulator-option ${simulationType === "deuteranopia" ? "active" : ""}`}
            onClick={() => setSimulationType("deuteranopia")}
          >
            Deuteranopia (Green-Blind)
          </button>
          <button 
            className={`simulator-option ${simulationType === "tritanopia" ? "active" : ""}`}
            onClick={() => setSimulationType("tritanopia")}
          >
            Tritanopia (Blue-Blind)
          </button>
        </div>
        
        <div className="simulator-description">
          <p>{getDescription()}</p>
        </div>
        
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}
        
        <div className="simulator-image-container">
          {isProcessing ? (
            <div className="simulator-loading">
              <div className="loading-spinner">
                <span className="sr-only">Processing image...</span>
              </div>
            </div>
          ) : processedImageUrl ? (
            <img 
              src={processedImageUrl} 
              alt={`${simulationType} vision simulation`} 
              className="simulator-image" 
            />
          ) : (
            <div className="placeholder-image">
              No image available
            </div>
          )}
        </div>
        
        <div className="simulator-info">
          <p>
            <strong>Note:</strong> This simulation is an approximation and may not perfectly represent 
            how people with color blindness perceive your design. Always test with real users when possible.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ColorBlindnessSimulator;