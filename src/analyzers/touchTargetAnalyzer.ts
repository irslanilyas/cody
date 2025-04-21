import { Issue } from "../types/issueTypes";
import { isFrameNode } from "framer-plugin";

// Constants for touch target requirements
const MIN_TOUCH_TARGET_SIZE = 44; // Minimum size in pixels for touch targets (WCAG 2.5.5)
const MIN_TOUCH_TARGET_SPACING = 8; // Minimum spacing between touch targets in pixels

// Simple UUID generation function
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Analyzes interactive elements for proper touch target size
 * @param nodes Array of nodes from the Framer project
 * @returns Array of touch target-related accessibility issues
 */
export async function analyzeTouchTargets(nodes: any[]): Promise<Issue[]> {
  const issues: Issue[] = [];

  // Find potential interactive elements as per Framer documentation
  const potentialInteractiveNodes = nodes.filter(node => {
    // Check if node is a frame
    if (!isFrameNode(node)) {
      return false;
    }
    
    try {
      // Heuristics to identify interactive elements according to Framer docs:
      // 1. Named like a button or interactive element
      const nameSuggestsInteractive = node.name && 
        /button|btn|link|tab|toggle|switch|menu|dropdown|select|checkbox|radio|slider/i.test(node.name);
      
      return nameSuggestsInteractive;
    } catch (error) {
      return false;
    }
  });

  for (const node of potentialInteractiveNodes) {
    try {
      // Get node dimensions using Framer API
      const rect = await node.getRect();
      if (!rect) continue;
      
      const { width, height } = rect;
      
      // Check if touch target is large enough
      if (width < MIN_TOUCH_TARGET_SIZE || height < MIN_TOUCH_TARGET_SIZE) {
        issues.push({
          id: generateUUID(),
          type: "touchTarget",
          severity: "critical",
          title: "Touch Target Too Small",
          description: `This interactive element is ${width}x${height}px, which is smaller than the recommended minimum size of ${MIN_TOUCH_TARGET_SIZE}x${MIN_TOUCH_TARGET_SIZE}px.`,
          wcagGuideline: "WCAG 2.1 AAA - 2.5.5 Target Size",
          wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/target-size.html",
          location: {
            nodeId: node.id,
            nodeName: node.name || "Interactive Element",
            nodePath: node.id
          },
          currentValue: `${width}x${height}px`,
          requiredValue: `${MIN_TOUCH_TARGET_SIZE}x${MIN_TOUCH_TARGET_SIZE}px minimum`,
          fixSuggestions: [
            {
              description: `Increase element size to at least ${MIN_TOUCH_TARGET_SIZE}x${MIN_TOUCH_TARGET_SIZE}px`,
              action: async () => {
                try {
                  // Calculate new dimensions while maintaining aspect ratio
                  const aspectRatio = width / height;
                  let newWidth = Math.max(width, MIN_TOUCH_TARGET_SIZE);
                  let newHeight = Math.max(height, MIN_TOUCH_TARGET_SIZE);
                  
                  // Update the element's size
                  await node.setAttributes({ 
                    width: newWidth,
                    height: newHeight
                  });
                } catch (error) {
                  console.error("Error resizing element:", error);
                }
              }
            }
          ]
        });
      }
      
      // Check spacing between adjacent interactive elements
      const otherInteractiveElements = potentialInteractiveNodes.filter(otherNode => otherNode.id !== node.id);
      
      for (const otherNode of otherInteractiveElements) {
        const otherRect = await otherNode.getRect();
        if (!otherRect) continue;
        
        // Calculate distance between elements
        const horizontalDistance = Math.min(
          Math.abs(rect.x + rect.width - otherRect.x),
          Math.abs(otherRect.x + otherRect.width - rect.x)
        );
        
        const verticalDistance = Math.min(
          Math.abs(rect.y + rect.height - otherRect.y),
          Math.abs(otherRect.y + otherRect.height - rect.y)
        );
        
        // Check if elements are adjacent (overlapping in one dimension)
        const isHorizontallyAdjacent = verticalDistance <= 0;
        const isVerticallyAdjacent = horizontalDistance <= 0;
        
        // Check spacing for adjacent elements
        if (isHorizontallyAdjacent && horizontalDistance < MIN_TOUCH_TARGET_SPACING && horizontalDistance >= 0) {
          issues.push({
            id: generateUUID(),
            type: "touchTarget",
            severity: "warning",
            title: "Touch Targets Too Close",
            description: `This interactive element is only ${horizontalDistance.toFixed(1)}px away from another interactive element. The recommended minimum spacing is ${MIN_TOUCH_TARGET_SPACING}px.`,
            wcagGuideline: "WCAG 2.1 AAA - 2.5.5 Target Size (Enhanced)",
            wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/target-size.html",
            location: {
              nodeId: node.id,
              nodeName: node.name || "Interactive Element",
              nodePath: node.id
            },
            currentValue: `${horizontalDistance.toFixed(1)}px spacing`,
            requiredValue: `${MIN_TOUCH_TARGET_SPACING}px minimum spacing`,
            fixSuggestions: [
              {
                description: "Increase spacing between interactive elements",
                action: async () => {
                  // This is complex and depends on layout logic - provide feedback only
                  console.log("This fix requires manual adjustment of element positions");
                }
              }
            ]
          });
        } else if (isVerticallyAdjacent && verticalDistance < MIN_TOUCH_TARGET_SPACING && verticalDistance >= 0) {
          issues.push({
            id: generateUUID(),
            type: "touchTarget",
            severity: "warning",
            title: "Touch Targets Too Close",
            description: `This interactive element is only ${verticalDistance.toFixed(1)}px away from another interactive element. The recommended minimum spacing is ${MIN_TOUCH_TARGET_SPACING}px.`,
            wcagGuideline: "WCAG 2.1 AAA - 2.5.5 Target Size (Enhanced)",
            wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/target-size.html",
            location: {
              nodeId: node.id,
              nodeName: node.name || "Interactive Element",
              nodePath: node.id
            },
            currentValue: `${verticalDistance.toFixed(1)}px spacing`,
            requiredValue: `${MIN_TOUCH_TARGET_SPACING}px minimum spacing`,
            fixSuggestions: [
              {
                description: "Increase spacing between interactive elements",
                action: async () => {
                  // This is complex and depends on layout logic - provide feedback only
                  console.log("This fix requires manual adjustment of element positions");
                }
              }
            ]
          });
        }
      }
    } catch (error) {
      console.error("Error analyzing touch target for node:", node.id, error);
    }
  }

  return issues;
}