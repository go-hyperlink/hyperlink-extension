// Page Context Detection & Analysis

import { PageContentType, PageMetadata, SidebarFeatureId } from '../types';

export function detectPageContext(): PageMetadata {
  const url = window.location.href;
  const domain = window.location.hostname;
  const title = document.title || 'Webpage';

  // 1. Check for PDF
  const isPDF =
    url.toLowerCase().endsWith('.pdf') ||
    document.contentType === 'application/pdf' ||
    !!document.querySelector('embed[type="application/pdf"], object[type="application/pdf"]');

  // 2. Check for Video page (YouTube, Vimeo, Twitch, or prominent video tag)
  const hasVideoElement = !!document.querySelector('video');
  const isVideoDomain =
    domain.includes('youtube.com') ||
    domain.includes('youtu.be') ||
    domain.includes('vimeo.com') ||
    domain.includes('twitch.tv') ||
    domain.includes('tiktok.com');
  const hasVideo = isVideoDomain || hasVideoElement;

  // 3. Check for Developer / Code page
  const isDevDomain =
    domain.includes('github.com') ||
    domain.includes('gitlab.com') ||
    domain.includes('bitbucket.org') ||
    domain.includes('stackoverflow.com') ||
    domain.includes('developer.mozilla.org') ||
    domain.includes('npmjs.com');
  const hasCodeBlocks = document.querySelectorAll('pre, code').length > 5;

  // 4. Check for Shopping / Product page
  const isShoppingDomain =
    domain.includes('amazon.') ||
    domain.includes('ebay.') ||
    domain.includes('shopify.') ||
    domain.includes('etsy.') ||
    domain.includes('walmart.') ||
    domain.includes('aliexpress.');
  const hasProductSchema =
    !!document.querySelector('[itemtype*="schema.org/Product"]') ||
    !!document.querySelector('.price, .product-price, [data-price]');

  // 5. Check for Article
  const isArticleDomain =
    domain.includes('medium.com') ||
    domain.includes('substack.com') ||
    domain.includes('nytimes.com') ||
    domain.includes('theverge.com') ||
    domain.includes('techcrunch.com');
  const hasArticleSchema =
    !!document.querySelector('article') ||
    !!document.querySelector('[itemtype*="schema.org/Article"]');

  let pageType: PageContentType = 'normal';
  if (isPDF) {
    pageType = 'pdf';
  } else if (hasVideo) {
    pageType = 'video';
  } else if (isDevDomain || hasCodeBlocks) {
    pageType = 'github';
  } else if (isShoppingDomain || hasProductSchema) {
    pageType = 'shopping';
  } else if (isArticleDomain || hasArticleSchema) {
    pageType = 'article';
  }

  // Extract headings
  const headingElements = Array.from(document.querySelectorAll('h1, h2, h3'));
  const headings = headingElements
    .map(el => (el.textContent || '').trim())
    .filter(t => t.length > 0 && t.length < 100)
    .slice(0, 8);

  // Extract meta description
  const metaDesc = document.querySelector('meta[name="description"], meta[property="og:description"]');
  const description = (metaDesc as HTMLMetaElement)?.content || '';

  // Extract detected price if shopping
  let price: string | undefined;
  if (pageType === 'shopping') {
    const priceEl = document.querySelector('.price, .product-price, [data-price], .a-price');
    if (priceEl) {
      price = (priceEl.textContent || '').trim();
    }
  }

  return {
    url,
    title,
    domain,
    description,
    pageType,
    headings,
    linksCount: document.querySelectorAll('a[href]').length,
    imagesCount: document.querySelectorAll('img[src]').length,
    hasVideo,
    hasAudio: !!document.querySelector('audio'),
    isPDF,
    price
  };
}

/**
 * Get prioritized features based on the detected page context
 */
export function getPrioritizedFeatures(pageType: PageContentType): SidebarFeatureId[] {
  switch (pageType) {
    case 'video':
      return [
        'media_downloader',
        'video',
        'ai',
        'summarize',
        'captions',
        'screenshot',
        'recorder',
        'notes',
        'reader',
        'save',
        'search'
      ];
    case 'pdf':
      return [
        'ai',
        'summarize',
        'notes',
        'extract',
        'pdf',
        'translate',
        'search',
        'save',
        'reader'
      ];
    case 'shopping':
      return [
        'search',
        'ai',
        'extract',
        'screenshot',
        'save',
        'pdf',
        'summarize'
      ];
    case 'github':
      return [
        'ai',
        'devtools',
        'search',
        'extract',
        'screenshot',
        'summarize',
        'save'
      ];
    case 'article':
      return [
        'summarize',
        'reader',
        'clean',
        'ai',
        'pdf',
        'translate',
        'save',
        'screenshot'
      ];
    case 'normal':
    default:
      return [
        'ai',
        'search',
        'summarize',
        'screenshot',
        'recorder',
        'reader',
        'save',
        'pdf',
        'extract',
        'clean',
        'translate',
        'tabs',
        'devtools',
        'settings'
      ];
  }
}
