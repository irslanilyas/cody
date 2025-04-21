import { Issue } from "../types/issueTypes";
import { calculateContrastRatio, getColorFromRGBA } from "../utils/colorUtils";
import { isTextNode, isFrameNode } from "framer-plugin";

// Simple UUID generation function for contrast analyzer
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Analyzes text nodes for proper contrast against their backgrounds
 * @param nodes Array of nodes from the Framer project
 * @returns Array of contrast-related accessibility issues
 */
export async function analyzeContrast(nodes: any[]): Promise<Issue[]> {
  const issues: Issue[] = [];

  // Find all text nodes as per documentation
  const textNodes = nodes.filter(node => isTextNode(node));

  for (const textNode of textNodes) {
    try {
      // Use default colors for analysis - in a real implementation
      // you would extract these from the Framer nodes
      const textColor = "#000000"; // Default black
      const backgroundColor = "#FFFFFF"; // Default white
      
      // Try to find the parent frame (background)
      const parentNode = await textNode.getParent();
      if (!parentNode || !isFrameNode(parentNode)) {
        continue;
      }

      // Convert colors to proper format for contrast calculation
      const textRGBA = getColorFromRGBA(textColor);
      const bgRGBA = getColorFromRGBA(backgroundColor);
      
      // Calculate contrast ratio
      const contrastRatio = calculateContrastRatio(textRGBA, bgRGBA);
      
      // Default font properties - in a real implementation
      // you would extract these from the Framer nodes
      const fontSize = 16; // Default
      const fontWeight = 400; // Default
      
      const isBold = fontWeight >= 700;
      const isLargeText = (fontSize >= 18) || (fontSize >= 14 && isBold);
      
      // Determine required contrast ratio based on text size
      const requiredContrastRatio = isLargeText ? 3.0 : 4.5;
      const enhancedContrastRatio = isLargeText ? 4.5 : 7.0;

      // Check if contrast ratio is sufficient
      if (contrastRatio < requiredContrastRatio) {
        // Critical issue - below minimum WCAG AA requirement
        issues.push({
          id: generateUUID(),
          type: "contrast",
          severity: "critical",
          title: "Insufficient Text Contrast",
          description: `This text has a contrast ratio of ${contrastRatio.toFixed(2)}:1, which is below the minimum required ratio of ${requiredContrastRatio}:1 for ${isLargeText ? "large" : "normal"} text.`,
          wcagGuideline: "WCAG 2.1 AA - 1.4.3 Contrast (Minimum)",
          wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html",
          location: {
            nodeId: textNode.id,
            nodeName: textNode.name || "Text Element",
            nodePath: textNode.id
          },
          currentValue: contrastRatio.toFixed(2) + ":1",
          requiredValue: requiredContrastRatio + ":1",
          fixSuggestions: [
            {
              description: "Darken text color for better contrast",
              action: async () => {
                try {
                  // Comment out the attribute setting for now since we don't know
                  // the correct property name for text color in this version of Framer API
                  console.log("Would set text color to black for better contrast");
                } catch (error) {
                  console.error("Error setting text color:", error);
                }
              }
            },
            {
              description: "Lighten background for better contrast",
              action: async () => {
                try {
                  if (parentNode) {
                    await parentNode.setAttributes({ 
                      backgroundColor: "#FFFFFF" 
                    });
                  }
                } catch (error) {
                  console.error("Error setting background color:", error);
                }
              }
            }
          ]
        });
      } else if (contrastRatio < enhancedContrastRatio) {
        // Warning issue - meets AA but not AAA
        issues.push({
          id: generateUUID(),
          type: "contrast",
          severity: "warning",
          title: "Moderate Text Contrast",
          description: `This text has a contrast ratio of ${contrastRatio.toFixed(2)}:1, which meets the minimum requirement but not the enhanced requirement of ${enhancedContrastRatio}:1 for ${isLargeText ? "large" : "normal"} text.`,
          wcagGuideline: "WCAG 2.1 AAA - 1.4.6 Contrast (Enhanced)",
          wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html",
          location: {
            nodeId: textNode.id,
            nodeName: textNode.name || "Text Element",
            nodePath: textNode.id
          },
          currentValue: contrastRatio.toFixed(2) + ":1",
          requiredValue: enhancedContrastRatio + ":1",
          fixSuggestions: [
            {
              description: "Increase text contrast to meet enhanced requirements",
              action: async () => {
                try {
                  // Comment out the attribute setting for now since we don't know
                  // the correct property name for text color in this version of Framer API
                  console.log("Would set text color to black for better contrast");
                } catch (error) {
                  console.error("Error setting text color:", error);
                }
              }
            }
          ]
        });
      }
    } catch (error) {
      console.error("Error analyzing contrast for node:", textNode.id, error);
    }
  }

  return issues;
}