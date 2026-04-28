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

// Re-implementing the robust search logic from server.ts for client-side execution
async function searchReference(query: string): Promise<SearchResult[]> {
  try {
    const wikiRes = await axios.get(WIKI_API, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: query,
        format: 'json',
        origin: '*',
        srlimit: 5
      }
    });

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
  if (!puter || !puter.browser?.search) return [];
  
  try {
    const results = await puter.browser.search(query);
    return (results || []).map((r: any) => ({
      title: r.title,
      snippet: r.snippet || r.description || "Detailed web content retrieved for analysis.",
      url: r.url || r.link,
      source: 'Spark Mesh',
      category: 'Web' as const
    }));
  } catch (error) {
    console.error('Spark Search error:', error);
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
      if (r.url.includes("wikipedia")) score += 20;
      if (r.url.includes(".edu")) score += 15;
      if (r.url.includes(".gov")) score += 18;
      if (r.url.includes("github")) score += 10;
      if (r.snippet?.length > 120) score += 5;
      return { ...r, score };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 15);
}

export function buildContext(results: SearchResult[]) {
  const reference = results.filter(r => r.category === 'Reference');
  const web = results.filter(r => r.category === 'Web' || !r.category);

  let context = "--- PRIMARY REFERENCE SOURCES ---\n";
  reference.forEach((r, i) => {
    context += `[Source ${i + 1}] (${r.source})\nTitle: ${r.title}\nContent: ${r.snippet}\n\n`;
  });

  context += "\n--- SUPPLEMENTAL WEB INTELLIGENCE ---\n";
  web.forEach((r, i) => {
    context += `[Source ${reference.length + i + 1}] (${r.source})\nTitle: ${r.title}\nContent: ${r.snippet}\n\n`;
  });

  return context;
}

export async function SparkSearch(
  query: string, 
  customSources: CustomSource[] = [],
  onStage?: (stage: string) => void,
  isGuest: boolean = false
) {
  const normalized = normalizeQuery(query);
  const summaryPromise = getSummary(normalized);
  const mediaPromise = getMedia(normalized);

  if (onStage) onStage(`Spark Edge: Indexing references for '${query}'...`);
  const wikiResults = await searchReference(normalized);
  
  let webResults: SearchResult[] = [];
  if (!isGuest) {
    if (onStage) onStage(`Spark Mesh: Expanding global search for '${query}'...`);
    webResults = await puterSearch(normalized);
  } else {
    // In guest mode, we skip general web search
    if (onStage) onStage(`Guest Access: Retrieving knowledge for '${query}'...`);
  }

  const queries = expandQuery(normalized);
  const expansionResults = await searchReference(queries[1]);

  const processedCustom: SearchResult[] = customSources.map(cs => ({
    title: cs.type === 'url' ? cs.value : 'Injected Context',
    snippet: cs.type === 'text' ? cs.value : `Data from custom URL: ${cs.value}`,
    url: cs.type === 'url' ? cs.value : '#custom',
    source: cs.type === 'url' ? 'User Link' : 'User Text',
    category: 'Reference'
  }));

  const allResults = [...wikiResults, ...webResults, ...expansionResults, ...processedCustom];
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
