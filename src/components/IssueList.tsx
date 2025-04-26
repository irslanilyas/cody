// src/components/IssueList.tsx
import React from "react";
import IssueItem from "./IssueItem";
import { Issue } from "../types/issueTypes";
import ScanButton from "./ScanButton";

interface IssueListProps {
  issues: Issue[];
  isLoading: boolean;
  nodesAccessible?: boolean;
  onScan?: () => void;
  freeScanCount?: number;
  totalScans?: number;
}

const IssueList: React.FC<IssueListProps> = ({ 
  issues, 
  isLoading, 
  nodesAccessible = true,
  onScan,
  freeScanCount = 2,
  totalScans = 3
}) => {
  if (isLoading) {
    return (
      <div className="loading-spinner">
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (!nodesAccessible) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h3 className="empty-state-title">Permission Required</h3>
        <p className="empty-state-description">
          This plugin needs permission to access nodes in your Framer project.
        </p>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="welcome-container">
        <div className="welcome-header">
          <h1>Welcome to Accessibility Checker</h1>
          <p>Analyse your framer project for accessibility issues</p>
        </div>
        
        {onScan && (
          <ScanButton 
            onScan={onScan} 
            isScanning={false} 
            disabled={false}
            freeScanCount={freeScanCount}
            totalScans={totalScans}
            showFreeScans={true}
          />
        )}
        
        <div className="instruction-box">
          <div className="frame-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" rx="2" fill="#1E90FF"/>
              <path d="M9 9H15V15H9V9Z" stroke="white" strokeWidth="1.5"/>
              <path d="M7 17H17M7 7H17M17 7V17M7 7V17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p>Click the 'Scan' button to start<br />analysing your design</p>
        </div>
      </div>
    );
  }

  return (
    <div className="issue-list">
      {issues.map((issue) => (
        <IssueItem key={issue.id} issue={issue} />
      ))}
    </div>
  );
};

export default IssueList;