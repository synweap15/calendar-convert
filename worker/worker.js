export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Try to serve a built asset first
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse && assetResponse.status !== 404) {
      return assetResponse;
    }

    // For SPA routes (no file extension), fall back to index.html
    const isSpaRoute = !url.pathname.includes('.') || url.pathname.endsWith('/');
    if (isSpaRoute) {
      const indexReq = new Request(new URL('/index.html', url), request);
      const indexRes = await env.ASSETS.fetch(indexReq);
      if (indexRes) {
        return indexRes;
      }
    }

    // Otherwise return the original (likely 404) response
    return assetResponse || new Response('Not found', { status: 404 });
  },
};
