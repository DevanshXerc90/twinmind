import React, { useEffect, useRef, useState } from 'react';

/**
 * Monitors microphone audio levels using Web Audio API.
 * Returns a 0-100 volume level for visual feedback.
 */
function useAudioLevel(isRecording) {
  const [level, setLevel] = useState(0);
  const animFrameRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const contextRef = useRef(null);

  useEffect(() => {
    if (!isRecording) {
      setLevel(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (contextRef.current) {
        contextRef.current.close().catch(() => {});
        contextRef.current = null;
      }
      return;
    }

    // Get the active mic stream from the existing getUserMedia
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        contextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;
        const analyser = ctx.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 256;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => {});

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (contextRef.current) {
        contextRef.current.close().catch(() => {});
        contextRef.current = null;
      }
    };
  }, [isRecording]);

  return level;
}

export default function TranscriptPanel({
  transcript,
  isRecording,
  isTranscribing,
  onToggleRecording,
  hasApiKey,
}) {
  const scrollRef = useRef(null);
  const audioLevel = useAudioLevel(isRecording);

  // Auto-scroll to latest transcript chunk
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <section className="panel transcript-panel" id="transcript-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="panel-number">1.</span> Mic &amp; Transcript
        </h2>
        <span className={`status-badge ${isRecording ? 'status-recording' : 'status-idle'}`}>
          {isRecording ? (isTranscribing ? 'Transcribing…' : 'Recording') : 'Idle'}
        </span>
      </div>

      <div className="mic-controls">
        <button
          className={`mic-button ${isRecording ? 'mic-active' : ''}`}
          onClick={onToggleRecording}
          disabled={!hasApiKey}
          id="mic-button"
          title={!hasApiKey ? 'Set your Groq API key in Settings first' : isRecording ? 'Stop recording' : 'Start recording'}
        >
          <span className="mic-icon">{isRecording ? '⏹' : '🎙️'}</span>
          <span className="mic-label">{isRecording ? 'Stop' : 'Start'}</span>
        </button>
        {!hasApiKey && (
          <p className="mic-hint">Paste your Groq API key in Settings to begin</p>
        )}
        {isRecording && (
          <div className="recording-indicator">
            <span className="pulse-dot" />
            <span className="recording-text">Listening… chunks every ~30s</span>
          </div>
        )}
        {isRecording && (
          <div className="audio-level-bar" title={`Mic level: ${audioLevel}%`}>
            <div
              className="audio-level-fill"
              style={{
                width: `${audioLevel}%`,
                backgroundColor: audioLevel > 5 ? '#10b981' : '#ef4444',
              }}
            />
            <span className="audio-level-label">
              {audioLevel > 5 ? '🟢 Mic active' : '🔴 No audio detected — check mic'}
            </span>
          </div>
        )}
      </div>

      <div className="transcript-body" ref={scrollRef} id="transcript-body">
        {transcript.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <p>No transcript yet — start the mic.</p>
          </div>
        ) : (
          transcript.map((chunk) => (
            <div key={chunk.id} className="transcript-chunk">
              <span className="chunk-time">{chunk.timestamp}</span>
              <p className="chunk-text">{chunk.text}</p>
            </div>
          ))
        )}
        {isTranscribing && (
          <div className="transcribing-indicator">
            <div className="typing-dots">
              <span /><span /><span />
            </div>
            <span>Transcribing audio…</span>
          </div>
        )}
      </div>
    </section>
  );
}
