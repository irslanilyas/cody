// Updated src/components/FilterControls.tsx
import React from "react";
import { IssueFilters } from "../types/issueTypes";

interface FilterControlsProps {
  filters: IssueFilters;
  onFilterChange: (category: "severity" | "type", name: string, value: boolean) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="filter-controls">
      <div className="filter-grid">
        <div className="filter-column">
          <h3 className="filter-group-title">Severity</h3>
          <div className="filter-options-column">
            <label className="filter-option">
              <input 
                type="checkbox" 
                checked={filters.severity.critical} 
                onChange={(e) => onFilterChange("severity", "critical", e.target.checked)} 
              />
              <span className="filter-label">Critical</span>
            </label>
            <label className="filter-option">
              <input 
                type="checkbox" 
                checked={filters.severity.warning} 
                onChange={(e) => onFilterChange("severity", "warning", e.target.checked)} 
              />
              <span className="filter-label">Warning</span>
            </label>
            <label className="filter-option">
              <input 
                type="checkbox" 
                checked={filters.severity.info} 
                onChange={(e) => onFilterChange("severity", "info", e.target.checked)} 
              />
              <span className="filter-label">Info</span>
            </label>
          </div>
        </div>
        
        <div className="filter-column">
          <h3 className="filter-group-title">Type</h3>
          <div className="filter-options-grid">
            <label className="filter-option">
              <input 
                type="checkbox" 
                checked={filters.type.contrast} 
                onChange={(e) => onFilterChange("type", "contrast", e.target.checked)} 
              />
              <span className="filter-label">Contrast</span>
            </label>
            <label className="filter-option">
              <input 
                type="checkbox" 
                checked={filters.type.textSize} 
                onChange={(e) => onFilterChange("type", "textSize", e.target.checked)} 
              />
              <span className="filter-label">Text Size</span>
            </label>
            <label className="filter-option">
              <input 
                type="checkbox" 
                checked={filters.type.touchTarget} 
                onChange={(e) => onFilterChange("type", "touchTarget", e.target.checked)} 
              />
              <span className="filter-label">Touch Target</span>
            </label>
            <label className="filter-option">
              <input 
                type="checkbox" 
                checked={filters.type.altText} 
                onChange={(e) => onFilterChange("type", "altText", e.target.checked)} 
              />
              <span className="filter-label">Alt Text</span>
            </label>
            <label className="filter-option">
              <input 
                type="checkbox" 
                checked={filters.type.colorBlindness} 
                onChange={(e) => onFilterChange("type", "colorBlindness", e.target.checked)} 
              />
              <span className="filter-label">Color Blindness</span>
            </label>
            <label className="filter-option">
              <input 
                type="checkbox" 
                checked={filters.type.navigation} 
                onChange={(e) => onFilterChange("type", "navigation", e.target.checked)} 
              />
              <span className="filter-label">Navigation</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;