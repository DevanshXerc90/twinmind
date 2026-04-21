import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for mic capture with periodic chunking.
 * Uses timeslice-based recording with periodic flush for reliable audio capture.
 * Each flush creates a new MediaRecorder to ensure valid WebM headers.
 *
 * @param {(blob: Blob) => void} onAudioChunk - Called with a complete audio Blob each cycle
 * @param {number} chunkInterval - Milliseconds between chunks (default 30s)
 */
export function useAudioRecorder(onAudioChunk, chunkInterval = 30000) {
  const [isRecording, setIsRecording] = useState(false);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const isRecordingRef = useRef(false);
  const onChunkRef = useRef(onAudioChunk);
  onChunkRef.current = onAudioChunk;
  const chunksRef = useRef([]);

  const getMimeType = useCallback(() => {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      return 'audio/webm;codecs=opus';
    }
    if (MediaRecorder.isTypeSupported('audio/webm')) {
      return 'audio/webm';
    }
    if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
      return 'audio/ogg;codecs=opus';
    }
    return '';
  }, []);

  const flushAndRestart = useCallback((stream) => {
    const recorder = recorderRef.current;

    // Stop current recorder — this fires ondataavailable + onstop
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }

    // Start a fresh recorder (new WebM header)
    if (isRecordingRef.current && stream && stream.active) {
      startFreshRecorder(stream);
    }
  }, []);

  const startFreshRecorder = useCallback((stream) => {
    const mimeType = getMimeType();
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream, {
      mimeType: mimeType || undefined,
      audioBitsPerSecond: 128000,
    });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const collectedChunks = chunksRef.current;
      chunksRef.current = [];

      if (collectedChunks.length > 0) {
        const blob = new Blob(collectedChunks, {
          type: mimeType || 'audio/webm',
        });

        // Only send if blob has meaningful audio (> 1KB)
        if (blob.size > 1000) {
          console.log(`[Audio] Sending chunk: ${(blob.size / 1024).toFixed(1)}KB`);
          onChunkRef.current(blob);
        } else {
          console.log(`[Audio] Skipped tiny chunk: ${blob.size} bytes`);
        }
      }
    };

    // Use timeslice to ensure data is captured regularly
    recorder.start(500);
    console.log(`[Audio] Recorder started (${mimeType})`);

    // Schedule next flush
    timerRef.current = setTimeout(() => {
      if (isRecordingRef.current && stream.active) {
        flushAndRestart(stream);
      }
    }, chunkInterval);
  }, [chunkInterval, getMimeType, flushAndRestart]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Disable browser processing — it can distort audio and confuse Whisper
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
      });
      streamRef.current = stream;
      isRecordingRef.current = true;
      setIsRecording(true);
      startFreshRecorder(stream);
      console.log('[Audio] Recording started');
    } catch (err) {
      console.error('Microphone access denied:', err);
      throw err;
    }
  }, [startFreshRecorder]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Stop triggers onstop which sends the final chunk
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    console.log('[Audio] Recording stopped');
  }, []);

  return { isRecording, startRecording, stopRecording };
}
