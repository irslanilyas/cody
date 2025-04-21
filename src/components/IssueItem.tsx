import React, { useState } from "react";
import { Issue } from "../types/issueTypes";

interface IssueItemProps {
  issue: Issue;
}

const IssueItem: React.FC<IssueItemProps> = ({ issue }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  const handleFix = async (fixIndex: number) => {
    setIsFixing(true);
    try {
      await issue.fixSuggestions[fixIndex].action();
    } catch (error) {
      console.error("Error applying fix:", error);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="issue-item">
      <div className="issue-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="issue-title">{issue.title}</h3>
        <span className={`issue-severity ${issue.severity}`}>{issue.severity}</span>
      </div>
      
      <p className="issue-description">{issue.description}</p>
      
      <div className="issue-location">
        Element: {issue.location.nodeName || "Unnamed element"}
      </div>
      
      {isExpanded && (
        <div className="issue-details">
          {issue.currentValue && issue.requiredValue && (
            <div className="issue-values">
              <div className="current-value">
                Current: {issue.currentValue}
              </div>
              <div className="required-value">
                Required: {issue.requiredValue}
              </div>
            </div>
          )}
          
          {issue.wcagGuideline && (
            <div className="issue-guideline">
              <span className="guideline-label">WCAG Guideline:</span>
              <span className="guideline-value">
                {issue.wcagGuideline}
                {issue.wcagLink && (
                  <a 
                    href={issue.wcagLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="guideline-link"
                  >
                    Learn more
                  </a>
                )}
              </span>
            </div>
          )}
          
          {issue.screenshot && (
            <div className="issue-screenshot">
              <img src={issue.screenshot} alt="Screenshot of the issue" />
            </div>
          )}
          
          {issue.fixSuggestions.length > 0 && (
            <div className="fix-suggestions">
              <h4 className="fix-title">Suggested Fixes:</h4>
              <ul className="fix-list">
                {issue.fixSuggestions.map((suggestion, index) => (
                  <li className="fix-item" key={index}>
                    <span className="fix-description">{suggestion.description}</span>
                    <button 
                      className="fix-button"
                      onClick={() => handleFix(index)}
                      disabled={isFixing}
                    >
                      {isFixing ? "Applying..." : "Apply Fix"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="issue-actions">
        <button 
          className="expand-button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Hide Details" : "Show Details"}
        </button>
        
        <button className="locate-button">
          Locate
        </button>
      </div>
    </div>
  );
};

export default IssueItem;