// src/pages/api/formdata-test.ts - VERSION DEBUG
export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  console.log('🧪 FormData Test - Starting');
  
  try {
    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type recibido:', contentType);
    console.log('Todos los headers:', Object.fromEntries(request.headers.entries()));
    
    // Intentar obtener el body como texto primero
    const textBody = await request.clone().text();
    console.log('Body como texto (primeros 200 chars):', textBody.substring(0, 200));
    
    return new Response(JSON.stringify({
      success: true,
      contentType,
      textBody: textBody.substring(0, 200),
      bodyLength: textBody.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};