// src/components/Dashboard.tsx
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
  canScan?: boolean;
  freeScanCount?: number;
  totalScans?: number;
}

const Dashboard: React.FC<DashboardProps> = ({
  issues,
  isScanning,
  filters,
  onScan,
  onFilterChange,
  onGenerateReport,
  canScan = true,
  freeScanCount = 2,
  totalScans = 3
}) => {
  // Count issues by severity
  const criticalCount = issues.filter(issue => issue.severity === "critical").length;
  const warningCount = issues.filter(issue => issue.severity === "warning").length;
  const infoCount = issues.filter(issue => issue.severity === "info").length;
  
  return (
    <div className="dashboard">
      {issues.length > 0 && (
        <div className="scan-controls">
          <div className="primary-controls">
            <div className="scan-button-container">
              <ScanButton 
                onScan={onScan} 
                isScanning={isScanning} 
                disabled={!canScan}
                freeScanCount={freeScanCount}
                totalScans={totalScans}
                showFreeScans={true}
              />
            </div>
            
            <button className="report-button" onClick={onGenerateReport}>
              Generate Report
            </button>
          </div>
        </div>
      )}
      
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
      
      <IssueList 
        issues={issues} 
        isLoading={isScanning} 
        nodesAccessible={canScan}
        onScan={onScan}
        freeScanCount={freeScanCount}
        totalScans={totalScans}
      />
    </div>
  );
};

export default Dashboard;