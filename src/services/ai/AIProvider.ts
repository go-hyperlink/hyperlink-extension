import { ChatMessage, PageMetadata } from '../../types';

export interface AIResponseWithSources {
  text: string;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  isLiveSearch?: boolean;
}

export interface DefinitionResult {
  term?: string;
  simple: string;
  definition?: string;
  example: string;
  technical?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  synonyms?: string[];
}

export interface AIProvider {
  id: string;
  name: string;
  
  chat(
    messages: ChatMessage[],
    context?: PageMetadata,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponseWithSources>;

  summarize(
    content: string,
    type?: 'page' | 'selection' | 'article' | 'pdf' | 'video',
    context?: PageMetadata
  ): Promise<string>;

  explain(
    target: string,
    isCode?: boolean,
    context?: string
  ): Promise<string>;

  define(word: string): Promise<DefinitionResult>;

  translate(text: string, targetLang: string): Promise<string>;

  extractStructured(text: string, targetType: string): Promise<any>;

  vision(imageDataUrl: string, prompt: string): Promise<string>;
}
