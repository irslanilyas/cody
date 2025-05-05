// src/App.tsx
import React, { useState, useEffect } from "react";
import { framer, isFrameNode } from "framer-plugin";
import Dashboard from "./components/Dashboard";
import ReportModal from "./components/ReportModal";
import { Issue } from "./types/issueTypes";
import { runAccessibilityCheck } from "./analyzers/accessibilityScanner";
import "./App.css";
import "./styles/ReportModal.css";
import "./types/framerTypes";

// Add this component inside App.tsx, right before the usePermissions hook
const IssueDetailView: React.FC<{
  issue: Issue;
  onClose: () => void;
  onLocate: (issue: Issue) => void;
}> = ({ issue, onClose, onLocate }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content issue-detail-modal">
        <div className="modal-header">
          <h3>{issue.title}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="issue-detail-section">
            <div className="issue-location">
              <strong>Element:</strong> {issue.location.nodeName}
            </div>
            
            <div className="issue-description-full">
              <p>{issue.description}</p>
            </div>
            
            {issue.wcagGuideline && (
              <div className="wcag-guideline-section">
                <h4>WCAG Guideline:</h4>
                <div className="wcag-guideline">
                  <span>{issue.wcagGuideline}</span>
                  {issue.wcagLink && (
                    <a 
                      href={issue.wcagLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wcag-link"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 1.5H6.5C4.01472 1.5 2 3.51472 2 6V10C2 12.4853 4.01472 14.5 6.5 14.5H10.5C12.9853 14.5 15 12.4853 15 10V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M7.5 8.5L14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 6.5V2H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {issue.fixSuggestions && issue.fixSuggestions.length > 0 && (
              <div className="fix-suggestions-section">
                <h4>Suggested Fixes:</h4>
                <ul className="fix-suggestions-list">
                  {issue.fixSuggestions.map((suggestion, index) => (
                    <li key={index} className="fix-suggestion-item">
                      <div className="fix-suggestion-content">
                        <div className="bullet-point"></div>
                        <span>{suggestion.description}</span>
                      </div>
                      <button 
                        className="apply-fix-button"
                        onClick={() => suggestion.action()}
                      >
                        Apply Fix
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="locate-issue-button" 
            onClick={() => {
              onClose();
              setTimeout(() => onLocate(issue), 100);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 8.5C8.82843 8.5 9.5 7.82843 9.5 7C9.5 6.17157 8.82843 5.5 8 5.5C7.17157 5.5 6.5 6.17157 6.5 7C6.5 7.82843 7.17157 8.5 8 8.5Z" fill="white"/>
              <path d="M8 14C10.5 11.5 13 9.36396 13 6.5C13 3.63604 10.7614 1.5 8 1.5C5.23858 1.5 3 3.63604 3 6.5C3 9.36396 5.5 11.5 8 14Z" stroke="white" strokeWidth="2"/>
            </svg>
            Locate Issue
          </button>
          <button className="close-details-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom hook to check for permissions
function usePermissions() {
  const [canAccessNodes, setCanAccessNodes] = useState<boolean>(true);
  
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if (typeof (framer as any).isAllowedTo === 'function') {
          const hasNodePermission = await (framer as any).isAllowedTo('getNodesWithType');
          setCanAccessNodes(hasNodePermission);
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        setCanAccessNodes(true);
      }
    };
    
    checkPermissions();
    
    if (typeof (framer as any).subscribeToIsAllowedTo === 'function') {
      const unsubscribe = (framer as any).subscribeToIsAllowedTo('getNodesWithType', setCanAccessNodes);
      return () => unsubscribe && unsubscribe();
    }
  }, []);
  
  return canAccessNodes;
}

const App: React.FC = () => {
  // State declarations (keep only one set)
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanCompleted, setScanCompleted] = useState<boolean>(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState({
    currentPage: 0,
    totalPages: 0,
    nodesScanned: 0,
    issuesFound: 0
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const [freeScanCount, setFreeScanCount] = useState<number>(2);
  const [totalScans] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [expandedTypes, setExpandedTypes] = useState({
    contrast: false,
    touchTarget: false,
    colorBlindness: false,
    textSize: false,
    altText: false,
    navigation: false
  });

  const canAccessNodes = usePermissions();
  
  const [filters, setFilters] = useState({
    severity: {
      critical: true,
      warning: true,
      info: true,
    },
    type: {
      contrast: true,
      textSize: true,
      touchTarget: true,
      altText: true,
      colorBlindness: true,
      navigation: true,
    },
  });

  // Get counts by severity
  const criticalCount = issues.filter(issue => issue.severity === "critical").length;
  const warningCount = issues.filter(issue => issue.severity === "warning").length;
  const infoCount = issues.filter(issue => issue.severity === "info").length;

  // Get counts by type
  const contrastIssues = issues.filter(issue => issue.type === "contrast");
  const touchTargetIssues = issues.filter(issue => issue.type === "touchTarget");
  const textSizeIssues = issues.filter(issue => issue.type === "textSize");
  const altTextIssues = issues.filter(issue => issue.type === "altText");
  const colorBlindnessIssues = issues.filter(issue => issue.type === "colorBlindness");
  const navigationIssues = issues.filter(issue => issue.type === "navigation");

  // Helper function to filter issues by tab
  const filterIssuesByTab = (issues: Issue[], tab: string): Issue[] => {
    if (tab === "All") return issues;
    if (tab === "Critical") return issues.filter(issue => issue.severity === "critical");
    if (tab === "Warnings") return issues.filter(issue => issue.severity === "warning");
    if (tab === "Info") return issues.filter(issue => issue.severity === "info");
    return issues;
  };

  // Apply filters to issues
  useEffect(() => {
    // First, filter by severity (tab)
    let filtered = filterIssuesByTab(issues, activeTab);
    
    // Then apply type filters
    filtered = filtered.filter((issue) => {
      return filters.type[issue.type];
    });

    setFilteredIssues(filtered);
  }, [issues, filters, activeTab]);

  // Perform scan
  const performScan = async () => {
    // Reset state
    setScanProgress({
      currentPage: 0,
      totalPages: 0,
      nodesScanned: 0,
      issuesFound: 0
    });
    
    let allFoundIssues: Issue[] = [];
    
    try {
      // Get pages/frames
      let pages: any[] = [];
      try {
        const canvasRoot = await framer.getCanvasRoot();
        if (canvasRoot) {
          const rootChildren = await canvasRoot.getChildren();
          pages = rootChildren.filter(node => isFrameNode(node));
        }
        
        setScanProgress(prev => ({ ...prev, totalPages: pages.length || 1 }));
      } catch (e) {
        console.error("Error getting top-level frames:", e);
        pages = [];
      }
      
      // Process each page or scan entire project
      if (pages.length > 0) {
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          setScanProgress(prev => ({ ...prev, currentPage: i + 1 }));
          
          // Get nodes
          let frameNodes = [page];
          let textNodes: any[] = [];
          
          try {
            const pageFrameNodes = await page.getNodesWithType("FrameNode");
            frameNodes = [page, ...pageFrameNodes];
          } catch (e) {
            console.error(`Error getting frame nodes for page ${i + 1}:`, e);
          }
          
          try {
            textNodes = await page.getNodesWithType("TextNode");
          } catch (e) {
            console.error(`Error getting text nodes for page ${i + 1}:`, e);
          }
          
          // Process nodes
          const pageNodes = [...frameNodes, ...textNodes];
          setScanProgress(prev => ({ 
            ...prev, 
            nodesScanned: prev.nodesScanned + pageNodes.length 
          }));
          
          if (pageNodes.length === 0) continue;
          
          // Limit nodes to prevent performance issues
          const nodesToProcess = pageNodes.length > 500 ? pageNodes.slice(0, 500) : pageNodes;
          
          // Run scan - ensure color blindness analysis is included
          const pageIssues = await runAccessibilityCheck(nodesToProcess, { includeColorBlindness: true });
          
          // Update scan progress (not actual displayed issues yet)
          allFoundIssues = [...allFoundIssues, ...pageIssues];
          setScanProgress(prev => ({ 
            ...prev, 
            issuesFound: allFoundIssues.length 
          }));
        }
      } else {
        // Scan entire project
        let frameNodes: any[] = [];
        let textNodes: any[] = [];
        
        try {
          frameNodes = await framer.getNodesWithType("FrameNode");
        } catch (e) {
          console.error("Error getting frame nodes:", e);
        }
        
        try {
          textNodes = await framer.getNodesWithType("TextNode");
        } catch (e) {
          console.error("Error getting text nodes:", e);
        }
        
        const allNodes = [...frameNodes, ...textNodes];
        setScanProgress({
          totalPages: 1,
          currentPage: 1,
          nodesScanned: allNodes.length,
          issuesFound: 0
        });
        
        if (allNodes.length === 0) {
          setError("No nodes found to analyze. Please make sure you have content in your Framer project.");
          return [];
        }
        
        // Limit nodes
        const nodesToProcess = allNodes.length > 1000 ? allNodes.slice(0, 1000) : allNodes;
        
        // Run scan - ensure color blindness analysis is included
        allFoundIssues = await runAccessibilityCheck(nodesToProcess, { includeColorBlindness: true });
        
        // Update scan progress counter only
        setScanProgress(prev => ({ ...prev, issuesFound: allFoundIssues.length }));
      }
      
      // Return all found issues to be set after scan completes
      return allFoundIssues;
    } catch (error) {
      console.error("Error during scan:", error);
      throw error;
    }
  };

  // Handle scan
  const handleScan = async () => {
    if (!canAccessNodes) {
      setError("This plugin doesn't have permission to access nodes. Please check your permissions settings.");
      return;
    }
    
    // Decrement scan count
    if (freeScanCount > 0) {
      setFreeScanCount(prev => prev - 1);
    }
    
    setError(null);
    setIsScanning(true);
    setScanCompleted(false);
    setIssues([]); // Clear existing issues
    setActiveTab("All"); // Reset to All tab
    
    try {
      // Set timeout to prevent infinite scanning
      const scanPromise = performScan();
      const timeoutPromise = new Promise<Issue[]>((_, reject) => {
        setTimeout(() => reject(new Error("Scan timed out after 120 seconds")), 120000);
      });
      
      // Wait for scan to complete
      const foundIssues = await Promise.race([scanPromise, timeoutPromise]);
      
      // Only update issues after scan is complete
      setIssues(foundIssues || []);
      setScanCompleted(true);
    } catch (error) {
      console.error("Error scanning for accessibility issues:", error);
      setError(`Error scanning for accessibility issues: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (category: "severity" | "type", name: string, value: boolean) => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [name]: value,
      },
    }));
  };

  // Generate report
  const handleGenerateReport = () => {
    if (issues.length === 0) {
      setError("No accessibility issues to include in the report. Run a scan first.");
      return;
    }
    
    setShowReportModal(true);
  };

  // Helper function to get descriptions for each issue type
  const getIssueTypeDescription = (type: string): string => {
    switch (type) {
      case 'Contrast':
        return 'In this section you can see sections that potentially have contrast issues, meaning there is difficulty reading the content due to mismatched contrast.';
      case 'Touch Target':
        return 'These elements may be too small or too close together, making them difficult to tap accurately on touch screens.';
      case 'Text Size':
        return 'Text that is too small can be difficult to read, especially for users with visual impairments.';
      case 'Alt text':
        return 'Images without alternative text are not accessible to screen reader users or when images fail to load.';
      case 'Color Blindness':
        return 'Colors that rely solely on color to convey information may be difficult for users with color vision deficiencies.';
      case 'Navigation':
        return 'These issues affect how users navigate through the content, especially for keyboard and screen reader users.';
      default:
        return '';
    }
  };

  // Handle locate issue
  const handleLocateIssue = async (issue: Issue) => {
    if (!issue.location || !issue.location.nodeId) {
      console.error("Issue missing nodeId, cannot locate");
      setError("Could not locate this issue - node information is missing.");
      return;
    }
    
    try {
      console.log("Attempting to locate node:", issue.location.nodeId);
      
      // Try to get the node by ID
      let node;
      try {
        // Get all frame nodes
        const frameNodes = await framer.getNodesWithType("FrameNode");
        // Get all text nodes
        const textNodes = await framer.getNodesWithType("TextNode");
        // Combine all nodes
        const allNodes = [...frameNodes, ...textNodes];
        // Find the node with the matching ID
        node = allNodes.find(n => n.id === issue.location.nodeId);
      } catch (e) {
        console.error("Error finding node by ID:", e);
      }
      
      // Attempt to select and focus on the node
      try {
        // Try to use setSelection API with node ID
        try {
          await framer.setSelection([issue.location.nodeId]);
          console.log("Node selected via setSelection");
        } catch (selectError) {
          console.error("Error selecting via setSelection:", selectError);
          
          // Try alternative selection method
          if (typeof (framer as any).select === 'function') {
            await (framer as any).select(node);
            console.log("Node selected via legacy select method");
          }
          // Try focusing on node
          else if (typeof (node as any).focus === 'function') {
            await (node as any).focus();
            console.log("Node focused via node.focus");
          } else {
            console.warn("No selection or focus method available");
          }
        }
        
        // Try to center view on node
        try {
          if (typeof framer.zoomIntoView === 'function') {
            await framer.zoomIntoView(issue.location.nodeId);
            console.log("Zoomed into node:", issue.location.nodeId);
          } else if (typeof (framer as any).centerOnNode === 'function') {
            await (framer as any).centerOnNode(node);
            console.log("Centered on node");
          }
        } catch (zoomError) {
          console.error("Error zooming to node:", zoomError);
        }
      } catch (selectError) {
        console.error("Error selecting node:", selectError);
        setError("Found the element but couldn't focus on it.");
      }
    } catch (error) {
      console.error("Error in handleLocate:", error);
      setError(`Error locating element: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Handle show details
  const handleShowDetails = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  // Issue type components for the completed screen
  const issueTypeItem = (
    icon: React.ReactNode, 
    label: string, 
    issues: Issue[], 
    isExpanded: boolean, 
    toggleExpand: () => void
  ) => {
    // Filter issues by active tab first
    const tabFilteredIssues = filterIssuesByTab(issues, activeTab);
    
    // If no issues match the current tab filter, don't render anything
    if (tabFilteredIssues.length === 0) return null;
    
    const severityDot = (severity: string) => {
      switch (severity) {
        case 'critical':
          return <span className="severity-dot critical"></span>;
        case 'warning':
          return <span className="severity-dot warning"></span>;
        case 'info':
          return <span className="severity-dot info"></span>;
        default:
          return null;
      }
    };

    // Get the most severe issue type
    let mostSeverePriority = 3; // 1: critical, 2: warning, 3: info
    let mostSevereType = "info";
    
    tabFilteredIssues.forEach(issue => {
      if (issue.severity === "critical" && mostSeverePriority > 1) {
        mostSeverePriority = 1;
        mostSevereType = "critical";
      } else if (issue.severity === "warning" && mostSeverePriority > 2) {
        mostSeverePriority = 2;
        mostSevereType = "warning";
      }
    });

    return (
      <div className="issue-type-container">
      <div className="issue-type-header" onClick={toggleExpand}>
        <div className="issue-type-info">
          {icon}
          <span className="issue-type-label">{label}</span>
          {severityDot(mostSevereType)}
          <span className="issue-count">{tabFilteredIssues.length} {tabFilteredIssues.length === 1 ? 'Issue' : 'Issues'}</span>
        </div>
        <button className="expand-button">
          {isExpanded ? 'Collapse' : 'Expand'} 
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d={isExpanded ? "M4 10L8 6L12 10" : "M4 6L8 10L12 6"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        {isExpanded && (
        <div className="issue-type-content">
          <p className="issue-type-description">
            {getIssueTypeDescription(label)}
          </p>
          
          {tabFilteredIssues.map((issue) => (
            <div key={issue.id} className="issue-item-compact">
              {severityDot(issue.severity)}
              <div className="issue-info">
                <div className="issue-location">Element : {issue.location.nodeName}</div>
                <div className="issue-description">{issue.description}</div>
              </div>
              <div className="issue-actions">
                <button 
                  className="locate-button-small"
                  onClick={() => handleLocateIssue(issue)}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* SVG path simplified */}
                      <path d="M8 8.5C8.82843 8.5 9.5 7.82843 9.5 7C9.5 6.17157 8.82843 5.5 8 5.5C7.17157 5.5 6.5 6.17157 6.5 7C6.5 7.82843 7.17157 8.5 8 8.5Z" fill="white"/>
                      <path d="M8 14C10.5 11.5 13 9.36396 13 6.5C13 3.63604 10.7614 1.5 8 1.5C5.23858 1.5 3 3.63604 3 6.5C3 9.36396 5.5 11.5 8 14Z" stroke="white" strokeWidth="2"/>
                    </svg>
                    Locate
                </button>
                <button 
                  className="details-button"
                  onClick={() => handleShowDetails(issue)}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* SVG path simplified */}
                      <path d="M8 12.5V8M8 5.5V5M1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8Z" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Show Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const toggleExpand = (type: keyof typeof expandedTypes) => {
    setExpandedTypes(prev => ({...prev, [type]: !prev[type]}));
  };

  return (
    <div className="app-container">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {!canAccessNodes && (
        <div className="permission-warning">
          This plugin requires permission to access nodes in your Framer project.
        </div>
      )}
      
      {isScanning && (
        <div className="welcome-section">
          {/* First container: Welcome text, progress bar, and stats with gray background */}
          <div className="welcome-container">
            
            
            
            <div className="welcome-header">
            <h1>Welcome to Accessibility Checker</h1>
            <p>Analyse your framer project for accessibility issues</p>
          </div>
          <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${scanProgress.totalPages > 0 ? Math.min(100, (scanProgress.currentPage / scanProgress.totalPages) * 100) : 0}%` }}
              ></div>
            </div>
            <div className="scan-stats">
              <div className="stat-box">
                <div className="stat-icon">
                  {/* SVG icon for pages scanned (simplified) */}
                  <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.09665 5.54432H12.5294L9.09665 2.11161V5.54432ZM4.29086 14.4694C3.91326 14.4694 3.59013 14.335 3.32147 14.0664C3.0528 13.7977 2.91824 13.4743 2.91778 13.0963V11.0367H13.9024V13.0963C13.9024 13.4739 13.7681 13.7972 13.4994 14.0664C13.2308 14.3355 12.9074 14.4698 12.5294 14.4694H4.29086ZM0.858154 9.66357V8.29048H15.9621V9.66357H0.858154ZM2.91778 6.9174V2.11161C2.91778 1.73401 3.05234 1.41088 3.32147 1.14221C3.59059 0.873545 3.91372 0.738983 4.29086 0.738525H9.7832L13.9024 4.85778V6.9174H2.91778Z" fill="url(#paint0_linear_1_65)"/>
<defs>
<linearGradient id="paint0_linear_1_65" x1="0.858154" y1="0.738525" x2="14.5269" y2="15.7741" gradientUnits="userSpaceOnUse">
<stop offset="0.303331" stop-color="#33A7FF"/>
<stop offset="1" stop-color="#0066FF"/>
</linearGradient>
</defs>
</svg>

                </div>
                <div className="stat-count">{scanProgress.currentPage} of {scanProgress.totalPages}</div>
                <div className="stat-label">Pages Scanned</div>
              </div>
              
              <div className="stat-box">
                <div className="stat-icon">
                  {/* SVG icon for nodes scanned (simplified) */}
                  <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.59428 14.4685C1.93066 14.4685 1.3643 14.234 0.895191 13.7649C0.426083 13.2958 0.191528 12.7294 0.191528 12.0658C0.191528 11.4022 0.426083 10.8358 0.895191 10.3667C1.3643 9.89758 1.93066 9.66302 2.59428 9.66302C2.80023 9.66302 3.00046 9.68865 3.19497 9.73991C3.38947 9.79117 3.57254 9.8628 3.74417 9.95479L6.37003 7.32893V5.44105C5.86659 5.29231 5.45469 5.00924 5.13433 4.59185C4.81396 4.17446 4.65378 3.69093 4.65378 3.14128C4.65378 2.47766 4.88833 1.9113 5.35744 1.44219C5.82655 0.97308 6.39291 0.738525 7.05653 0.738525C7.72014 0.738525 8.28651 0.97308 8.75562 1.44219C9.22472 1.9113 9.45928 2.47766 9.45928 3.14128C9.45928 3.69048 9.29909 4.174 8.97873 4.59185C8.65836 5.0097 8.24646 5.29277 7.74303 5.44105V7.32893L10.3861 9.95479C10.5577 9.86325 10.738 9.79186 10.927 9.7406C11.116 9.68934 11.3133 9.66348 11.5188 9.66302C12.1824 9.66302 12.7488 9.89758 13.2179 10.3667C13.687 10.8358 13.9215 11.4022 13.9215 12.0658C13.9215 12.7294 13.687 13.2958 13.2179 13.7649C12.7488 14.234 12.1824 14.4685 11.5188 14.4685C10.8552 14.4685 10.2888 14.234 9.81969 13.7649C9.35058 13.2958 9.11603 12.7294 9.11603 12.0658C9.11603 11.8598 9.14166 11.6596 9.19292 11.4651C9.24417 11.2706 9.3158 11.0875 9.40779 10.9159L7.05653 8.56462L4.70527 10.9159C4.7968 11.0875 4.86842 11.2706 4.92014 11.4651C4.97186 11.6596 4.99749 11.8598 4.99703 12.0658C4.99703 12.7294 4.76247 13.2958 4.29337 13.7649C3.82426 14.234 3.25789 14.4685 2.59428 14.4685ZM11.5188 13.0955C11.8048 13.0955 12.0481 12.9955 12.2485 12.7955C12.449 12.5955 12.549 12.3523 12.5485 12.0658C12.5481 11.7793 12.4481 11.5363 12.2485 11.3367C12.049 11.1372 11.8057 11.0369 11.5188 11.036C11.2318 11.0351 10.9888 11.1353 10.7897 11.3367C10.5906 11.5381 10.4904 11.7811 10.489 12.0658C10.4877 12.3504 10.5879 12.5937 10.7897 12.7955C10.9915 12.9974 11.2346 13.0974 11.5188 13.0955ZM7.05653 4.17103C7.34257 4.17103 7.58582 4.07103 7.78628 3.87102C7.98673 3.67102 8.08674 3.42777 8.08628 3.14128C8.08582 2.85478 7.98582 2.61176 7.78628 2.41221C7.58673 2.21267 7.34348 2.11244 7.05653 2.11153C6.76957 2.11061 6.52655 2.21084 6.32746 2.41221C6.12838 2.61359 6.02815 2.85661 6.02678 3.14128C6.0254 3.42594 6.12563 3.66919 6.32746 3.87102C6.5293 4.07286 6.77232 4.17286 7.05653 4.17103ZM2.59428 13.0955C2.88032 13.0955 3.12357 12.9955 3.32403 12.7955C3.52449 12.5955 3.62449 12.3523 3.62403 12.0658C3.62357 11.7793 3.52357 11.5363 3.32403 11.3367C3.12449 11.1372 2.88124 11.0369 2.59428 11.036C2.30732 11.0351 2.0643 11.1353 1.86522 11.3367C1.66613 11.5381 1.5659 11.7811 1.56453 12.0658C1.56316 12.3504 1.66338 12.5937 1.86522 12.7955C2.06705 12.9974 2.31007 13.0974 2.59428 13.0955Z" fill="url(#paint0_linear_1_70)"/>
<defs>
<linearGradient id="paint0_linear_1_70" x1="0.191528" y1="0.738525" x2="13.9215" y2="14.4685" gradientUnits="userSpaceOnUse">
<stop offset="0.303331" stop-color="#33A7FF"/>
<stop offset="1" stop-color="#0066FF"/>
</linearGradient>
</defs>
</svg>

                </div>
                <div className="stat-count">{scanProgress.nodesScanned}</div>
                <div className="stat-label">Nodes Scanned</div>
              </div>
              
              <div className="stat-box">
                <div className="stat-icon">
                  {/* SVG icon for issues found (simplified) */}
                  <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.9955 12.7664L8.84569 1.34582C8.40979 0.536094 7.24861 0.536094 6.81235 1.34582L0.662899 12.7664C0.568255 12.9422 0.520804 13.1395 0.52518 13.3391C0.529555 13.5387 0.585606 13.7338 0.687862 13.9053C0.790118 14.0767 0.935085 14.2188 1.10861 14.3175C1.28214 14.4162 1.4783 14.4682 1.67794 14.4685H13.9787C14.1785 14.4686 14.3748 14.4167 14.5486 14.3181C14.7224 14.2195 14.8676 14.0776 14.9701 13.906C15.0725 13.7345 15.1288 13.5393 15.1332 13.3396C15.1377 13.1398 15.0902 12.9424 14.9955 12.7664ZM7.8292 12.7004C7.68647 12.7004 7.54694 12.6581 7.42826 12.5788C7.30958 12.4995 7.21708 12.3868 7.16245 12.2549C7.10783 12.123 7.09354 11.9779 7.12139 11.8379C7.14923 11.6979 7.21797 11.5693 7.31889 11.4684C7.41982 11.3675 7.54842 11.2988 7.68841 11.2709C7.8284 11.2431 7.97351 11.2574 8.10538 11.312C8.23725 11.3666 8.34996 11.4591 8.42926 11.5778C8.50856 11.6965 8.55088 11.836 8.55088 11.9787C8.55088 12.1701 8.47485 12.3537 8.33951 12.489C8.20417 12.6244 8.0206 12.7004 7.8292 12.7004ZM8.61295 5.44209L8.40583 9.84435C8.40583 9.99747 8.345 10.1443 8.23672 10.2526C8.12845 10.3609 7.9816 10.4217 7.82848 10.4217C7.67536 10.4217 7.52851 10.3609 7.42023 10.2526C7.31196 10.1443 7.25113 9.99747 7.25113 9.84435L7.04401 5.44389C7.03936 5.33874 7.05592 5.23372 7.09271 5.13511C7.12951 5.03649 7.18578 4.9463 7.25818 4.86989C7.33058 4.79349 7.41761 4.73244 7.51411 4.69039C7.6106 4.64835 7.71457 4.62615 7.81982 4.62514H7.8274C7.93337 4.62509 8.03825 4.6465 8.13571 4.6881C8.23317 4.72969 8.3212 4.7906 8.39448 4.86715C8.46776 4.9437 8.52477 5.0343 8.56207 5.13349C8.59937 5.23267 8.61618 5.33839 8.6115 5.44425L8.61295 5.44209Z" fill="url(#paint0_linear_1_75)"/>
<defs>
<linearGradient id="paint0_linear_1_75" x1="0.524902" y1="0.738525" x2="14.2285" y2="15.3191" gradientUnits="userSpaceOnUse">
<stop offset="0.303331" stop-color="#33A7FF"/>
<stop offset="1" stop-color="#0066FF"/>
</linearGradient>
</defs>
</svg>

                </div>
                <div className="stat-count">{scanProgress.issuesFound}</div>
                <div className="stat-label">Issues Found</div>
              </div>
            </div>
          </div>
          
          {/* Second container: Loading spinner with white background */}
          <div className="instructions-container">
            <div className="instruction-box">
              <div className="loading-spinner"></div>
            </div>
          </div>
        </div>
      )}
      
      {!isScanning && scanCompleted && issues.length > 0 && (
  <div className="scan-completed-section">
    {/* First container: Scan completed text and buttons */}
    <div className="scan-completed-header">
      <div className="completed-header">
        <h1>Scan Completed</h1>
        
        {/* Show empty state message when no issues match current tab */}
        {activeTab !== "All" && filterIssuesByTab(issues, activeTab).length === 0 && (
          <div className="empty-state" style={{ marginTop: "16px" }}>
            <h3 className="empty-state-title">No {activeTab} Issues Found</h3>
            <p className="empty-state-description">
              There are no {activeTab.toLowerCase()} level issues detected in your design.
              {activeTab === "Critical" && " That's great news for accessibility!"}
            </p>
          </div>
        )}
        
        {filterIssuesByTab(issues, activeTab).length > 0 && (
          <p>Generate a report or click the scan button to scan again</p>
        )}
      </div>
      
      <div className="buttons-container">
        <button className="scan-button" onClick={handleScan}>
          <span className="accessibility-icon">
            <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.95731 3.20796C5.64007 3.20796 5.32996 3.11388 5.06619 2.93764C4.80242 2.76139 4.59683 2.51088 4.47543 2.21779C4.35403 1.92471 4.32226 1.6022 4.38415 1.29106C4.44604 0.979917 4.59881 0.694115 4.82313 0.469795C5.04745 0.245475 5.33325 0.0927105 5.64439 0.0308207C5.95553 -0.0310691 6.27804 0.00069499 6.57113 0.122096C6.86422 0.243498 7.11472 0.449083 7.29097 0.712856C7.46722 0.976629 7.56129 1.28674 7.56129 1.60398C7.56083 2.02924 7.3917 2.43695 7.09099 2.73766C6.79029 3.03837 6.38257 3.2075 5.95731 3.20796Z" fill="white"/>
              <path d="M10.9984 3.23088L10.9855 3.23432L10.9735 3.23804C10.9449 3.24606 10.9162 3.25465 10.8876 3.26353C10.3545 3.41992 7.76755 4.14916 5.94503 4.14916C4.2514 4.14916 1.89842 3.51902 1.1457 3.30507C1.07078 3.27611 0.994277 3.25144 0.916559 3.23117C0.372352 3.08796 0 3.64075 0 4.14601C0 4.64639 0.449687 4.8847 0.90367 5.05569V5.06371L3.63101 5.91554C3.9097 6.02238 3.98417 6.1315 4.02054 6.22602C4.13884 6.52935 4.04432 7.12998 4.0108 7.33964L3.84468 8.62855L2.92268 13.6751C2.91981 13.6888 2.91723 13.7029 2.91494 13.7172L2.90836 13.7535C2.84191 14.2161 3.18161 14.665 3.82491 14.665C4.38631 14.665 4.63406 14.2774 4.74147 13.7501C4.84888 13.2228 5.54346 9.23692 5.94446 9.23692C6.34545 9.23692 7.1715 13.7501 7.1715 13.7501C7.27891 14.2774 7.52667 14.665 8.08806 14.665C8.73309 14.665 9.07279 14.2141 9.00462 13.7501C8.99877 13.7111 8.99151 13.6723 8.98285 13.6338L8.04825 8.62913L7.88241 7.34021C7.76239 6.5895 7.85892 6.34145 7.89157 6.28331C7.89246 6.28194 7.89322 6.28051 7.89386 6.27901C7.9248 6.22173 8.06572 6.09341 8.39453 5.96996L10.9517 5.07603C10.9674 5.07184 10.9829 5.06687 10.9981 5.06113C11.4564 4.88928 11.9147 4.65155 11.9147 4.14658C11.9147 3.64161 11.5426 3.08796 10.9984 3.23088Z" fill="white"/>
            </svg>
          </span>
          <span className="scan-button-text">Scan again</span>
        </button>
        <button className="generate-report-button" onClick={handleGenerateReport}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <path d="M12 11h4"/>
            <path d="M12 16h4"/>
            <path d="M8 11h.01"/>
            <path d="M8 16h.01"/>
          </svg>
          Generate Report
        </button>
      </div>
    </div>
    
      <div className="second-container">
            {/* Stats boxes showing issue counts by severity */}
            <div className="severity-stats">
              <div className="severity-box critical" onClick={() => setActiveTab(activeTab === "Critical" ? "All" : "Critical")}>
                <div className="severity-icon">
                <svg width="21" height="22" viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="0.117188" y="0.738525" width="20.5086" height="20.57" rx="10.2543" fill="#FEE2E2"/>
<path d="M10.3715 13.6459C10.5201 13.6459 10.6447 13.5956 10.7454 13.4949C10.8461 13.3942 10.8963 13.2697 10.8959 13.1214C10.8956 12.9732 10.8452 12.8487 10.7449 12.748C10.6445 12.6473 10.5201 12.5969 10.3715 12.5969C10.2228 12.5969 10.0984 12.6473 9.99802 12.748C9.89767 12.8487 9.84731 12.9732 9.84696 13.1214C9.84661 13.2697 9.89697 13.3943 9.99802 13.4954C10.0991 13.5964 10.2235 13.6466 10.3715 13.6459ZM9.84696 11.548H10.8959V8.40106H9.84696V11.548ZM10.3715 16.2684C9.64591 16.2684 8.96408 16.1306 8.32595 15.8551C7.68783 15.5795 7.13275 15.2059 6.66071 14.7342C6.18867 14.2625 5.81506 13.7075 5.53988 13.069C5.2647 12.4305 5.12694 11.7487 5.12659 11.0235C5.12624 10.2983 5.264 9.61647 5.53988 8.97799C5.81576 8.33952 6.18937 7.78444 6.66071 7.31275C7.13205 6.84106 7.68713 6.46745 8.32595 6.19192C8.96478 5.91639 9.64661 5.77863 10.3715 5.77863C11.0963 5.77863 11.7781 5.91639 12.4169 6.19192C13.0558 6.46745 13.6109 6.84106 14.0822 7.31275C14.5535 7.78444 14.9273 8.33952 15.2035 8.97799C15.4798 9.61647 15.6174 10.2983 15.6163 11.0235C15.6153 11.7487 15.4775 12.4305 15.203 13.069C14.9285 13.7075 14.5549 14.2625 14.0822 14.7342C13.6095 15.2059 13.0544 15.5797 12.4169 15.8556C11.7795 16.1315 11.0977 16.2691 10.3715 16.2684Z" fill="#DC2626"/>
</svg>

                </div>
                <div className="severity-label">Critical</div>
                <div className="severity-count">{criticalCount}</div>
              </div>
              
              <div className="severity-box warning" onClick={() => setActiveTab(activeTab === "Warnings" ? "All" : "Warnings")}>
                <div className="severity-icon">
                <svg width="21" height="22" viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="0.117188" y="0.738525" width="20.5086" height="20.57" rx="10.2543" fill="#FFEDD5"/>
<path d="M9.4506 7.23911C9.85104 6.51494 10.8919 6.51494 11.2924 7.23911L14.916 13.7889C15.3043 14.4906 14.7967 15.3513 13.9949 15.3513H6.74855C5.94626 15.3513 5.43869 14.4906 5.82697 13.7889L9.4506 7.23911ZM10.8386 13.4801C10.8406 13.4175 10.8299 13.3552 10.8074 13.2968C10.7848 13.2384 10.7507 13.1851 10.7071 13.1401C10.6635 13.0952 10.6114 13.0594 10.5537 13.035C10.4961 13.0106 10.4341 12.998 10.3715 12.998C10.3089 12.998 10.2469 13.0106 10.1892 13.035C10.1316 13.0594 10.0794 13.0952 10.0358 13.1401C9.99226 13.1851 9.95817 13.2384 9.93559 13.2968C9.91301 13.3552 9.90239 13.4175 9.90437 13.4801C9.90821 13.6014 9.95911 13.7165 10.0463 13.801C10.1335 13.8854 10.2501 13.9327 10.3715 13.9327C10.4929 13.9327 10.6095 13.8854 10.6967 13.801C10.7838 13.7165 10.8347 13.6014 10.8386 13.4801ZM10.7174 9.80643C10.7053 9.71833 10.6602 9.63811 10.5912 9.58201C10.5222 9.52591 10.4344 9.49811 10.3457 9.50423C10.257 9.51035 10.1739 9.54994 10.1132 9.61498C10.0526 9.68003 10.0189 9.76568 10.019 9.85461L10.0209 11.9602L10.0241 12.0079C10.0363 12.096 10.0814 12.1762 10.1504 12.2323C10.2194 12.2884 10.3071 12.3163 10.3959 12.3101C10.4846 12.304 10.5677 12.2644 10.6283 12.1994C10.689 12.1343 10.7227 12.0487 10.7226 11.9597L10.7207 9.85368L10.7174 9.80643Z" fill="#EA580C"/>
</svg>

                </div>
                <div className="severity-label">Warnings</div>
                <div className="severity-count">{warningCount}</div>
              </div>
              
              <div className="severity-box info" onClick={() => setActiveTab(activeTab === "Info" ? "All" : "Info")}>
                <div className="severity-icon">
                <svg width="21" height="22" viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="0.117188" y="0.738525" width="20.5086" height="20.57" rx="10.2543" fill="#FEF9C3"/>
<path d="M9.84708 13.6461H10.8961V10.4991H9.84708V13.6461ZM10.3716 9.45012C10.5202 9.45012 10.6448 9.39977 10.7456 9.29907C10.8463 9.19836 10.8964 9.07388 10.8961 8.92562C10.8957 8.77736 10.8454 8.65288 10.745 8.55218C10.6447 8.45148 10.5202 8.40112 10.3716 8.40112C10.223 8.40112 10.0985 8.45148 9.99814 8.55218C9.89779 8.65288 9.84743 8.77736 9.84708 8.92562C9.84673 9.07388 9.89709 9.19854 9.99814 9.29959C10.0992 9.40065 10.2237 9.45082 10.3716 9.45012ZM10.3716 16.2686C9.64603 16.2686 8.96418 16.1308 8.32604 15.8553C7.68789 15.5798 7.1328 15.2062 6.66075 14.7345C6.1887 14.2628 5.81508 13.7077 5.53989 13.0692C5.26471 12.4307 5.12694 11.7488 5.12659 11.0236C5.12624 10.2984 5.26401 9.61656 5.53989 8.97807C5.81578 8.33958 6.1894 7.78449 6.66075 7.31279C7.1321 6.84109 7.6872 6.46747 8.32604 6.19193C8.96488 5.91639 9.64673 5.77863 10.3716 5.77863C11.0964 5.77863 11.7783 5.91639 12.4171 6.19193C13.056 6.46747 13.6111 6.84109 14.0824 7.31279C14.5538 7.78449 14.9276 8.33958 15.2038 8.97807C15.48 9.61656 15.6176 10.2984 15.6166 11.0236C15.6155 11.7488 15.4778 12.4307 15.2033 13.0692C14.9288 13.7077 14.5552 14.2628 14.0824 14.7345C13.6097 15.2062 13.0546 15.58 12.4171 15.8558C11.7797 16.1317 11.0978 16.2693 10.3716 16.2686Z" fill="#EAB308"/>
</svg>

                </div>
                <div className="severity-label">Info</div>
                <div className="severity-count">{infoCount}</div>
              </div>
            </div>
          </div>
         
          {/* Tabs for filtering by severity */}
          <div className="filter-tabs-container">
            <div className="filter-tabs">
              <button 
                className={`tab ${activeTab === 'All' ? 'active' : ''}`} 
                onClick={() => setActiveTab('All')}
              >
                All ({issues.length})
              </button>
              <button 
                className={`tab ${activeTab === 'Critical' ? 'active' : ''}`} 
                onClick={() => setActiveTab('Critical')}
              >
                Critical ({criticalCount})
              </button>
              <button 
                className={`tab ${activeTab === 'Warnings' ? 'active' : ''}`} 
                onClick={() => setActiveTab('Warnings')}
              >
                Warnings ({warningCount})
              </button>
              <button 
                className={`tab ${activeTab === 'Info' ? 'active' : ''}`} 
                onClick={() => setActiveTab('Info')}
              >
                Info ({infoCount})
              </button>
            </div>
          </div>
          
          {/* Only show issue types container if there are issues for the selected tab */}
          {filterIssuesByTab(issues, activeTab).length > 0 && (
            <div className="issue-types-container">
              {issueTypeItem(
                <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.1172 20.3085C8.73386 20.3085 7.43386 20.0459 6.21719 19.5205C5.00052 18.9952 3.94219 18.2829 3.04219 17.3835C2.14219 16.4842 1.42986 15.4259 0.905189 14.2085C0.380522 12.9912 0.117855 11.6912 0.117189 10.3085C0.116522 8.92587 0.379189 7.62587 0.905189 6.40853C1.43119 5.1912 2.14352 4.13287 3.04219 3.23353C3.94086 2.3342 4.99919 1.62187 6.21719 1.09653C7.43519 0.571199 8.73519 0.308533 10.1172 0.308533C11.4992 0.308533 12.7992 0.571199 14.0172 1.09653C15.2352 1.62187 16.2935 2.3342 17.1922 3.23353C18.0909 4.13287 18.8035 5.1912 19.3302 6.40853C19.8569 7.62587 20.1192 8.92587 20.1172 10.3085C20.1152 11.6912 19.8525 12.9912 19.3292 14.2085C18.8059 15.4259 18.0935 16.4842 17.1922 17.3835C16.2909 18.2829 15.2325 18.9955 14.0172 19.5215C12.8019 20.0475 11.5019 20.3099 10.1172 20.3085ZM11.1172 18.2335C13.1005 17.9835 14.7632 17.1125 16.1052 15.6205C17.4472 14.1285 18.1179 12.3579 18.1172 10.3085C18.1165 8.2592 17.4455 6.48853 16.1042 4.99653C14.7629 3.50453 13.1005 2.63353 11.1172 2.38353V18.2335Z" fill="black"/>
                </svg>
                ,
                'Contrast',
                contrastIssues,
                expandedTypes.contrast,
                () => toggleExpand('contrast')
              )}
              
              {issueTypeItem(
                <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.29576 20.3085C8.85131 20.3085 8.43481 20.2133 8.04623 20.0228C7.65766 19.8323 7.32814 19.5625 7.05766 19.2133L1.86719 12.6181L2.31957 12.1419C2.63703 11.8085 3.01798 11.6101 3.46243 11.5466C3.90687 11.4831 4.31957 11.5704 4.70052 11.8085L6.46243 12.88V5.07043C6.46243 4.80059 6.55385 4.57456 6.73671 4.39234C6.91957 4.21012 7.1456 4.11869 7.41481 4.11805C7.68401 4.11742 7.91417 4.20885 8.10528 4.39234C8.29639 4.57583 8.39163 4.80186 8.391 5.07043V9.83234H15.51C16.3037 9.83234 16.9783 10.1101 17.5339 10.6657C18.0894 11.2212 18.3672 11.8958 18.3672 12.6895V16.499C18.3672 17.5466 17.9942 18.4435 17.2481 19.1895C16.5021 19.9355 15.6053 20.3085 14.5577 20.3085H9.29576ZM3.29576 7.45139C3.08941 7.10218 2.93068 6.72536 2.81957 6.32091C2.70846 5.91647 2.6529 5.49964 2.6529 5.07043C2.6529 3.75297 3.11735 2.63012 4.04623 1.70186C4.97512 0.773609 6.09798 0.309164 7.41481 0.30853C8.73163 0.307895 9.85481 0.772339 10.7843 1.70186C11.7139 2.63139 12.178 3.75424 12.1767 5.07043C12.1767 5.49901 12.1212 5.91583 12.01 6.32091C11.8989 6.72599 11.7402 7.10282 11.5339 7.45139L9.891 6.49901C10.018 6.27678 10.1132 6.05075 10.1767 5.82091C10.2402 5.59107 10.2719 5.34091 10.2719 5.07043C10.2719 4.27678 9.99417 3.60218 9.43862 3.04662C8.88306 2.49107 8.20846 2.21329 7.41481 2.21329C6.62116 2.21329 5.94655 2.49107 5.391 3.04662C4.83544 3.60218 4.55766 4.27678 4.55766 5.07043C4.55766 5.34028 4.58941 5.59043 4.6529 5.82091C4.71639 6.05139 4.81163 6.27742 4.93862 6.49901L3.29576 7.45139Z" fill="black"/>
                </svg>
                ,
                'Touch Target',
                touchTargetIssues,
                expandedTypes.touchTarget,
                () => toggleExpand('touchTarget')
              )}
              
              {issueTypeItem(
                <svg width="23" height="16" viewBox="0 0 23 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.1172 5.30853C10.3215 5.30853 9.55848 5.6246 8.99587 6.18721C8.43326 6.74982 8.11719 7.51288 8.11719 8.30853C8.11719 9.10418 8.43326 9.86724 8.99587 10.4299C9.55848 10.9925 10.3215 11.3085 11.1172 11.3085C11.9128 11.3085 12.6759 10.9925 13.2385 10.4299C13.8011 9.86724 14.1172 9.10418 14.1172 8.30853C14.1172 7.51288 13.8011 6.74982 13.2385 6.18721C12.6759 5.6246 11.9128 5.30853 11.1172 5.30853ZM11.1172 13.3085C9.79111 13.3085 8.51934 12.7817 7.58165 11.8441C6.64397 10.9064 6.11719 9.63461 6.11719 8.30853C6.11719 6.98245 6.64397 5.71068 7.58165 4.773C8.51934 3.83532 9.79111 3.30853 11.1172 3.30853C12.4433 3.30853 13.715 3.83532 14.6527 4.773C15.5904 5.71068 16.1172 6.98245 16.1172 8.30853C16.1172 9.63461 15.5904 10.9064 14.6527 11.8441C13.715 12.7817 12.4433 13.3085 11.1172 13.3085ZM11.1172 0.808533C6.11719 0.808533 1.84719 3.91853 0.117188 8.30853C1.84719 12.6985 6.11719 15.8085 11.1172 15.8085C16.1172 15.8085 20.3872 12.6985 22.1172 8.30853C20.3872 3.91853 16.1172 0.808533 11.1172 0.808533Z" fill="black"/>
                </svg>
                ,
                'Color Blindness',
                colorBlindnessIssues,
                expandedTypes.colorBlindness,
                () => toggleExpand('colorBlindness')
              )}
              
              {issueTypeItem(
                <svg width="21" height="17" viewBox="0 0 21 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.11719 3.30853V1.30853H14.1172V3.30853M8.11719 1.30853V15.3085M10.1172 15.3085H6.11719M13.1172 9.30853V8.30853H19.1172V9.30853M16.1172 8.30853V15.3085M15.1172 15.3085H17.1172" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ,
                'Text Size',
                textSizeIssues,
                expandedTypes.textSize,
                () => toggleExpand('textSize')
              )}
              
              {issueTypeItem(
                <svg width="21" height="11" viewBox="0 0 21 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.11719 9.30853V3.30853C2.11719 2.7781 2.3279 2.26939 2.70297 1.89432C3.07805 1.51925 3.58675 1.30853 4.11719 1.30853C4.64762 1.30853 5.15633 1.51925 5.5314 1.89432C5.90647 2.26939 6.11719 2.7781 6.11719 3.30853V9.30853M2.11719 6.30853H6.11719M9.11719 1.30853V9.30853H13.1172M14.1172 1.30853H18.1172M16.1172 1.30853V9.30853" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ,
                'Alt text',
                altTextIssues,
                expandedTypes.altText,
                () => toggleExpand('altText')
              )}
              
              {issueTypeItem(
                <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M17.687 0.792445C18.643 0.448445 19.5671 1.37245 19.2231 2.32745L13.1831 19.1044C12.8081 20.1474 11.3411 20.1674 10.937 19.1344L8.10805 11.9064L0.880051 9.07845C-0.151949 8.67445 -0.13195 7.20745 0.910051 6.83145L17.687 0.792445Z" fill="black"/>
                </svg>
                ,
                'Navigation',
                navigationIssues,
                expandedTypes.navigation,
                () => toggleExpand('navigation')
              )}
            </div>
          )}
        </div>
      )}
      
      {!isScanning && (!scanCompleted || issues.length === 0) && (
        <Dashboard 
          issues={filteredIssues}
          isScanning={isScanning}
          onScan={handleScan}
          onFilterChange={handleFilterChange}
          filters={filters}
          onGenerateReport={handleGenerateReport}
          canScan={canAccessNodes}
          freeScanCount={freeScanCount}
          totalScans={totalScans}
        />
      )}
      
      {showReportModal && (
        <ReportModal 
          issues={issues}
          onClose={() => setShowReportModal(false)}
        />
      )}
      
      {selectedIssue && (
        <IssueDetailView
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onLocate={handleLocateIssue}
        />
      )}
    </div>
  );
};

export default App;