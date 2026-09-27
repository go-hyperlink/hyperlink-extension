import { AIProvider, AIResponseWithSources, DefinitionResult } from './AIProvider';
import { BuiltinMockProvider } from './MockProvider';
import { GeminiProvider } from './GeminiProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { storageService } from '../storage/storageService';
import { ChatMessage, PageMetadata } from '../../types';
import { sanitizeGroqModel, GROQ_DEFAULT_MODEL } from './aiModels';

class AIService {
  private activeProvider: AIProvider | null = null;
  private mockProvider = new BuiltinMockProvider();

  async getProvider(): Promise<AIProvider> {
    const settings = await storageService.getSettings();
    const config = settings.aiConfig;

    if (!config || config.provider === 'builtin_mock' || !config.apiKey) {
      return this.mockProvider;
    }

    if (config.provider === 'gemini') {
      return new GeminiProvider(config.apiKey, config.modelName || 'gemini-1.5-flash');
    }

    if (config.provider === 'openai' || config.provider === 'groq' || config.provider === 'ollama') {
      let endpoint = 'https://api.openai.com/v1/chat/completions';
      if (config.provider === 'groq') {
        endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      } else if (config.provider === 'ollama') {
        endpoint = config.customEndpoint || 'http://localhost:11434/v1/chat/completions';
      } else if (config.customEndpoint) {
        endpoint = config.customEndpoint;
      }
      let model = config.modelName;
      if (config.provider === 'groq') {
        model = sanitizeGroqModel(model);
      }
      const defaultModel = config.provider === 'groq' ? GROQ_DEFAULT_MODEL : config.provider === 'ollama' ? 'llama3' : 'gpt-4o-mini';
      return new OpenAIProvider(config.apiKey, model || defaultModel, endpoint);
    }

    return this.mockProvider;
  }

  async chat(
    messages: ChatMessage[],
    context?: PageMetadata,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponseWithSources> {
    try {
      const provider = await this.getProvider();
      return await provider.chat(messages, context, onChunk);
    } catch (err: any) {
      console.warn('Primary AI provider failed, falling back to built-in intelligent engine:', err);
      const fallback = await this.mockProvider.chat(messages, context, onChunk);
      return {
        ...fallback,
        text: `*(Notice: AI Provider error: ${err.message || 'connection issue'}. Switched to Hyperlink Offline Intelligence)*\n\n` + fallback.text
      };
    }
  }

  async summarize(
    content: string,
    type: 'page' | 'selection' | 'article' | 'pdf' | 'video' = 'page',
    context?: PageMetadata
  ): Promise<string> {
    try {
      const provider = await this.getProvider();
      return await provider.summarize(content, type, context);
    } catch {
      return await this.mockProvider.summarize(content, type, context);
    }
  }

  async explain(target: string, isCode: boolean = false, context?: string): Promise<string> {
    try {
      const provider = await this.getProvider();
      return await provider.explain(target, isCode, context);
    } catch {
      return await this.mockProvider.explain(target, isCode, context);
    }
  }

  async define(word: string): Promise<DefinitionResult> {
    try {
      const provider = await this.getProvider();
      return await provider.define(word);
    } catch {
      return await this.mockProvider.define(word);
    }
  }

  async translate(text: string, targetLang: string): Promise<string> {
    try {
      const provider = await this.getProvider();
      return await provider.translate(text, targetLang);
    } catch {
      return await this.mockProvider.translate(text, targetLang);
    }
  }

  async extractStructured(text: string, targetType: string): Promise<any> {
    try {
      const provider = await this.getProvider();
      return await provider.extractStructured(text, targetType);
    } catch {
      return await this.mockProvider.extractStructured(text, targetType);
    }
  }

  async vision(imageDataUrl: string, prompt: string): Promise<string> {
    try {
      const provider = await this.getProvider();
      return await provider.vision(imageDataUrl, prompt);
    } catch {
      return await this.mockProvider.vision(imageDataUrl, prompt);
    }
  }

  async query(params: {
    prompt: string;
    systemPrompt?: string;
    context?: string;
    messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    webSearch?: boolean;
    onStreamChunk?: (chunk: string) => void;
  }): Promise<{ content: string; sources?: Array<{ title: string; url: string; snippet?: string }> }> {
    const chatMessages: ChatMessage[] = (params.messages || []).map((m, idx) => ({
      id: `msg_${idx}`,
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      timestamp: Date.now()
    }));

    if (chatMessages.length === 0 || chatMessages[chatMessages.length - 1].content !== params.prompt) {
      chatMessages.push({
        id: `msg_${Date.now()}`,
        role: 'user',
        content: params.prompt,
        timestamp: Date.now()
      });
    }

    const pageMeta: PageMetadata = {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      articleText: params.context,
      pageType: 'article',
      headings: [],
      linksCount: 0,
      imagesCount: 0,
      hasVideo: false,
      hasAudio: false,
      isPDF: false
    };

    const res = await this.chat(chatMessages, pageMeta, params.onStreamChunk);
    return {
      content: res.text,
      sources: res.sources
    };
  }
}

export const aiService = new AIService();
