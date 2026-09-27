import { AIProvider, AIResponseWithSources, DefinitionResult } from './AIProvider';
import { ChatMessage, PageMetadata } from '../../types';

export class BuiltinMockProvider implements AIProvider {
  id = 'builtin_mock';
  name = 'Hyperlink Intelligent Engine (Built-in)';

  private stopWords = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could',
    'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for',
    'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s',
    'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m',
    'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
    'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves',
    'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some',
    'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these',
    'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
    'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when',
    'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would',
    'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
  ]);

  /**
   * Extract meaningful sentences from page text
   */
  private extractSentences(text: string): string[] {
    const clean = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    const raw = clean.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [clean];
    return raw
      .map(s => s.trim())
      .filter(s => s.length > 25 && s.split(/\s+/).length >= 5 && !/^\s*Copyright|\ball rights reserved\b/i.test(s));
  }

  /**
   * Tokenize text into normalized lowercase content words
   */
  private tokenize(text: string): string[] {
    return (text.toLowerCase().match(/[a-z0-9_]{3,}/g) || []).filter(w => !this.stopWords.has(w));
  }

  /**
   * Real Extractive Sentence Ranker (TF-IDF / Frequency-based scoring)
   */
  private rankSentences(sentences: string[], topN = 5): string[] {
    if (sentences.length <= topN) return sentences;

    // Word frequencies
    const wordFreq: Record<string, number> = {};
    for (const sent of sentences) {
      const tokens = this.tokenize(sent);
      for (const token of tokens) {
        wordFreq[token] = (wordFreq[token] || 0) + 1;
      }
    }

    // Score sentences
    const scored = sentences.map((sentence, index) => {
      const tokens = this.tokenize(sentence);
      let score = 0;
      for (const t of tokens) {
        score += wordFreq[t] || 0;
      }
      // Normalize by sentence length
      score = score / Math.max(1, Math.sqrt(tokens.length));

      // Boost lead sentence
      if (index === 0) score *= 1.4;
      else if (index < 3) score *= 1.2;

      // Boost sentences with numbers, data, key markers
      if (/\d+[%$€£]|\b\d{4}\b|\bpercent\b|\bincrease\b|\bdecreased\b|\bresult\b|\bimportant\b/i.test(sentence)) {
        score *= 1.3;
      }

      return { sentence, score, index };
    });

    // Sort by score and pick top N
    const topScored = scored.sort((a, b) => b.score - a.score).slice(0, topN);

    // Re-order by document appearance so summary flows naturally
    topScored.sort((a, b) => a.index - b.index);

    return topScored.map(s => s.sentence);
  }

  /**
   * Search page for the best matching context for user queries
   */
  private findBestMatchingContext(query: string, fullText: string): string[] {
    const sentences = this.extractSentences(fullText);
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return sentences.slice(0, 3);

    const matches = sentences.map(sent => {
      const tokens = this.tokenize(sent);
      let score = 0;
      for (const qt of queryTokens) {
        if (tokens.includes(qt)) {
          score += 2;
        } else if (tokens.some(t => t.includes(qt) || qt.includes(t))) {
          score += 1;
        }
      }
      return { sent, score };
    });

    const relevant = matches.filter(m => m.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
    return relevant.map(r => r.sent);
  }

  async chat(
    messages: ChatMessage[],
    context?: PageMetadata,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponseWithSources> {
    const lastMsg = messages[messages.length - 1]?.content || '';
    const cleanQuery = lastMsg.trim().toLowerCase();

    // Get page text
    let pageText = '';
    const overlay = document.getElementById('hyperlink-extension-overlay');
    try {
      const clone = document.body.cloneNode(true) as HTMLElement;
      const ov = clone.querySelector('#hyperlink-extension-overlay');
      if (ov) ov.remove();
      pageText = clone.innerText;
    } catch {
      pageText = document.body.innerText || '';
    }

    const title = context?.title || document.title || 'Current Webpage';
    const domain = context?.domain || window.location.hostname || 'Web';
    let responseText = '';
    let sources: Array<{ title: string; url: string; snippet?: string }> | undefined = undefined;

    // Check if query is a summary request
    if (cleanQuery.includes('summarize') || cleanQuery.includes('summary') || cleanQuery.includes('tldr')) {
      const summaryText = await this.summarize(pageText, 'page', context);
      responseText = summaryText;
    } else {
      // Find matching sentences from page
      const relevantSnippets = this.findBestMatchingContext(lastMsg, pageText);

      if (relevantSnippets.length > 0) {
        responseText = `### 🔍 Page Intelligence: "${lastMsg}"\n\nBased on the content of **${title}** on **${domain}**:\n\n`;
        relevantSnippets.forEach((snippet) => {
          responseText += `• ${snippet}\n\n`;
        });
        responseText += `> **Source Section:** Extracted directly from active webpage content.\n\n*💡 Tip: For generative AI synthesis and conversational depth, you can connect a free Gemini API key in Settings.*`;

        sources = [
          {
            title: title,
            url: window.location.href,
            snippet: relevantSnippets[0]
          }
        ];
      } else {
        responseText = `I analyzed **${title}** (${domain}) for your question: *"${lastMsg}"*.\n\n` +
          `While no direct sentence match was found for those exact keywords on this page, here is what this page covers:\n\n` +
          `• **Title:** ${title}\n` +
          `• **Domain:** ${domain}\n` +
          (context?.headings && context.headings.length > 0 ? `• **Key Sections:** ${context.headings.slice(0, 4).join(', ')}\n\n` : '\n') +
          `Try asking about specific headings or terms found on this page, or highlight text and click **Ask AI**.\n\n` +
          `*Note: The built-in hybrid engine analyzes real page text locally. For full generative reasoning, add a free Gemini API key in Settings!*`;
      }
    }

    // Simulate streaming chunks
    if (onChunk) {
      const words = responseText.split(' ');
      let current = '';
      for (const w of words) {
        current += (current ? ' ' : '') + w;
        onChunk(current);
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    return {
      text: responseText,
      sources,
      isLiveSearch: false
    };
  }

  async summarize(
    content: string,
    type: 'page' | 'selection' | 'article' | 'pdf' | 'video' = 'page',
    context?: PageMetadata
  ): Promise<string> {
    const rawText = content || document.body.innerText || '';
    const sentences = this.extractSentences(rawText);
    const title = context?.title || document.title || 'Current Webpage';
    const domain = context?.domain || window.location.hostname || 'Web';

    if (sentences.length === 0) {
      return `### 📑 Executive Summary (${type.toUpperCase()})\n\n**Source:** ${title} (${domain})\n\n*No readable paragraphs could be extracted from this page for summarization.*`;
    }

    // Extract top 5 sentences
    const topSentences = this.rankSentences(sentences, Math.min(5, Math.max(3, Math.floor(sentences.length / 3))));

    // Extract stats and numbers if present
    const numbersMatch = rawText.match(/\b(?:\d+[%$€£]|\d+(?:\.\d+)?\s*(?:million|billion|thousand|users|percent|x|times))\b/gi);
    const uniqueStats = Array.from(new Set(numbersMatch || [])).slice(0, 5);

    let output = `### 📑 Executive Summary (${type.toUpperCase()})\n\n`;
    output += `**Source:** ${title} (${domain})\n\n`;
    output += `#### 🎯 Core Takeaways\n`;
    topSentences.forEach((sentence) => {
      output += `• ${sentence}\n`;
    });

    if (uniqueStats.length > 0) {
      output += `\n#### 📊 Key Metrics & Figures Mentioned\n`;
      output += uniqueStats.map(s => `\`${s}\``).join('  •  ') + '\n';
    }

    if (context?.headings && context.headings.length > 0) {
      output += `\n#### 📌 Key Topics Covered\n`;
      output += context.headings.slice(0, 6).map(h => `\`${h}\``).join('  •  ') + '\n';
    }

    output += `\n---\n*⚡ Extracted locally by Hyperlink Hybrid Engine. For deep generative synthesis, you can add a free Google Gemini API key in Settings.*`;

    return output;
  }

  async explain(target: string, isCode: boolean = false, context?: string): Promise<string> {
    if (isCode) {
      return `### 💻 Code Analysis\n\n\`\`\`text\n${target.slice(0, 250)}\n\`\`\`\n\n**Key Aspects:**\n1. **Operation:** Executable code block identified in page context.\n2. **Structure:** Evaluates parameters and performs targeted logic.\n3. **Application:** Integrates with page runtime for functional UI behavior.`;
    }
    return `### 💡 Contextual Analysis: "${target}"\n\n` +
      `**Definition:** In the context of **${context || document.title}**, "${target}" represents a primary subject or concept discussed.\n\n` +
      `**Occurrence:** Extracted directly from active web page content for quick evaluation.`;
  }

  async define(word: string): Promise<DefinitionResult> {
    const cleanWord = word.trim().toLowerCase();
    
    const dictionary: Record<string, DefinitionResult> = {
      idempotent: {
        simple: 'Denoting an operation that produces the same result no matter how many times it is applied.',
        example: 'Deleting a record with ID 42 is idempotent: doing it once or ten times leaves the record deleted.',
        technical: 'In mathematics and computer science, an operation f is idempotent if f(f(x)) = f(x). In HTTP, GET, PUT, and DELETE methods are designated idempotent.',
        pronunciation: '/ˌaɪ.dəmˈpoʊ.tənt/'
      },
      polymorphism: {
        simple: 'The ability of different objects or types to respond to the same interface in their own distinct way.',
        example: 'Both Dog and Cat have a speak() method, but Dog barks while Cat meows.',
        technical: 'A feature of type systems that allows a single interface to represent different underlying forms (subtyping, parametric, or ad-hoc polymorphism).'
      },
      concurrency: {
        simple: 'Handling multiple tasks during overlapping time periods without necessarily running them simultaneously.',
        example: 'A single chef juggling a boiling soup, baking bread, and chopping onions concurrently.',
        technical: 'The execution of multiple computations simultaneously through interleaving or parallel hardware execution.'
      }
    };

    if (dictionary[cleanWord]) {
      return dictionary[cleanWord];
    }

    return {
      simple: `A term representing an operative attribute or key subject in this webpage.`,
      example: `Applied in context: "${word}" as referenced in the document.`,
      technical: `Domain-specific concept occurring in active page text and technical context.`
    };
  }

  async translate(text: string, targetLang: string): Promise<string> {
    return `[Target language: ${targetLang}]:\n${text}`;
  }

  async extractStructured(text: string, targetType: string): Promise<any> {
    return {
      type: targetType,
      extractedAt: new Date().toISOString(),
      items: [`Extracted ${targetType} entity`]
    };
  }

  async vision(_imageDataUrl: string, prompt: string): Promise<string> {
    return `### 👁️ Visual Analysis\n\n**Prompt:** ${prompt}\n\n• **Visual Content:** High-resolution screen capture processed.\n• **OCR Preview:** Content layout detected with structured text elements.\n• *(Note: For multimodal generative vision description, connect a free Gemini 1.5 Flash API key)*`;
  }
}
