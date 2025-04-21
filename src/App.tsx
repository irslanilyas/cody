import React, { useState, useEffect } from "react";
import { framer } from "framer-plugin";
import Dashboard from "./components/Dashboard";
import { Issue } from "./types/issueTypes";
import { runAccessibilityCheck } from "./analyzers/accessibilityScanner";
import "./App.css";

const App: React.FC = () => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
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
    try {
      setIsScanning(true);
      
      // Get all nodes in the current Framer project using the appropriate API method
      // According to the Framer docs, we should use getNodesWithType() with "*" to get all nodes
      console.log("Starting accessibility scan...");
      const frameNodes = await framer.getNodesWithType("FrameNode");
      const textNodes = await framer.getNodesWithType("TextNode");
      const allNodes = [...frameNodes, ...textNodes];
      console.log(`Found ${allNodes.length} nodes to analyze`);
      
      // Run accessibility check on all nodes
      const foundIssues = await runAccessibilityCheck(allNodes);
      console.log(`Found ${foundIssues.length} accessibility issues`);
      
      // Update issues state with found issues
      setIssues(foundIssues);
    } catch (error) {
      console.error("Error scanning for accessibility issues:", error);
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
      
      <Dashboard 
        issues={filteredIssues}
        isScanning={isScanning}
        onScan={handleScan}
        onFilterChange={handleFilterChange}
        filters={filters}
        onGenerateReport={handleGenerateReport}
      />
    </div>
  );
};

export default App;