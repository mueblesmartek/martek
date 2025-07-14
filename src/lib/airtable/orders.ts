// src/lib/airtable/orders.ts
import { base, TABLES, FIELDS, ORDER_STATUS, PAYMENT_STATUS, airtableUtils } from './config';
import type { Address } from '../../types/order';

// Tipos para órdenes
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  variantInfo?: {
    color?: string;
    size?: string;
    sku?: string;
  };
}

export interface CreateOrderData {
  customerId: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
}

export interface Order {
  id: string;
  orderId: string;
  customerId: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentId?: string;
  shippingAddress: string;
  billingAddress: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// Convertir registro de Airtable a objeto Order
const airtableToOrder = (record: any, items: OrderItem[] = []): Order => {
  const fields = record.fields;
  
  return {
    id: record.id,
    orderId: fields[FIELDS.ORDERS.ID] || record.id,
    customerId: fields[FIELDS.ORDERS.CUSTOMER_ID] || '',
    customerEmail: fields[FIELDS.ORDERS.CUSTOMER_EMAIL] || '',
    status: fields[FIELDS.ORDERS.STATUS] || ORDER_STATUS.PENDING,
    paymentStatus: fields[FIELDS.ORDERS.PAYMENT_STATUS] || PAYMENT_STATUS.PENDING,
    subtotal: parseFloat(fields[FIELDS.ORDERS.SUBTOTAL] || '0'),
    shippingCost: parseFloat(fields[FIELDS.ORDERS.SHIPPING_COST] || '0'),
    taxAmount: parseFloat(fields[FIELDS.ORDERS.TAX_AMOUNT] || '0'),
    totalAmount: parseFloat(fields[FIELDS.ORDERS.TOTAL_AMOUNT] || '0'),
    currency: fields[FIELDS.ORDERS.CURRENCY] || 'COP',
    paymentMethod: fields[FIELDS.ORDERS.PAYMENT_METHOD] || '',
    paymentId: fields[FIELDS.ORDERS.PAYMENT_ID],
    shippingAddress: fields[FIELDS.ORDERS.SHIPPING_ADDRESS] || '',
    billingAddress: fields[FIELDS.ORDERS.BILLING_ADDRESS] || '',
    notes: fields[FIELDS.ORDERS.NOTES],
    items,
    createdAt: fields[FIELDS.ORDERS.CREATED_AT] || record._rawJson?.createdTime || '',
    updatedAt: fields[FIELDS.ORDERS.UPDATED_AT] || ''
  };
};

// Crear nueva orden
export const createOrder = async (orderData: CreateOrderData): Promise<string | null> => {
  try {
    const orderId = generateOrderId();
    
    // 1. Crear orden principal
    const orderRecord = await base(TABLES.ORDERS).create({
      [FIELDS.ORDERS.ID]: orderId,
      [FIELDS.ORDERS.CUSTOMER_ID]: orderData.customerId,
      [FIELDS.ORDERS.CUSTOMER_EMAIL]: orderData.customerEmail,
      [FIELDS.ORDERS.STATUS]: ORDER_STATUS.PENDING,
      [FIELDS.ORDERS.PAYMENT_STATUS]: PAYMENT_STATUS.PENDING,
      [FIELDS.ORDERS.SUBTOTAL]: orderData.subtotal,
      [FIELDS.ORDERS.SHIPPING_COST]: orderData.shippingCost,
      [FIELDS.ORDERS.TAX_AMOUNT]: orderData.taxAmount,
      [FIELDS.ORDERS.TOTAL_AMOUNT]: orderData.totalAmount,
      [FIELDS.ORDERS.CURRENCY]: 'COP',
      [FIELDS.ORDERS.PAYMENT_METHOD]: orderData.paymentMethod,
      [FIELDS.ORDERS.SHIPPING_ADDRESS]: JSON.stringify(orderData.shippingAddress),
      [FIELDS.ORDERS.BILLING_ADDRESS]: JSON.stringify(orderData.billingAddress),
      [FIELDS.ORDERS.NOTES]: orderData.notes || '',
      [FIELDS.ORDERS.CREATED_AT]: new Date().toISOString(),
      [FIELDS.ORDERS.UPDATED_AT]: new Date().toISOString()
    });

    // 2. Crear items de la orden
    const orderItemsPromises = orderData.items.map(item => 
      base(TABLES.ORDER_ITEMS).create({
        [FIELDS.ORDER_ITEMS.ORDER_ID]: orderId,
        [FIELDS.ORDER_ITEMS.PRODUCT_ID]: item.productId,
        [FIELDS.ORDER_ITEMS.PRODUCT_NAME]: item.productName,
        [FIELDS.ORDER_ITEMS.QUANTITY]: item.quantity,
        [FIELDS.ORDER_ITEMS.UNIT_PRICE]: item.unitPrice,
        [FIELDS.ORDER_ITEMS.TOTAL_PRICE]: item.unitPrice * item.quantity,
        [FIELDS.ORDER_ITEMS.VARIANT_INFO]: item.variantInfo ? JSON.stringify(item.variantInfo) : ''
      })
    );

    await Promise.all(orderItemsPromises);

    return orderRecord.id;

  } catch (error) {
    console.error('Error creando orden:', error);
    airtableUtils.handleError(error);
    return null;
  }
};

// Obtener orden por ID
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    // Obtener orden principal
    const orderRecord = await base(TABLES.ORDERS).find(orderId);
    
    // Obtener items de la orden
    const items = await getOrderItems(orderRecord.fields[FIELDS.ORDERS.ID] || orderId);
    
    return airtableToOrder(orderRecord, items);

  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }
    console.error('Error obteniendo orden:', error);
    airtableUtils.handleError(error);
    return null;
  }
};

// Obtener órdenes por cliente
export const getOrdersByCustomer = async (customerId: string): Promise<Order[]> => {
  try {
    const records = await base(TABLES.ORDERS)
      .select({
        filterByFormula: `{${FIELDS.ORDERS.CUSTOMER_ID}} = '${customerId}'`,
        sort: [{ field: FIELDS.ORDERS.CREATED_AT, direction: 'desc' }]
      })
      .all();

    const orders: Order[] = [];
    
    for (const record of records) {
      const orderId = record.fields[FIELDS.ORDERS.ID] || record.id;
      const items = await getOrderItems(orderId);
      orders.push(airtableToOrder(record, items));
    }

    return orders;

  } catch (error) {
    console.error('Error obteniendo órdenes del cliente:', error);
    airtableUtils.handleError(error);
    return [];
  }
};

// Obtener items de una orden
export const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
  try {
    const records = await base(TABLES.ORDER_ITEMS)
      .select({
        filterByFormula: `{${FIELDS.ORDER_ITEMS.ORDER_ID}} = '${orderId}'`
      })
      .all();

    return records.map(record => {
      const fields = record.fields;
      return {
        productId: fields[FIELDS.ORDER_ITEMS.PRODUCT_ID] || '',
        productName: fields[FIELDS.ORDER_ITEMS.PRODUCT_NAME] || '',
        quantity: parseInt(fields[FIELDS.ORDER_ITEMS.QUANTITY] || '1'),
        unitPrice: parseFloat(fields[FIELDS.ORDER_ITEMS.UNIT_PRICE] || '0'),
        totalPrice: parseFloat(fields[FIELDS.ORDER_ITEMS.TOTAL_PRICE] || '0'),
        variantInfo: fields[FIELDS.ORDER_ITEMS.VARIANT_INFO] 
          ? JSON.parse(fields[FIELDS.ORDER_ITEMS.VARIANT_INFO]) 
          : undefined
      };
    });

  } catch (error) {
    console.error('Error obteniendo items de orden:', error);
    return [];
  }
};

// Actualizar estado de orden
export const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
  try {
    await base(TABLES.ORDERS).update(orderId, {
      [FIELDS.ORDERS.STATUS]: status,
      [FIELDS.ORDERS.UPDATED_AT]: new Date().toISOString()
    });

    return true;

  } catch (error) {
    console.error('Error actualizando estado de orden:', error);
    airtableUtils.handleError(error);
    return false;
  }
};

// Actualizar estado de pago
export const updatePaymentStatus = async (
  orderId: string, 
  paymentStatus: string, 
  paymentId?: string
): Promise<boolean> => {
  try {
    const updateData: any = {
      [FIELDS.ORDERS.PAYMENT_STATUS]: paymentStatus,
      [FIELDS.ORDERS.UPDATED_AT]: new Date().toISOString()
    };

    if (paymentId) {
      updateData[FIELDS.ORDERS.PAYMENT_ID] = paymentId;
    }

    await base(TABLES.ORDERS).update(orderId, updateData);

    return true;

  } catch (error) {
    console.error('Error actualizando estado de pago:', error);
    airtableUtils.handleError(error);
    return false;
  }
};

// Agregar información de seguimiento
export const addTrackingInfo = async (
  orderId: string,
  trackingData: {
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
  }
): Promise<boolean> => {
  try {
    const updateData: any = {
      [FIELDS.ORDERS.STATUS]: ORDER_STATUS.SHIPPED,
      [FIELDS.ORDERS.UPDATED_AT]: new Date().toISOString()
    };

    // Agregar tracking info como JSON en notes o campo específico
    const existingOrder = await base(TABLES.ORDERS).find(orderId);
    const currentNotes = existingOrder.fields[FIELDS.ORDERS.NOTES] || '';
    
    const trackingInfo = {
      ...trackingData,
      shippedAt: new Date().toISOString()
    };

    updateData[FIELDS.ORDERS.NOTES] = currentNotes + `\n\nTRACKING: ${JSON.stringify(trackingInfo)}`;

    await base(TABLES.ORDERS).update(orderId, updateData);

    return true;

  } catch (error) {
    console.error('Error agregando información de seguimiento:', error);
    airtableUtils.handleError(error);
    return false;
  }
};

// Obtener órdenes por estado
export const getOrdersByStatus = async (status: string): Promise<Order[]> => {
  try {
    const records = await base(TABLES.ORDERS)
      .select({
        filterByFormula: `{${FIELDS.ORDERS.STATUS}} = '${status}'`,
        sort: [{ field: FIELDS.ORDERS.CREATED_AT, direction: 'desc' }]
      })
      .all();

    const orders: Order[] = [];
    
    for (const record of records) {
      const orderId = record.fields[FIELDS.ORDERS.ID] || record.id;
      const items = await getOrderItems(orderId);
      orders.push(airtableToOrder(record, items));
    }

    return orders;

  } catch (error) {
    console.error('Error obteniendo órdenes por estado:', error);
    airtableUtils.handleError(error);
    return [];
  }
};

// Obtener estadísticas de órdenes
export const getOrderStats = async (dateRange?: { start: string; end: string }) => {
  try {
    let filterFormula = '';
    
    if (dateRange) {
      filterFormula = `AND(
        IS_AFTER({${FIELDS.ORDERS.CREATED_AT}}, '${dateRange.start}'),
        IS_BEFORE({${FIELDS.ORDERS.CREATED_AT}}, '${dateRange.end}')
      )`;
    }

    const records = await base(TABLES.ORDERS)
      .select({
        filterByFormula: filterFormula || undefined,
        fields: [
          FIELDS.ORDERS.STATUS,
          FIELDS.ORDERS.PAYMENT_STATUS,
          FIELDS.ORDERS.TOTAL_AMOUNT,
          FIELDS.ORDERS.CREATED_AT
        ]
      })
      .all();

    const stats = {
      totalOrders: records.length,
      totalRevenue: records.reduce((sum, record) => {
        return sum + parseFloat(record.fields[FIELDS.ORDERS.TOTAL_AMOUNT] || '0');
      }, 0),
      averageOrderValue: 0,
      ordersByStatus: {} as Record<string, number>,
      ordersByPaymentStatus: {} as Record<string, number>,
      ordersToday: 0,
      ordersThisWeek: 0,
      ordersThisMonth: 0
    };

    // Calcular promedio
    stats.averageOrderValue = stats.totalOrders > 0 
      ? stats.totalRevenue / stats.totalOrders 
      : 0;

    // Agrupar por estados
    records.forEach(record => {
      const status = record.fields[FIELDS.ORDERS.STATUS] || 'unknown';
      const paymentStatus = record.fields[FIELDS.ORDERS.PAYMENT_STATUS] || 'unknown';
      
      stats.ordersByStatus[status] = (stats.ordersByStatus[status] || 0) + 1;
      stats.ordersByPaymentStatus[paymentStatus] = (stats.ordersByPaymentStatus[paymentStatus] || 0) + 1;
      
      // Calcular órdenes por periodo
      const orderDate = new Date(record.fields[FIELDS.ORDERS.CREATED_AT]);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      if (orderDate >= today) stats.ordersToday++;
      if (orderDate >= weekAgo) stats.ordersThisWeek++;
      if (orderDate >= monthAgo) stats.ordersThisMonth++;
    });

    return stats;

  } catch (error) {
    console.error('Error obteniendo estadísticas de órdenes:', error);
    airtableUtils.handleError(error);
    return null;
  }
};

// Buscar órdenes
export const searchOrders = async (searchTerm: string): Promise<Order[]> => {
  try {
    const records = await base(TABLES.ORDERS)
      .select({
        filterByFormula: `OR(
          SEARCH('${searchTerm}', {${FIELDS.ORDERS.ID}}),
          SEARCH('${searchTerm}', {${FIELDS.ORDERS.CUSTOMER_EMAIL}}),
          SEARCH('${searchTerm}', {${FIELDS.ORDERS.PAYMENT_ID}})
        )`,
        sort: [{ field: FIELDS.ORDERS.CREATED_AT, direction: 'desc' }]
      })
      .all();

    const orders: Order[] = [];
    
    for (const record of records) {
      const orderId = record.fields[FIELDS.ORDERS.ID] || record.id;
      const items = await getOrderItems(orderId);
      orders.push(airtableToOrder(record, items));
    }

    return orders;

  } catch (error) {
    console.error('Error buscando órdenes:', error);
    airtableUtils.handleError(error);
    return [];
  }
};

// Cancelar orden
export const cancelOrder = async (orderId: string, reason?: string): Promise<boolean> => {
  try {
    const updateData: any = {
      [FIELDS.ORDERS.STATUS]: ORDER_STATUS.CANCELLED,
      [FIELDS.ORDERS.UPDATED_AT]: new Date().toISOString()
    };

    if (reason) {
      const existingNotes = await getOrderById(orderId);
      updateData[FIELDS.ORDERS.NOTES] = (existingNotes?.notes || '') + `\n\nCANCELLED: ${reason} (${new Date().toISOString()})`;
    }

    await base(TABLES.ORDERS).update(orderId, updateData);

    return true;

  } catch (error) {
    console.error('Error cancelando orden:', error);
    airtableUtils.handleError(error);
    return false;
  }
};

// Procesar reembolso
export const processRefund = async (
  orderId: string, 
  amount: number, 
  reason: string
): Promise<boolean> => {
  try {
    await base(TABLES.ORDERS).update(orderId, {
      [FIELDS.ORDERS.PAYMENT_STATUS]: PAYMENT_STATUS.REFUNDED,
      [FIELDS.ORDERS.UPDATED_AT]: new Date().toISOString(),
      [FIELDS.ORDERS.NOTES]: `REFUND: $${amount} - ${reason} (${new Date().toISOString()})`
    });

    return true;

  } catch (error) {
    console.error('Error procesando reembolso:', error);
    airtableUtils.handleError(error);
    return false;
  }
};

// Obtener órdenes que requieren seguimiento
export const getOrdersNeedingTracking = async (): Promise<Order[]> => {
  try {
    return await getOrdersByStatus(ORDER_STATUS.PROCESSING);
  } catch (error) {
    console.error('Error obteniendo órdenes que necesitan seguimiento:', error);
    return [];
  }
};

// Obtener información de entrega
export const getDeliveryInfo = async (orderId: string) => {
  try {
    const order = await getOrderById(orderId);
    if (!order) return null;

    // Extraer información de tracking de las notas
    const trackingMatch = order.notes?.match(/TRACKING: ({.*?})/);
    if (trackingMatch) {
      const trackingInfo = JSON.parse(trackingMatch[1]);
      return {
        ...trackingInfo,
        status: order.status,
        estimatedDelivery: trackingInfo.estimatedDelivery,
        currentLocation: 'En tránsito' // Esto vendría de la API del carrier
      };
    }

    return {
      status: order.status,
      message: 'Información de seguimiento no disponible'
    };

  } catch (error) {
    console.error('Error obteniendo información de entrega:', error);
    return null;
  }
};

// Generar ID único de orden
const generateOrderId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `KS${timestamp}${random}`;
};

// Validar datos de orden
export const validateOrderData = (orderData: CreateOrderData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!orderData.customerId) errors.push('ID de cliente requerido');
  if (!orderData.customerEmail) errors.push('Email de cliente requerido');
  if (!orderData.items || orderData.items.length === 0) errors.push('Items de orden requeridos');
  if (orderData.totalAmount <= 0) errors.push('Total de orden debe ser mayor a cero');
  if (!orderData.paymentMethod) errors.push('Método de pago requerido');
  if (!orderData.shippingAddress) errors.push('Dirección de envío requerida');
  if (!orderData.billingAddress) errors.push('Dirección de facturación requerida');

  // Validar items
  orderData.items.forEach((item, index) => {
    if (!item.productId) errors.push(`Item ${index + 1}: ID de producto requerido`);
    if (!item.productName) errors.push(`Item ${index + 1}: Nombre de producto requerido`);
    if (item.quantity <= 0) errors.push(`Item ${index + 1}: Cantidad debe ser mayor a cero`);
    if (item.unitPrice <= 0) errors.push(`Item ${index + 1}: Precio unitario debe ser mayor a cero`);
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

// Exportar funciones de utilidad
export const orderUtils = {
  generateOrderId,
  validateOrderData,
  calculateOrderTotals: (items: OrderItem[], shippingCost: number = 0, taxRate: number = 0.19) => {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxAmount = Math.round(subtotal * taxRate);
    const totalAmount = subtotal + shippingCost + taxAmount;
    
    return {
      subtotal,
      shippingCost,
      taxAmount,
      totalAmount
    };
  }
};