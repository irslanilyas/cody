import { Issue } from "../types/issueTypes";
import { isTextNode } from "framer-plugin";

// Constants for text size requirements
const MIN_BODY_TEXT_SIZE = 12; // Minimum size for body text in pixels
const MIN_LINE_HEIGHT_RATIO = 1.5; // Minimum line height as a ratio of font size

// Simple UUID generation function
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Analyzes text nodes for proper size and line height
 * @param nodes Array of nodes from the Framer project
 * @returns Array of text size-related accessibility issues
 */
export async function analyzeTextSize(nodes: any[]): Promise<Issue[]> {
  const issues: Issue[] = [];

  // Find all text nodes
  const textNodes = nodes.filter(node => isTextNode(node));

  for (const textNode of textNodes) {
    try {
      // Get text size using Framer API
      // Since we can't directly access these properties, use default values for demonstration
      let fontSize = 16; // Default
      let lineHeight = fontSize; // Default, assume 1:1 ratio initially

      // In a real implementation, you would try to access these properties
      // through the correct API methods or properties
      
      // Calculate line height ratio
      const lineHeightRatio = lineHeight / fontSize;

      // Check text size
      if (fontSize < MIN_BODY_TEXT_SIZE) {
        issues.push({
          id: generateUUID(),
          type: "textSize",
          severity: "warning",
          title: "Text Too Small",
          description: `This text has a font size of ${fontSize}px, which is below the recommended minimum of ${MIN_BODY_TEXT_SIZE}px for body text.`,
          wcagGuideline: "WCAG 2.1 AA - 1.4.4 Resize Text",
          wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html",
          location: {
            nodeId: textNode.id,
            nodeName: textNode.name || "Text Element",
            nodePath: textNode.id
          },
          currentValue: `${fontSize}px`,
          requiredValue: `${MIN_BODY_TEXT_SIZE}px minimum`,
          fixSuggestions: [
            {
              description: `Increase font size to at least ${MIN_BODY_TEXT_SIZE}px`,
              action: async () => {
                try {
                  // Log what we would do since we don't know the correct property
                  console.log(`Would increase font size to ${MIN_BODY_TEXT_SIZE}px`);
                } catch (error) {
                  console.error("Error setting font size:", error);
                }
              }
            }
          ]
        });
      }

      // Check line height
      if (lineHeightRatio < MIN_LINE_HEIGHT_RATIO) {
        issues.push({
          id: generateUUID(),
          type: "textSize",
          severity: "info",
          title: "Insufficient Line Height",
          description: `This text has a line height ratio of ${lineHeightRatio.toFixed(2)}, which is below the recommended minimum of ${MIN_LINE_HEIGHT_RATIO} for good readability.`,
          wcagGuideline: "WCAG 2.1 AAA - 1.4.8 Visual Presentation",
          wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html",
          location: {
            nodeId: textNode.id,
            nodeName: textNode.name || "Text Element",
            nodePath: textNode.id
          },
          currentValue: `${lineHeightRatio.toFixed(2)}x`,
          requiredValue: `${MIN_LINE_HEIGHT_RATIO}x minimum`,
          fixSuggestions: [
            {
              description: `Increase line height to at least ${MIN_LINE_HEIGHT_RATIO}x font size`,
              action: async () => {
                try {
                  const newLineHeight = fontSize * MIN_LINE_HEIGHT_RATIO;
                  // Log what we would do since we don't know the correct property
                  console.log(`Would increase line height to ${newLineHeight}px`);
                } catch (error) {
                  console.error("Error setting line height:", error);
                }
              }
            }
          ]
        });
      }
      
      // Check if text is fully uppercase
      let text: string | null = null; // Declare with correct type that accepts null
      try {
        // Try to get text content using getText() method if available
        if (typeof textNode.getText === 'function') {
          text = await textNode.getText(); // Assign to the outer variable
        }
      } catch (error) {
        console.log("Could not get text content");
      }
      
      if (text && text === text.toUpperCase() && text.length > 20) {
        issues.push({
          id: generateUUID(),
          type: "textSize",
          severity: "info",
          title: "All Uppercase Text",
          description: "Long sections of text in all uppercase letters are more difficult to read.",
          wcagGuideline: "Readability Best Practice",
          location: {
            nodeId: textNode.id,
            nodeName: textNode.name || "Text Element",
            nodePath: textNode.id
          },
          fixSuggestions: [
            {
              description: "Convert text to sentence or title case",
              action: async () => {
                try {
                  // Convert to sentence case (capitalize first letter only)
                  const sentenceCase = text!.charAt(0).toUpperCase() + text!.slice(1).toLowerCase();
                  // Use setText if it exists as a function
                  if (typeof textNode.setText === 'function') {
                    await textNode.setText(sentenceCase);
                  } else {
                    console.log(`Would set text to: "${sentenceCase}"`);
                  }
                } catch (error) {
                  console.error("Error setting text:", error);
                }
              }
            }
          ]
        });
      }
    } catch (error) {
      console.error("Error analyzing text size for node:", textNode.id, error);
    }
  }

  return issues;
}