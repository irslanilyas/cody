// src/App.tsx
import React, { useState, useEffect } from "react";
import { framer } from "framer-plugin";
import Dashboard from "./components/Dashboard";
import { Issue } from "./types/issueTypes";
import { runAccessibilityCheck } from "./analyzers/accessibilityScanner";
import "./App.css";
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

  // Start accessibility scan using Framer API
  const handleScan = async () => {
    if (!canAccessNodes) {
      setError("This plugin doesn't have permission to access nodes. Please check your permissions settings.");
      return;
    }
    
    setError(null);
    try {
      setIsScanning(true);
      
      // Get all nodes in the current Framer project
      console.log("Starting accessibility scan...");
      
      // Use try/catch for each API call to handle potential errors gracefully
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
      console.log(`Found ${allNodes.length} nodes to analyze`);
      
      if (allNodes.length === 0) {
        setError("No nodes found to analyze. Please make sure you have content in your Framer project.");
        setIsScanning(false);
        return;
      }
      
      // Run accessibility check on all nodes
      const foundIssues = await runAccessibilityCheck(allNodes);
      console.log(`Found ${foundIssues.length} accessibility issues`);
      
      // Update issues state with found issues
      setIssues(foundIssues);
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
    // Implementation for generating and exporting reports
    console.log("Generating report for", issues.length, "issues");
    // We'll implement this later with the reportGenerator utility
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Accessibility Checker</h1>
        <p>Analyze your Framer project for accessibility issues</p>
      </header>
      
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
      
      <Dashboard 
        issues={filteredIssues}
        isScanning={isScanning}
        onScan={handleScan}
        onFilterChange={handleFilterChange}
        filters={filters}
        onGenerateReport={handleGenerateReport}
        canScan={canAccessNodes}
      />
    </div>
  );
};

export default App;