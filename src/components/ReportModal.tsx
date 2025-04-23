// src/components/ReportModal.tsx
import React, { useState } from "react";
import { Issue } from "../types/issueTypes";
import { generateHtmlReport, generateCsvReport, exportReport } from "../utils/reportGenerator";
import "../styles/ReportModal.css";

interface ReportModalProps {
  issues: Issue[];
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ issues, onClose }) => {
  const [format, setFormat] = useState<"html" | "csv">("html");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    try {
      setIsExporting(true);
      setError(null);
      
      let reportData: string;
      
      if (format === "html") {
        reportData = generateHtmlReport(issues);
      } else {
        reportData = generateCsvReport(issues);
      }
      
      exportReport(reportData, format);
      setTimeout(() => {
        onClose();
      }, 1000); // Close modal after successful export
    } catch (err) {
      setError(`Failed to generate report: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Generate Accessibility Report</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p>Generate a report for {issues.length} accessibility issues found in your project.</p>
          
          <div className="format-options">
            <h4>Report Format</h4>
            <label className="format-option">
              <input
                type="radio"
                name="format"
                value="html"
                checked={format === "html"}
                onChange={() => setFormat("html")}
              />
              <span className="format-label">HTML Report</span>
              <p className="format-description">Generate a detailed HTML report with full descriptions and styling.</p>
            </label>
            
            <label className="format-option">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={format === "csv"}
                onChange={() => setFormat("csv")}
              />
              <span className="format-label">CSV Report</span>
              <p className="format-description">Generate a CSV file that can be opened in Excel or Google Sheets.</p>
            </label>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose} disabled={isExporting}>
            Cancel
          </button>
          <button 
            className="export-button" 
            onClick={handleExport} 
            disabled={isExporting}
          >
            {isExporting ? "Generating..." : `Export ${format.toUpperCase()} Report`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;