// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.tsx'

// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )

import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// This wrapper forces ANY hidden error to show up on the white screen
class ErrorBoundary extends React.Component<{}, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', backgroundColor: '#fee2e2', margin: '20px', border: '2px solid red', fontFamily: 'monospace' }}>
          <h1 style={{ color: 'red', fontSize: '24px' }}>🚨 REACT CRASH DETECTED 🚨</h1>
          <p style={{ marginTop: '10px' }}><strong>Error Message:</strong> {this.state.error?.message}</p>
          <pre style={{ whiteSpace: 'pre-wrap', color: 'black', marginTop: '20px', backgroundColor: '#fff', padding: '10px', borderRadius: '5px' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Try to mount the app, if it fails before React even loads, alert it.
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find <div id='root'></div> in your index.html!");
  }

  createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
} catch (error) {
  document.body.innerHTML = `<h1 style="color:red; padding: 20px;">Fatal Error Before React Loaded: ${error}</h1>`;
}