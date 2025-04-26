// src/App.tsx
import React, { useState, useEffect } from "react";
import { framer, isFrameNode } from "framer-plugin";
import Dashboard from "./components/Dashboard";
import ReportModal from "./components/ReportModal";
import ColorBlindnessSimulator from "./components/ColorBlindnessSimulator";
import { Issue } from "./types/issueTypes";
import { runAccessibilityCheck } from "./analyzers/accessibilityScanner";
import "./App.css";
import "./styles/ReportModal.css";
import "./styles/ColorBlindnessSimulator.css";
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
  const [showSimulator, setShowSimulator] = useState(false);
  const [freeScanCount, setFreeScanCount] = useState<number>(2);
  const [totalScans] = useState<number>(3);
  
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

  // Apply filters to issues
  useEffect(() => {
    const filtered = issues.filter((issue) => {
      return filters.severity[issue.severity] && filters.type[issue.type];
    });
    setFilteredIssues(filtered);
  }, [issues, filters]);

  // Perform scan
  const performScan = async () => {
    // Reset state
    setScanProgress({
      currentPage: 0,
      totalPages: 0,
      nodesScanned: 0,
      issuesFound: 0
    });
    setIssues([]);
    
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
          
          // Update state
          setIssues(prev => [...prev, ...pageIssues]);
          setScanProgress(prev => ({ 
            ...prev, 
            issuesFound: prev.issuesFound + pageIssues.length 
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
          return;
        }
        
        // Limit nodes
        const nodesToProcess = allNodes.length > 1000 ? allNodes.slice(0, 1000) : allNodes;
        
        // Run scan
        const foundIssues = await runAccessibilityCheck(nodesToProcess);
        
        // Update state
        setIssues(foundIssues);
        setScanProgress(prev => ({ ...prev, issuesFound: foundIssues.length }));
      }
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
    
    try {
      // Set timeout to prevent infinite scanning
      const scanPromise = performScan();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Scan timed out after 120 seconds")), 120000);
      });
      
      await Promise.race([scanPromise, timeoutPromise]);
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
        <span className="stat-value">{scanProgress.currentPage} of {scanProgress.totalPages || 1}</span>
        <span className="stat-label">Pages Scanned</span>
      </div>
      <div className="progress-stat">
        <span className="stat-value">{scanProgress.nodesScanned}</span>
        <span className="stat-label">Nodes Scanned</span>
      </div>
      <div className="progress-stat">
        <span className="stat-value">{scanProgress.issuesFound}</span>
        <span className="stat-label">Issues Found</span>
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
      
      {showReportModal && (
        <ReportModal 
          issues={issues}
          onClose={() => setShowReportModal(false)}
        />
      )}
      
      {showSimulator && (
        <ColorBlindnessSimulator 
          onClose={() => setShowSimulator(false)}
        />
      )}
    </div>
  );
};

export default App;