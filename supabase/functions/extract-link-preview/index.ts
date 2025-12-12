import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

function extractMetaTags(html: string): LinkPreview {
  const preview: LinkPreview = { url: '' };

  const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
  if (titleMatch) preview.title = titleMatch[1];

  const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
  if (descMatch) preview.description = descMatch[1];

  const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
  if (imageMatch) preview.image = imageMatch[1];

  const siteNameMatch = html.match(/<meta property="og:site_name" content="([^"]+)"/i);
  if (siteNameMatch) preview.siteName = siteNameMatch[1];

  if (!preview.title) {
    const titleTag = html.match(/<title>([^<]+)<\/title>/i);
    if (titleTag) preview.title = titleTag[1];
  }

  if (!preview.description) {
    const metaDesc = html.match(/<meta name="description" content="([^"]+)"/i);
    if (metaDesc) preview.description = metaDesc[1];
  }

  return preview;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const urlObj = new URL(url);

    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com' || urlObj.hostname === 'youtu.be') {
      let videoId = '';

      if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get('v') || '';
      }

      if (videoId) {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oembedResponse = await fetch(oembedUrl);
        const oembedData = await oembedResponse.json();

        return new Response(
          JSON.stringify({
            url,
            title: oembedData.title,
            description: `by ${oembedData.author_name}`,
            image: oembedData.thumbnail_url,
            siteName: 'YouTube',
            videoId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PaddleGridBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch URL');
    }

    const html = await response.text();
    const preview = extractMetaTags(html);
    preview.url = url;

    return new Response(
      JSON.stringify(preview),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting link preview:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to extract link preview' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
