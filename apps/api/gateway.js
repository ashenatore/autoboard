import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Hono();

// 1. Proxy /api requests to the Hono backend on port 3001
app.all('/api/*', async (c) => {
  const url = new URL(c.req.url);
  const targetUrl = `http://127.0.0.1:3001${url.pathname}${url.search}`;
  
  try {
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers: c.req.header(),
      body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? await c.req.arrayBuffer() : undefined,
    });
    return new Response(response.body, response);
  } catch (err) {
    return c.text('Gateway Error: Backend unreachable', 502);
  }
});

// 2. Serve static files from the public folder
app.use('/*', serveStatic({ root: './public' }));

// 3. SPA Fallback (Return index.html for any non-file routes)
app.get('*', async (c) => {
  try {
    const html = await readFile(path.join(__dirname, 'public/index.html'), 'utf-8');
    return c.html(html);
  } catch (e) {
    return c.text('Frontend assets not found in public/ folder', 404);
  }
});

console.log('🚀 Gateway running on port 3000 -> Proxying to 3001');
serve({ fetch: app.fetch, port: 3000 });