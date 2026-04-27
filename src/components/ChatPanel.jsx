import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';

export default function ChatPanel({ chatMessages, onSendMessage, isStreaming }) {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <section className="panel chat-panel" id="chat-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="panel-number">3.</span> Chat
        </h2>
        <span className="status-badge status-idle">Session Only</span>
      </div>

      <div className="chat-body" ref={scrollRef} id="chat-body">
        {chatMessages.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">💬</span>
            <p>Click a suggestion or type a question below.</p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit} id="chat-form">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about the meeting…"
          rows={1}
          disabled={isStreaming}
          id="chat-input"
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!input.trim() || isStreaming}
          id="chat-send-button"
          title="Send message"
        >
          Send
        </button>
      </form>
    </section>
  );
}
