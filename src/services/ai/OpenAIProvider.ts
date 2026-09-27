import { AIProvider, AIResponseWithSources, DefinitionResult } from './AIProvider';
import { ChatMessage, PageMetadata } from '../../types';
import { safeFetch } from '../../utils/safeFetch';
import { sanitizeGroqModel, GROQ_CANDIDATE_MODELS } from './aiModels';

export class OpenAIProvider implements AIProvider {
  id = 'openai';
  name = 'OpenAI Compatible';

  private apiKey: string;
  private modelName: string;
  private endpoint: string;

  constructor(
    apiKey: string,
    modelName?: string,
    endpoint: string = 'https://api.openai.com/v1/chat/completions'
  ) {
    this.apiKey = apiKey.trim();
    this.endpoint = endpoint.trim();

    // Model configuration based on target endpoint
    if (this.endpoint.includes('groq.com')) {
      this.modelName = sanitizeGroqModel(modelName);
    } else if (this.endpoint.includes('11434') || this.endpoint.includes('ollama')) {
      if (!modelName || modelName.startsWith('gpt') || modelName.startsWith('gemini')) {
        this.modelName = 'llama3';
      } else {
        this.modelName = modelName.trim();
      }
    } else {
      this.modelName = modelName?.trim() || 'gpt-4o-mini';
    }
  }

  async chat(
    messages: ChatMessage[],
    context?: PageMetadata,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponseWithSources> {
    if (!this.apiKey && !this.endpoint.includes('ollama')) {
      throw new Error('API key is required. Please add your key in Hyperlink Settings.');
    }

    const systemPrompt = `You are Hyperlink, a universal browser command center assistant.
Webpage Title: "${context?.title || 'Unknown'}"
URL: "${context?.url || 'Unknown'}"
${context?.selectedText ? `Selected text: "${context.selectedText}"` : ''}
Provide direct, concise, and helpful responses formatted in clean markdown.`;

    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Build model candidate sequence for fallback resilience
    const candidateModels = [this.modelName];
    if (this.endpoint.includes('groq.com')) {
      for (const m of GROQ_CANDIDATE_MODELS) {
        if (!candidateModels.includes(m)) {
          candidateModels.push(m);
        }
      }
    }

    let lastError: Error | null = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const currentModel = candidateModels[i];
      try {
        const response = await safeFetch(this.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: currentModel,
            messages: openAiMessages,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const rawText = await response.text();
          let errMsg = `Error ${response.status}: ${response.statusText}`;
          try {
            const errJson = JSON.parse(rawText);
            errMsg = errJson?.error?.message || errJson?.message || rawText;
          } catch {
            if (rawText) errMsg = rawText.slice(0, 200);
          }

          // If the model does not exist or was decommissioned, try next candidate
          const isModelError = 
            response.status === 404 || 
            response.status === 400 ||
            errMsg.toLowerCase().includes('model') ||
            errMsg.toLowerCase().includes('decommission') ||
            errMsg.toLowerCase().includes('deprecat') ||
            errMsg.toLowerCase().includes('does not exist') ||
            errMsg.toLowerCase().includes('not found') ||
            errMsg.toLowerCase().includes('access');

          if (isModelError && i < candidateModels.length - 1) {
            console.debug(`Model ${currentModel} unavailable (${errMsg}), retrying with fallback ${candidateModels[i + 1]}`);
            continue;
          }

          throw new Error(errMsg);
        }

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content || 'No response generated.';

        // If a fallback model succeeded, update our instance model and sync storage
        if (currentModel !== this.modelName) {
          this.modelName = currentModel;
          if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
            chrome.storage.sync.get('hyperlink_settings', (res) => {
              if (res && res.hyperlink_settings) {
                const updated = {
                  ...res.hyperlink_settings,
                  aiConfig: {
                    ...res.hyperlink_settings.aiConfig,
                    modelName: currentModel
                  }
                };
                chrome.storage.sync.set({ hyperlink_settings: updated }).catch(() => {});
              }
            });
          }
        }

        if (onChunk) onChunk(text);
        return { text, isLiveSearch: false };

      } catch (err: any) {
        lastError = err;
        const msg = (err?.message || '').toLowerCase();
        if (msg.includes('api key') || msg.includes('unauthorized') || msg.includes('401') || msg.includes('quota') || msg.includes('rate limit')) {
          throw err;
        }
        if (i === candidateModels.length - 1) {
          throw err;
        }
      }
    }

    throw lastError || new Error('Failed to generate AI response.');
  }

  async summarize(
    content: string,
    type: 'page' | 'selection' | 'article' | 'pdf' | 'video' = 'page',
    context?: PageMetadata
  ): Promise<string> {
    const prompt = `Summarize this ${type} content concisely with bullet points:\n\n${content.slice(0, 15000)}`;
    const res = await this.chat([{ id: '1', role: 'user', content: prompt, timestamp: Date.now() }], context);
    return res.text;
  }

  async explain(target: string, isCode: boolean = false, context?: string): Promise<string> {
    const prompt = isCode
      ? `Explain this code clearly:\n\`\`\`\n${target}\n\`\`\``
      : `Explain "${target}" in context: ${context || 'general'}`;
    const res = await this.chat([{ id: '1', role: 'user', content: prompt, timestamp: Date.now() }]);
    return res.text;
  }

  async define(word: string): Promise<DefinitionResult> {
    const prompt = `Define the word "${word}". Return JSON with keys: simple, example, technical.`;
    const res = await this.chat([{ id: '1', role: 'user', content: prompt, timestamp: Date.now() }]);
    try {
      const cleaned = res.text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { simple: res.text, example: `Used with "${word}".` };
    }
  }

  async translate(text: string, targetLang: string): Promise<string> {
    const prompt = `Translate this text directly into ${targetLang}:\n\n${text}`;
    const res = await this.chat([{ id: '1', role: 'user', content: prompt, timestamp: Date.now() }]);
    return res.text;
  }

  async extractStructured(text: string, targetType: string): Promise<any> {
    const prompt = `Extract ${targetType} from this text. Return strictly valid JSON array or object:\n\n${text.slice(0, 8000)}`;
    const res = await this.chat([{ id: '1', role: 'user', content: prompt, timestamp: Date.now() }]);
    try {
      const cleaned = res.text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { raw: res.text };
    }
  }

  async vision(base64Image: string, promptText: string): Promise<string> {
    let visionModel = 'gpt-4o-mini';
    if (this.endpoint.includes('groq.com')) {
      visionModel = 'qwen/qwen3.8-27b';
    }

    const response = await safeFetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: visionModel,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              { type: 'image_url', image_url: { url: base64Image } }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Vision request failed');
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || 'No description available.';
  }
}
