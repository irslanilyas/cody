import React, { useState, useEffect } from "react";
import { framer } from "framer-plugin";
import { 
  simulateProtanopia, 
  simulateDeuteranopia, 
  simulateTritanopia 
} from "../utils/colorUtils";

type SimulationType = "normal" | "protanopia" | "deuteranopia" | "tritanopia";

interface SimulationViewProps {
  onClose: () => void;
}

const SimulationView: React.FC<SimulationViewProps> = ({ onClose }) => {
  const [simulationType, setSimulationType] = useState<SimulationType>("normal");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Get screenshot of current selection or canvas
  useEffect(() => {
    const captureScreenshot = async () => {
      try {
        // Try to get a screenshot of the current selection
        const selection = await framer.getSelection();
        
        if (selection.length > 0) {
          // Get screenshot of selection (implementation would depend on Framer API)
          // For now, we'll assume there's a hypothetical getScreenshot method
          // const screenshot = await framer.getScreenshot(selection[0]);
          // setScreenshotUrl(screenshot);
          
          // Since we don't have the actual method, we'll just use a placeholder
          setScreenshotUrl("placeholder-screenshot.png");
        } else {
          // Get screenshot of entire canvas
          // const screenshot = await framer.getCanvasScreenshot();
          // setScreenshotUrl(screenshot);
          
          // Placeholder
          setScreenshotUrl("placeholder-canvas-screenshot.png");
        }
      } catch (error) {
        console.error("Error capturing screenshot:", error);
      }
    };
    
    captureScreenshot();
  }, []);

  // Apply color blindness simulation when type changes
  useEffect(() => {
    if (!screenshotUrl || simulationType === "normal") {
      setProcessedImageUrl(screenshotUrl);
      return;
    }
    
    setIsProcessing(true);
    
    // Process image with color blindness simulation
    processImage(screenshotUrl, simulationType)
      .then(processedUrl => {
        setProcessedImageUrl(processedUrl);
        setIsProcessing(false);
      })
      .catch(error => {
        console.error("Error processing image:", error);
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

  return (
    <div className="simulation-view">
      <div className="simulation-header">
        <h3>Color Blindness Simulation</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="simulation-options">
        <button 
          className={`simulation-option ${simulationType === "normal" ? "active" : ""}`}
          onClick={() => setSimulationType("normal")}
        >
          Normal
        </button>
        <button 
          className={`simulation-option ${simulationType === "protanopia" ? "active" : ""}`}
          onClick={() => setSimulationType("protanopia")}
        >
          Protanopia (Red-Blind)
        </button>
        <button 
          className={`simulation-option ${simulationType === "deuteranopia" ? "active" : ""}`}
          onClick={() => setSimulationType("deuteranopia")}
        >
          Deuteranopia (Green-Blind)
        </button>
        <button 
          className={`simulation-option ${simulationType === "tritanopia" ? "active" : ""}`}
          onClick={() => setSimulationType("tritanopia")}
        >
          Tritanopia (Blue-Blind)
        </button>
      </div>
      
      <div className="simulation-description">
        {simulationType === "normal" ? (
          <p>Normal vision: This is how your design appears to users with typical color vision.</p>
        ) : simulationType === "protanopia" ? (
          <p>Protanopia: People with protanopia have difficulty distinguishing between red and green colors. Reds appear darker and can be confused with black.</p>
        ) : simulationType === "deuteranopia" ? (
          <p>Deuteranopia: People with deuteranopia also have difficulty with red and green colors, but in a different way than protanopia. Greens appear more red.</p>
        ) : (
          <p>Tritanopia: People with tritanopia have difficulty distinguishing between blue and yellow colors. Blues may appear greener, and yellows can appear lighter.</p>
        )}
      </div>
      
      <div className="simulation-image-container">
        {isProcessing ? (
          <div className="loading-spinner">
            <span className="sr-only">Processing image...</span>
          </div>
        ) : processedImageUrl ? (
          <img 
            src={processedImageUrl} 
            alt={`${simulationType} simulation`} 
            className="simulation-image" 
          />
        ) : (
          <div className="placeholder-image">
            No image available
          </div>
        )}
      </div>
      
      <div className="simulation-info">
        <p>
          <strong>Note:</strong> This simulation is an approximation and may not perfectly represent 
          how people with color blindness perceive your design. Always test with real users when possible.
        </p>
      </div>
    </div>
  );
};

export default SimulationView;