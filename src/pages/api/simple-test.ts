export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  console.log('🔥 SIMPLE TEST - Starting');
  
  const contentType = request.headers.get('content-type');
  const contentLength = request.headers.get('content-length');
  
  let textResult = 'NOT_TRIED';
  
  try {
    const body = await request.text();
    textResult = `SUCCESS: length=${body.length}, content="${body}"`;
  } catch (e) {
    textResult = `ERROR: ${e.message}`;
  }
  
  return new Response(JSON.stringify({
    test: 'simple-basic',
    content_type: contentType,
    content_length: contentLength,
    result: textResult,
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
