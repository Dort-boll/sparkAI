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
        'User-Agent': 'SparkAI/2.0 (Advanced Intelligence Engine; +https://ais-dev.ais-dev.cloud)' 
      };
      
      // Stage 1: Full-text search with metadata from Wikipedia
      const wikiRes = await axios.get(`https://en.wikipedia.org/w/api.php`, {
        params: {
          action: 'query',
          list: 'search',
          srsearch: query,
          format: 'json',
          origin: '*',
          srlimit: 20
        },
        headers
      }).catch(() => ({ data: { query: { search: [] } } }));

      const wikiSearchItems = wikiRes.data.query?.search || [];
      const wikiResults = await Promise.all(wikiSearchItems.map(async (item: any) => {
        let snippet = item.snippet.replace(/<[^>]*>?/gm, '').replace(/\[\d+\]/g, '');
        
        try {
          // Subsidiary: Summary API for high-quality extracts
          const detailRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title)}`, { headers });
          snippet = detailRes.data.extract || snippet;
        } catch (e) {}

        return {
          title: item.title,
          snippet: snippet,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
          source: 'Verified Intelligence',
          category: 'Reference'
        };
      }));

      res.json(wikiResults);
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
        // Fetch the full page extract for massive elaboration
        const detailRes = await axios.get(`https://en.wikipedia.org/w/api.php`, {
          params: { action: 'query', prop: 'extracts', explaintext: 1, titles: firstResult.title, format: 'json', origin: '*' },
          headers
        });
        
        const pages = detailRes.data.query?.pages;
        if (pages) {
          const pageId = Object.keys(pages)[0];
          let extract = pages[pageId]?.extract;
          if (extract) {
            return res.json({ extract: extract.trim() });
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
          gsrlimit: 15,
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
            source: `Verified Source: ${page.title}`
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
