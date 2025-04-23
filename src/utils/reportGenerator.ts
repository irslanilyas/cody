import { Issue, IssueSeverity, IssueType } from "../types/issueTypes";
import { framer } from "framer-plugin";

/**
 * Attempts to capture a screenshot of a node
 * @param nodeId ID of the node to capture
 * @returns Promise<string | null> Base64 encoded screenshot or null if not possible
 */
export async function captureNodeScreenshot(nodeId: string): Promise<string | null> {
  try {
    // First, select and zoom to the node to prepare for screenshot
    await framer.setSelection([nodeId]);
    await (framer as any).zoomIntoView(nodeId);
    
    // Wait for zoom animation to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real implementation, we would capture the screenshot here
    // For now, we return null since we don't have direct access to screenshot functionality
    return null;
  } catch (error) {
    console.error("Error capturing node screenshot:", error);
    return null;
  }
}

/**
 * Generates an HTML accessibility report from issues
 * @param issues Array of accessibility issues
 * @returns HTML report as string
 */
export function generateHtmlReport(issues: Issue[]): string {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  
  // Count issues by severity
  const criticalCount = issues.filter(issue => issue.severity === "critical").length;
  const warningCount = issues.filter(issue => issue.severity === "warning").length;
  const infoCount = issues.filter(issue => issue.severity === "info").length;
  
  // Count issues by type
  const countByType: Record<IssueType, number> = {
    contrast: 0,
    textSize: 0,
    touchTarget: 0,
    altText: 0,
    colorBlindness: 0,
    navigation: 0
  };
  
  issues.forEach(issue => {
    countByType[issue.type]++;
  });
  
  // Generate HTML
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Audit Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3, h4 {
      color: #2d3748;
    }
    .report-header {
      margin-bottom: 30px;
      border-bottom: 1px solid #eaeaea;
      padding-bottom: 20px;
    }
    .report-meta {
      color: #666;
      font-size: 14px;
    }
    .summary-section {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      flex: 1;
      min-width: 200px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .summary-card h3 {
      margin-top: 0;
      border-bottom: 1px solid #eaeaea;
      padding-bottom: 10px;
    }
    .stat-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .stat-label {
      color: #666;
    }
    .stat-value {
      font-weight: 600;
    }
    .stat-value.critical {
      color: #e53e3e;
    }
    .stat-value.warning {
      color: #dd6b20;
    }
    .stat-value.info {
      color: #3182ce;
    }
    .issues-section {
      margin-top: 40px;
    }
    .issue-card {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .issue-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }
    .issue-type {
      font-size: 14px;
      color: #666;
    }
    .issue-severity {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .issue-severity.critical {
      background-color: #fed7d7;
      color: #e53e3e;
    }
    .issue-severity.warning {
      background-color: #feebc8;
      color: #dd6b20;
    }
    .issue-severity.info {
      background-color: #bee3f8;
      color: #3182ce;
    }
    .issue-details {
      margin-bottom: 15px;
    }
    .issue-location {
      background: #f7fafc;
      padding: 10px;
      border-radius: 4px;
      font-family: monospace;
      margin-bottom: 15px;
    }
    .issue-values {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
    }
    .value-item {
      flex: 1;
    }
    .value-label {
      font-weight: 600;
      font-size: 14px;
      color: #4a5568;
      margin-bottom: 4px;
    }
    .guideline {
      background: #f0fff4;
      padding: 12px;
      border-radius: 4px;
      border-left: 4px solid #48bb78;
      margin-bottom: 15px;
    }
    .guideline-header {
      font-weight: 600;
      margin-bottom: 5px;
    }
    .guideline-link {
      display: inline-block;
      margin-top: 5px;
      color: #3182ce;
      text-decoration: none;
    }
    .guideline-link:hover {
      text-decoration: underline;
    }
    .fixes-section {
      margin-top: 15px;
    }
    .fix-suggestion {
      padding-left: 20px;
      position: relative;
      margin-bottom: 8px;
    }
    .fix-suggestion:before {
      content: "•";
      position: absolute;
      left: 5px;
    }
    .screenshot {
      max-width: 100%;
      border-radius: 4px;
      border: 1px solid #eaeaea;
      margin-top: 15px;
    }
    .no-issues {
      background: #f0fff4;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      color: #2f855a;
    }
    .chart-container {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      gap: 20px;
    }
    .chart {
      flex: 1;
      min-height: 200px;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .chart-header {
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 16px;
      font-weight: 600;
    }
    .bar-chart {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      justify-content: flex-end;
    }
    .bar-container {
      display: flex;
      align-items: flex-end;
      height: 200px;
      gap: 15px;
    }
    .bar-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-grow: 1;
    }
    .bar {
      width: 40px;
      background-color: #3182ce;
      margin-bottom: 10px;
      border-radius: 4px 4px 0 0;
    }
    .bar.critical {
      background-color: #e53e3e;
    }
    .bar.warning {
      background-color: #dd6b20;
    }
    .bar.info {
      background-color: #3182ce;
    }
    .bar-label {
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .table-of-contents {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .toc-title {
      font-size: 18px;
      margin-top: 0;
      margin-bottom: 15px;
    }
    .toc-list {
      list-style-type: none;
      padding-left: 0;
    }
    .toc-item {
      margin-bottom: 8px;
    }
    .toc-link {
      color: #3182ce;
      text-decoration: none;
    }
    .toc-link:hover {
      text-decoration: underline;
    }
    @media print {
      body {
        font-size: 12px;
      }
      .chart-container {
        page-break-inside: avoid;
      }
      .issue-card {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <h1>Accessibility Audit Report</h1>
    <p class="report-meta">Generated on ${timestamp}</p>
  </div>
  
  <div class="summary-section">
    <div class="summary-card">
      <h3>Issues by Severity</h3>
      <div class="stat-item">
        <span class="stat-label">Critical</span>
        <span class="stat-value critical">${criticalCount}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Warning</span>
        <span class="stat-value warning">${warningCount}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Info</span>
        <span class="stat-value info">${infoCount}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total</span>
        <span class="stat-value">${issues.length}</span>
      </div>
    </div>
    
    <div class="summary-card">
      <h3>Issues by Type</h3>
      <div class="stat-item">
        <span class="stat-label">Contrast</span>
        <span class="stat-value">${countByType.contrast}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Text Size</span>
        <span class="stat-value">${countByType.textSize}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Touch Target</span>
        <span class="stat-value">${countByType.touchTarget}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Alt Text</span>
        <span class="stat-value">${countByType.altText}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Color Blindness</span>
        <span class="stat-value">${countByType.colorBlindness}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Navigation</span>
        <span class="stat-value">${countByType.navigation}</span>
      </div>
    </div>
  </div>
  
  <!-- Add bar charts for visual representation -->
  <div class="chart-container">
    <div class="chart">
      <h3 class="chart-header">Issues by Severity</h3>
      <div class="bar-container">
        <div class="bar-group">
          <div class="bar critical" style="height: ${criticalCount > 0 ? Math.min(200, criticalCount * 20) : 0}px;"></div>
          <div class="bar-label">Critical<br>${criticalCount}</div>
        </div>
        <div class="bar-group">
          <div class="bar warning" style="height: ${warningCount > 0 ? Math.min(200, warningCount * 20) : 0}px;"></div>
          <div class="bar-label">Warning<br>${warningCount}</div>
        </div>
        <div class="bar-group">
          <div class="bar info" style="height: ${infoCount > 0 ? Math.min(200, infoCount * 20) : 0}px;"></div>
          <div class="bar-label">Info<br>${infoCount}</div>
        </div>
      </div>
    </div>
    
    <div class="chart">
      <h3 class="chart-header">Issues by Type</h3>
      <div class="bar-container">
        ${Object.entries(countByType).map(([type, count]) => `
          <div class="bar-group">
            <div class="bar" style="height: ${count > 0 ? Math.min(200, count * 20) : 0}px;"></div>
            <div class="bar-label">${formatIssueType(type as IssueType)}<br>${count}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
  
  <!-- Table of contents -->
  ${issues.length > 0 ? `
    <div class="table-of-contents">
      <h3 class="toc-title">Table of Contents</h3>
      <ol class="toc-list">
        ${issues.map((issue, index) => `
          <li class="toc-item">
            <a href="#issue-${issue.id}" class="toc-link">
              ${index + 1}. ${issue.title} (${formatIssueType(issue.type)}, ${issue.severity})
            </a>
          </li>
        `).join('')}
      </ol>
    </div>
  ` : ''}
  
  <div class="issues-section">
    <h2>Detailed Issues</h2>
    
    ${issues.length === 0 ? 
      '<div class="no-issues"><h3>No accessibility issues found!</h3><p>Great job on creating an accessible design.</p></div>' :
      issues.map((issue, index) => `
        <div id="issue-${issue.id}" class="issue-card">
          <div class="issue-header">
            <div>
              <h3 class="issue-title">${index + 1}. ${issue.title}</h3>
              <span class="issue-type">${formatIssueType(issue.type)}</span>
            </div>
            <span class="issue-severity ${issue.severity}">${issue.severity}</span>
          </div>
          
          <div class="issue-details">
            <p>${issue.description}</p>
          </div>
          
          <div class="issue-location">
            Location: ${issue.location.nodeName} (${issue.location.nodePath})
          </div>
          
          ${issue.currentValue || issue.requiredValue ? `
            <div class="issue-values">
              ${issue.currentValue ? `
                <div class="value-item">
                  <div class="value-label">Current Value</div>
                  <div>${issue.currentValue}</div>
                </div>
              ` : ''}
              
              ${issue.requiredValue ? `
                <div class="value-item">
                  <div class="value-label">Required Value</div>
                  <div>${issue.requiredValue}</div>
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          ${issue.wcagGuideline ? `
            <div class="guideline">
              <div class="guideline-header">${issue.wcagGuideline}</div>
              ${issue.wcagLink ? `<a href="${issue.wcagLink}" target="_blank" class="guideline-link">Learn more about this guideline</a>` : ''}
            </div>
          ` : ''}
          
          ${issue.fixSuggestions.length > 0 ? `
            <div class="fixes-section">
              <h4>Suggested Fixes:</h4>
              ${issue.fixSuggestions.map(fix => `
                <div class="fix-suggestion">
                  ${fix.description}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${issue.screenshot ? `
            <img src="${issue.screenshot}" alt="Screenshot of the issue" class="screenshot">
          ` : ''}
        </div>
      `).join('')
    }
  </div>
  
  <footer>
    <p>This report was generated by the Framer Accessibility Checker plugin.</p>
  </footer>
</body>
</html>
`;
}

/**
 * Formats an issue type for display
 * @param type Issue type
 * @returns Formatted display name
 */
function formatIssueType(type: IssueType): string {
  switch (type) {
    case "contrast":
      return "Contrast";
    case "textSize":
      return "Text Size";
    case "touchTarget":
      return "Touch Target";
    case "altText":
      return "Alternative Text";
    case "colorBlindness":
      return "Color Blindness";
    case "navigation":
      return "Navigation & Structure";
    default:
      return type;
  }
}

/**
 * Generates a CSV report from accessibility issues
 * @param issues Array of accessibility issues
 * @returns CSV data as string
 */
export function generateCsvReport(issues: Issue[]): string {
  // Define CSV headers
  const headers = [
    "ID",
    "Type",
    "Severity",
    "Title",
    "Description",
    "Location",
    "Current Value",
    "Required Value",
    "WCAG Guideline",
    "Fix Suggestions"
  ];
  
  // Generate CSV rows
  const rows = issues.map(issue => [
    issue.id,
    issue.type,
    issue.severity,
    issue.title,
    issue.description,
    `${issue.location.nodeName} (${issue.location.nodePath})`,
    issue.currentValue || "",
    issue.requiredValue || "",
    issue.wcagGuideline || "",
    issue.fixSuggestions.map(fix => fix.description).join("; ")
  ]);
  
  // Combine headers and rows
  const csvData = [
    headers,
    ...rows
  ].map(row => 
    row.map(cell => 
      // Escape CSV special characters
      `"${String(cell).replace(/"/g, '""')}"`
    ).join(",")
  ).join("\n");
  
  return csvData;
}

/**
 * Exports the report to a file
 * @param reportData Report data (HTML or CSV)
 * @param format Report format ("html" or "csv")
 */
export function exportReport(reportData: string, format: "html" | "csv"): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `accessibility-report-${timestamp}.${format}`;
  
  // Create a blob and download link
  const blob = new Blob([reportData], { type: format === "html" ? "text/html" : "text/csv" });
  const url = URL.createObjectURL(blob);
  
  // Create and trigger download
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  
  // Clean up
  URL.revokeObjectURL(url);
}