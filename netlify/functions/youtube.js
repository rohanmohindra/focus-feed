function isoToSeconds(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) +
         (parseInt(m[2] || 0) * 60) +
          parseInt(m[3] || 0);
}

export default async (request, context) => {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(request.url);
  const params = url.searchParams;

  params.set('key', process.env.YOUTUBE_API_KEY);

  const endpoint = params.get('_endpoint');
  params.delete('_endpoint');

  const allowedEndpoints = ['channels', 'playlistItems', 'videos'];
  if (!allowedEndpoints.includes(endpoint)) {
    return new Response('Invalid endpoint', { status: 400 });
  }

  const youtubeUrl = `https://www.googleapis.com/youtube/v3/${endpoint}?${params.toString()}`;

  const ytResponse = await fetch(youtubeUrl);
  const data = await ytResponse.json();

  // Filter Shorts out of video detail responses
  if (endpoint === 'videos' && data.items) {
    data.items = data.items.filter(v => {
      const secs = isoToSeconds(v.contentDetails?.duration);
      return secs >= 150; // Filter out videos shorter than 2.5 minutes
    });
  }

  return new Response(JSON.stringify(data), {
    status: ytResponse.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const config = { path: '/api/youtube' };