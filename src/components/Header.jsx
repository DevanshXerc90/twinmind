import React from 'react';

export default function Header({ onOpenSettings, onExport, hasData }) {
  return (
    <header className="header" id="app-header">
      <div className="header-left">
        <div className="header-logo">
          <span className="logo-icon">🧠</span>
          <h1 className="logo-text">Meetly AI</h1>
        </div>
        <span className="header-tagline">AI Meeting Copilot</span>
      </div>
      <div className="header-right">
        {hasData && (
          <button
            className="header-btn export-btn"
            onClick={onExport}
            id="export-button"
            title="Export session"
          >
            <span className="btn-icon">📤</span>
            Export
          </button>
        )}
        <button
          className="header-btn settings-btn"
          onClick={onOpenSettings}
          id="settings-button"
          title="Settings"
        >
          <span className="btn-icon">⚙️</span>
          Settings
        </button>
      </div>
    </header>
  );
}
