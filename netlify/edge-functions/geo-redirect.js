// netlify/edge-functions/geo-redirect.js
export default async (request, context) => {
  const country = context.geo?.country?.code;
  
  // Solo permitir acceso desde Colombia
  if (country && country !== 'CO') {
    return new Response('Lo sentimos, este servicio solo está disponible en Colombia.', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
  
  return context.next();
};
