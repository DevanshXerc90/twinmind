import React, { useState, useCallback, useRef } from 'react';
import Header from './components/Header';
import TranscriptPanel from './components/TranscriptPanel';
import SuggestionsPanel from './components/SuggestionsPanel';
import ChatPanel from './components/ChatPanel';
import SettingsModal from './components/SettingsModal';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { transcribeAudio, generateSuggestions, streamChatResponse } from './services/groqApi';
import {
  buildSuggestionMessages,
  buildDetailMessages,
  buildChatMessages,
} from './services/promptTemplates';
import { exportSession } from './utils/exportUtils';
import { DEFAULT_SETTINGS } from './utils/constants';

const SESSION_START = new Date().toISOString();

export default function App() {
  /* ---- Settings state ---- */
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('groq_api_key') || '');
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('twinmind_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  });

  /* ---- Core app state ---- */
  const [transcript, setTranscript] = useState([]);
  const [suggestionBatches, setSuggestionBatches] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  /* ---- Loading / status ---- */
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [error, setError] = useState(null);

  /* ---- Refs to avoid stale closures ---- */
  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;
  const apiKeyRef = useRef(apiKey);
  apiKeyRef.current = apiKey;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const chatMessagesRef = useRef(chatMessages);
  chatMessagesRef.current = chatMessages;
  const isGeneratingRef = useRef(false);

  /* ---- Suggestion generation ---- */
  const handleGenerateSuggestions = useCallback(async (currentTranscript) => {
    const t = currentTranscript || transcriptRef.current;
    if (t.length === 0 || !apiKeyRef.current || isGeneratingRef.current) return;

    isGeneratingRef.current = true;
    setIsGeneratingSuggestions(true);
    setError(null);

    try {
      const messages = buildSuggestionMessages(
        t,
        settingsRef.current.suggestionPrompt,
        settingsRef.current.suggestionContextWindow,
      );
      const result = await generateSuggestions(messages, apiKeyRef.current);
      const content = result.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);

      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        setSuggestionBatches((prev) => [
          {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            suggestions: parsed.suggestions.slice(0, 3),
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error('Suggestion error:', err);
      setError(`Suggestions: ${err.message}`);
    } finally {
      setIsGeneratingSuggestions(false);
      isGeneratingRef.current = false;
    }
  }, []);

  /* ---- Audio chunk handler (called by recorder every ~30s) ---- */
  const handleAudioChunk = useCallback(
    async (blob) => {
      if (!apiKeyRef.current) return;
      setIsTranscribing(true);
      setError(null);

      try {
        const result = await transcribeAudio(
          blob,
          apiKeyRef.current,
          settingsRef.current.language,
        );
        if (result.text && result.text.trim()) {
          const newChunk = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            text: result.text.trim(),
          };
          setTranscript((prev) => {
            const updated = [...prev, newChunk];
            transcriptRef.current = updated;
            handleGenerateSuggestions(updated);
            return updated;
          });
        }
      } catch (err) {
        console.error('Transcription error:', err);
        setError(`Transcription: ${err.message}`);
      } finally {
        setIsTranscribing(false);
      }
    },
    [handleGenerateSuggestions],
  );

  /* ---- Audio recorder hook ---- */
  const { isRecording, startRecording, stopRecording } = useAudioRecorder(
    handleAudioChunk,
    (settings.refreshInterval || 30) * 1000,
  );

  /* ---- Mic toggle ---- */
  const handleToggleRecording = useCallback(async () => {
    try {
      if (isRecording) {
        stopRecording();
      } else {
        await startRecording();
      }
    } catch (err) {
      setError(`Microphone: ${err.message}`);
    }
  }, [isRecording, startRecording, stopRecording]);

  /* ---- Manual refresh ---- */
  const handleManualRefresh = useCallback(() => {
    handleGenerateSuggestions(transcriptRef.current);
  }, [handleGenerateSuggestions]);

  /* ---- Suggestion click → detailed answer in chat ---- */
  const handleSuggestionClick = useCallback(async (suggestion) => {
    if (!apiKeyRef.current) return;

    const userMsg = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      role: 'user',
      content: `**${suggestion.title}**\n${suggestion.preview}`,
      type: 'suggestion',
      suggestionType: suggestion.type,
    };

    const assistantId = Date.now() + 1;
    const assistantMsg = {
      id: assistantId,
      timestamp: new Date().toLocaleTimeString(),
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    setChatMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreamingMessageId(assistantId);

    try {
      const messages = buildDetailMessages(
        transcriptRef.current,
        suggestion,
        settingsRef.current.detailPrompt,
        settingsRef.current.detailContextWindow,
      );

      for await (const chunk of streamChatResponse(messages, apiKeyRef.current)) {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
        );
      }
    } catch (err) {
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `Error: ${err.message}`, isError: true } : m,
        ),
      );
    } finally {
      setChatMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m)),
      );
      setStreamingMessageId(null);
    }
  }, []);

  /* ---- Free-form chat send ---- */
  const handleChatSend = useCallback(async (message) => {
    if (!apiKeyRef.current || !message.trim()) return;

    const userMsg = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      role: 'user',
      content: message,
    };

    const assistantId = Date.now() + 1;
    const assistantMsg = {
      id: assistantId,
      timestamp: new Date().toLocaleTimeString(),
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    setChatMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreamingMessageId(assistantId);

    try {
      const history = [...chatMessagesRef.current, userMsg].filter(
        (m) => !m.isStreaming && m.content,
      );
      const messages = buildChatMessages(
        transcriptRef.current,
        history,
        settingsRef.current.chatPrompt,
      );

      for await (const chunk of streamChatResponse(messages, apiKeyRef.current)) {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
        );
      }
    } catch (err) {
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `Error: ${err.message}`, isError: true } : m,
        ),
      );
    } finally {
      setChatMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m)),
      );
      setStreamingMessageId(null);
    }
  }, []);

  /* ---- Settings save ---- */
  const handleSaveSettings = useCallback((newKey, newSettings) => {
    setApiKey(newKey);
    setSettings(newSettings);
    apiKeyRef.current = newKey;
    settingsRef.current = newSettings;
    localStorage.setItem('groq_api_key', newKey);
    localStorage.setItem('twinmind_settings', JSON.stringify(newSettings));
  }, []);

  /* ---- Export ---- */
  const handleExport = useCallback(() => {
    exportSession({
      transcript: transcriptRef.current,
      suggestionBatches,
      chatMessages: chatMessagesRef.current,
      sessionStart: SESSION_START,
    });
  }, [suggestionBatches]);

  const hasData = transcript.length > 0 || suggestionBatches.length > 0 || chatMessages.length > 0;

  return (
    <div className="app" id="twinmind-app">
      <Header
        onOpenSettings={() => setShowSettings(true)}
        onExport={handleExport}
        hasData={hasData}
      />

      {error && (
        <div className="error-bar" id="error-bar">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="error-dismiss">✕</button>
        </div>
      )}

      <main className="main-layout" id="main-layout">
        <TranscriptPanel
          transcript={transcript}
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          onToggleRecording={handleToggleRecording}
          hasApiKey={!!apiKey}
        />
        <SuggestionsPanel
          suggestionBatches={suggestionBatches}
          isGenerating={isGeneratingSuggestions}
          onRefresh={handleManualRefresh}
          onSuggestionClick={handleSuggestionClick}
          hasTranscript={transcript.length > 0}
        />
        <ChatPanel
          chatMessages={chatMessages}
          onSendMessage={handleChatSend}
          isStreaming={!!streamingMessageId}
        />
      </main>

      {showSettings && (
        <SettingsModal
          settings={settings}
          apiKey={apiKey}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
