/**
 * Represents the severity level of an accessibility issue
 */
export type IssueSeverity = "critical" | "warning" | "info";

/**
 * Represents the type of accessibility issue
 */
export type IssueType = 
  | "contrast" 
  | "textSize" 
  | "touchTarget" 
  | "altText" 
  | "colorBlindness" 
  | "navigation";

/**
 * Represents the location of an issue within the Framer project
 */
export interface IssueLocation {
  nodeId: string;
  nodeName: string;
  nodePath: string;
}

/**
 * Represents a fix suggestion for an accessibility issue
 */
export interface FixSuggestion {
  description: string;
  action: () => Promise<void>;
}

/**
 * Represents a single accessibility issue
 */
export interface Issue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  wcagGuideline?: string;
  wcagLink?: string;
  location: IssueLocation;
  currentValue?: string | number;
  requiredValue?: string | number;
  fixSuggestions: FixSuggestion[];
  screenshot?: string; // Base64 encoded image
}

/**
 * Represents filter options for issues
 */
export interface IssueFilters {
  severity: Record<IssueSeverity, boolean>;
  type: Record<IssueType, boolean>;
}