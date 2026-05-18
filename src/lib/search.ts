import axios from 'axios';
import { SearchResult, CustomSource, MediaResult } from '../types';

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1';

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

// Re-implementing the robust search logic from server.ts for client-side execution
async function searchReference(query: string): Promise<SearchResult[]> {
  try {
    const res = await axios.get('/api/search', { 
      params: { q: query },
      timeout: 10000 
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error('Core search error:', error);
    return [];
  }
}

async function getSummary(query: string): Promise<string | null> {
  try {
    const res = await axios.get('/api/summary', { params: { q: query } });
    return res.data?.extract || null;
  } catch (error) {}
  return null;
}

async function getMedia(query: string): Promise<MediaResult[]> {
  try {
    const res = await axios.get('/api/media', { 
      params: { q: query },
      timeout: 10000 
    });
    return Array.isArray(res.data) ? res.data : [];
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
      const text = (r.title + ' ' + r.snippet).toLowerCase();
      
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
      
      if (r.snippet?.length > 150) score += 5;
      
      return { ...r, score };
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
    context += `[ENTITY ${i + 1}] source: ${r.source || 'Wikipedia'} | title: ${r.title}\nSUMMARY: ${r.snippet}\n\n`;
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
    
    // Core Reference results (Wikipedia)
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
        title: "Spark Intelligence Cache",
        snippet: "Direct real-time search yielded limited fragments. Proceeding with internal knowledge synthesis for: " + query,
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
