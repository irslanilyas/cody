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

  // Apply filters to issues
  useEffect(() => {
    let filtered = [...issues];

    // Apply active tab filter
    if (activeTab === "Critical") {
      filtered = filtered.filter(issue => issue.severity === "critical");
    } else if (activeTab === "Warnings") {
      filtered = filtered.filter(issue => issue.severity === "warning");
    } else if (activeTab === "Info") {
      filtered = filtered.filter(issue => issue.severity === "info");
    }

    // Apply type filters
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
          
          // Run scan
          const pageIssues = await runAccessibilityCheck(nodesToProcess);
          
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
        
        // Run scan
        allFoundIssues = await runAccessibilityCheck(nodesToProcess);
        
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

  // Issue type components for the completed screen
  const issueTypeItem = (
    icon: React.ReactNode, 
    label: string, 
    issues: Issue[], 
    isExpanded: boolean, 
    toggleExpand: () => void
  ) => {
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
    
    issues.forEach(issue => {
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
            <span className="issue-count">{issues.length} {issues.length === 1 ? 'Issue' : 'Issues'}</span>
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
            
            {issues.map((issue, index) => (
              <div key={issue.id} className="issue-item-compact">
                {severityDot(issue.severity)}
                <div className="issue-info">
                  <div className="issue-location">Element : {issue.location.nodeName}</div>
                  <div className="issue-description">{issue.description}</div>
                </div>
                <div className="issue-actions">
                  <button className="locate-button-small">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 8.5C8.82843 8.5 9.5 7.82843 9.5 7C9.5 6.17157 8.82843 5.5 8 5.5C7.17157 5.5 6.5 6.17157 6.5 7C6.5 7.82843 7.17157 8.5 8 8.5Z" fill="white"/>
                      <path d="M8 14C10.5 11.5 13 9.36396 13 6.5C13 3.63604 10.7614 1.5 8 1.5C5.23858 1.5 3 3.63604 3 6.5C3 9.36396 5.5 11.5 8 14Z" stroke="white" strokeWidth="2"/>
                    </svg>
                    Locate
                  </button>
                  <button className="details-button">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          {/* First container: Scan completed and buttons */}
          <div className="completed-container">
            <div className="completed-header">
              <h1>Scan Completed</h1>
              <p>Generate a report or click the scan button to scan again</p>
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
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 2H12C13.1 2 14 2.9 14 4V12C14 13.1 13.1 14 12 14H4C2.9 14 2 13.1 2 12V4C2 2.9 2.9 2 4 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 5H10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 8H10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 11H8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Generate Report
              </button>
            </div>
            
            {/* Stats boxes showing issue counts by severity */}
            <div className="severity-stats">
              <div className="severity-box critical">
                <div className="severity-icon">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="6" cy="6" r="6" fill="#E53935"/>
                  </svg>
                </div>
                <div className="severity-label">Critical</div>
                <div className="severity-count">{criticalCount}</div>
              </div>
              
              <div className="severity-box warning">
                <div className="severity-icon">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.7 9.9L6.7 1.5C6.5 1.2 6.3 1 6 1C5.7 1 5.5 1.2 5.3 1.5L0.3 9.9C0.1 10.2 0 10.4 0 10.7C0 11.4 0.6 12 1.3 12H10.7C11.4 12 12 11.4 12 10.7C12 10.4 11.9 10.2 11.7 9.9ZM6 10C5.7 10 5.5 9.8 5.5 9.5C5.5 9.2 5.7 9 6 9C6.3 9 6.5 9.2 6.5 9.5C6.5 9.8 6.3 10 6 10ZM6.5 8H5.5V5H6.5V8Z" fill="#FF9800"/>
                  </svg>
                </div>
                <div className="severity-label">Warnings</div>
                <div className="severity-count">{warningCount}</div>
              </div>
              
              <div className="severity-box info">
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
                All
              </button>
              <button 
                className={`tab ${activeTab === 'Critical' ? 'active' : ''}`} 
                onClick={() => setActiveTab('Critical')}
              >
                Critical
              </button>
              <button 
                className={`tab ${activeTab === 'Warnings' ? 'active' : ''}`} 
                onClick={() => setActiveTab('Warnings')}
              >
                Warnings
              </button>
              <button 
                className={`tab ${activeTab === 'Info' ? 'active' : ''}`} 
                onClick={() => setActiveTab('Info')}
              >
                Info
              </button>
            </div>
          </div>
          
          {/* Issue types */}
          <div className="issue-types-container">
            {contrastIssues.length > 0 && issueTypeItem(
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="black" strokeWidth="2"/>
                <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" fill="black" fillOpacity="0.5"/>
              </svg>,
              'Contrast',
              contrastIssues,
              expandedTypes.contrast,
              () => toggleExpand('contrast')
            )}
            
            {touchTargetIssues.length > 0 && issueTypeItem(
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
            
            {colorBlindnessIssues.length > 0 && issueTypeItem(
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
            
            {textSizeIssues.length > 0 && issueTypeItem(
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
            
            {altTextIssues.length > 0 && issueTypeItem(
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
            
            {navigationIssues.length > 0 && issueTypeItem(
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