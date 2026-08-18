// dev-site.ts — tiny static server for docs/ with live reload.
// Run:  bun run dev:site               (PORT=4321 by default)
// Serves the docs/ landing site and auto-reloads the browser on any file change.
import { watch } from 'node:fs';
import { join, extname, normalize } from 'node:path';

const ROOT = join(import.meta.dir, '..', 'docs');
const PORT = Number(process.env.PORT ?? 4321);

const clients = new Set<ReadableStreamDefaultController>();
const enc = new TextEncoder();
function broadcast() {
  for (const c of clients) { try { c.enqueue(enc.encode('data: reload\n\n')); } catch {} }
}
let debounce: ReturnType<typeof setTimeout> | undefined;
watch(ROOT, { recursive: true }, () => {
  clearTimeout(debounce);
  debounce = setTimeout(broadcast, 90);
});

const RELOAD = `<script>(()=>{try{const e=new EventSource('/__reload');e.onmessage=()=>location.reload();}catch(_){}})()</script>`;
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.wav': 'audio/wav', '.mp3': 'audio/mpeg',
  '.json': 'application/json', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/__reload') {
      let ctl: ReadableStreamDefaultController;
      const stream = new ReadableStream({
        start(c) { ctl = c; clients.add(c); c.enqueue(enc.encode(': connected\n\n')); },
        cancel() { clients.delete(ctl); },
      });
      return new Response(stream, {
        headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' },
      });
    }

    let path = decodeURIComponent(url.pathname);
    if (path.endsWith('/')) path += 'index.html';
    const full = normalize(join(ROOT, path));
    if (!full.startsWith(ROOT)) return new Response('forbidden', { status: 403 });

    let served = full;
    if (!(await Bun.file(served).exists())) {
      if (await Bun.file(full + '.html').exists()) served = full + '.html';
      else if (await Bun.file(join(full, 'index.html')).exists()) served = join(full, 'index.html');
      else return new Response('not found: ' + path, { status: 404 });
    }

    const ext = extname(served).toLowerCase();
    if (ext === '.html') {
      let html = await Bun.file(served).text();
      html = html.includes('</body>') ? html.replace('</body>', RELOAD + '</body>') : html + RELOAD;
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    }
    return new Response(Bun.file(served), {
      headers: { 'content-type': TYPES[ext] ?? 'application/octet-stream', 'cache-control': 'no-store' },
    });
  },
});

console.log(`\n  preframe dev-site → http://localhost:${PORT}/`);
console.log(`  serving docs/ with live reload\n`);
console.log(`    /                  current homepage (index.html)`);
console.log(`    /hero-prototype    the new split-editor hero`);
console.log(`    /concepts/         concept readings\n`);
