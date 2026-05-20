import axios from 'axios';
import { SearchResult, CustomSource, MediaResult } from '../types';

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1';

function cleanText(str: string): string {
  if (!str) return '';
  // Strip HTML tags
  let cleaned = str.replace(/<[^>]*>?/gm, '');
  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  return cleaned.trim();
}

function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

function expandQuery(q: string, isGuest: boolean = false) {
  if (isGuest) {
    return [q, `${q} history background`, `about ${q} overview`].slice(0, 3);
  }
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  return [
    q,
    `${q} latest news breaking ${dateStr}`,
    `${q} current events updates today`,
    `recent developments about ${q} 2026`
  ];
}

interface ExtendedSearchResult extends SearchResult {
  score?: number;
}

export class SparkSearchError extends Error {
  constructor(public stage: string, message: string) {
    super(message);
    this.name = 'SparkSearchError';
  }
}

async function searchWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 500): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise(r => setTimeout(r, delay));
    return searchWithRetry(fn, retries - 1, delay * 1.5);
  }
}

// Core search logic migrated from server-side to client-side for pure frontend execution
async function searchReference(query: string): Promise<SearchResult[]> {
  try {
    // Stage 1: Fast Search for Titles
    const wikiRes = await axios.get(`https://en.wikipedia.org/w/api.php`, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: query,
        format: 'json',
        origin: '*',
        srlimit: 8
      },
      timeout: 10000
    }).catch(() => ({ data: { query: { search: [] } } }));

    let searchItems = wikiRes.data?.query?.search || [];
    
    // Secondary suggestion if dry
    if (searchItems.length === 0) {
      const suggestRes = await axios.get(`https://en.wikipedia.org/w/api.php`, {
        params: { action: 'opensearch', search: query, limit: 3, format: 'json', origin: '*' },
        timeout: 5000
      }).catch(() => ({ data: [[], []] }));
      
      const titles = suggestRes.data?.[1] || [];
      searchItems = titles.map((t: string) => ({ title: t }));
    }

    const wikiResults: SearchResult[] = [];
    
    if (searchItems.length > 0) {
      // Stage 2: Batch Extract Fetch (MUCH faster than individual calls)
      const titlesToFetch = searchItems.slice(0, 6).map((item: any) => item.title).join('|');
      const batchRes = await axios.get(`https://en.wikipedia.org/w/api.php`, {
        params: {
          action: 'query',
          prop: 'extracts',
          exintro: 1,
          explaintext: 1,
          titles: titlesToFetch,
          format: 'json',
          origin: '*'
        },
        timeout: 10000
      }).catch(() => ({ data: { query: { pages: {} } } }));

      const pages = batchRes.data?.query?.pages || {};
      
      Object.values(pages).forEach((page: any) => {
        if (page.title && !page.missing) {
          wikiResults.push({
            title: page.title,
            snippet: page.extract || `Information about ${page.title}.`,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
            source: 'Reference Node',
            category: 'Reference'
          });
        }
      });
    }

    // Stage 3: Modern Global Grounding (News)
    const newsResults: SearchResult[] = [];
    try {
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = String(now.getUTCMonth() + 1).padStart(2, '0');
      const d = String(now.getUTCDate()).padStart(2, '0');
      
      const newsRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/feed/featured/${y}/${m}/${d}`, { 
        timeout: 8000 
      }).catch(() => null);
      
      const news = newsRes?.data?.news || [];
      
      news.slice(0, 8).forEach((n: any) => {
        const plainStory = cleanText(n.story);
        if (query.toLowerCase().trim().length < 3 || plainStory.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes('news')) {
          const trimmedTitle = plainStory.length > 70 ? `${plainStory.substring(0, 70)}...` : plainStory;
          newsResults.push({
            title: trimmedTitle,
            snippet: plainStory,
            url: n.links?.[0]?.content_urls?.desktop?.page || 'https://en.wikipedia.org/wiki/Portal:Current_events',
            source: 'Global News Node',
            category: 'Other'
          });
        }
      });
    } catch (e) {}

    return [...wikiResults, ...newsResults];
  } catch (error: any) {
    console.error('Core search error in Spark Pipeline:', error.message);
    return [];
  }
}

async function getSummary(query: string): Promise<string | null> {
  try {
    const searchRes = await axios.get(`https://en.wikipedia.org/w/api.php`, {
      params: { action: 'query', list: 'search', srsearch: query, format: 'json', origin: '*', srlimit: 1 },
      timeout: 5000
    }).catch(() => ({ data: { query: { search: [] } } }));

    const firstResult = searchRes.data.query?.search?.[0];
    if (firstResult) {
      const detailRes = await axios.get(`https://en.wikipedia.org/w/api.php`, {
        params: { action: 'query', prop: 'extracts', explaintext: 1, titles: firstResult.title, format: 'json', origin: '*' },
        timeout: 8000
      }).catch(() => null);
      
      const pages = detailRes?.data?.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        let extract = pages[pageId]?.extract;
        if (extract) {
          extract = extract.replace(/[=*\\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
          return extract;
        }
      }
    }
  } catch (error) {}
  return null;
}

async function getMedia(query: string): Promise<MediaResult[]> {
  try {
    const wikiRes = await axios.get(`https://en.wikipedia.org/w/api.php`, {
      params: {
        action: 'query',
        generator: 'search',
        gsrsearch: query,
        gsrlimit: 10,
        prop: 'pageimages',
        piprop: 'thumbnail',
        pithumbsize: 600,
        format: 'json',
        origin: '*'
      },
      timeout: 8000
    });

    const pages = wikiRes.data.query?.pages || {};
    const media: MediaResult[] = [];
    
    Object.values(pages).forEach((page: any) => {
      if (page.thumbnail && page.thumbnail.source) {
        media.push({
          type: 'image',
          url: page.thumbnail.source,
          thumbnail: page.thumbnail.source,
          source: `Reference Node: ${page.title}`
        });
      }
    });

    return media;
  } catch (error) {
    return [];
  }
}

async function puterSearch(query: string): Promise<SearchResult[]> {
  if (typeof window === 'undefined') return [];
  const puter = (window as any).puter;
  if (!puter) return [];
  
  try {
    // Robust check for the search module availability (avoids initialization race conditions)
    if (!puter.browser || typeof puter.browser.search !== 'function') {
      console.warn("Spark Mesh: puter.browser.search module is not yet available in this environment.");
      return [];
    }

    const results = await puter.browser.search(query);
    if (!results || !Array.isArray(results)) return [];

    return results.map((r: any) => ({
      title: r.title || "Reference Fragment",
      snippet: r.snippet || r.description || "Insight indexed from the global spark mesh.",
      url: r.url || r.link || "#",
      source: r.source || 'Spark Mesh',
      category: 'Web' as const
    }));
  } catch (error) {
    console.error('Spark Mesh Web Search Error:', error);
    return [];
  }
}

function deduplicateAndRank(results: SearchResult[]): SearchResult[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const todayStr = now.toLocaleDateString();
  const seen = new Set();
  
  return results
    .filter(r => {
      if (!r.url || seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    })
    .map(r => {
      let score = 0;
      // Clean HTML tags and entities from BOTH title and snippet
      const cleanTitle = cleanText(r.title);
      const cleanSnippet = cleanText(r.snippet);
      const text = (cleanTitle + ' ' + cleanSnippet).toLowerCase();
      
      // Maximum Recency Bias (Today)
      if (text.includes(todayStr.toLowerCase())) score += 50;
      
      // Recency bias (General)
      if (text.includes("2026")) score += 30;
      if (text.includes("2025")) score += 20;
      if (text.includes("live") || text.includes("real-time") || text.includes("current")) score += 20;
      if (text.includes("breaking") || text.includes("incident") || text.includes("update") || text.includes("just now") || text.includes("minutes ago")) score += 25;

      // Authority bias
      if (r.url.includes("wikipedia")) score += 5;
      if (r.url.includes(".gov") || r.url.includes(".edu")) score += 15;
      if (r.url.includes("reuters.com") || r.url.includes("apnews.com") || r.url.includes("bbc.co.uk") || r.url.includes("cnn.com") || r.url.includes("bloomberg.com")) score += 25;
      
      if (cleanSnippet && cleanSnippet.length > 150) score += 5;
      
      return { 
        ...r, 
        title: cleanTitle, 
        snippet: cleanSnippet, 
        score 
      };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 20);
}

export function buildContext(results: SearchResult[], isGuest: boolean = false) {
  // In guest mode, treat all results as reference to ensure they are parsed by the reference logic
  const reference = isGuest ? results : results.filter(r => r.category === 'Reference');
  const web = isGuest ? [] : results.filter(r => r.category !== 'Reference');

  let context = "### REFERENCE KNOWLEDGE REPOSITORY\n";
  if (reference.length === 0) {
    context += "No specific reference entities found for this query.\n";
  }
  reference.forEach((r, i) => {
    context += `[ENTITY ${i + 1}] source: ${r.source || 'Reference Node'} | title: ${r.title}\nSUMMARY: ${r.snippet}\n\n`;
  });

  if (!isGuest) {
    context += "\n### REAL-TIME WEB MESH PROTOCOLS (2026 VERIFIED)\n";
    if (web.length === 0) {
      context += "No real-time web nodes available for this context.\n";
    }
    web.forEach((r, i) => {
      context += `[NODE ${reference.length + i + 1}] origin: ${r.source || 'Spark Mesh'} | title: ${r.title}\nINTEL: ${r.snippet}\n\n`;
    });
  }

  // Under guest mode rules, strictly throttle and limit context depth to exactly 8000 words
  if (isGuest) {
    const words = context.trim().split(/\s+/);
    if (words.length > 8000) {
      context = words.slice(0, 8000).join(' ') + '\n\n[Context limited to exactly 8000 words in guest mode]';
    }
  }

  return context;
}

export async function SparkSearch(
  query: string, 
  customSources: CustomSource[] = [],
  onStage?: (stage: string) => void,
  isGuest: boolean = false
) {
  try {
    const normalized = normalizeQuery(query);
    const summaryPromise = getSummary(normalized).catch(() => null);
    const mediaPromise = getMedia(normalized).catch(() => []);
    const queries = expandQuery(normalized, isGuest);

    if (onStage) onStage(isGuest ? `Guest Access: Accessing Reference Library...` : `Spark Edge: Mapping knowledge for '${query}'...`);
    
    // Core Reference results
    const wikiResults = await searchReference(normalized).catch(() => []);
    
    let webResults: SearchResult[] = [];
    if (!isGuest) {
      if (onStage) onStage(`Spark Mesh: Deep crawling 2026 real-time network...`);
      const webResultsArray = await Promise.all(
        queries.map(q => puterSearch(q).catch(() => []))
      );
      webResults = webResultsArray.flat();
    } else {
      if (onStage) onStage(`Guest Access: Synthesizing reference knowledge...`);
      // For guests, we expand the library search to provide more breadth
      const expansionQueries = [
        normalized,
        ...queries.slice(1, 3)
      ];
      
      const wikiExpansionArray = await Promise.all(
        expansionQueries.map(q => searchReference(q).catch(() => []))
      );
      webResults = wikiExpansionArray.flat(); 
    }

    const processedCustom: SearchResult[] = customSources.map(cs => ({
      title: cs.type === 'url' ? cs.value : 'Injected Context',
      snippet: cs.type === 'text' ? cs.value : `Data from custom URL: ${cs.value}`,
      url: cs.type === 'url' ? cs.value : '#custom',
      source: cs.type === 'url' ? 'User Link' : 'User Text',
      category: 'Reference'
    }));

    const allResults = [...webResults, ...wikiResults, ...processedCustom];
    
    if (allResults.length === 0) {
      allResults.push({
        title: "Spark Intelligence Node",
        snippet: `Direct reference search for "${query}" yielded limited fragments. Proceeding with generalized internal synthesis.`,
        url: "#internal",
        source: "System",
        category: "Reference"
      });
    }

    const ranked = deduplicateAndRank(allResults);
    const summary = await summaryPromise;
    const media = await mediaPromise;
    
    return {
      summary,
      sources: ranked,
      context: buildContext(ranked, isGuest),
      queries,
      media
    };
  } catch (error: any) {
    console.error("Search Pipeline Error:", error);
    return {
      summary: "Protocol Alert: Intelligence retrieval interrupted. Synthesizing from available fragments.",
      sources: [{ title: "System Fallback", snippet: "Error: " + (error.message || "Unknown disrupt"), url: "#", source: "System" }],
      context: "Search failed. Fallback to basic processing.",
      queries: [query],
      media: []
    };
  }
}
