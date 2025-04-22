// src/components/IssueItem.tsx
import React, { useState } from "react";
import { framer } from "framer-plugin";
import { Issue } from "../types/issueTypes";

interface IssueItemProps {
  issue: Issue;
}

const IssueItem: React.FC<IssueItemProps> = ({ issue }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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

  const handleLocate = async () => {
    try {
      setIsLocating(true);
      
      const nodeId = issue.location.nodeId;
      
      if (!nodeId) {
        console.error("No node ID available for this issue");
        return;
      }
      
      // First just set the selection
      await framer.setSelection([nodeId]);
      
      // Delay the zoom to create a visual separation between selection and zoom
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Then zoom, possibly with custom options if supported
      try {
        // Try with options first (this is speculative based on your description)
        await (framer as any).zoomIntoView(nodeId, {
          zoom: 0.1,  // Less zoom (0.0-1.0 range)
          duration: 800  // Slower animation in milliseconds
        });
      } catch (e) {
        // Fall back to standard zoom if options aren't supported
        await (framer as any).zoomIntoView(nodeId);
      }
    } catch (error) {
      console.error("Error locating node:", error);
    } finally {
      setIsLocating(false);
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
        
        <button 
          className="locate-button"
          onClick={handleLocate}
          disabled={isLocating}
        >
          {isLocating ? "Locating..." : "Locate"}
        </button>
      </div>
    </div>
  );
};

export default IssueItem;