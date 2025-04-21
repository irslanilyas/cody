import { Issue } from "../types/issueTypes";
import { isFrameNode, isTextNode } from "framer-plugin";
import { 
  simulateProtanopia, 
  simulateDeuteranopia, 
  simulateTritanopia,
  calculateColorDifference
} from "../utils/colorUtils";

// Simple UUID generation function
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Threshold for color difference to be considered significant
const COLOR_DIFFERENCE_THRESHOLD = 30;

/**
 * Analyzes elements for color blindness issues
 * @param nodes Array of nodes from the Framer project
 * @returns Array of color blindness-related accessibility issues
 */
export async function analyzeColorBlindness(nodes: any[]): Promise<Issue[]> {
  const issues: Issue[] = [];

  // Find nodes with colors (both frames and text nodes)
  const nodesWithColor = nodes.filter(node => {
    try {
      // For now, only use FrameNode with backgroundColor
      return isFrameNode(node) && node.backgroundColor;
    } catch (error) {
      return false;
    }
  });

  // Find adjacent elements with similar colors under color blindness simulation
  for (let i = 0; i < nodesWithColor.length; i++) {
    for (let j = i + 1; j < nodesWithColor.length; j++) {
      try {
        const node1 = nodesWithColor[i];
        const node2 = nodesWithColor[j];
        
        // Check if nodes are adjacent or have a parent-child relationship
        const isAdjacent = await areNodesAdjacent(node1, node2);
        
        if (!isAdjacent) {
          continue;
        }
        
        
        // Get colors from nodes - for now only handle FrameNode backgroundColor
        let color1, color2;
        
        if (isFrameNode(node1)) {
          // Handle backgroundColor which could be string or ColorStyle
          if (node1.backgroundColor) {
            color1 = typeof node1.backgroundColor === 'string' 
              ? node1.backgroundColor 
              : node1.backgroundColor.toString();
          }
        }
        
        if (isFrameNode(node2)) {
          // Handle backgroundColor which could be string or ColorStyle
          if (node2.backgroundColor) {
            color2 = typeof node2.backgroundColor === 'string' 
              ? node2.backgroundColor 
              : node2.backgroundColor.toString();
          }
        }
        
        if (!color1 || !color2) {
          continue;
        }
        
        // Check color differences under different color blindness simulations
        const normalDifference = calculateColorDifference(color1, color2);
        
        // Simulate colors under different color blindness conditions
        const protanopiaColor1 = simulateProtanopia(color1);
        const protanopiaColor2 = simulateProtanopia(color2);
        const protanopiaDifference = calculateColorDifference(protanopiaColor1, protanopiaColor2);
        
        const deuteranopiaColor1 = simulateDeuteranopia(color1);
        const deuteranopiaColor2 = simulateDeuteranopia(color2);
        const deuteranopiaDifference = calculateColorDifference(deuteranopiaColor1, deuteranopiaColor2);
        
        const tritanopiaColor1 = simulateTritanopia(color1);
        const tritanopiaColor2 = simulateTritanopia(color2);
        const tritanopiaDifference = calculateColorDifference(tritanopiaColor1, tritanopiaColor2);
        
        // Check if colors become too similar under any color blindness simulation
        if (normalDifference > COLOR_DIFFERENCE_THRESHOLD && 
            (protanopiaDifference < COLOR_DIFFERENCE_THRESHOLD || 
             deuteranopiaDifference < COLOR_DIFFERENCE_THRESHOLD || 
             tritanopiaDifference < COLOR_DIFFERENCE_THRESHOLD)) {
          
          // Determine which type of color blindness has the most significant impact
          let colorBlindnessType = "color blindness";
          let differenceLoss = normalDifference - Math.min(protanopiaDifference, deuteranopiaDifference, tritanopiaDifference);
          
          if (protanopiaDifference <= deuteranopiaDifference && protanopiaDifference <= tritanopiaDifference) {
            colorBlindnessType = "protanopia (red-blind)";
            differenceLoss = normalDifference - protanopiaDifference;
          } else if (deuteranopiaDifference <= protanopiaDifference && deuteranopiaDifference <= tritanopiaDifference) {
            colorBlindnessType = "deuteranopia (green-blind)";
            differenceLoss = normalDifference - deuteranopiaDifference;
          } else {
            colorBlindnessType = "tritanopia (blue-blind)";
            differenceLoss = normalDifference - tritanopiaDifference;
          }
          
          issues.push({
            id: generateUUID(), // Add a unique ID
            type: "colorBlindness",
            severity: "warning",
            title: "Color Distinction Issues for Color Blind Users",
            description: `These elements use colors that may be difficult to distinguish for users with ${colorBlindnessType}. The color difference is reduced by ${differenceLoss.toFixed(1)} under this simulation.`,
            wcagGuideline: "WCAG 2.1 AA - 1.4.1 Use of Color",
            wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html",
            location: {
              nodeId: node1.id,
              nodeName: node1.name || "Element",
              nodePath: node1.id
            },
            fixSuggestions: [
              {
                description: "Add a non-color indicator (pattern, icon, or text)",
                action: async () => {
                  // This requires manual intervention
                  console.log("This fix requires adding non-color indicators");
                }
              },
              {
                description: "Increase color contrast for better distinction",
                action: async () => {
                  // Adjust colors to be more distinguishable
                  if (isFrameNode(node1) && node1.backgroundColor) {
                    await node1.setAttributes({ backgroundColor: "#000000" });
                  }
                }
              }
            ]
          });
        }
        
        // Check for elements that only use color to convey information
        // This is a heuristic and may not catch all cases
        if (isFrameNode(node1) && node1.backgroundColor && 
            isTextNode(node2) && isLikelyStatusIndicator(node1, node2)) {
          issues.push({
            id: generateUUID(), // Add a unique ID
            type: "colorBlindness",
            severity: "critical",
            title: "Color Alone Used to Convey Information",
            description: "This appears to be a status indicator that relies solely on color to convey information, which may not be perceivable by users with color blindness.",
            wcagGuideline: "WCAG 2.1 A - 1.4.1 Use of Color",
            wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html",
            location: {
              nodeId: node1.id,
              nodeName: node1.name || "Status Indicator",
              nodePath: node1.id
            },
            fixSuggestions: [
              {
                description: "Add a pattern, icon, or text label to convey the same information",
                action: async () => {
                  // This requires manual intervention
                  console.log("This fix requires adding non-color indicators");
                }
              }
            ]
          });
        }
      } catch (error) {
        console.error("Error analyzing color blindness for nodes:", nodesWithColor[i].id, nodesWithColor[j].id, error);
      }
    }
  }

  return issues;
}

/**
 * Checks if two nodes are adjacent or have a parent-child relationship
 * @param node1 First node
 * @param node2 Second node
 * @returns Promise<boolean> True if nodes are adjacent
 */
async function areNodesAdjacent(node1: any, node2: any): Promise<boolean> {
  try {
    // Check if one node is a child of the other
    const node1Parent = await node1.getParent();
    if (node1Parent && node1Parent.id === node2.id) {
      return true;
    }
    
    const node2Parent = await node2.getParent();
    if (node2Parent && node2Parent.id === node1.id) {
      return true;
    }
    
    // Check if nodes share the same parent
    if (node1Parent && node2Parent && node1Parent.id === node2Parent.id) {
      return true;
    }
    
    // Check if nodes are visually adjacent by comparing their rectangles
    const rect1 = await node1.getRect();
    const rect2 = await node2.getRect();
    
    if (rect1 && rect2) {
      // Check for overlap or adjacency
      const horizontalOverlap = 
        (rect1.x <= rect2.x + rect2.width) && 
        (rect1.x + rect1.width >= rect2.x);
      
      const verticalOverlap = 
        (rect1.y <= rect2.y + rect2.height) && 
        (rect1.y + rect1.height >= rect2.y);
      
      // Nodes are adjacent if they overlap in at least one dimension
      return horizontalOverlap || verticalOverlap;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking if nodes are adjacent:", error);
    return false;
  }
}

/**
 * Heuristic to detect if a frame and text node combination is likely a status indicator
 * @param frameNode The frame node
 * @param textNode The text node
 * @returns boolean True if likely a status indicator
 */
function isLikelyStatusIndicator(frameNode: any, textNode: any): boolean {
  // Check if frame is small and colored
  const isSmallColoredFrame = frameNode.width <= 24 && frameNode.height <= 24 && frameNode.backgroundColor;
  
  // Check if text has status-like content
  const statusWords = /status|state|success|error|warning|info|active|inactive|enabled|disabled|on|off|yes|no|completed|pending|progress/i;
  const textContainsStatusWord = textNode.text && statusWords.test(textNode.text);
  
  // Check if frame name suggests it's a status indicator
  const frameNameSuggestsIndicator = frameNode.name && 
    /indicator|status|state|dot|circle|badge/i.test(frameNode.name);
  
  return isSmallColoredFrame && (textContainsStatusWord || frameNameSuggestsIndicator);
}