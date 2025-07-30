export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  console.log('🧪 Headers test');
  
  const customHeader = request.headers.get('x-custom-data');
  const userAgent = request.headers.get('user-agent');
  const allHeaders = Object.fromEntries(request.headers.entries());
  
  return new Response(JSON.stringify({
    success: true,
    customHeader,
    userAgent,
    allHeaders,
    headerCount: Object.keys(allHeaders).length
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};