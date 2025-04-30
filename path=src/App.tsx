import React, { useState } from 'react';

const [expandedTypes, setExpandedTypes] = useState({
  contrast: false,
  touchTarget: false,
  colorBlindness: false,
  textSize: false,
  altText: false,
  navigation: false
});

const toggleExpand = (type: keyof typeof expandedTypes) => {
  setExpandedTypes(prev => ({
    ...prev,
    [type]: !prev[type]
  }));
};

{selectedIssue && (
  <IssueDetailView
    issue={selectedIssue}
    onClose={() => setSelectedIssue(null)}
    onLocate={handleLocateIssue}
  />
)} 