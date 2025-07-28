// src/lib/wompi.ts - Integración con Wompi para pagos
export interface WompiConfig {
  publicKey: string;
  currency: 'COP';
  country: 'CO';
}

export interface WompiPayment {
  amount: number; // En centavos
  currency: 'COP';
  reference: string;
  customer_email: string;
  customer_data?: {
    phone_number?: string;
    full_name?: string;
  };
  shipping_address?: {
    address_line_1: string;
    address_line_2?: string;
    country: string;
    region: string;
    city: string;
    name: string;
    phone_number: string;
  };
}

const WOMPI_CONFIG: WompiConfig = {
  publicKey: import.meta.env.PUBLIC_WOMPI_PUBLIC_KEY || '',
  currency: 'COP',
  country: 'CO'
};

export function isWompiConfigured(): boolean {
  return !!WOMPI_CONFIG.publicKey;
}

export function createWompiPayment(paymentData: WompiPayment): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!isWompiConfigured()) {
      reject(new Error('Wompi no está configurado'));
      return;
    }

    // Crear el widget de Wompi
    const checkout = new (window as any).WidgetCheckout({
      currency: WOMPI_CONFIG.currency,
      amountInCents: paymentData.amount * 100, // Convertir a centavos
      reference: paymentData.reference,
      publicKey: WOMPI_CONFIG.publicKey,
      customerData: {
        email: paymentData.customer_email,
        fullName: paymentData.customer_data?.full_name,
        phoneNumber: paymentData.customer_data?.phone_number,
      },
      shippingAddress: paymentData.shipping_address,
      redirectUrl: `${window.location.origin}/checkout/success`, // URL de éxito
    });

    checkout.open((result: any) => {
      if (result.transaction && result.transaction.status === 'APPROVED') {
        resolve({
          success: true,
          transactionId: result.transaction.id,
          reference: result.transaction.reference,
          status: result.transaction.status
        });
      } else {
        reject(new Error('Pago no completado o rechazado'));
      }
    });
  });
}

export function loadWompiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).WidgetCheckout) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar el script de Wompi'));
    document.head.appendChild(script);
  });
}

// Función para usar en el CheckoutForm
export async function processWompiPayment(
  amount: number,
  reference: string,
  customerEmail: string,
  customerData?: {
    phone_number?: string;
    full_name?: string;
  },
  shippingAddress?: any
): Promise<any> {
  try {
    // Cargar script de Wompi si no está cargado
    await loadWompiScript();

    // Crear el pago
    const paymentData: WompiPayment = {
      amount,
      currency: 'COP',
      reference,
      customer_email: customerEmail,
      customer_data: customerData,
      shipping_address: shippingAddress ? {
        address_line_1: shippingAddress.address,
        country: shippingAddress.country,
        region: shippingAddress.state,
        city: shippingAddress.city,
        name: shippingAddress.full_name,
        phone_number: shippingAddress.phone,
      } : undefined
    };

    return await createWompiPayment(paymentData);
  } catch (error) {
    console.error('Error procesando pago con Wompi:', error);
    throw error;
  }
}