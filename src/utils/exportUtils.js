/**
 * Export the full session as a downloadable JSON file.
 */
export function exportSession({ transcript, suggestionBatches, chatMessages, sessionStart }) {
  const sessionData = {
    sessionStart,
    sessionEnd: new Date().toISOString(),
    transcript: transcript.map((chunk) => ({
      timestamp: chunk.timestamp,
      text: chunk.text,
    })),
    suggestionBatches: suggestionBatches.map((batch) => ({
      timestamp: batch.timestamp,
      suggestions: batch.suggestions.map((s) => ({
        type: s.type,
        title: s.title,
        preview: s.preview,
      })),
    })),
    chat: chatMessages
      .filter((m) => !m.isStreaming)
      .map((m) => ({
        timestamp: m.timestamp,
        role: m.role,
        content: m.content,
        ...(m.suggestionType && { suggestionType: m.suggestionType }),
      })),
  };

  const blob = new Blob([JSON.stringify(sessionData, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meetly-ai-session-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
