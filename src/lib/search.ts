import axios from 'axios';
import { SearchResult, CustomSource, MediaResult } from '../types';

function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

function expandQuery(q: string) {
  return [
    q,
    `${q} explanation`,
    `${q} latest updates`,
    `${q} detailed analysis`
  ];
}

async function searchApi(query: string): Promise<SearchResult[]> {
  try {
    const response = await axios.get('/api/search', {
      params: { q: query },
      timeout: 10000 // 10s timeout
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Search API error:', query, error);
    return [];
  }
}

async function multiSearch(queries: string[]): Promise<SearchResult[]> {
  // Use a map to track unique results by URL to prevent duplicates early
  const allResultsMap = new Map<string, SearchResult>();
  
  const results = await Promise.allSettled(
    queries.map(q => searchApi(q))
  );

  results.forEach(r => {
    if (r.status === "fulfilled") {
      r.value.forEach(res => {
        if (res.url && !allResultsMap.has(res.url)) {
          allResultsMap.set(res.url, res);
        }
      });
    }
  });

  return Array.from(allResultsMap.values());
}

function deduplicateAndRank(results: SearchResult[]): SearchResult[] {
  const seen = new Set();

  return results
    .filter(r => {
      if (!r.url || seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    })
    .map(r => {
      let score = 0;
      if (r.url.includes("wikipedia")) score += 20;
      if (r.url.includes(".edu")) score += 15;
      if (r.url.includes(".gov")) score += 18;
      if (r.url.includes("github")) score += 10;
      if (r.snippet?.length > 120) score += 5;
      return { ...r, score };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 10);
}

export function buildContext(results: SearchResult[]) {
  const reference = results.filter(r => r.category === 'Reference');
  const web = results.filter(r => r.category === 'Web' || !r.category);

  let context = "--- PRIMARY REFERENCE SOURCES (PRIORITIZE) ---\n";
  if (reference.length === 0) context += "No direct reference data found.\n";
  reference.forEach((r, i) => {
    context += `[Source ${i + 1}] (${r.source})\nTitle: ${r.title}\nContent: ${r.snippet}\n\n`;
  });

  context += "\n--- SUPPLEMENTAL WEB INTELLIGENCE ---\n";
  if (web.length === 0) context += "No supplemental web data found.\n";
  web.forEach((r, i) => {
    context += `[Source ${reference.length + i + 1}] (${r.source})\nTitle: ${r.title}\nContent: ${r.snippet}\n\n`;
  });

  return context;
}

async function getSummary(query: string): Promise<string | null> {
  try {
    const response = await axios.get('/api/summary', { params: { q: query } });
    return response.data.extract || null;
  } catch (error) {
    return null;
  }
}

async function puterSearch(query: string): Promise<SearchResult[]> {
  const puter = (window as any).puter;
  if (!puter || !puter.browser?.search) return [];
  
  try {
    const results = await puter.browser.search(query);
    return (results || []).map((r: any) => ({
      title: r.title,
      snippet: r.snippet || r.description || "Detailed web content retrieved for analysis.",
      url: r.url || r.link,
      source: 'Puter Web',
      category: 'Web' as const
    }));
  } catch (error) {
    console.error('Puter Search error:', error);
    return [];
  }
}

async function getMedia(query: string): Promise<MediaResult[]> {
  try {
    const response = await axios.get('/api/media', { params: { q: query } });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    return [];
  }
}

export async function SparkAI_Search(
  query: string, 
  customSources: CustomSource[] = [],
  onStage?: (stage: string) => void
) {
  const normalized = normalizeQuery(query);
  const summaryPromise = getSummary(normalized);
  const mediaPromise = getMedia(normalized);

  // Phase 1: Reference Reasoning (Wikipedia & Custom Sources)
  if (onStage) onStage(`Indexing Wikipedia & Reference Data for '${query}'...`);
  
  // 1a. Wikipedia Content
  const backendResults = await multiSearch([normalized]); 
  
  // 1b. Custom Sources Indexing
  if (customSources.length > 0) {
    if (onStage) onStage(`Injecting ${customSources.length} User Context Sources for '${query}'...`);
  }
  const processedCustom: SearchResult[] = customSources.map(cs => ({
    title: cs.type === 'url' ? cs.value : 'Injected Context',
    snippet: cs.type === 'text' ? cs.value : `Data retrieved from specified custom URL: ${cs.value}. Analyzing for relevance to: ${query}...`,
    url: cs.type === 'url' ? cs.value : '#custom',
    source: cs.type === 'url' ? 'User Link' : 'User Text',
    category: 'Reference'
  }));

  const phaseOneResults = [...backendResults, ...processedCustom];
  
  // Preliminary context for reasoning if needed, but we keep fetching
  
  // Phase 2: Open Web Intelligence (Puter)
  if (onStage) onStage(`Broadening search with Puter Web for '${query}'...`);
  const deepResults = await puterSearch(normalized);
  
  // Stage 3: Multi-facet Analysis
  if (onStage) onStage(`Orchestrating multi-source reasoning for '${query}'...`);
  const queries = expandQuery(normalized);
  const expansionResults = await multiSearch([queries[1], queries[2]]);
  
  const allResults = [...phaseOneResults, ...deepResults, ...expansionResults];
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
}
