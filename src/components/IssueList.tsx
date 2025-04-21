import React from "react";
import IssueItem from "./IssueItem";
import { Issue } from "../types/issueTypes";

interface IssueListProps {
  issues: Issue[];
  isLoading: boolean;
}

const IssueList: React.FC<IssueListProps> = ({ issues, isLoading }) => {
  if (isLoading) {
    return (
      <div className="loading-spinner">
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <h3 className="empty-state-title">No accessibility issues found</h3>
        <p className="empty-state-description">
          {issues.length === 0
            ? "Click the 'Scan' button to analyze your design for accessibility issues."
            : "No issues match your current filters."}
        </p>
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