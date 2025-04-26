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
      <div className="welcome-section">
        {/* First container: Welcome text and scan button with gray background */}
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
        </div>
        
        {/* Second container: Instructions with white background */}
        <div className="instructions-container">
          <div className="instruction-box">
            <div className="frame-icon">
              <svg width="73" height="73" viewBox="0 0 73 73" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g filter="url(#filter0_dii_1_42)">
                  <rect x="10.2255" y="2.74548" width="52.7474" height="52.7474" rx="3.30995" fill="url(#paint0_linear_1_42)"/>
                  <g filter="url(#filter1_d_1_42)">
                    <path d="M26.5831 24.1111V21.6071C26.5831 20.943 26.8469 20.3061 27.3165 19.8365C27.7861 19.3669 28.423 19.1031 29.0871 19.1031H31.5911M26.5831 34.1272V36.6312C26.5831 37.2953 26.8469 37.9322 27.3165 38.4018C27.7861 38.8714 28.423 39.1352 29.0871 39.1352H31.5911M41.6072 19.1031H44.1112C44.7753 19.1031 45.4122 19.3669 45.8818 19.8365C46.3514 20.3061 46.6152 20.943 46.6152 21.6071V24.1111M41.6072 39.1352H44.1112C44.7753 39.1352 45.4122 38.8714 45.8818 38.4018C46.3514 37.9322 46.6152 37.2953 46.6152 36.6312V34.1272M30.3391 29.1192H42.8592" stroke="white" stroke-width="2.50402" stroke-linecap="round" stroke-linejoin="round"/>
                  </g>
                </g>
                <defs>
                  <filter id="filter0_dii_1_42" x="0.412003" y="0.292119" width="72.3743" height="72.3743" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="7.3601"/>
                    <feGaussianBlur stdDeviation="4.90673"/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0.516578 0 0 0 0 0.490089 0 0 0 0 0.490089 0 0 0 0.06 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_42"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_42" result="shape"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="2.45337"/>
                    <feGaussianBlur stdDeviation="1.22668"/>
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0.506845 0 0 0 0 0.697834 0 0 0 0 0.986489 0 0 0 1 0"/>
                    <feBlend mode="normal" in2="shape" result="effect2_innerShadow_1_42"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dx="2.45337"/>
                    <feGaussianBlur stdDeviation="1.22668"/>
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0.506845 0 0 0 0 0.697834 0 0 0 0 0.986489 0 0 0 1 0"/>
                    <feBlend mode="normal" in2="effect2_innerShadow_1_42" result="effect3_innerShadow_1_42"/>
                  </filter>
                  <filter id="filter1_d_1_42" x="15.776" y="11.7754" width="41.6462" height="41.6462" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="3.47941"/>
                    <feGaussianBlur stdDeviation="2.8995"/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0.0459471 0 0 0 0 0.381978 0 0 0 0 0.88072 0 0 0 1 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_42"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_42" result="shape"/>
                  </filter>
                  <linearGradient id="paint0_linear_1_42" x1="10.2255" y1="2.74548" x2="62.9728" y2="55.4928" gradientUnits="userSpaceOnUse">
                    <stop offset="0.303331" stop-color="#33A7FF"/>
                    <stop offset="1" stop-color="#0066FF"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p>Click the 'Scan' button to start<br />analysing your design</p>
          </div>
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