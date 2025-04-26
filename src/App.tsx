// src/App.tsx
import React, { useState, useEffect } from "react";
import { framer, isFrameNode } from "framer-plugin";
import Dashboard from "./components/Dashboard";
import ReportModal from "./components/ReportModal"; // Import the report modal
import ColorBlindnessSimulator from "./components/ColorBlindnessSimulator"; // Import the simulator
import { Issue } from "./types/issueTypes";
import { runAccessibilityCheck } from "./analyzers/accessibilityScanner";
import "./App.css";
import "./styles/ReportModal.css";
import "./styles/ColorBlindnessSimulator.css";
import "./types/framerTypes"; // Import the type extensions

// Create a custom hook to check for permissions
function usePermissions() {
  const [canAccessNodes, setCanAccessNodes] = useState<boolean>(true);
  
  useEffect(() => {
    // Check if we can access nodes using the new permissions API
    const checkPermissions = async () => {
      try {
        // If isAllowedTo exists, use it to check permissions
        if (typeof (framer as any).isAllowedTo === 'function') {
          const hasNodePermission = await (framer as any).isAllowedTo('getNodesWithType');
          setCanAccessNodes(hasNodePermission);
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        // Default to true if we can't check (older versions of Framer)
        setCanAccessNodes(true);
      }
    };
    
    checkPermissions();
    
    // Subscribe to permission changes if the API exists
    if (typeof (framer as any).subscribeToIsAllowedTo === 'function') {
      const unsubscribe = (framer as any).subscribeToIsAllowedTo('getNodesWithType', setCanAccessNodes);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);
  
  return canAccessNodes;
}

const App: React.FC = () => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const canAccessNodes = usePermissions();
  const [scanProgress, setScanProgress] = useState({
    currentPage: 0,
    totalPages: 0,
    nodesScanned: 0,
    issuesFound: 0
  });
  const [isScanComplete, setIsScanComplete] = useState(false);
  // Add state for the modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  // Add state for free scan count
  const [freeScanCount, setFreeScanCount] = useState<number>(2);
  const [totalScans] = useState<number>(3);
  
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

  // Apply filters to issues
  useEffect(() => {
    const filtered = issues.filter((issue) => {
      const severityMatch = filters.severity[issue.severity];
      const typeMatch = filters.type[issue.type];
      return severityMatch && typeMatch;
    });
    setFilteredIssues(filtered);
  }, [issues, filters]);

  // Separate function to perform the scan with progress updates
  const performScan = async () => {
    // Reset progress and issues
    setScanProgress({
      currentPage: 0,
      totalPages: 0,
      nodesScanned: 0,
      issuesFound: 0
    });
    setIsScanComplete(false);
    setIssues([]);
    
    try {
      // Try to get root canvas and its top-level frames that may represent pages
      let pages: any[] = [];
      try {
        // Get the canvas root first
        const canvasRoot = await framer.getCanvasRoot();
        if (canvasRoot) {
          // Get direct children of the canvas
          const rootChildren = await canvasRoot.getChildren();
          // Filter for frame nodes that are likely pages/screens
          pages = rootChildren.filter(node => isFrameNode(node));
          console.log(`Found ${pages.length} top-level frames that could be pages`);
        }
        
        setScanProgress(prev => ({ ...prev, totalPages: pages.length || 1 }));
      } catch (e) {
        console.error("Error getting top-level frames:", e);
        pages = [];
      }
      
      // If we have pages, process each one separately
      if (pages.length > 0) {
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          setScanProgress(prev => ({ 
            ...prev, 
            currentPage: i + 1 
          }));
          
          console.log(`Scanning frame ${i + 1} of ${pages.length}: ${page.name || 'Unnamed frame'}`);
          
          // Get nodes for the current page
          let frameNodes: any[] = [];
          let textNodes: any[] = [];
          
          try {
            // Get descendant frame nodes for this container
            const pageFrameNodes = await page.getNodesWithType("FrameNode");
            frameNodes = [page, ...pageFrameNodes]; // Include the page frame itself
            console.log(`Found ${pageFrameNodes.length + 1} frame nodes in container ${i + 1}`);
          } catch (e) {
            console.error(`Error getting frame nodes for container ${i + 1}:`, e);
            frameNodes = [page]; // At least include the page frame itself
          }
          
          try {
            // Get text nodes within this container
            const pageTextNodes = await page.getNodesWithType("TextNode");
            textNodes = pageTextNodes;
            console.log(`Found ${pageTextNodes.length} text nodes in container ${i + 1}`);
          } catch (e) {
            console.error(`Error getting text nodes for container ${i + 1}:`, e);
          }
          
          // Process current page's nodes
          const pageNodes = [...frameNodes, ...textNodes];
          setScanProgress(prev => ({ 
            ...prev, 
            nodesScanned: prev.nodesScanned + pageNodes.length 
          }));
          
          if (pageNodes.length === 0) {
            console.log(`No nodes found in container ${i + 1}`);
            continue;
          }
          
          // Set a limit to avoid overwhelming the system
          const nodesToProcess = pageNodes.length > 500 ? pageNodes.slice(0, 500) : pageNodes;
          if (pageNodes.length > 500) {
            console.warn(`Processing only 500 out of ${pageNodes.length} nodes in container ${i + 1} to avoid performance issues`);
          }
          
          // Process this page's nodes
          console.log(`Processing ${nodesToProcess.length} nodes in container ${i + 1}`);
          const pageIssues = await runAccessibilityCheck(nodesToProcess);
          console.log(`Found ${pageIssues.length} accessibility issues in container ${i + 1}`);
          
          // Update issues immediately to show progress
          setIssues(prev => [...prev, ...pageIssues]);
          setScanProgress(prev => ({ 
            ...prev, 
            issuesFound: prev.issuesFound + pageIssues.length 
          }));
        }
      } else {
        // No pages found, scan the entire project
        console.log("No top-level frames found, scanning entire project");
        
        let frameNodes: any[] = [];
        let textNodes: any[] = [];
        
        try {
          frameNodes = await framer.getNodesWithType("FrameNode");
          console.log(`Found ${frameNodes.length} frame nodes`);
        } catch (e) {
          console.error("Error getting frame nodes:", e);
          frameNodes = [];
        }
        
        try {
          textNodes = await framer.getNodesWithType("TextNode");
          console.log(`Found ${textNodes.length} text nodes`);
        } catch (e) {
          console.error("Error getting text nodes:", e);
          textNodes = [];
        }
        
        const allNodes = [...frameNodes, ...textNodes];
        setScanProgress(prev => ({ 
          ...prev, 
          totalPages: 1,
          currentPage: 1,
          nodesScanned: allNodes.length 
        }));
        
        console.log(`Found ${allNodes.length} nodes to analyze`);
        
        if (allNodes.length === 0) {
          setError("No nodes found to analyze. Please make sure you have content in your Framer project.");
          return;
        }
        
        // Set a limit to avoid overwhelming the system
        const nodesToProcess = allNodes.length > 1000 ? allNodes.slice(0, 1000) : allNodes;
        if (allNodes.length > 1000) {
          console.warn(`Processing only 1000 out of ${allNodes.length} nodes to avoid performance issues`);
        }
        
        // Run accessibility check on all nodes
        const foundIssues = await runAccessibilityCheck(nodesToProcess);
        console.log(`Found ${foundIssues.length} accessibility issues`);
        
        // Update issues state with found issues
        setIssues(foundIssues);
        setScanProgress(prev => ({ 
          ...prev, 
          issuesFound: foundIssues.length 
        }));
      }
      
      setIsScanComplete(true);
    } catch (error) {
      console.error("Error during scan:", error);
      throw error; // Re-throw to be caught by the main handler
    }
  };

  // Start accessibility scan using Framer API
  const handleScan = async () => {
    if (!canAccessNodes) {
      setError("This plugin doesn't have permission to access nodes. Please check your permissions settings.");
      return;
    }
    
    // Decrement free scan count if greater than 0
    if (freeScanCount > 0) {
      setFreeScanCount(prevCount => prevCount - 1);
    }
    
    setError(null);
    try {
      setIsScanning(true);
      
      // Add a timeout to prevent infinite scanning
      const scanPromise = performScan();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Scan timed out after 120 seconds")), 120000);
      });
      
      // Race the scan against the timeout
      await Promise.race([scanPromise, timeoutPromise]);
      
    } catch (error) {
      console.error("Error scanning for accessibility issues:", error);
      setError(`Error scanning for accessibility issues: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Update filters
  const handleFilterChange = (category: "severity" | "type", name: string, value: boolean) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [category]: {
        ...prevFilters[category],
        [name]: value,
      },
    }));
  };

  // Generate accessibility report
  const handleGenerateReport = () => {
    if (issues.length === 0) {
      setError("No accessibility issues to include in the report. Run a scan first.");
      return;
    }
    
    // Show the report modal
    setShowReportModal(true);
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
        <div className="scan-progress">
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${scanProgress.totalPages > 0 ? Math.min(100, (scanProgress.currentPage / scanProgress.totalPages) * 100) : 0}%` }}
            ></div>
          </div>
          <div className="progress-stats">
            <div className="progress-stat">
              <span className="stat-label">Pages:</span>
              <span className="stat-value">{scanProgress.currentPage} of {scanProgress.totalPages || 1}</span>
            </div>
            <div className="progress-stat">
              <span className="stat-label">Nodes scanned:</span>
              <span className="stat-value">{scanProgress.nodesScanned}</span>
            </div>
            <div className="progress-stat">
              <span className="stat-label">Issues found:</span>
              <span className="stat-value">{scanProgress.issuesFound}</span>
            </div>
          </div>
        </div>
      )}
      
      <Dashboard 
        issues={filteredIssues}
        isScanning={isScanning}
        onScan={handleScan}
        onFilterChange={handleFilterChange}
        filters={filters}
        onGenerateReport={handleGenerateReport}
        onOpenSimulator={() => setShowSimulator(true)}
        canScan={canAccessNodes}
        freeScanCount={freeScanCount}
        totalScans={totalScans}
      />
      
      {/* Render the report modal when showReportModal is true */}
      {showReportModal && (
        <ReportModal 
          issues={issues}
          onClose={() => setShowReportModal(false)}
        />
      )}
      
      {/* Render the color blindness simulator when showSimulator is true */}
      {showSimulator && (
        <ColorBlindnessSimulator 
          onClose={() => setShowSimulator(false)}
        />
      )}
    </div>
  );
};

export default App;