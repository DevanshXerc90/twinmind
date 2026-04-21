import React from 'react';
import { SUGGESTION_TYPE_CONFIG } from '../utils/constants';

export default function SuggestionCard({ suggestion, onClick }) {
  const config = SUGGESTION_TYPE_CONFIG[suggestion.type] || SUGGESTION_TYPE_CONFIG.clarification;

  return (
    <button
      className="suggestion-card"
      onClick={() => onClick(suggestion)}
      style={{
        '--card-color': config.color,
        '--card-bg': config.bg,
        '--card-border': config.border,
      }}
      title="Click for detailed answer"
    >
      <div className="suggestion-card-header">
        <span
          className="suggestion-type-badge"
          style={{ backgroundColor: config.bg, color: config.color, borderColor: config.border }}
        >
          {config.icon} {config.label}
        </span>
      </div>
      <h4 className="suggestion-title">{suggestion.title}</h4>
      <p className="suggestion-preview">{suggestion.preview}</p>
    </button>
  );
}
