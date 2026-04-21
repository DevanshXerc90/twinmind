import { GROQ_BASE_URL, WHISPER_MODEL, LLM_MODEL } from '../utils/constants';

/**
 * Transcribe audio using Groq's Whisper API.
 * @param {Blob} audioBlob - WebM audio blob
 * @param {string} apiKey - Groq API key
 * @param {string} language - ISO-639-1 language code
 * @returns {Promise<{text: string}>}
 */
export async function transcribeAudio(audioBlob, apiKey, language = 'en') {
  console.log(`[Transcription] Sending ${(audioBlob.size / 1024).toFixed(1)}KB audio (type: ${audioBlob.type})`);

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', WHISPER_MODEL);
  // Only set language if explicitly specified (not 'auto') — otherwise Whisper auto-detects
  if (language && language !== 'auto') {
    formData.append('language', language);
  }
  formData.append('response_format', 'json');
  formData.append('temperature', '0');

  const response = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Transcription failed (${response.status})`);
  }

  const result = await response.json();
  console.log(`[Transcription] Result: "${result.text?.slice(0, 100)}..."`);
  return result;
}

/**
 * Generate suggestions (non-streaming) using Groq chat completions.
 * @param {Array} messages - Chat messages array
 * @param {string} apiKey - Groq API key
 * @returns {Promise<Object>} - Chat completion response
 */
export async function generateSuggestions(messages, apiKey) {
  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Suggestions failed (${response.status})`);
  }

  return response.json();
}

/**
 * Stream a chat response from Groq.
 * Yields content chunks as they arrive.
 * @param {Array} messages - Chat messages array
 * @param {string} apiKey - Groq API key
 */
export async function* streamChatResponse(messages, apiKey) {
  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Chat failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Skip malformed SSE chunks
        }
      }
    }
  }
}
