import { AIProvider, AIResponseWithSources, DefinitionResult } from './AIProvider';
import { ChatMessage, PageMetadata } from '../../types';
import { safeFetch } from '../../utils/safeFetch';

export class GeminiProvider implements AIProvider {
  id = 'gemini';
  name = 'Google Gemini';

  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-1.5-flash') {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  private getEndpoint(): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
  }

  async chat(
    messages: ChatMessage[],
    context?: PageMetadata,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponseWithSources> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is required. Please set it in Hyperlink Settings.');
    }

    const systemInstruction = `You are Hyperlink, a universal browser command center assistant.
You help the user interact with the current webpage.
Current page title: "${context?.title || 'Unknown'}"
Current page URL: "${context?.url || 'Unknown'}"
Page type: "${context?.pageType || 'normal'}"
${context?.selectedText ? `User selected text: "${context.selectedText}"` : ''}

Always give concise, clear, accurate, and structured responses.
When asked about latest/current events or real-time information, state what sources you are citing.`;

    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    try {
      const response = await safeFetch(this.getEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Gemini request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

      if (onChunk) {
        onChunk(text);
      }

      return {
        text,
        isLiveSearch: false
      };
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      throw err;
    }
  }

  async summarize(
    content: string,
    type: 'page' | 'selection' | 'article' | 'pdf' | 'video' = 'page',
    context?: PageMetadata
  ): Promise<string> {
    const prompt = `Please provide a concise, structured summary of the following ${type} content from "${context?.title || 'page'}":\n\n${content.slice(0, 15000)}`;
    const result = await this.chat([{ id: '1', role: 'user', content: prompt, timestamp: Date.now() }], context);
    return result.text;
  }

  async explain(target: string, isCode: boolean = false, context?: string): Promise<string> {
    const prompt = isCode
      ? `Please explain the following code snippet clearly, step-by-step, including what it does and best practices:\n\n\`\`\`\n${target}\n\`\`\``
      : `Please explain "${target}" clearly and concisely in the context of: ${context || 'general web context'}.`;
    const result = await this.chat([{ id: '1', role: 'user', content: prompt, timestamp: Date.now() }]);
    return result.text;
  }

  async define(word: string): Promise<DefinitionResult> {
    const prompt = `Define the word or term "${word}". Respond ONLY in JSON format with the following keys:
{
  "simple": "Simple 1-2 sentence plain English definition",
  "example": "A clear practical example sentence",
  "technical": "A precise technical or formal definition if applicable",
  "pronunciation": "Phonetic pronunciation if known"
}`;
    const result = await this.chat([{ id: '1', role: 'user', content: prompt, timestamp: Date.now() }]);
    try {
      const cleaned = result.text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        simple: result.text,
        example: `Used in context with "${word}".`,
      };
    }
  }

  async translate(text: string, targetLang: string): Promise<string> {
    const prompt = `Translate the following text accurately into ${targetLang}. Return ONLY the translated text without extra explanation:\n\n${text}`;
    const result = await this.chat([{ id: '1', role: 'user', content: prompt, timestamp: Date.now() }]);
    return result.text;
  }

  async extractStructured(text: string, targetType: string): Promise<any> {
    const prompt = `Extract all instances of "${targetType}" from the text below. Return ONLY a JSON array of the extracted items:\n\n${text.slice(0, 15000)}`;
    const result = await this.chat([{ id: '1', role: 'user', content: prompt, timestamp: Date.now() }]);
    try {
      const cleaned = result.text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return [result.text];
    }
  }

  async vision(imageDataUrl: string, prompt: string): Promise<string> {
    if (!this.apiKey) throw new Error('Gemini API key is required.');
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    
    const body = {
      contents: [{
        parts: [
          { text: prompt || 'Analyze this screenshot, extract visible text, and explain its key elements.' },
          { inline_data: { mime_type: 'image/png', data: base64Data } }
        ]
      }]
    };

    const res = await safeFetch(this.getEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`Gemini Vision failed: ${res.statusText}`);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No visual analysis returned.';
  }
}
