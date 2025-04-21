import React from "react";
import IssueList from "./IssueList";
import ScanButton from "./ScanButton";
import FilterControls from "./FilterControls";
import { Issue, IssueFilters } from "../types/issueTypes";

interface DashboardProps {
  issues: Issue[];
  isScanning: boolean;
  filters: IssueFilters;
  onScan: () => void;
  onFilterChange: (category: "severity" | "type", name: string, value: boolean) => void;
  onGenerateReport: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  issues,
  isScanning,
  filters,
  onScan,
  onFilterChange,
  onGenerateReport
}) => {
  // Count issues by severity
  const criticalCount = issues.filter(issue => issue.severity === "critical").length;
  const warningCount = issues.filter(issue => issue.severity === "warning").length;
  const infoCount = issues.filter(issue => issue.severity === "info").length;
  
  return (
    <div className="dashboard">
      <div className="scan-controls">
        <ScanButton onScan={onScan} isScanning={isScanning} />
        
        {issues.length > 0 && (
          <button className="report-button" onClick={onGenerateReport}>
            Generate Report
          </button>
        )}
      </div>
      
      {issues.length > 0 && (
        <div className="issues-summary">
          <div className="summary-item critical">
            <span className="summary-count">{criticalCount}</span>
            <span className="summary-label">Critical</span>
          </div>
          <div className="summary-item warning">
            <span className="summary-count">{warningCount}</span>
            <span className="summary-label">Warnings</span>
          </div>
          <div className="summary-item info">
            <span className="summary-count">{infoCount}</span>
            <span className="summary-label">Info</span>
          </div>
        </div>
      )}
      
      {issues.length > 0 && (
        <FilterControls 
          filters={filters} 
          onFilterChange={onFilterChange} 
        />
      )}
      
      <IssueList issues={issues} isLoading={isScanning} />
    </div>
  );
};

export default Dashboard;