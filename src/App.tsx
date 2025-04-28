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
  // State
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
        node = await framer.getNodeById(issue.location.nodeId);
      } catch (e) {
        console.error("Error getting node by ID:", e);
      }
      
      if (!node) {
        console.log("Node not found by ID, trying alternative methods...");
        setError("Could not locate this element. It may have been deleted or moved.");
        return;
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
          else if (typeof node.focus === 'function') {
            await node.focus();
            console.log("Node focused via node.focus");
          } else {
            console.warn("No selection or focus method available");
          }
        }
        
        // Try to center view on node
        try {
          if (typeof (framer as any).zoomIntoView === 'function') {
            await (framer as any).zoomIntoView(issue.location.nodeId);
            console.log("Zoomed to node");
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
    // Implement the details view logic here
    console.log("Show details for issue:", issue);
    // This could open a modal or expand a details panel
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

  // Issue type expanded state management
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({
    contrast: false,
    touchTarget: false,
    textSize: false,
    altText: false,
    colorBlindness: false,
    navigation: false
  });

  const toggleExpand = (type: string) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
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
                    <path d="M9.09665 5.54432H12.5294L9.09665 2.11161V5.54432Z" fill="url(#paint0_linear_1_65)"/>
                    {/* SVG content simplified */}
                  </svg>
                </div>
                <div className="stat-count">{scanProgress.currentPage} of {scanProgress.totalPages}</div>
                <div className="stat-label">Pages Scanned</div>
              </div>
              
              <div className="stat-box">
                <div className="stat-icon">
                  {/* SVG icon for nodes scanned (simplified) */}
                  <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* SVG content simplified */}
                  </svg>
                </div>
                <div className="stat-count">{scanProgress.nodesScanned}</div>
                <div className="stat-label">Nodes Scanned</div>
              </div>
              
              <div className="stat-box">
                <div className="stat-icon">
                  {/* SVG icon for issues found (simplified) */}
                  <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* SVG content simplified */}
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
          {/* First container: Scan completed and buttons */}
          <div className="completed-container">
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
                    {/* SVG content simplified */}
                  </svg>
                </span>
                <span className="scan-button-text">Scan again</span>
              </button>
              <button className="generate-report-button" onClick={handleGenerateReport}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* SVG content simplified */}
                </svg>
                Generate Report
              </button>
            </div>
            
            {/* Stats boxes showing issue counts by severity */}
            <div className="severity-stats">
              <div className="severity-box critical" onClick={() => setActiveTab(activeTab === "Critical" ? "All" : "Critical")}>
                <div className="severity-icon">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="6" cy="6" r="6" fill="#E53935"/>
                  </svg>
                </div>
                <div className="severity-label">Critical</div>
                <div className="severity-count">{criticalCount}</div>
              </div>
              
              <div className="severity-box warning" onClick={() => setActiveTab(activeTab === "Warnings" ? "All" : "Warnings")}>
                <div className="severity-icon">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* SVG content simplified */}
                  </svg>
                </div>
                <div className="severity-label">Warnings</div>
                <div className="severity-count">{warningCount}</div>
              </div>
              
              <div className="severity-box info" onClick={() => setActiveTab(activeTab === "Info" ? "All" : "Info")}>
                <div className="severity-icon">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="6" cy="6" r="6" fill="#2196F3"/>
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
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="black" strokeWidth="2"/>
                  <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" fill="black" fillOpacity="0.5"/>
                </svg>,
                'Contrast',
                contrastIssues,
                expandedTypes.contrast,
                () => toggleExpand('contrast')
              )}
              
              {issueTypeItem(
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.5 7.5C5.88071 7.5 7 6.38071 7 5C7 3.61929 5.88071 2.5 4.5 2.5C3.11929 2.5 2 3.61929 2 5C2 6.38071 3.11929 7.5 4.5 7.5Z" stroke="black" strokeWidth="1.5"/>
                  <path d="M11.5 13.5C12.8807 13.5 14 12.3807 14 11C14 9.61929 12.8807 8.5 11.5 8.5C10.1193 8.5 9 9.61929 9 11C9 12.3807 10.1193 13.5 11.5 13.5Z" stroke="black" strokeWidth="1.5"/>
                  <path d="M11.5 5.5L4.5 10.5" stroke="black" strokeWidth="1.5"/>
                </svg>,
                'Touch Target',
                touchTargetIssues,
                expandedTypes.touchTarget,
                () => toggleExpand('touchTarget')
              )}
              
              {issueTypeItem(
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="black" strokeWidth="1.5"/>
                  <path d="M4 8C4 5.79086 5.79086 4 8 4" stroke="black" strokeWidth="1.5"/>
                  <path d="M8 12C10.2091 12 12 10.2091 12 8" stroke="black" strokeWidth="1.5"/>
                </svg>,
                'Color Blindness',
                colorBlindnessIssues,
                expandedTypes.colorBlindness,
                () => toggleExpand('colorBlindness')
              )}
              
              {issueTypeItem(
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4H13" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M8 4V12" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M5 12H11" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>,
                'Text Size',
                textSizeIssues,
                expandedTypes.textSize,
                () => toggleExpand('textSize')
              )}
              
              {issueTypeItem(
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="12" height="12" rx="2" stroke="black" strokeWidth="1.5"/>
                  <path d="M5 10L11 10" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M5 7L8 7" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>,
                'Alt text',
                altTextIssues,
                expandedTypes.altText,
                () => toggleExpand('altText')
              )}
              
              {issueTypeItem(
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 14L14 8L8 2L2 8L8 14Z" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M8 8L8 14" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M8 8L14 8" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>,
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
    </div>
  );
};

export default App;