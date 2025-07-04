import { Router } from 'itty-router';

// Create a new router
const router = Router();

// Define API routes
router.get('/lfg', async (request, env) => {
  try {
    // Query for "Looking For Group" threads
    const { results } = await env.DB.prepare(`
      SELECT * FROM discord_threads 
      WHERE parent_id = ?
    `)
    .bind(env.LFG_CHANNEL_ID)
    .all();

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

router.get('/lfm', async (request, env) => {
  try {
    // Query for "Looking For Members" threads
    const { results } = await env.DB.prepare(`
      SELECT * FROM discord_threads
      WHERE parent_id = ?
    `)
    .bind(env.LFM_CHANNEL_ID)
    .all();

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

router.get('/lfs', async (request, env) => {
  try {
    // Query for "Looking For Static" threads
    const { results } = await env.DB.prepare(`
      SELECT * FROM discord_threads
      WHERE parent_id = ?
    `)
    .bind(env.LFS_CHANNEL_ID)
    .all();

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Combined endpoint for all types of threads
router.get('/threads', async (request, env) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type')?.toLowerCase();

    let channelId;
    switch (type) {
      case 'lfg':
        channelId = env.LFG_CHANNEL_ID;
        break;
      case 'lfm':
        channelId = env.LFM_CHANNEL_ID;
        break;
      case 'lfs':
        channelId = env.LFS_CHANNEL_ID;
        break;
      default:
        // If no type provided or invalid type, return all threads
        const { results } = await env.DB.prepare(`
          SELECT * FROM discord_threads
        `).all();

        return new Response(JSON.stringify({ success: true, data: results }), {
          headers: { 'Content-Type': 'application/json' },
        });
    }

    // If a valid type was provided, query for that specific channel
    const { results } = await env.DB.prepare(`
      SELECT * FROM discord_threads
      WHERE parent_id = ?
    `)
    .bind(channelId)
    .all();

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

router.get('/tags', async (request, env) => {
  try {
    // Query all tags from discord_channel_tags table
    const { results } = await env.DB.prepare(`
      SELECT * FROM discord_channel_tags
    `)
    .all();

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Add a catch-all route for 404s
router.all('*', () => {
  return new Response('Not Found', { status: 404 });
});

// Export a default object containing event handlers
export default {
  // The fetch handler is invoked when this worker receives a HTTP request
  async fetch(request, env, ctx) {
    // Add CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Route the request
    const response = await router.handle(request, env, ctx);

    // Add CORS headers to the response
    const newResponse = new Response(response.body, response);
    Object.keys(corsHeaders).forEach(key => {
      newResponse.headers.set(key, corsHeaders[key]);
    });

    return newResponse;
  }
};
