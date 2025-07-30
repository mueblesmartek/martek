export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  console.log('🧪 Simple order test');
  
  try {
    const body = await request.text();
    console.log('Body recibido:', body);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Test funciona',
      bodyLength: body.length,
      bodyPreview: body.substring(0, 100)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error en test:', error);
    
    // ✅ FIX: Manejar error como unknown
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};