import { Issue } from "../types/issueTypes";
import { analyzeContrast } from "./contrastAnalyzer";
import { analyzeTextSize } from "./textSizeAnalyzer";
import { analyzeTouchTargets } from "./touchTargetAnalyzer";
import { analyzeImageAccessibility } from "./imageAccessibilityAnalyzer";
import { analyzeColorBlindness } from "./colorBlindnessAnalyzer";
import { analyzeNavigation } from "./navigationAnalyzer";

// Simple UUID generation function
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Runs a complete accessibility check on all nodes in the Framer project
 * @param nodes Array of nodes from the Framer project
 * @param options Optional settings for the accessibility check
 * @returns Array of accessibility issues found
 */
export async function runAccessibilityCheck(
  nodes: any[], 
  options?: { includeColorBlindness?: boolean }
): Promise<Issue[]> {
  if (!nodes || nodes.length === 0) {
    return [];
  }

  try {
    // Default options
    const checkOptions = {
      includeColorBlindness: options?.includeColorBlindness ?? true
    };

    // Run all analyzers in parallel for better performance
    const [
      contrastIssues,
      textSizeIssues,
      touchTargetIssues,
      altTextIssues,
      colorBlindnessIssues,
      navigationIssues
    ] = await Promise.all([
      analyzeContrast(nodes),
      analyzeTextSize(nodes),
      analyzeTouchTargets(nodes),
      analyzeImageAccessibility(nodes),
      analyzeColorBlindness(nodes),
      analyzeNavigation(nodes)
    ]);

    // Combine all issues (note: IDs are now assigned in each analyzer)
    const allIssues = [
      ...contrastIssues,
      ...textSizeIssues,
      ...touchTargetIssues,
      ...altTextIssues,
      ...colorBlindnessIssues,
      ...navigationIssues
    ];

    // Sort issues by severity (critical first, then warning, then info)
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return allIssues;
  } catch (error) {
    console.error("Error running accessibility check:", error);
    return [];
  }
}