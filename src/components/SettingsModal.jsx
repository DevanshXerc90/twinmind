import React, { useState, useEffect } from 'react';
import {
  DEFAULT_SUGGESTION_PROMPT,
  DEFAULT_DETAIL_PROMPT,
  DEFAULT_CHAT_PROMPT,
} from '../services/promptTemplates';
import { DEFAULT_SETTINGS } from '../utils/constants';

export default function SettingsModal({ settings, apiKey, onSave, onClose }) {
  const [localKey, setLocalKey] = useState(apiKey);
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const updateField = (field, value) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(localKey, localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings({ ...DEFAULT_SETTINGS });
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="settings-modal">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose} title="Close">✕</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`modal-tab ${activeTab === 'prompts' ? 'active' : ''}`}
            onClick={() => setActiveTab('prompts')}
          >
            Prompts
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'general' && (
            <div className="settings-section">
              <label className="settings-label" htmlFor="api-key-input">
                Groq API Key
                <span className="settings-hint">
                  Get yours at{' '}
                  <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">
                    console.groq.com
                  </a>
                </span>
              </label>
              <input
                id="api-key-input"
                type="password"
                className="settings-input"
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="gsk_..."
              />

              <label className="settings-label" htmlFor="refresh-interval">
                Auto-refresh interval (seconds)
              </label>
              <input
                id="refresh-interval"
                type="number"
                className="settings-input settings-input-small"
                value={localSettings.refreshInterval}
                onChange={(e) => updateField('refreshInterval', parseInt(e.target.value, 10) || 30)}
                min={10}
                max={120}
              />

              <label className="settings-label" htmlFor="suggestion-context">
                Suggestion context window (transcript chunks)
              </label>
              <input
                id="suggestion-context"
                type="number"
                className="settings-input settings-input-small"
                value={localSettings.suggestionContextWindow}
                onChange={(e) => updateField('suggestionContextWindow', parseInt(e.target.value, 10) || 5)}
                min={1}
                max={50}
              />

              <label className="settings-label" htmlFor="detail-context">
                Detail answer context window (transcript chunks)
              </label>
              <input
                id="detail-context"
                type="number"
                className="settings-input settings-input-small"
                value={localSettings.detailContextWindow}
                onChange={(e) => updateField('detailContextWindow', parseInt(e.target.value, 10) || 20)}
                min={1}
                max={100}
              />

              <label className="settings-label" htmlFor="language-select">
                Audio language (ISO 639-1)
              </label>
              <input
                id="language-select"
                type="text"
                className="settings-input settings-input-small"
                value={localSettings.language}
                onChange={(e) => updateField('language', e.target.value)}
                placeholder="en"
              />
            </div>
          )}

          {activeTab === 'prompts' && (
            <div className="settings-section">
              <label className="settings-label" htmlFor="suggestion-prompt">
                Live Suggestion Prompt
                <span className="settings-hint">System prompt for generating 3 suggestions</span>
              </label>
              <textarea
                id="suggestion-prompt"
                className="settings-textarea"
                value={localSettings.suggestionPrompt || ''}
                onChange={(e) => updateField('suggestionPrompt', e.target.value)}
                placeholder={DEFAULT_SUGGESTION_PROMPT}
                rows={8}
              />

              <label className="settings-label" htmlFor="detail-prompt">
                Detail Answer Prompt
                <span className="settings-hint">System prompt for expanded answers on click</span>
              </label>
              <textarea
                id="detail-prompt"
                className="settings-textarea"
                value={localSettings.detailPrompt || ''}
                onChange={(e) => updateField('detailPrompt', e.target.value)}
                placeholder={DEFAULT_DETAIL_PROMPT}
                rows={6}
              />

              <label className="settings-label" htmlFor="chat-prompt">
                Chat Prompt
                <span className="settings-hint">System prompt for free-form chat</span>
              </label>
              <textarea
                id="chat-prompt"
                className="settings-textarea"
                value={localSettings.chatPrompt || ''}
                onChange={(e) => updateField('chatPrompt', e.target.value)}
                placeholder={DEFAULT_CHAT_PROMPT}
                rows={6}
              />

              <button className="reset-btn" onClick={handleReset}>
                Reset all to defaults
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="modal-btn-primary" onClick={handleSave} id="save-settings-button">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
