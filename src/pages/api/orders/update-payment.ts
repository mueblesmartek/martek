export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

interface UpdatePaymentRequest {
  order_id: string;
  payment_reference?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_data?: any;
}

const ALLOWED_PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'];

function validateUpdatePaymentData(data: any): { isValid: boolean; errors: string[]; cleanData?: UpdatePaymentRequest } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Datos requeridos');
    return { isValid: false, errors };
  }

  if (!data.order_id || typeof data.order_id !== 'string') {
    errors.push('ID de orden requerido');
  }

  if (!data.payment_status || !ALLOWED_PAYMENT_STATUSES.includes(data.payment_status)) {
    errors.push('Estado de pago inválido');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    cleanData: {
      order_id: data.order_id,
      payment_reference: data.payment_reference || null,
      payment_status: data.payment_status,
      transaction_data: data.transaction_data || null
    }
  };
}

async function updateOrderInDatabase(orderId: string, updateData: any) {
  if (!supabase) {
    return { success: false, error: 'Database not available' };
  }

  try {
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        payment_reference: updateData.payment_reference,
        payment_status: updateData.payment_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando orden:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Orden actualizada:', updatedOrder.order_number);
    return { success: true, data: updatedOrder };

  } catch (error) {
    console.error('❌ Error general:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: errorMessage };
  }
}

export const POST: APIRoute = async ({ request }) => {
  console.log('🔄 POST /api/orders/update-payment - Iniciando...');

  if (!supabase) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Database not available' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parsear datos
    let requestData;
    try {
      const rawBody = await request.text();
      if (!rawBody || rawBody.trim() === '') {
        throw new Error('Request body está vacío');
      }
      requestData = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('❌ Error parseando datos:', parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Error de parsing';
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Datos JSON inválidos',
        details: errorMessage
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar datos
    const validation = validateUpdatePaymentData(requestData);
    if (!validation.isValid) {
      console.error('❌ Datos inválidos:', validation.errors);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Datos de actualización inválidos',
        validation_errors: validation.errors
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updateData = validation.cleanData!;

    // Actualizar orden
    const result = await updateOrderInDatabase(updateData.order_id, updateData);
    
    if (!result.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Error actualizando orden',
        details: result.error
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Respuesta exitosa
    return new Response(JSON.stringify({
      success: true,
      message: 'Estado de pago actualizado exitosamente',
      data: result.data
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error general:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Error interno del servidor',
      details: errorMessage
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ 
    success: true,
    message: 'API update-payment activa',
    methods: ['POST']
  }), { 
    headers: { 'Content-Type': 'application/json' }
  });
};