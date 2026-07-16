function getEnv(name) {
  return globalThis.Netlify?.env?.get(name) || process.env[name];
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function cleanQuery(value) {
  return String(value || '')
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

// Proxies Unsplash search so the Access Key never reaches the browser bundle.
// Also handles the download-tracking ping Unsplash's API guidelines require
// whenever a searched photo is actually used, not just previewed.
export default async (req) => {
  const accessKey = getEnv('UNSPLASH_ACCESS_KEY');
  if (!accessKey) {
    console.error('[cover-art-search] missing UNSPLASH_ACCESS_KEY');
    return json({ error: 'Photo search is not configured' }, 503);
  }

  if (req.method === 'POST') {
    let payload;
    try {
      payload = await req.json();
    } catch {
      return json({ error: 'Invalid request' }, 400);
    }
    const downloadLocation = String(payload?.downloadLocation || '');
    if (!downloadLocation.startsWith('https://api.unsplash.com/')) {
      return json({ error: 'Invalid download location' }, 400);
    }
    const pingRes = await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });
    if (!pingRes.ok) return json({ error: 'Could not register download' }, pingRes.status);
    return json({ ok: true });
  }

  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const url = new URL(req.url);
  const query = cleanQuery(url.searchParams.get('query'));
  if (!query) return json({ error: 'A search query is required' }, 400);

  const searchUrl = new URL('https://api.unsplash.com/search/photos');
  searchUrl.searchParams.set('query', query);
  searchUrl.searchParams.set('per_page', '3');
  searchUrl.searchParams.set('orientation', 'portrait');
  searchUrl.searchParams.set('content_filter', 'high');

  let unsplashRes;
  try {
    unsplashRes = await fetch(searchUrl, {
      headers: { Authorization: `Client-ID ${accessKey}`, 'Accept-Version': 'v1' },
    });
  } catch (err) {
    console.error('[cover-art-search] fetch failed:', err?.message || err);
    return json({ error: 'Photo search is temporarily unavailable' }, 502);
  }

  if (unsplashRes.status === 403) return json({ error: 'Photo search rate limit reached' }, 429);
  if (!unsplashRes.ok) {
    console.error('[cover-art-search] Unsplash error:', unsplashRes.status);
    return json({ error: 'Photo search is temporarily unavailable' }, 502);
  }

  const data = await unsplashRes.json();
  const results = (data.results || []).slice(0, 3).map(photo => ({
    id: photo.id,
    thumbUrl: photo.urls?.small,
    fullUrl: photo.urls?.regular,
    alt: photo.alt_description || photo.description || 'Unsplash photo',
    photographerName: photo.user?.name || 'Unknown',
    photographerUrl: photo.user?.links?.html || 'https://unsplash.com',
    downloadLocation: photo.links?.download_location || null,
  }));

  return json({ query, results });
};

export const config = {
  path: '/api/cover-art-search',
  method: ['GET', 'POST'],
};
