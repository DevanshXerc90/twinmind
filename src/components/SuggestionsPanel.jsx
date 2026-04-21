import React from 'react';
import SuggestionCard from './SuggestionCard';

export default function SuggestionsPanel({
  suggestionBatches,
  isGenerating,
  onRefresh,
  onSuggestionClick,
  hasTranscript,
}) {
  const totalBatches = suggestionBatches.length;

  return (
    <section className="panel suggestions-panel" id="suggestions-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="panel-number">2.</span> Live Suggestions
        </h2>
        <span className="batch-count">{totalBatches} batch{totalBatches !== 1 ? 'es' : ''}</span>
      </div>

      <div className="suggestions-controls">
        <button
          className="refresh-btn"
          onClick={onRefresh}
          disabled={isGenerating || !hasTranscript}
          id="refresh-suggestions-button"
          title="Manually refresh suggestions"
        >
          <span className={`refresh-icon ${isGenerating ? 'spinning' : ''}`}>🔄</span>
          {isGenerating ? 'Generating…' : 'Refresh suggestions'}
        </button>
        <span className="auto-refresh-note">auto-refresh every ~30s</span>
      </div>

      <div className="suggestions-body" id="suggestions-body">
        {totalBatches === 0 && !isGenerating ? (
          <div className="empty-state">
            <span className="empty-icon">💡</span>
            <p>Suggestions appear here once recording starts.</p>
          </div>
        ) : (
          <>
            {isGenerating && (
              <div className="generating-indicator">
                <div className="shimmer-card" />
                <div className="shimmer-card" />
                <div className="shimmer-card" />
              </div>
            )}
            {suggestionBatches.map((batch) => (
              <div key={batch.id} className="suggestion-batch">
                <div className="batch-header">
                  <span className="batch-time">{batch.timestamp}</span>
                </div>
                <div className="batch-cards">
                  {batch.suggestions.map((suggestion, idx) => (
                    <SuggestionCard
                      key={`${batch.id}-${idx}`}
                      suggestion={suggestion}
                      onClick={onSuggestionClick}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
