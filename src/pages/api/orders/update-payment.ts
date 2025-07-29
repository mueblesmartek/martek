// src/pages/api/orders/update-payment.ts - API PARA ACTUALIZAR ESTADO DE PAGO
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { order_id, payment_reference, payment_status } = await request.json();

    // Validar datos requeridos
    if (!order_id || !payment_reference || !payment_status) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Faltan datos requeridos' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar estados permitidos
    const validStatuses = ['paid', 'failed', 'pending', 'refunded'];
    if (!validStatuses.includes(payment_status)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Estado de pago inválido' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!supabase) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error de configuración del servidor' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Actualizar orden en la base de datos
    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status,
        payment_reference,
        status: payment_status === 'paid' ? 'processing' : 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error actualizando la orden' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Si el pago fue exitoso, enviar email de confirmación (opcional)
    if (payment_status === 'paid') {
      try {
        await sendOrderConfirmationEmail(data);
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
        // No fallar la respuesta por error de email
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        message: 'Estado de pago actualizado correctamente' 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error en update-payment:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error interno del servidor' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// ✅ FUNCIÓN PARA ENVIAR EMAIL DE CONFIRMACIÓN
async function sendOrderConfirmationEmail(order: any) {
  // Aquí puedes integrar con tu servicio de email preferido
  // Ejemplos: SendGrid, Mailgun, Resend, etc.
  
  console.log(`📧 Enviando email de confirmación para orden ${order.order_number}`);
  
  // Ejemplo con fetch a servicio externo:
  /*
  const emailData = {
    to: order.shipping_address.email,
    subject: `Confirmación de Pedido #${order.order_number} - mueblesmartek.com`,
    template: 'order-confirmation',
    data: {
      order_number: order.order_number,
      customer_name: order.shipping_address.full_name,
      total: order.total,
      items: order.items,
      shipping_address: order.shipping_address
    }
  };

  const response = await fetch(process.env.EMAIL_SERVICE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.EMAIL_SERVICE_KEY}`
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    throw new Error('Error enviando email');
  }
  */
  
  return { success: true };
}