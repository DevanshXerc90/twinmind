import React from 'react';
import { renderMarkdown } from '../utils/markdown';
import { SUGGESTION_TYPE_CONFIG } from '../utils/constants';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isSuggestion = message.type === 'suggestion';
  const typeConfig = isSuggestion
    ? SUGGESTION_TYPE_CONFIG[message.suggestionType] || null
    : null;

  return (
    <div className={`chat-message ${isUser ? 'chat-message-user' : 'chat-message-assistant'}`}>
      <div className="chat-message-meta">
        <span className="chat-message-role">
          {isUser ? '🧑 You' : '🤖 Meetly AI'}
        </span>
        <span className="chat-message-time">{message.timestamp}</span>
      </div>
      {isSuggestion && typeConfig && (
        <span
          className="chat-suggestion-badge"
          style={{ color: typeConfig.color, borderColor: typeConfig.border }}
        >
          {typeConfig.icon} {typeConfig.label}
        </span>
      )}
      <div
        className={`chat-message-content ${message.isStreaming ? 'streaming' : ''} ${message.isError ? 'error' : ''}`}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
      />
      {message.isStreaming && (
        <div className="typing-dots">
          <span /><span /><span />
        </div>
      )}
    </div>
  );
}
