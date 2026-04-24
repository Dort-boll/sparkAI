import axios from 'axios';
import { SearchResult, CustomSource, MediaResult } from '../types';

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1';

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

// Optimized Wikipedia engine: Unified search + extracts + images in one request
async function searchWikipedia(query: string, limit: number = 8): Promise<{ results: SearchResult[], summary: string | null, media: MediaResult[] }> {
  try {
    const wikiRes = await axios.get(WIKI_API, {
      params: {
        action: 'query',
        generator: 'search',
        gsrsearch: query,
        gsrlimit: limit,
        prop: 'extracts|pageimages|info',
        exintro: 1,
        explaintext: 1,
        exchars: 1200,
        piprop: 'thumbnail',
        pithumbsize: 600,
        inprop: 'url',
        format: 'json',
        origin: '*',
      },
      timeout: 5000 // Strict 5s timeout
    });

    const pages = wikiRes.data.query?.pages || {};
    const results: SearchResult[] = [];
    const media: MediaResult[] = [];
    let summary: string | null = null;

    Object.values(pages).forEach((page: any, index) => {
      // First page extract is our primary summary
      if (index === 0 && page.extract) {
        summary = page.extract.replace(/[=*\\]/g, '').trim();
      }

      if (page.extract || page.title) {
        // Aggressive cleanup of Wikipedia-style citations [1][2][a] etc.
        const cleanExtract = (page.extract || "")
          .replace(/<[^>]*>?/gm, '')
          .replace(/\[\d+\]/g, '')
          .replace(/\[[a-zA-Z]\]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        results.push({
          title: page.title,
          snippet: cleanExtract.slice(0, 1000).replace(/\n/g, ' '),
          url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
          source: 'Reference',
          category: 'Reference' as const
        });
      }

      if (page.thumbnail?.source) {
        media.push({
          type: 'image',
          url: page.thumbnail.source,
          thumbnail: page.thumbnail.source,
          source: `Wikipedia: ${page.title}`
        });
      }
    });

    return { results, summary, media };
  } catch (error) {
    console.error('Wikipedia search error:', error);
    return { results: [], summary: null, media: [] };
  }
}

// Internet Archive search engine
async function internetArchiveSearch(query: string, limit: number = 5): Promise<SearchResult[]> {
  try {
    const res = await axios.get('https://archive.org/advancedsearch.php', {
      params: {
        q: query,
        output: 'json',
        rows: limit,
        fields: 'title,description,identifier,mediatype'
      },
      timeout: 5000
    });

    const docs = res.data.response?.docs || [];
    return docs.map((doc: any) => ({
      title: doc.title || doc.identifier,
      snippet: (doc.description || "Historical data point available for depth analysis.")
        .replace(/<[^>]*>?/gm, '')
        .replace(/\[\d+\]/g, '')
        .replace(/\n/g, ' ')
        .slice(0, 1000)
        .trim(),
      url: `https://archive.org/details/${doc.identifier}`,
      source: 'Data Archive',
      category: 'Web' as const
    }));
  } catch (error) {
    console.error('Internet Archive search error:', error);
    return [];
  }
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
      const url = r.url.toLowerCase();
      if (url.includes("wikipedia")) score += 20;
      if (url.includes("archive.org")) score += 18;
      if (url.includes(".edu")) score += 15;
      if (url.includes(".gov")) score += 18;
      if (url.includes("github")) score += 10;
      if (url.includes("news") || url.includes("reuters") || url.includes("bbc") || url.includes("nytimes")) score += 12;
      return { ...r, score };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 20);
}

function buildContext(results: SearchResult[]) {
  const reference = results.filter(r => r.category === 'Reference');
  const web = results.filter(r => r.category === 'Web');

  let context = "--- CORE COGNITIVE CLUSTERS ---\n";
  reference.forEach((r, i) => {
    context += `[C${i + 1}] ${r.title}\nInsight: ${r.snippet}\n\n`;
  });

  if (web.length > 0) {
    context += "\n--- SUPPLEMENTAL DATA DEPTH ---\n";
    web.forEach((r, i) => {
      context += `[D${i + 1}] ${r.title}\nInsight: ${r.snippet}\n\n`;
    });
  }

  return context;
}

export async function SparkAI_Search(
  query: string, 
  customSources: CustomSource[] = [],
  onStage?: (stage: string) => void,
  isDeepMode: boolean = false
) {
  const normalized = normalizeQuery(query);
  const queries = expandQuery(normalized);

  if (onStage) {
    onStage(isDeepMode 
      ? `Orchestrating Deep Multi-Dataset Analysis...` 
      : `Gathering Reference Intelligence...`);
  }

  // Optimized parallel dispatch: Only wait for the critical results
  const wikipediaPromise = searchWikipedia(normalized, 12);
  
  if (!isDeepMode) {
    const { results, summary, media } = await wikipediaPromise;
    
    if (onStage) onStage(`Synthesizing results...`);

    const processedCustom: SearchResult[] = customSources.map(cs => ({
      title: cs.type === 'url' ? cs.value : 'User Context',
      snippet: cs.type === 'text' ? cs.value : `Active research link: ${cs.value}`,
      url: cs.type === 'url' ? cs.value : '#custom',
      source: cs.type === 'url' ? 'Source' : 'Text',
      category: 'Reference'
    }));

    const allResults = [...results, ...processedCustom];
    const ranked = deduplicateAndRank(allResults);

    return {
      sources: ranked,
      context: buildContext(ranked),
      summary: summary || (ranked[0]?.snippet || null),
      media,
      queries
    };
  }

  // Deep mode parallelization: Wikipedia Depth + Internet Archive
  const archivePromise = internetArchiveSearch(normalized, 8);
  const depthPromise = searchWikipedia(queries[1], 5);

  const [wikiCore, archiveResults, depthWiki] = await Promise.all([
    wikipediaPromise,
    archivePromise,
    depthPromise
  ]);

  if (onStage) onStage(`Merging multi-source intelligence...`);

  const processedCustom: SearchResult[] = customSources.map(cs => ({
    title: cs.type === 'url' ? cs.value : 'User Context',
    snippet: cs.type === 'text' ? cs.value : `Active research link: ${cs.value}`,
    url: cs.type === 'url' ? cs.value : '#custom',
    source: cs.type === 'url' ? 'Source' : 'Text',
    category: 'Reference' as const
  }));

  const allResults = [
    ...wikiCore.results, 
    ...archiveResults, 
    ...depthWiki.results, 
    ...processedCustom
  ];

  const ranked = deduplicateAndRank(allResults);
  
  return {
    sources: ranked,
    context: buildContext(ranked),
    summary: wikiCore.summary || (ranked[0]?.snippet || null),
    media: wikiCore.media,
    queries
  };
}
