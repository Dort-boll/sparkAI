import axios from 'axios';
import { SearchResult, CustomSource, MediaResult } from '../types';

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1';

function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

function expandQuery(q: string) {
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  return [
    q,
    `${q} latest news breaking ${dateStr}`,
    `${q} real-time incidents updates ${dateStr}`,
    `${q} current events and status ${dateStr} ${timeStr}`,
    `recent developments about ${q} today`
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
    const wikiRes = await searchWithRetry(() => axios.get(WIKI_API, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: query,
        format: 'json',
        origin: '*',
        srlimit: 8
      }
    }));

    const searchItems = wikiRes.data.query?.search || [];
    const results = await Promise.all(searchItems.map(async (item: any) => {
      const infoboxLinks: SearchResult[] = [];
      
      // Try Wikidata for Infobox links (CORS supported)
      try {
        const propsRes = await axios.get(WIKI_API, {
          params: { action: 'query', prop: 'pageprops', titles: item.title, format: 'json', origin: '*' }
        });
        const pages = propsRes.data.query?.pages;
        if (pages) {
          const pageId = Object.keys(pages)[0];
          const wikibaseItem = pages[pageId]?.pageprops?.wikibase_item;
          if (wikibaseItem) {
            const wdRes = await axios.get(WIKIDATA_API, {
              params: { action: 'wbgetclaims', entity: wikibaseItem, format: 'json', origin: '*' }
            });
            const claims = wdRes.data.claims || {};
            
            const extractClaim = (prop: string, formatter: (val: string) => string) => {
               const val = claims[prop]?.[0]?.mainsnak?.datavalue?.value;
               if (typeof val === 'string') return formatter(val);
               if (val?.id) return formatter(val.id);
               return null;
            };

            const website = extractClaim('P856', (v) => v);
            if (website) infoboxLinks.push({ title: `${item.title} Official Website`, url: website, source: 'Official Website', category: 'Reference', snippet: 'Official presence.' });

            const twitter = extractClaim('P2002', (v) => `https://twitter.com/${v}`);
            if (twitter) infoboxLinks.push({ title: `${item.title} on X (Twitter)`, url: twitter, source: 'Twitter Profile', category: 'Reference', snippet: 'Social media presence.' });
          }
        }
      } catch (e) {}

      let snippet = item.snippet.replace(/<[^>]*>?/gm, '');
      try {
        const detailRes = await axios.get(`${WIKI_REST}/page/summary/${encodeURIComponent(item.title)}`);
        snippet = detailRes.data.extract || snippet;
      } catch {}

      return [
        {
          title: item.title,
          snippet: snippet,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
          source: 'Reference Library',
          category: 'Reference' as const
        },
        ...infoboxLinks
      ];
    }));

    return results.flat();
  } catch (error) {
    console.error('Core search error:', error);
    return [];
  }
}

async function getSummary(query: string): Promise<string | null> {
  try {
    const searchRes = await axios.get(WIKI_API, {
      params: { action: 'query', list: 'search', srsearch: query, format: 'json', origin: '*', srlimit: 1 }
    });
    const firstResult = searchRes.data.query?.search?.[0];
    if (firstResult) {
      const detailRes = await axios.get(WIKI_API, {
        params: { action: 'query', prop: 'extracts', explaintext: 1, titles: firstResult.title, format: 'json', origin: '*' }
      });
      const pages = detailRes.data.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        let extract = pages[pageId]?.extract;
        if (extract) return extract.replace(/[=*\\]/g, '').trim();
      }
    }
  } catch (error) {}
  return null;
}

async function getMedia(query: string): Promise<MediaResult[]> {
  try {
    const wikiRes = await axios.get(WIKI_API, {
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
      }
    });

    const pages = wikiRes.data.query?.pages || {};
    return Object.values(pages)
      .filter((page: any) => page.thumbnail?.source)
      .map((page: any) => ({
        type: 'image',
        url: page.thumbnail.source,
        thumbnail: page.thumbnail.source,
        source: `Reference: ${page.title}`
      }));
  } catch (error) {
    return [];
  }
}

async function puterSearch(query: string): Promise<SearchResult[]> {
  const puter = (window as any).puter;
  if (!puter) return [];
  
  try {
    // Attempt to use puter.web.search (modern) or puter.browser.search (fallback)
    const searchFn = puter.web?.search || puter.browser?.search;
    if (!searchFn) {
      console.warn("Puter search module not found");
      return [];
    }

    const results = await searchFn(query);
    if (!results || !Array.isArray(results)) return [];

    return results.map((r: any) => ({
      title: r.title || "Web Result",
      snippet: r.snippet || r.description || "Contextual data retrieved from the web.",
      url: r.url || r.link || "#",
      source: 'Spark Web Mesh',
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

export function buildContext(results: SearchResult[]) {
  const reference = results.filter(r => r.category === 'Reference');
  const web = results.filter(r => r.category === 'Web' || !r.category);

  let context = "### REFERENCE KNOWLEDGE REPOSITORY\n";
  reference.forEach((r, i) => {
    context += `[ENTITY ${i + 1}] source: ${r.source} | title: ${r.title}\nSUMMARY: ${r.snippet}\n\n`;
  });

  context += "\n### REAL-TIME WEB MESH PROTOCOLS (2026 VERIFIED)\n";
  web.forEach((r, i) => {
    context += `[NODE ${reference.length + i + 1}] origin: ${r.source} | title: ${r.title}\nINTEL: ${r.snippet}\n\n`;
  });

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
    const queries = expandQuery(normalized);

    if (onStage) onStage(`Spark Edge: Mapping knowledge for '${query}'...`);
    const wikiResults = await searchReference(normalized).catch(() => []);
    
    let webResults: SearchResult[] = [];
    if (!isGuest) {
      if (onStage) onStage(`Spark Mesh: Deep crawling 2026 real-time network...`);
      // Parallelized multi-query crawl for maximum power - using all expanded queries
      const webResultsArray = await Promise.all(
        queries.map(q => puterSearch(q).catch(() => []))
      );
      webResults = webResultsArray.flat();
    } else {
      if (onStage) onStage(`Guest Access: Retrieving knowledge for '${query}'...`);
    }

    const expansionResults = await searchReference(normalized).catch(() => []);

    const processedCustom: SearchResult[] = customSources.map(cs => ({
      title: cs.type === 'url' ? cs.value : 'Injected Context',
      snippet: cs.type === 'text' ? cs.value : `Data from custom URL: ${cs.value}`,
      url: cs.type === 'url' ? cs.value : '#custom',
      source: cs.type === 'url' ? 'User Link' : 'User Text',
      category: 'Reference'
    }));

    const allResults = [...webResults, ...wikiResults, ...expansionResults, ...processedCustom];
    
    if (allResults.length === 0) {
      allResults.push({
        title: "Spark Intelligence Cache",
        snippet: "Direct real-time search yielded limited fragments. Proceeding with internal knowledge synthesis for 2026: " + query,
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
      context: buildContext(ranked),
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
