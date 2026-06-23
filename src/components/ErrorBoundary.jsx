import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details to console or error reporter
    console.error("Uncaught error captured by ErrorBoundary:", error, errorInfo);
  }

  handleReload = () => {
    // Reloads the window to restart the React app context
    window.location.reload();
  };

  render() {
    /* Conditional Render: If a runtime rendering crash occurred, show error page */
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
          <div className="bg-white border border-red-100 shadow-xl rounded-2xl p-8 max-w-md w-full text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-6">
              <AlertOctagon className="h-8 w-8 text-red-650" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-8 font-medium">
              An unexpected application error occurred. Click reload below to refresh the page.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
