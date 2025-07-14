// src/lib/wompi/payments.ts
import {
  wompiPrivateClient,
  wompiPublicClient,
  wompiUtils,
  TRANSACTION_STATUS,
  PAYMENT_METHODS,
  type WompiTransaction,
  type CreateTransactionData,
  type CreatePaymentLinkData,
  type WompiPaymentLink,
  type WompiCustomer,
  type WompiPaymentMethod
} from './config';

// Resultado de transacción
export interface TransactionResult {
  success: boolean;
  transaction?: WompiTransaction;
  paymentLink?: WompiPaymentLink;
  error?: string;
  redirectUrl?: string;
}

// Datos para crear pago
export interface CreatePaymentData {
  orderId: string;
  amount: number; // En pesos colombianos
  customerEmail: string;
  customerData?: {
    fullName?: string;
    phoneNumber?: string;
    legalId?: string;
    legalIdType?: 'CC' | 'CE' | 'NIT' | 'PP';
  };
  shippingAddress?: any;
  paymentMethod?: 'CARD' | 'PSE' | 'NEQUI' | 'BANCOLOMBIA_TRANSFER';
  description?: string;
}

// ===========================================
// TRANSACCIONES DIRECTAS
// ===========================================

// Crear transacción con tarjeta
export const createCardTransaction = async (
  paymentData: CreatePaymentData,
  cardToken: string,
  installments: number = 1
): Promise<TransactionResult> => {
  try {
    const reference = wompiUtils.generateReference(paymentData.orderId);
    const amountInCents = wompiUtils.pesosTocents(paymentData.amount);

    if (!wompiUtils.isValidAmount(paymentData.amount)) {
      return { success: false, error: 'Monto inválido' };
    }

    if (!wompiUtils.isValidEmail(paymentData.customerEmail)) {
      return { success: false, error: 'Email inválido' };
    }

    const transactionData: CreateTransactionData = {
      amount_in_cents: amountInCents,
      currency: 'COP',
      customer_email: paymentData.customerEmail,
      payment_method: {
        type: 'CARD',
        token: cardToken,
        installments: installments
      },
      redirect_url: wompiUtils.generateRedirectUrl(paymentData.orderId),
      reference: reference,
      customer_data: paymentData.customerData ? 
        wompiUtils.formatCustomerData(paymentData.customerData) : undefined,
      shipping_address: paymentData.shippingAddress ? 
        wompiUtils.formatAddress(paymentData.shippingAddress) : undefined
    };

    const response = await wompiPrivateClient.post('/transactions', transactionData);
    const transaction: WompiTransaction = response.data.data;

    return {
      success: true,
      transaction,
      redirectUrl: transaction.redirect_url
    };

  } catch (error) {
    console.error('Error en transacción con tarjeta:', error);
    return {
      success: false,
      error: wompiUtils.handleError(error)
    };
  }
};

// Crear transacción PSE
export const createPSETransaction = async (
  paymentData: CreatePaymentData,
  pseData: {
    bankCode: string;
    userType: 'NATURAL' | 'JURIDICA';
    documentType: 'CC' | 'CE' | 'NIT';
    documentNumber: string;
  }
): Promise<TransactionResult> => {
  try {
    const reference = wompiUtils.generateReference(paymentData.orderId);
    const amountInCents = wompiUtils.pesosTocents(paymentData.amount);

    const transactionData: CreateTransactionData = {
      amount_in_cents: amountInCents,
      currency: 'COP',
      customer_email: paymentData.customerEmail,
      payment_method: {
        type: 'PSE',
        extra: {
          financial_institution_code: pseData.bankCode,
          user_type: pseData.userType,
          user_legal_id_type: pseData.documentType,
          user_legal_id: pseData.documentNumber
        }
      },
      redirect_url: wompiUtils.generateRedirectUrl(paymentData.orderId),
      reference: reference,
      customer_data: paymentData.customerData ? 
        wompiUtils.formatCustomerData(paymentData.customerData) : undefined
    };

    const response = await wompiPrivateClient.post('/transactions', transactionData);
    const transaction: WompiTransaction = response.data.data;

    return {
      success: true,
      transaction,
      redirectUrl: transaction.redirect_url
    };

  } catch (error) {
    console.error('Error en transacción PSE:', error);
    return {
      success: false,
      error: wompiUtils.handleError(error)
    };
  }
};

// Crear transacción NEQUI
export const createNequiTransaction = async (
  paymentData: CreatePaymentData,
  phoneNumber: string
): Promise<TransactionResult> => {
  try {
    const reference = wompiUtils.generateReference(paymentData.orderId);
    const amountInCents = wompiUtils.pesosTocents(paymentData.amount);

    // NEQUI tiene límite de 3,000,000 COP
    if (paymentData.amount > 3000000) {
      return { success: false, error: 'Monto excede límite de NEQUI (3,000,000 COP)' };
    }

    const transactionData: CreateTransactionData = {
      amount_in_cents: amountInCents,
      currency: 'COP',
      customer_email: paymentData.customerEmail,
      payment_method: {
        type: 'NEQUI',
        extra: {
          phone_number: phoneNumber
        }
      },
      redirect_url: wompiUtils.generateRedirectUrl(paymentData.orderId),
      reference: reference,
      customer_data: paymentData.customerData ? 
        wompiUtils.formatCustomerData(paymentData.customerData) : undefined
    };

    const response = await wompiPrivateClient.post('/transactions', transactionData);
    const transaction: WompiTransaction = response.data.data;

    return {
      success: true,
      transaction,
      redirectUrl: transaction.redirect_url
    };

  } catch (error) {
    console.error('Error en transacción NEQUI:', error);
    return {
      success: false,
      error: wompiUtils.handleError(error)
    };
  }
};

// ===========================================
// PAYMENT LINKS (Para checkout general)
// ===========================================

// Crear link de pago
export const createPaymentLink = async (
  paymentData: CreatePaymentData
): Promise<TransactionResult> => {
  try {
    const amountInCents = wompiUtils.pesosTocents(paymentData.amount);
    const reference = wompiUtils.generateReference(paymentData.orderId);

    const linkData: CreatePaymentLinkData = {
      name: `Orden ${paymentData.orderId}`,
      description: paymentData.description || 'Compra en Kamasex.shop',
      single_use: true,
      amount_in_cents: amountInCents,
      currency: 'COP',
      customer_email: paymentData.customerEmail,
      redirect_url: wompiUtils.generateRedirectUrl(paymentData.orderId),
      collect_shipping: !!paymentData.shippingAddress,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      shipping_countries: ['CO'],
      payment_methods: wompiUtils.getAvailablePaymentMethods(amountInCents),
      reference: reference
    };

    const response = await wompiPrivateClient.post('/payment_links', linkData);
    const paymentLink: WompiPaymentLink = response.data.data;

    return {
      success: true,
      paymentLink,
      redirectUrl: paymentLink.url
    };

  } catch (error) {
    console.error('Error creando link de pago:', error);
    return {
      success: false,
      error: wompiUtils.handleError(error)
    };
  }
};

// ===========================================
// CONSULTAS Y VERIFICACIONES
// ===========================================

// Obtener transacción por ID
export const getTransaction = async (transactionId: string): Promise<WompiTransaction | null> => {
  try {
    const response = await wompiPrivateClient.get(`/transactions/${transactionId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo transacción:', error);
    wompiUtils.handleError(error);
    return null;
  }
};

// Obtener link de pago por ID
export const getPaymentLink = async (linkId: string): Promise<WompiPaymentLink | null> => {
  try {
    const response = await wompiPrivateClient.get(`/payment_links/${linkId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo link de pago:', error);
    wompiUtils.handleError(error);
    return null;
  }
};

// Verificar estado de transacción
export const checkTransactionStatus = async (reference: string): Promise<{
  status: string;
  transaction?: WompiTransaction;
  approved: boolean;
}> => {
  try {
    // Buscar por referencia
    const response = await wompiPrivateClient.get(`/transactions?reference=${reference}`);
    const transactions = response.data.data;

    if (transactions.length === 0) {
      return { status: 'NOT_FOUND', approved: false };
    }

    const transaction = transactions[0];
    return {
      status: transaction.status,
      transaction,
      approved: transaction.status === TRANSACTION_STATUS.APPROVED
    };

  } catch (error) {
    console.error('Error verificando estado de transacción:', error);
    return { status: 'ERROR', approved: false };
  }
};

// ===========================================
// MÉTODOS DE PAGO AUXILIARES
// ===========================================

// Obtener bancos disponibles para PSE
export const getPSEBanks = async (): Promise<Array<{
  code: string;
  name: string;
}>> => {
  try {
    const response = await wompiPublicClient.get('/pse/financial_institutions');
    return response.data.data.map((bank: any) => ({
      code: bank.financial_institution_code,
      name: bank.financial_institution_name
    }));
  } catch (error) {
    console.error('Error obteniendo bancos PSE:', error);
    return [];
  }
};

// Tokenizar tarjeta (frontend)
export const tokenizeCard = async (cardData: {
  number: string;
  cvc: string;
  exp_month: string;
  exp_year: string;
  card_holder: string;
}): Promise<{ token?: string; error?: string }> => {
  try {
    const response = await wompiPublicClient.post('/tokens/cards', {
      number: cardData.number.replace(/\s/g, ''),
      cvc: cardData.cvc,
      exp_month: cardData.exp_month,
      exp_year: cardData.exp_year,
      card_holder: cardData.card_holder
    });

    return { token: response.data.data.id };
  } catch (error) {
    console.error('Error tokenizando tarjeta:', error);
    return { error: wompiUtils.handleError(error) };
  }
};

// ===========================================
// WEBHOOK HANDLERS
// ===========================================

// Procesar webhook de Wompi
export const processWompiWebhook = async (
  payload: any,
  signature: string
): Promise<{
  processed: boolean;
  transactionId?: string;
  status?: string;
  error?: string;
}> => {
  try {
    // Verificar firma del webhook
    const payloadString = JSON.stringify(payload);
    if (!wompiUtils.verifyWebhookSignature(payloadString, signature)) {
      return { processed: false, error: 'Firma de webhook inválida' };
    }

    const { event, data } = payload;

    switch (event) {
      case 'transaction.updated':
        return await handleTransactionUpdated(data);
      
      case 'payment_link.paid':
        return await handlePaymentLinkPaid(data);
      
      case 'transaction.declined':
        return await handleTransactionDeclined(data);
      
      default:
        console.log('Evento de webhook no manejado:', event);
        return { processed: true };
    }

  } catch (error) {
    console.error('Error procesando webhook:', error);
    return { processed: false, error: error.message };
  }
};

// Manejar transacción actualizada
const handleTransactionUpdated = async (transactionData: any) => {
  try {
    const transaction: WompiTransaction = transactionData.transaction;
    
    console.log('Transacción actualizada:', {
      id: transaction.id,
      status: transaction.status,
      reference: transaction.reference
    });

    // Aquí integrarías con tu sistema de órdenes
    // Por ejemplo, actualizar el estado en Airtable
    
    return {
      processed: true,
      transactionId: transaction.id,
      status: transaction.status
    };

  } catch (error) {
    console.error('Error manejando transacción actualizada:', error);
    return { processed: false, error: error.message };
  }
};

// Manejar payment link pagado
const handlePaymentLinkPaid = async (paymentLinkData: any) => {
  try {
    const paymentLink: WompiPaymentLink = paymentLinkData.payment_link;
    
    console.log('Payment link pagado:', {
      id: paymentLink.id,
      status: paymentLink.status
    });

    return {
      processed: true,
      transactionId: paymentLink.id,
      status: 'PAID'
    };

  } catch (error) {
    console.error('Error manejando payment link pagado:', error);
    return { processed: false, error: error.message };
  }
};

// Manejar transacción rechazada
const handleTransactionDeclined = async (transactionData: any) => {
  try {
    const transaction: WompiTransaction = transactionData.transaction;
    
    console.log('Transacción rechazada:', {
      id: transaction.id,
      status: transaction.status,
      reference: transaction.reference
    });

    return {
      processed: true,
      transactionId: transaction.id,
      status: transaction.status
    };

  } catch (error) {
    console.error('Error manejando transacción rechazada:', error);
    return { processed: false, error: error.message };
  }
};

// ===========================================
// REEMBOLSOS Y ANULACIONES
// ===========================================

// Procesar reembolso (void)
export const processRefund = async (
  transactionId: string,
  amount?: number // Si no se especifica, reembolso total
): Promise<{ success: boolean; error?: string }> => {
  try {
    const transaction = await getTransaction(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transacción no encontrada' };
    }

    if (transaction.status !== TRANSACTION_STATUS.APPROVED) {
      return { success: false, error: 'Solo se pueden reembolsar transacciones aprobadas' };
    }

    const refundAmount = amount || transaction.amount_in_cents;

    // Wompi maneja reembolsos a través de voids
    const response = await wompiPrivateClient.post(`/transactions/${transactionId}/void`, {
      amount_in_cents: refundAmount
    });

    return { success: true };

  } catch (error) {
    console.error('Error procesando reembolso:', error);
    return { success: false, error: wompiUtils.handleError(error) };
  }
};

// ===========================================
// REPORTES Y ANALYTICS
// ===========================================

// Obtener transacciones por fecha
export const getTransactionsByDate = async (
  startDate: string,
  endDate: string
): Promise<WompiTransaction[]> => {
  try {
    const response = await wompiPrivateClient.get('/transactions', {
      params: {
        created_at_start: startDate,
        created_at_end: endDate,
        limit: 200
      }
    });

    return response.data.data;

  } catch (error) {
    console.error('Error obteniendo transacciones por fecha:', error);
    wompiUtils.handleError(error);
    return [];
  }
};

// Generar reporte de ventas
export const generateSalesReport = async (
  startDate: string,
  endDate: string
): Promise<{
  totalTransactions: number;
  totalAmount: number;
  approvedTransactions: number;
  approvedAmount: number;
  declinedTransactions: number;
  byPaymentMethod: Record<string, { count: number; amount: number }>;
}> => {
  try {
    const transactions = await getTransactionsByDate(startDate, endDate);

    const report = {
      totalTransactions: transactions.length,
      totalAmount: 0,
      approvedTransactions: 0,
      approvedAmount: 0,
      declinedTransactions: 0,
      byPaymentMethod: {} as Record<string, { count: number; amount: number }>
    };

    transactions.forEach(transaction => {
      const amount = wompiUtils.centsToPesos(transaction.amount_in_cents);
      const method = transaction.payment_method.type;

      report.totalAmount += amount;

      if (transaction.status === TRANSACTION_STATUS.APPROVED) {
        report.approvedTransactions++;
        report.approvedAmount += amount;
      } else if (transaction.status === TRANSACTION_STATUS.DECLINED) {
        report.declinedTransactions++;
      }

      if (!report.byPaymentMethod[method]) {
        report.byPaymentMethod[method] = { count: 0, amount: 0 };
      }
      report.byPaymentMethod[method].count++;
      report.byPaymentMethod[method].amount += amount;
    });

    return report;

  } catch (error) {
    console.error('Error generando reporte de ventas:', error);
    throw error;
  }
};

// ===========================================
// UTILIDADES DE VALIDACIÓN
// ===========================================

// Validar datos de tarjeta
export const validateCardData = (cardData: {
  number: string;
  cvc: string;
  exp_month: string;
  exp_year: string;
  card_holder: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validar número de tarjeta (Luhn algorithm)
  const cleanNumber = cardData.number.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleanNumber)) {
    errors.push('Número de tarjeta inválido');
  }

  // Validar CVC
  if (!/^\d{3,4}$/.test(cardData.cvc)) {
    errors.push('CVC inválido');
  }

  // Validar fecha de expiración
  const month = parseInt(cardData.exp_month);
  const year = parseInt(cardData.exp_year);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  if (month < 1 || month > 12) {
    errors.push('Mes de expiración inválido');
  }

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    errors.push('Tarjeta expirada');
  }

  // Validar nombre del titular
  if (!cardData.card_holder || cardData.card_holder.length < 2) {
    errors.push('Nombre del titular requerido');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Detectar tipo de tarjeta
export const detectCardType = (number: string): string => {
  const cleanNumber = number.replace(/\s/g, '');
  
  if (/^4/.test(cleanNumber)) return 'VISA';
  if (/^5[1-5]/.test(cleanNumber)) return 'MASTERCARD';
  if (/^3[47]/.test(cleanNumber)) return 'AMEX';
  if (/^30[0-5]/.test(cleanNumber)) return 'DINERS';
  
  return 'UNKNOWN';
};

// Formatear número de tarjeta
export const formatCardNumber = (number: string): string => {
  const cleanNumber = number.replace(/\s/g, '');
  return cleanNumber.replace(/(.{4})/g, '$1 ').trim();
};

// Exportar funciones de utilidad
export const paymentUtils = {
  validateCardData,
  detectCardType,
  formatCardNumber,
  ...wompiUtils
};