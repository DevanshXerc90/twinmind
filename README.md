# TwinMind — Live AI Meeting Copilot

A real-time AI meeting assistant that listens to your microphone, transcribes speech, surfaces contextual suggestions, and provides detailed answers — all powered by [Groq](https://groq.com).

![TwinMind Screenshot](docs/screenshot.png)

## 🚀 Live Demo

**Deployed URL:** _(add your deployment URL here)_

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Live transcription** | Whisper Large V3 via Groq — chunks every ~30s with auto-scroll |
| **3 contextual suggestions** | Generated per chunk with type-coded cards (question, answer, fact-check, talking point, clarification) |
| **Detailed chat answers** | Click any suggestion for a thorough, streaming response |
| **Free-form chat** | Ask anything about the meeting with full transcript context |
| **Editable prompts** | Customize all system prompts and parameters in Settings |
| **Session export** | Download full transcript + suggestions + chat as JSON |

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite 5 (vanilla CSS, no Tailwind)
- **Transcription:** Groq Whisper Large V3 (`whisper-large-v3`)
- **LLM:** GPT-OSS 120B via Groq (`openai/gpt-oss-120b`)
- **Audio:** Web Audio API + MediaRecorder (WebM/Opus)
- **Deployment:** Vercel / Netlify (static SPA, no backend)

## 📋 Setup

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/twinmind.git
cd twinmind

# Install
npm install

# Dev server
npm run dev

# Production build
npm run build
```

Open `http://localhost:5173`, click **Settings**, paste your Groq API key, and start recording.

## 🧠 Prompt Engineering Strategy

### Live Suggestions

The suggestion prompt is the heart of the product. Key design decisions:

1. **Analysis framework before generation.** The prompt asks the model to reason through the conversation phase (intro, brainstorming, debate, Q&A, wrap-up), detect unanswered questions, identify verifiable claims, and spot missing perspectives — all before generating suggestions. This chain-of-thought approach produces more contextually appropriate outputs.

2. **Typed suggestions with contextual selection.** Five suggestion types (`question`, `talking_point`, `answer`, `fact_check`, `clarification`) each have explicit "when to use" guidance. The model picks the right mix based on what's happening:
   - Someone asks a question → an `answer` suggestion appears
   - A statistic is cited → a `fact_check` suggestion surfaces
   - Discussion is surface-level → a `question` or `talking_point` is generated
   - Jargon is used → a `clarification` is offered

3. **Value-dense previews.** Each suggestion's preview must deliver standalone value — the user benefits even without clicking. This is enforced in the prompt with explicit rules against vague/generic output.

4. **Sliding context window.** Recent transcript chunks (configurable, default 5) are sent in full. Older transcript is truncated with a summary prefix, keeping the prompt lean while maintaining continuity.

### Detail Answers (on click)

When a user clicks a suggestion, a separate prompt generates a thorough expansion:
- Uses a larger context window (default 20 chunks) for comprehensive answers
- Structured output guidance (bullet points, headers, reasoning)
- Type-specific instructions (fact-check → accuracy analysis, question → complete answer + follow-ups)

### Chat

Free-form chat gets the full transcript as system context plus the entire chat history, enabling follow-up questions that reference earlier discussion.

## 🏗️ Architecture

```
src/
├── App.jsx                     # Root: state orchestration + data flow
├── App.css                     # Design system + all styles
├── components/
│   ├── Header.jsx              # Top bar with settings/export
│   ├── TranscriptPanel.jsx     # Left column: mic + transcript
│   ├── SuggestionsPanel.jsx    # Middle column: suggestion batches
│   ├── SuggestionCard.jsx      # Individual suggestion card
│   ├── ChatPanel.jsx           # Right column: chat + input
│   ├── ChatMessage.jsx         # Single chat message (markdown)
│   └── SettingsModal.jsx       # API key + prompt editor
├── hooks/
│   └── useAudioRecorder.js     # Mic capture with stop-restart cycles
├── services/
│   ├── groqApi.js              # Groq API wrapper (transcription, chat, streaming)
│   └── promptTemplates.js      # Default prompts + message builders
└── utils/
    ├── constants.js            # Config, defaults, type styling
    ├── exportUtils.js          # Session JSON export
    └── markdown.js             # Lightweight markdown → HTML renderer
```

### Data Flow

```
Mic → MediaRecorder (30s cycles) → WebM Blob
  → Groq Whisper API → transcript chunk
    → append to transcript state
    → Groq GPT-OSS 120B → 3 suggestions (JSON)
      → prepend to suggestion batches

Click suggestion → Groq GPT-OSS 120B (streaming) → chat message
Type question → Groq GPT-OSS 120B (streaming) → chat message
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Client-side only** | User provides their own API key → no backend needed, simpler deployment, lower latency |
| **Stop-restart audio cycles** | Each chunk is a complete WebM file, avoiding header/container issues with `timeslice` splitting |
| **Non-streaming suggestions** | Suggestions are parsed as JSON, so we need the complete response. Chat uses streaming for perceived speed. |
| **Refs for stale closure avoidance** | Audio callbacks fire asynchronously; React state refs ensure current values are always used |
| **CSS custom properties** | Single design token source, easy theming, no build-time CSS processing |

## ⚡ Latency Optimizations

1. **Parallel pipeline:** Suggestion generation starts immediately after transcription completes — no user interaction required.
2. **Streaming chat:** Tokens render as they arrive via SSE parsing, giving near-instant first-token display.
3. **JSON mode for suggestions:** `response_format: { type: 'json_object' }` avoids extraneous model output and reduces token count.
4. **Lean context windows:** Configurable, defaulting to last 5 chunks for suggestions (covers ~2.5 minutes), preventing prompt bloat.

## 📦 Export Format

```json
{
  "sessionStart": "2025-01-15T10:30:00.000Z",
  "sessionEnd": "2025-01-15T11:15:00.000Z",
  "transcript": [
    { "timestamp": "10:30:15 AM", "text": "..." }
  ],
  "suggestionBatches": [
    {
      "timestamp": "10:31:00 AM",
      "suggestions": [
        { "type": "question", "title": "...", "preview": "..." }
      ]
    }
  ],
  "chat": [
    { "timestamp": "10:32:00 AM", "role": "user", "content": "..." },
    { "timestamp": "10:32:01 AM", "role": "assistant", "content": "..." }
  ]
}
```

## 🔧 Configurable Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Groq API Key | — | User's own key |
| Auto-refresh interval | 30s | Seconds between audio chunks |
| Suggestion context window | 5 chunks | Recent chunks sent for suggestion generation |
| Detail context window | 20 chunks | Chunks sent for detailed click answers |
| Audio language | en | ISO 639-1 hint for Whisper |
| All prompts | Optimized defaults | Fully editable in the Prompts tab |

## 📄 License

MIT
