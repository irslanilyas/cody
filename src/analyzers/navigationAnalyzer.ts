import { Issue } from "../types/issueTypes";
import { isFrameNode, isTextNode } from "framer-plugin";

// Simple UUID generation function
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Define interfaces to help with type checking
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface NodeWithRect {
  node: any;
  rect: Rect;
}

/**
 * Analyzes the reading order and navigation structure
 * @param nodes Array of nodes from the Framer project
 * @returns Array of navigation-related accessibility issues
 */
export async function analyzeNavigation(nodes: any[]): Promise<Issue[]> {
  const issues: Issue[] = [];

  // Get all frame nodes that might be containers
  const containerNodes = nodes.filter(node => 
    isFrameNode(node) && node.name && 
    /container|section|layout|view|page|screen|panel|group/i.test(node.name)
  );

  // Analyze reading order within containers
  for (const container of containerNodes) {
    try {
      // Get all children of the container
      const children = await container.getChildren();
      if (!children || children.length < 2) {
        continue;
      }
      
      // Get rectangles for all children
      const childRects = await Promise.all(
        children.map(async (child: any) => {
          const rect = await child.getRect();
          return {
            node: child,
            rect
          };
        })
      );
      
      // Filter out nodes without proper rectangles
      const validChildRects = childRects.filter((item): item is NodeWithRect => item.rect !== undefined);
      
      // Check if visual order matches DOM order
      // We do this by sorting by y-position and comparing to the original order
      const visualOrder = [...validChildRects].sort((a, b) => a.rect.y - b.rect.y);
      
      let hasReadingOrderIssue = false;
      for (let i = 0; i < validChildRects.length - 1; i++) {
        // Check if the next element in DOM order is at least 2 positions away in visual order
        const domIndex = validChildRects.findIndex(item => item.node.id === visualOrder[i].node.id);
        if (Math.abs(domIndex - i) > 1) {
          hasReadingOrderIssue = true;
          break;
        }
      }
      
      if (hasReadingOrderIssue) {
        issues.push({
          id: generateUUID(),
          type: "navigation",
          severity: "warning",
          title: "Potentially Confusing Reading Order",
          description: "The visual arrangement of elements in this container may not match the expected reading order, which can be confusing for screen reader users.",
          wcagGuideline: "WCAG 2.1 A - 1.3.2 Meaningful Sequence",
          wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/meaningful-sequence.html",
          location: {
            nodeId: container.id,
            nodeName: container.name || "Container",
            nodePath: container.id
          },
          fixSuggestions: [
            {
              description: "Reorder elements to match visual reading order",
              action: async () => {
                // This requires manual intervention
                console.log("This fix requires manual reordering of elements");
              }
            }
          ]
        });
      }
      
      // Check for headings and their levels
      // Use only name-based detection since fontSize property doesn't exist on TextNode
      const headings = children.filter((child: any) => 
        isTextNode(child) && 
        (child.name?.includes("heading") || child.name?.match(/h[1-6]/i))
      );
      
      if (headings.length > 1) {
        // Since we can't rely on fontSize, we'll use a heuristic based on node names
        // Sort headings by their heading level if available in the name (h1, h2, etc.)
        const sortedHeadings = [...headings].sort((a, b) => {
          // Try to extract heading level from name
          const aMatch = a.name?.match(/h([1-6])/i);
          const bMatch = b.name?.match(/h([1-6])/i);
          
          const aLevel = aMatch ? parseInt(aMatch[1]) : 999;
          const bLevel = bMatch ? parseInt(bMatch[1]) : 999;
          
          return aLevel - bLevel;
        });
        
        // Check for potential gaps in heading levels
        for (let i = 0; i < sortedHeadings.length - 1; i++) {
          const currentName = sortedHeadings[i].name || "";
          const nextName = sortedHeadings[i + 1].name || "";
          
          const currentMatch = currentName.match(/h([1-6])/i);
          const nextMatch = nextName.match(/h([1-6])/i);
          
          // If we can extract levels and there's a gap greater than 1
          if (currentMatch && nextMatch) {
            const currentLevel = parseInt(currentMatch[1]);
            const nextLevel = parseInt(nextMatch[1]);
            
            if (nextLevel - currentLevel > 1) {
              issues.push({
                id: generateUUID(),
                type: "navigation",
                severity: "info",
                title: "Heading Levels May Be Skipped",
                description: `There appears to be a gap between heading levels (${currentLevel} to ${nextLevel}). This can be confusing for screen reader users navigating by headings.`,
                wcagGuideline: "WCAG 2.1 A - 1.3.1 Info and Relationships",
                wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html",
                location: {
                  nodeId: sortedHeadings[i + 1].id,
                  nodeName: sortedHeadings[i + 1].name || "Heading",
                  nodePath: sortedHeadings[i + 1].id
                },
                currentValue: `Heading level: h${nextLevel} (after h${currentLevel})`,
                requiredValue: `Sequential heading levels (h${currentLevel} should be followed by h${currentLevel + 1})`,
                fixSuggestions: [
                  {
                    description: `Rename heading to h${currentLevel + 1} or adjust heading hierarchy`,
                    action: async () => {
                      // This would ideally involve renaming the node
                      console.log(`Would rename heading to h${currentLevel + 1}`);
                    }
                  }
                ]
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error analyzing navigation for container:", container.id, error);
    }
  }

  // Check for landmarks or semantic structure
  const hasPotentialHeader = nodes.some(node => 
    node.name && /header|banner/i.test(node.name)
  );
  
  const hasPotentialNavigation = nodes.some(node => 
    node.name && /nav|navigation|menu/i.test(node.name)
  );
  
  const hasPotentialMain = nodes.some(node => 
    node.name && /main|content/i.test(node.name)
  );
  
  const hasPotentialFooter = nodes.some(node => 
    node.name && /footer/i.test(node.name)
  );
  
  // Check if basic landmarks are missing
  if (!hasPotentialHeader || !hasPotentialMain || !hasPotentialNavigation || !hasPotentialFooter) {
    let missingLandmarks: string[] = [];
    
    if (!hasPotentialHeader) missingLandmarks.push("header");
    if (!hasPotentialNavigation) missingLandmarks.push("navigation");
    if (!hasPotentialMain) missingLandmarks.push("main content area");
    if (!hasPotentialFooter) missingLandmarks.push("footer");
    
    issues.push({
      id: generateUUID(),
      type: "navigation",
      severity: "info",
      title: "Missing Landmark Regions",
      description: `This design appears to be missing some standard landmark regions: ${missingLandmarks.join(", ")}. Landmarks help screen reader users navigate content.`,
      wcagGuideline: "WCAG 2.1 A - 1.3.1 Info and Relationships",
      wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html",
      location: {
        nodeId: containerNodes.length > 0 ? containerNodes[0].id : "root",
        nodeName: "Page Structure",
        nodePath: "root"
      },
      fixSuggestions: [
        {
          description: "Add missing landmark regions with appropriate names",
          action: async () => {
            // This requires manual intervention
            console.log("This fix requires manually adding landmark regions");
          }
        }
      ]
    });
  }

  // Check for keyboard focus indicators
  const potentialInteractiveElements = nodes.filter(node => {
    // Check for elements that might be interactive
    const isLikelyInteractive = node.name && 
      /button|link|input|checkbox|radio|tab|dropdown|menu|select/i.test(node.name);
    
    return isLikelyInteractive;
  });
  
  // Check if any elements have focus states defined
  const hasFocusStates = potentialInteractiveElements.some(node => {
    // Check for variants or properties that suggest focus states
    return node.name && /focus|focused|selected|active/i.test(node.name);
  });
  
  if (potentialInteractiveElements.length > 0 && !hasFocusStates) {
    issues.push({
      id: generateUUID(),
      type: "navigation",
      severity: "critical",
      title: "Missing Keyboard Focus Indicators",
      description: "Interactive elements do not appear to have visible focus states defined. Focus indicators are essential for keyboard navigation.",
      wcagGuideline: "WCAG 2.1 AA - 2.4.7 Focus Visible",
      wcagLink: "https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html",
      location: {
        nodeId: potentialInteractiveElements[0].id,
        nodeName: potentialInteractiveElements[0].name || "Interactive Element",
        nodePath: potentialInteractiveElements[0].id
      },
      fixSuggestions: [
        {
          description: "Add focus states to all interactive elements",
          action: async () => {
            // This requires manual intervention
            console.log("This fix requires manually adding focus states to components");
          }
        }
      ]
    });
  }

  return issues;
}