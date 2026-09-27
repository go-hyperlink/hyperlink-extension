/**
 * Supported and deprecated AI models configuration.
 * Specifically handles automatic upgrades from decommissioned Groq/OpenAI models.
 */

export const DEPRECATED_GROQ_MODELS = [
  'mixtral-8x7b-32768',
  'llama-3.1-70b-versatile',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'gemma-7b-it',
  'gemma2-9b-it',
  'llama-3.2-1b-preview',
  'llama-3.2-3b-preview',
  'llama3-groq-70b-8192-tool-use-preview',
  'llama3-groq-8b-8192-tool-use-preview',
];

export const GROQ_DEFAULT_MODEL = 'llama-3.1-8b-instant';

export const GROQ_CANDIDATE_MODELS = [
  'qwen/qwen3.8-27b',
  'llama-3.1-8b-instant',
  'deepseek-r1-distill-llama-70b',
  'llama-3.3-70b-versatile',
];

/**
 * Sanitizes and auto-upgrades a Groq model name.
 * If the model is empty, deprecated, restricted, or an incompatible model name (e.g. gpt/gemini),
 * it returns the universal free-tier model: 'llama-3.1-8b-instant'.
 */
export function sanitizeGroqModel(model?: string): string {
  if (!model) return GROQ_DEFAULT_MODEL;
  const m = model.trim();
  if (
    !m ||
    DEPRECATED_GROQ_MODELS.includes(m) ||
    m.toLowerCase().includes('mixtral') ||
    m.toLowerCase().includes('openai/') ||
    m.toLowerCase().startsWith('gpt') ||
    m.toLowerCase().startsWith('gemini') ||
    m === 'llama-3.1-70b' ||
    m === 'llama-3-70b' ||
    m === 'llama-3-8b'
  ) {
    return GROQ_DEFAULT_MODEL;
  }
  return m;
}
