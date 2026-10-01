import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('PingCheck UI error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fatal-error">
          <div className="fatal-card">
            <span className="eyebrow">PINGCHECK UI ERROR</span>
            <h2>This page failed to render.</h2>
            <p>{this.state.error.message}</p>
            <button className="btn primary" onClick={() => window.location.reload()}>Reload page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
