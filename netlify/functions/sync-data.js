// netlify/functions/sync-data.js
export async function handler(event, context) {
  // Autenticación simple con API key
  const apiKey = event.headers['x-api-key'];
  if (apiKey !== process.env.SYNC_API_KEY) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    // TODO: Implementar lógica de sincronización
    // - Obtener productos de Airtable
    // - Actualizar cache en Firebase
    // - Sincronizar inventario
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Sync completed',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Sync error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Sync failed' })
    };
  }
}
