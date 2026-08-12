'use client';

import React from 'react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="hb-card"
          role="alert"
          aria-live="assertive"
          style={{ maxWidth: 560, margin: '40px auto' }}
        >
          <div className="hb-card-header">
            <h2 style={{ fontSize: 18 }}>Something went wrong</h2>
            <p>An unexpected error occurred while calculating your retirement plan.</p>
          </div>
          <div className="hb-card-body" style={{ textAlign: 'center', padding: 32 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
              This may be caused by invalid inputs. Please reload the page or reset all inputs to defaults.
            </p>
            <div className="hb-btn-group" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="hb-btn-secondary"
                onClick={() => window.location.reload()}
              >
                ↺ Reload page
              </button>
              <button
                type="button"
                className="hb-btn-primary"
                onClick={() => {
                  window.history.replaceState(null, '', window.location.pathname);
                  window.location.reload();
                }}
              >
                Reset all inputs
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
