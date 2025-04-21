import React from "react";
import { IssueFilters } from "../types/issueTypes";

interface FilterControlsProps {
  filters: IssueFilters;
  onFilterChange: (category: "severity" | "type", name: string, value: boolean) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="filter-controls">
      <div className="filter-group">
        <h3 className="filter-group-title">Severity</h3>
        <div className="filter-options">
          <label className="filter-option">
            <input 
              type="checkbox" 
              checked={filters.severity.critical} 
              onChange={(e) => onFilterChange("severity", "critical", e.target.checked)} 
            />
            Critical
          </label>
          <label className="filter-option">
            <input 
              type="checkbox" 
              checked={filters.severity.warning} 
              onChange={(e) => onFilterChange("severity", "warning", e.target.checked)} 
            />
            Warning
          </label>
          <label className="filter-option">
            <input 
              type="checkbox" 
              checked={filters.severity.info} 
              onChange={(e) => onFilterChange("severity", "info", e.target.checked)} 
            />
            Info
          </label>
        </div>
      </div>
      
      <div className="filter-group">
        <h3 className="filter-group-title">Type</h3>
        <div className="filter-options">
          <label className="filter-option">
            <input 
              type="checkbox" 
              checked={filters.type.contrast} 
              onChange={(e) => onFilterChange("type", "contrast", e.target.checked)} 
            />
            Contrast
          </label>
          <label className="filter-option">
            <input 
              type="checkbox" 
              checked={filters.type.textSize} 
              onChange={(e) => onFilterChange("type", "textSize", e.target.checked)} 
            />
            Text Size
          </label>
          <label className="filter-option">
            <input 
              type="checkbox" 
              checked={filters.type.touchTarget} 
              onChange={(e) => onFilterChange("type", "touchTarget", e.target.checked)} 
            />
            Touch Target
          </label>
          <label className="filter-option">
            <input 
              type="checkbox" 
              checked={filters.type.altText} 
              onChange={(e) => onFilterChange("type", "altText", e.target.checked)} 
            />
            Alt Text
          </label>
          <label className="filter-option">
            <input 
              type="checkbox" 
              checked={filters.type.colorBlindness} 
              onChange={(e) => onFilterChange("type", "colorBlindness", e.target.checked)} 
            />
            Color Blindness
          </label>
          <label className="filter-option">
            <input 
              type="checkbox" 
              checked={filters.type.navigation} 
              onChange={(e) => onFilterChange("type", "navigation", e.target.checked)} 
            />
            Navigation
          </label>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;