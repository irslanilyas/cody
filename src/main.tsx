import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    safeConsoleLog("Error caught by boundary:", error, errorInfo);
  }

  render() {
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
const safeConsoleLog = (...args: any[]) => {
  try {
    console.log(...args);
  } catch (e) {
    // Suppress errors
  }
};

// Safe error handling
try {
  safeConsoleLog("Accessibility Checker plugin initializing...");
  
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