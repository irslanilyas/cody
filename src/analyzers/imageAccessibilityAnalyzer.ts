import { Issue } from "../types/issueTypes";
import { isFrameNode } from "framer-plugin";

// Simple UUID generation function
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Analyzes image elements for accessibility issues like missing alt text
 * @param nodes Array of nodes from the Framer project
 * @returns Array of image accessibility issues
 */
export async function analyzeImageAccessibility(nodes: any[]): Promise<Issue[]> {
  const issues: Issue[] = [];

  // Find nodes with images based on Framer documentation
  const nodesWithImage = nodes.filter(node => {
    // Check if node has a background image
    if (isFrameNode(node) && node.backgroundImage) {
      return true;
    }
    
    return false;
  });

  for (const node of nodesWithImage) {
    try {
      let imageAsset;
      let hasAltText = false;
      
      // Check if it's a frame with background image
      if (isFrameNode(node) && node.backgroundImage) {
        imageAsset = node.backgroundImage;
        hasAltText = !!(imageAsset && imageAsset.altText && imageAsset.altText.trim() !== "");
      }
      
      if (!hasAltText) {
        issues.push({
          id: generateUUID(),
          type: "altText",
          severity: "critical",
          title: "Missing Alt Text",
          description: "This image does not have alternative text, which is required for screen reader users to understand the content.",
          wcagGuideline: "WCAG 2.1 A - 1.1.1 Non-text Content",
          wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html",
          location: {
            nodeId: node.id,
            nodeName: node.name || "Image Element",
            nodePath: node.id
          },
          fixSuggestions: [
            {
              description: "Add descriptive alt text to the image",
              action: async () => {
                try {
                  if (isFrameNode(node) && node.backgroundImage) {
                    // Create a clone of the image with alt text
                    const updatedImage = node.backgroundImage.cloneWithAttributes({
                      altText: "Description of image" // Default placeholder text
                    });
                    
                    // Update the node with the new image
                    await node.setAttributes({
                      backgroundImage: updatedImage
                    });
                  }
                } catch (error) {
                  console.error("Error setting alt text:", error);
                }
              }
            }
          ]
        });
      } 
      else if (imageAsset && imageAsset.altText && imageAsset.altText.trim().toLowerCase() === "image") {
        // Check for non-descriptive alt text
        issues.push({
          id: generateUUID(),
          type: "altText",
          severity: "warning",
          title: "Non-descriptive Alt Text",
          description: 'This image has generic alt text ("image") which is not descriptive enough for screen reader users.',
          wcagGuideline: "WCAG 2.1 A - 1.1.1 Non-text Content",
          wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html",
          location: {
            nodeId: node.id,
            nodeName: node.name || "Image Element",
            nodePath: node.id
          },
          currentValue: `Alt text: "${imageAsset.altText}"`,
          requiredValue: "Descriptive alternative text",
          fixSuggestions: [
            {
              description: "Add more descriptive alt text",
              action: async () => {
                try {
                  if (isFrameNode(node) && node.backgroundImage) {
                    const updatedImage = node.backgroundImage.cloneWithAttributes({
                      altText: "Descriptive text about this image" // Better placeholder
                    });
                    
                    await node.setAttributes({
                      backgroundImage: updatedImage
                    });
                  }
                } catch (error) {
                  console.error("Error setting alt text:", error);
                }
              }
            }
          ]
        });
      }
      
      // Check if image is decorative but has alt text
      // This is a bit of a heuristic - we look at the image's context and size
      const rect = await node.getRect();
      const isSmallImage = rect && (rect.width < 24 || rect.height < 24);
      const nameIndicatesDecorative = node.name && /icon|decoration|divider|separator|ornament/i.test(node.name);
      
      if (imageAsset && imageAsset.altText && imageAsset.altText.trim() !== "" && 
          (isSmallImage || nameIndicatesDecorative)) {
        issues.push({
          id: generateUUID(),
          type: "altText",
          severity: "info",
          title: "Possibly Decorative Image with Alt Text",
          description: "This appears to be a decorative image. Decorative images should have empty alt text (alt=\"\") rather than descriptive text.",
          wcagGuideline: "WCAG 2.1 A - 1.1.1 Non-text Content",
          wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html",
          location: {
            nodeId: node.id,
            nodeName: node.name || "Image Element",
            nodePath: node.id
          },
          currentValue: `Alt text: "${imageAsset.altText}"`,
          requiredValue: 'Empty alt text (alt="")',
          fixSuggestions: [
            {
              description: "Set empty alt text for decorative image",
              action: async () => {
                try {
                  if (isFrameNode(node) && node.backgroundImage) {
                    const updatedImage = node.backgroundImage.cloneWithAttributes({
                      altText: "" // Empty alt text for decorative images
                    });
                    
                    await node.setAttributes({
                      backgroundImage: updatedImage
                    });
                  }
                } catch (error) {
                  console.error("Error setting alt text:", error);
                }
              }
            }
          ]
        });
      }
    } catch (error) {
      console.error("Error analyzing image accessibility for node:", node.id, error);
    }
  }

  return issues;
}