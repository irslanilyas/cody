import React, { useState } from 'react';

const [expandedIssueIds, setExpandedIssueIds] = useState<Record<string, boolean>>({});

const toggleIssueDetails = (issueId: string) => {
  setExpandedIssueIds(prev => ({
    ...prev,
    [issueId]: !prev[issueId]
  }));
};

const handleShowDetails = (issueId: string) => {
  toggleIssueDetails(issueId);
}; 