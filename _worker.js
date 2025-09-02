export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Try static asset first
    const res = await env.ASSETS.fetch(request);
    if (res && res.status !== 404) {
      return res;
    }
    // SPA fallback for routes without extensions
    if (!url.pathname.includes('.') || url.pathname.endsWith('/')) {
      return env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
    }
    return res || new Response('Not found', { status: 404 });
  },
};
