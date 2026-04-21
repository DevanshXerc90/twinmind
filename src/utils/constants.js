export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
export const WHISPER_MODEL = 'whisper-large-v3';
export const LLM_MODEL = 'openai/gpt-oss-120b';

export const DEFAULT_SETTINGS = {
  suggestionPrompt: '',
  detailPrompt: '',
  chatPrompt: '',
  suggestionContextWindow: 5,
  detailContextWindow: 20,
  refreshInterval: 30,
  language: 'en',
};

export const SUGGESTION_TYPE_CONFIG = {
  question: {
    label: 'Question',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.25)',
    icon: '❓',
  },
  talking_point: {
    label: 'Talking Point',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.08)',
    border: 'rgba(139, 92, 246, 0.25)',
    icon: '💡',
  },
  answer: {
    label: 'Answer',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.25)',
    icon: '✅',
  },
  fact_check: {
    label: 'Fact Check',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.25)',
    icon: '🔍',
  },
  clarification: {
    label: 'Clarification',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.08)',
    border: 'rgba(6, 182, 212, 0.25)',
    icon: '📋',
  },
};
