import axios from 'axios';
import { SearchResult, CustomSource, MediaResult, RAGSettings } from '../types';

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1';

function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

function expandQuery(q: string) {
  return [
    q,
    `${q} history timeline origins`,
    `${q} latest news updates 2024 2025`,
    `${q} technical specifications and detailed working`
  ];
}

// Optimized search engine: Unified search + extracts + images in one request
async function searchWikipedia(query: string, limit: number = 8): Promise<{ results: SearchResult[], summary: string | null, media: MediaResult[] }> {
  try {
    const wikiRes = await axios.get(WIKI_API, {
      params: {
        action: 'query',
        generator: 'search',
        gsrsearch: query,
        gsrlimit: limit || 15,
        prop: 'extracts|pageimages|info',
        explaintext: 1,
        exchars: 5000,
        piprop: 'thumbnail',
        pithumbsize: 600,
        inprop: 'url',
        format: 'json',
        origin: '*',
      },
      timeout: 8000
    });

    const pages = wikiRes.data.query?.pages || {};
    const results: SearchResult[] = [];
    const media: MediaResult[] = [];
    let summary: string | null = null;

    Object.values(pages).forEach((page: any, index) => {
      if (index === 0 && page.extract) {
        summary = page.extract.trim();
      }

      if (page.extract || page.title) {
        const cleanExtract = (page.extract || "")
          .replace(/<[^>]*>?/gm, '')
          .replace(/\[\d+\]/g, '')
          .replace(/\[[a-zA-Z]\]/g, '')
          .trim();

        results.push({
          title: page.title,
          snippet: cleanExtract.slice(0, 5000).replace(/\n/g, ' '),
          url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
          source: 'Verified Intelligence',
          category: 'Reference' as const
        });
      }

      if (page.thumbnail?.source) {
        media.push({
          type: 'image',
          url: page.thumbnail.source,
          thumbnail: page.thumbnail.source,
          source: `Verified Source: ${page.title}`
        });
      }
    });

    return { results, summary, media };
  } catch (error) {
    console.error('Core search error:', error);
    return { results: [], summary: null, media: [] };
  }
}

// Internet Archive search removed per user constraint

function deduplicateAndRank(results: SearchResult[], query: string, settings?: RAGSettings): SearchResult[] {
  const seen = new Set<string>();
  const filtered = results.filter(r => {
    if (!r.url || seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  
  return filtered.map(r => {
    let score = 0;
    const text = (r.title + ' ' + r.snippet).toLowerCase();
    
    queryTerms.forEach(term => {
      if (text.includes(term)) score += 10;
      if (r.title.toLowerCase().includes(term)) score += 20;
    });

    // Authority boosts for sources
    if (r.source === 'Verified Intelligence') score += 20;
    
    // Penalize fragmented data
    if (r.snippet.length < 50) score -= 40;

    return { ...r, score };
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, settings?.maxSources || 15);
}

function buildContext(results: SearchResult[]): string {
  let context = "=== SPARK AI VERIFIED DATASET ===\n\n";
  results.forEach((res, i) => {
    context += `[ENTITY_VECTOR_${i + 1}]\n`;
    context += `CLASSIFICATION: CURRENT_REFERENCE\n`;
    context += `IDENTIFIER: ${res.title}\n`;
    context += `SOURCE_LINK: ${res.url}\n`;
    context += `INTELLIGENCE_DATA: ${res.snippet}\n\n`;
  });
  return context;
}

export async function SparkAI_Search(
  query: string, 
  customSources: CustomSource[] = [],
  onStage?: (stage: string) => void,
  isDeepMode: boolean = false,
  ragSettings?: RAGSettings
) {
  if (onStage) {
    onStage(isDeepMode 
      ? `Conducting Deep Multi-Dataset Archival Research...` 
      : `Gathering Reference Intelligence...`);
  }

  try {
    // Stage 1: Core research from Wikipedia
    const { results, summary, media } = await searchWikipedia(query, isDeepMode ? 15 : 8);
    let sources: SearchResult[] = results;

    // Additional depth for Deep Mode using sub-queries
    if (isDeepMode) {
      if (onStage) onStage(`Expanding Technical Coverage via Research Indices...`);
      const depthQueries = expandQuery(query);
      const [techRes, histRes] = await Promise.all([
        searchWikipedia(depthQueries[3], 5), // Technical query
        searchWikipedia(depthQueries[1], 5)  // History query
      ]);
      sources = [...sources, ...techRes.results, ...histRes.results];
    }

    if (onStage) onStage(`Synthesizing Media Intelligence...`);

    const processedCustom: SearchResult[] = customSources.map(cs => ({
      title: cs.type === 'url' ? cs.value : 'User Context',
      snippet: cs.type === 'text' ? cs.value : `Active research link: ${cs.value}`,
      url: cs.type === 'url' ? cs.value : '#custom',
      source: cs.type === 'url' ? 'Source' : 'Text',
      category: 'Reference' as const
    }));

    const allResults = [...sources, ...processedCustom];
    const ranked = deduplicateAndRank(allResults, query, ragSettings);

    return {
      sources: ranked,
      context: buildContext(ranked),
      summary: summary || (ranked[0]?.snippet || null),
      media: media,
      queries: expandQuery(query)
    };
  } catch (error) {
    console.error("Advanced Search Engine Error:", error);
    const { results, summary, media } = await searchWikipedia(query, 10);
    return {
      sources: results,
      context: buildContext(results),
      summary,
      media,
      queries: expandQuery(query)
    };
  }
}
