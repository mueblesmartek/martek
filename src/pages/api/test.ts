// src/pages/api/simple-test.ts - TEST ULTRA BÁSICO
export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  console.log('🔥 SIMPLE TEST - Starting');
  
  // Test 1: Verificar que el request existe
  const hasRequest = !!request;
  console.log('Has request:', hasRequest);
  
  // Test 2: Verificar headers
  const contentType = request.headers.get('content-type');
  const contentLength = request.headers.get('content-length');
  console.log('Content-Type:', contentType);
  console.log('Content-Length:', contentLength);
  
  // Test 3: Intentar diferentes métodos para obtener body
  let result1 = 'NOT_TRIED';
  let result2 = 'NOT_TRIED';
  let result3 = 'NOT_TRIED';
  
  try {
    // Método 1: request.text()
    const body1 = await request.clone().text();
    result1 = `text(): length=${body1.length}, content="${body1}"`;
  } catch (e) {
    result1 = `text() ERROR: ${e.message}`;
  }
  
  try {
    // Método 2: request.json() directo
    const body2 = await request.clone().json();
    result2 = `json(): ${JSON.stringify(body2)}`;
  } catch (e) {
    result2 = `json() ERROR: ${e.message}`;
  }
  
  try {
    // Método 3: request.arrayBuffer()
    const buffer = await request.clone().arrayBuffer();
    const decoder = new TextDecoder();
    const body3 = decoder.decode(buffer);
    result3 = `arrayBuffer(): length=${body3.length}, content="${body3}"`;
  } catch (e) {
    result3 = `arrayBuffer() ERROR: ${e.message}`;
  }
  
  return new Response(JSON.stringify({
    test: 'simple-basic',
    has_request: hasRequest,
    content_type: contentType,
    content_length: contentLength,
    method1: result1,
    method2: result2,
    method3: result3,
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};