import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query is required' });

    try {
      const query = String(q);
      const headers = { 
        'User-Agent': 'SparkAI/1.0 (Reasoning Engine; Personal Assistant; +https://ais-dev.ais-dev.cloud)' 
      };
      
      // Stage 1: Search Wikipedia
      const wikiRes = await axios.get(`https://en.wikipedia.org/w/api.php`, {
        params: {
          action: 'query',
          list: 'search',
          srsearch: query,
          format: 'json',
          origin: '*',
          srlimit: 5
        },
        headers
      }).catch(() => ({ data: { query: { search: [] } } }));

      const wikiSearchItems = wikiRes.data.query?.search || [];
      const wikiResults = await Promise.all(wikiSearchItems.map(async (item: any) => {
        const infoboxLinks: { title: string, url: string, source: string }[] = [];
        
        // Try to fetch InfoBox Metadata via Wikidata
        try {
          const propsRes = await axios.get(`https://en.wikipedia.org/w/api.php`, {
            params: { action: 'query', prop: 'pageprops', titles: item.title, format: 'json', origin: '*' },
            headers
          });
          const pages = propsRes.data.query?.pages;
          if (pages) {
            const pageId = Object.keys(pages)[0];
            const wikibaseItem = pages[pageId]?.pageprops?.wikibase_item;
            if (wikibaseItem) {
              const wdRes = await axios.get(`https://www.wikidata.org/w/api.php`, {
                params: { action: 'wbgetclaims', entity: wikibaseItem, format: 'json', origin: '*' },
                headers
              });
              const claims = wdRes.data.claims || {};
              
              const extractClaim = (prop: string, formatter: (val: string) => string) => {
                 const val = claims[prop]?.[0]?.mainsnak?.datavalue?.value;
                 return val ? formatter(val) : null;
              };

              // Official Website (P856)
              const website = extractClaim('P856', (v) => v);
              if (website) infoboxLinks.push({ title: `${item.title} Official Website`, url: website, source: 'Official Website' });

              // Twitter (P2002)
              const twitter = extractClaim('P2002', (v) => `https://twitter.com/${v}`);
              if (twitter) infoboxLinks.push({ title: `${item.title} on X (Twitter)`, url: twitter, source: 'Twitter Profile' });
              
              // Instagram (P2053)
              const instagram = extractClaim('P2053', (v) => `https://instagram.com/${v}`);
              if (instagram) infoboxLinks.push({ title: `${item.title} on Instagram`, url: instagram, source: 'Instagram Profile' });

              // YouTube (P2397)
              const youtube = extractClaim('P2397', (v) => `https://youtube.com/channel/${v}`);
              if (youtube) infoboxLinks.push({ title: `${item.title} on YouTube`, url: youtube, source: 'YouTube Channel' });

              // IMDb (P345)
              const imdb = extractClaim('P345', (v) => `https://www.imdb.com/title/${v}`);
              if (imdb) infoboxLinks.push({ title: `${item.title} on IMDb`, url: imdb, source: 'IMDb Page' });
            }
          }
        } catch (e) {
          // Ignore wikidata errors
        }

        let snippet = item.snippet.replace(/<[^>]*>?/gm, '');
        try {
          const detailRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title)}`, { headers });
          snippet = detailRes.data.extract || snippet;
        } catch {}

        const resultsToReturn = [{
          title: item.title,
          snippet: snippet,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
          source: 'Wikipedia',
          category: 'Reference'
        }];

        infoboxLinks.forEach(link => {
          resultsToReturn.push({
            title: link.title,
            snippet: `Verified external link retrieved from Wikidata's Infobox resources for ${item.title}.`,
            url: link.url,
            source: link.source,
            category: 'Reference'
          });
        });
        
        return resultsToReturn;
      }));
      
      // Flatten the nested arrays from wikiResults
      const flatWikiResults = wikiResults.flat();

      // Stage 2: DuckDuckGo
      const ddgRes = await axios.get(`https://api.duckduckgo.com/`, {
        params: { q: query, format: 'json', no_html: 1, skip_disambig: 1 },
        headers
      }).catch(() => ({ data: {} }));

      const ddgResults = [];
      if (ddgRes.data.AbstractText) {
        ddgResults.push({
          title: ddgRes.data.Heading || query,
          snippet: ddgRes.data.AbstractText,
          url: ddgRes.data.AbstractURL,
          source: 'DuckDuckGo',
          category: 'Web'
        });
      }

      // Stage 3: Wikipedia Latest News (Recency injection)
      const newsResults: any[] = [];
      try {
        const d = new Date();
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        
        const newsRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/feed/featured/${year}/${month}/${day}`, { headers });
        const news = newsRes.data.news || [];
        
        // Take the top 5 global breaking news stories from Wikipedia
        const topNews = news.slice(0, 5);
        topNews.forEach((n: any) => {
          // If the query matches the news OR if the query includes "news", "latest", we inject it. 
          // Injecting the absolute latest news helps the model ground itself to the current date/reality.
          if (query.toLowerCase().includes('news') || query.toLowerCase().includes('latest') || n.story.toLowerCase().includes(query.toLowerCase())) {
            newsResults.push({
              title: `Latest Update: ${n.story}`,
              snippet: (n.links && n.links[0]?.extract) ? `${n.story} - ${n.links[0].extract}` : n.story,
              url: (n.links && n.links[0]?.content_urls?.desktop?.page) ? n.links[0].content_urls.desktop.page : 'https://en.wikipedia.org/wiki/Portal:Current_events',
              source: 'Wikipedia News',
              category: 'News'
            });
          }
        });
      } catch (e) {
        // Fallback or ignore if the featured feed fails
      }

      res.json([...flatWikiResults, ...ddgResults, ...newsResults]);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  app.get('/api/summary', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query is required' });

    try {
      const query = String(q);
      const headers = { 'User-Agent': 'SparkAI/1.0' };
      
      // Fallback: Search first, then get the full extract of first result
      const searchRes = await axios.get(`https://en.wikipedia.org/w/api.php`, {
        params: { action: 'query', list: 'search', srsearch: query, format: 'json', origin: '*', srlimit: 1 },
        headers
      });
      const firstResult = searchRes.data.query?.search?.[0];
      if (firstResult) {
        // Fetch the full page extract for massive elaboration (often 5000+ words)
        const detailRes = await axios.get(`https://en.wikipedia.org/w/api.php`, {
          params: { action: 'query', prop: 'extracts', explaintext: 1, titles: firstResult.title, format: 'json', origin: '*' },
          headers
        });
        
        const pages = detailRes.data.query?.pages;
        if (pages) {
          const pageId = Object.keys(pages)[0];
          let extract = pages[pageId]?.extract;
          if (extract) {
            // Remove = and * symbols from the extract to clean up formatting glitches
            extract = extract.replace(/[=*\\]/g, '').trim();
            return res.json({ extract: extract });
          }
        }
      }
      
      res.json({ extract: null });
    } catch (error) {
      res.json({ extract: null });
    }
  });

  app.get('/api/media', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query is required' });

    try {
      const query = String(q);
      const headers = { 'User-Agent': 'SparkAI/1.0' };
      
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
        headers
      });

      const pages = wikiRes.data.query?.pages || {};
      const media: any[] = [];
      
      Object.values(pages).forEach((page: any) => {
        if (page.thumbnail && page.thumbnail.source) {
          media.push({
            type: 'image',
            url: page.thumbnail.source,
            thumbnail: page.thumbnail.source,
            source: `Wikipedia: ${page.title}`
          });
        }
      });

      res.json(media);
    } catch (error) {
      res.json([]);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
