// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { framer } from "framer-plugin";
import App from "./App";
import "./App.css";

// Define interfaces for the ErrorBoundary component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple error boundary component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null 
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    safeConsoleLog("Error caught by boundary:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>
            The Accessibility Checker encountered an error. Please try refreshing the plugin.
          </p>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap console.log to avoid potential issues
const safeConsoleLog = (...args: any[]): void => {
  try {
    console.log(...args);
  } catch (e) {
    // Suppress errors
  }
};

// Safe error handling
try {
  safeConsoleLog("Accessibility Checker plugin initializing...");
  
  // Show the UI with appropriate size and position
  framer.showUI({ 
    width: 480, 
    height: 480,
    position: "center" // Using a valid position value
  });
  
  // Create a root element for the plugin UI
  const rootElement = document.getElementById("root");
  
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    
    // Render the main application with error boundary
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    
    safeConsoleLog("Accessibility Checker plugin initialized successfully");
  } else {
    safeConsoleLog("Error: Root element not found");
  }
} catch (error) {
  safeConsoleLog("Error initializing Accessibility Checker plugin:", error);
}