// netlify/functions/wompi-webhook.js
export async function handler(event, context) {
  // Verificar que sea POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body);
    const signature = event.headers['x-signature'];
    
    // TODO: Verificar signature de Wompi
    // TODO: Procesar el evento del pago
    // TODO: Actualizar Airtable con estado del pedido
    // TODO: Enviar email de confirmación via Firebase
    
    console.log('Webhook recibido:', payload);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
