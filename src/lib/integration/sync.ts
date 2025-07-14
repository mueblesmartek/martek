// src/lib/integration/sync.ts
import { doc, setDoc, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase/config';
import { getUserProfile } from '../firebase/users';
import { createOrder, updateOrderStatus, updatePaymentStatus } from '../airtable/orders';
import { checkMultipleProductsStock, reserveStock, confirmSale, releaseReservedStock } from '../airtable/inventory';
import type { Cart } from '../../types/cart';
import type { Address } from '../../types/order';
import type { OrderSync } from '../firebase/config';

// Interfaz para datos de checkout
export interface CheckoutData {
  cart: Cart;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  notes?: string;
}

// Resultado del procesamiento de checkout
export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  firebaseOrderId?: string;
  airtableOrderId?: string;
  error?: string;
  stockIssues?: Array<{
    productId: string;
    requested: number;
    available: number;
  }>;
}

// ===========================================
// CHECKOUT HÍBRIDO FIREBASE + AIRTABLE
// ===========================================

// Función principal de checkout que integra ambos sistemas
export const processHybridCheckout = async (
  userId: string,
  checkoutData: CheckoutData
): Promise<CheckoutResult> => {
  let airtableOrderId: string | null = null;
  let firebaseOrderId: string | null = null;

  try {
    // 1. Verificar usuario en Firebase
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return { success: false, error: 'Usuario no encontrado en Firebase' };
    }

    // 2. Verificar stock disponible en Airtable
    const stockCheck = await checkMultipleProductsStock(
      checkoutData.cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    );

    const stockIssues = stockCheck.filter(item => !item.available);
    if (stockIssues.length > 0) {
      return {
        success: false,
        error: 'Stock insuficiente para algunos productos',
        stockIssues: stockIssues.map(item => ({
          productId: item.productId,
          requested: item.requestedQuantity,
          available: item.availableQuantity
        }))
      };
    }

    // 3. Reservar stock en Airtable
    const tempOrderId = `temp_${Date.now()}_${userId}`;
    const reservationPromises = checkoutData.cart.items.map(item =>
      reserveStock(item.productId, item.quantity, tempOrderId)
    );
    const reservationResults = await Promise.all(reservationPromises);
    
    if (reservationResults.some(result => !result)) {
      return { success: false, error: 'Error al reservar stock en Airtable' };
    }

    // 4. Calcular totales
    const subtotal = checkoutData.cart.subtotal;
    const shippingCost = calculateShippingCost(checkoutData.shippingAddress, subtotal);
    const taxAmount = Math.round(subtotal * 0.19); // IVA 19%
    const totalAmount = subtotal + shippingCost + taxAmount;

    // 5. Crear orden en Airtable
    airtableOrderId = await createOrder({
      customerId: userId,
      customerEmail: userProfile.email,
      items: checkoutData.cart.items.map(item => ({
        productId: item.productId,
        productName: item.product?.name || 'Producto',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        variantInfo: item.selectedVariant
      })),
      subtotal,
      shippingCost,
      taxAmount,
      totalAmount,
      paymentMethod: checkoutData.paymentMethod,
      shippingAddress: checkoutData.shippingAddress,
      billingAddress: checkoutData.billingAddress,
      notes: checkoutData.notes
    });

    if (!airtableOrderId) {
      // Liberar stock reservado si falla la creación de la orden
      await Promise.all(
        checkoutData.cart.items.map(item =>
          releaseReservedStock(item.productId, item.quantity, tempOrderId)
        )
      );
      return { success: false, error: 'Error al crear orden en Airtable' };
    }

    // 6. Actualizar orden en Airtable con el ID real
    await updateOrderReservations(airtableOrderId, checkoutData.cart.items);

    // 7. Crear registro de sincronización en Firebase
    const orderSync: Omit<OrderSync, 'id'> = {
      userId,
      airtableOrderId,
      status: 'pending',
      paymentStatus: 'pending',
      totalAmount,
      currency: 'COP',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      metadata: {
        tempOrderId,
        itemCount: checkoutData.cart.items.length,
        shippingMethod: getShippingMethod(checkoutData.shippingAddress),
        paymentMethod: checkoutData.paymentMethod
      }
    };

    const orderSyncRef = await addDoc(collection(db, COLLECTIONS.ORDER_SYNC), orderSync);
    firebaseOrderId = orderSyncRef.id;

    return {
      success: true,
      orderId: airtableOrderId,
      firebaseOrderId,
      airtableOrderId
    };

  } catch (error) {
    console.error('Error en checkout híbrido:', error);

    // Cleanup en caso de error
    if (airtableOrderId) {
      try {
        await updateOrderStatus(airtableOrderId, 'cancelled');
        await Promise.all(
          checkoutData.cart.items.map(item =>
            releaseReservedStock(item.productId, item.quantity, airtableOrderId)
          )
        );
      } catch (cleanupError) {
        console.error('Error en cleanup:', cleanupError);
      }
    }

    return { success: false, error: 'Error interno del servidor' };
  }
};

// ===========================================
// CONFIRMACIÓN DE PAGO
// ===========================================

// Confirmar pago y actualizar ambos sistemas
export const confirmPayment = async (
  airtableOrderId: string,
  paymentId: string,
  paymentData?: any
): Promise<boolean> => {
  try {
    // 1. Actualizar estado de pago en Airtable
    const airtableUpdated = await updatePaymentStatus(airtableOrderId, 'paid', paymentId);
    if (!airtableUpdated) return false;

    // 2. Actualizar estado de orden en Airtable
    const orderUpdated = await updateOrderStatus(airtableOrderId, 'confirmed');
    if (!orderUpdated) return false;

    // 3. Confirmar venta en inventario (reduce stock real)
    const orderItems = await getOrderItems(airtableOrderId);
    if (orderItems) {
      await Promise.all(
        orderItems.map(item =>
          confirmSale(item.productId, item.quantity, airtableOrderId)
        )
      );
    }

    // 4. Actualizar sincronización en Firebase
    await updateFirebaseOrderSync(airtableOrderId, {
      status: 'confirmed',
      paymentStatus: 'paid',
      updatedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      metadata: {
        paymentId,
        paymentConfirmedAt: new Date().toISOString(),
        ...paymentData
      }
    });

    // 5. Actualizar estadísticas del usuario en Firebase
    await updateUserStats(airtableOrderId);

    return true;

  } catch (error) {
    console.error('Error confirmando pago:', error);
    return false;
  }
};

// ===========================================
// CANCELACIÓN DE ORDEN
// ===========================================

// Cancelar orden y liberar stock
export const cancelOrder = async (
  airtableOrderId: string,
  reason?: string,
  userId?: string
): Promise<boolean> => {
  try {
    // 1. Actualizar estado en Airtable
    const orderUpdated = await updateOrderStatus(airtableOrderId, 'cancelled');
    if (!orderUpdated) return false;

    // 2. Liberar stock reservado
    const orderItems = await getOrderItems(airtableOrderId);
    if (orderItems) {
      await Promise.all(
        orderItems.map(item =>
          releaseReservedStock(item.productId, item.quantity, airtableOrderId)
        )
      );
    }

    // 3. Actualizar sincronización en Firebase
    await updateFirebaseOrderSync(airtableOrderId, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      metadata: {
        cancelledAt: new Date().toISOString(),
        cancelReason: reason || 'No especificado'
      }
    });

    return true;

  } catch (error) {
    console.error('Error cancelando orden:', error);
    return false;
  }
};

// ===========================================
// SINCRONIZACIÓN DE ÓRDENES
// ===========================================

// Obtener órdenes del usuario desde Firebase
export const getUserOrders = async (userId: string): Promise<OrderSync[]> => {
  try {
    const ordersRef = collection(db, COLLECTIONS.ORDER_SYNC);
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as OrderSync[];

  } catch (error) {
    console.error('Error obteniendo órdenes de usuario:', error);
    return [];
  }
};

// Sincronizar estado de orden desde Airtable a Firebase
export const syncOrderFromAirtable = async (airtableOrderId: string): Promise<boolean> => {
  try {
    // Obtener datos actualizados de Airtable
    const airtableOrder = await getOrderFromAirtable(airtableOrderId);
    if (!airtableOrder) return false;

    // Actualizar en Firebase
    await updateFirebaseOrderSync(airtableOrderId, {
      status: airtableOrder.status,
      paymentStatus: airtableOrder.paymentStatus,
      lastSyncAt: new Date().toISOString(),
      metadata: {
        ...airtableOrder.metadata,
        lastAirtableUpdate: airtableOrder.updatedAt
      }
    });

    return true;

  } catch (error) {
    console.error('Error sincronizando orden desde Airtable:', error);
    return false;
  }
};

// ===========================================
// FUNCIONES AUXILIARES
// ===========================================

// Calcular costo de envío
const calculateShippingCost = (address: Address, subtotal: number): number => {
  // Envío gratis para pedidos mayores a $150,000
  if (subtotal >= 150000) return 0;

  // Ciudades principales: $15,000
  const mainCities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga'];
  if (mainCities.some(city => address.city.includes(city))) {
    return 15000;
  }

  // Otras ciudades: $25,000
  return 25000;
};

// Obtener método de envío
const getShippingMethod = (address: Address): string => {
  const mainCities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga'];
  if (mainCities.some(city => address.city.includes(city))) {
    return 'express';
  }
  return 'standard';
};

// Actualizar reservas con el ID real de la orden
const updateOrderReservations = async (orderId: string, items: any[]): Promise<void> => {
  try {
    // Liberar reservas temporales y crear nuevas con el ID real
    const tempOrderId = `temp_${Date.now()}`;
    
    await Promise.all(items.map(async (item) => {
      await releaseReservedStock(item.productId, item.quantity, tempOrderId);
      await reserveStock(item.productId, item.quantity, orderId);
    }));
  } catch (error) {
    console.error('Error actualizando reservas:', error);
  }
};

// Actualizar sincronización en Firebase
const updateFirebaseOrderSync = async (
  airtableOrderId: string,
  updates: Partial<OrderSync>
): Promise<void> => {
  try {
    // Buscar documento por airtableOrderId
    const q = query(
      collection(db, COLLECTIONS.ORDER_SYNC),
      where('airtableOrderId', '==', airtableOrderId)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0].id;
      await updateDoc(doc(db, COLLECTIONS.ORDER_SYNC, docId), updates);
    }
  } catch (error) {
    console.error('Error actualizando sincronización:', error);
  }
};

// Actualizar estadísticas del usuario
const updateUserStats = async (airtableOrderId: string): Promise<void> => {
  try {
    // Obtener información de la orden
    const orderSync = await getOrderSyncByAirtableId(airtableOrderId);
    if (!orderSync) return;

    // Actualizar estadísticas en Firebase
    const userRef = doc(db, COLLECTIONS.USERS, orderSync.userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentOrders = userData.totalOrders || 0;
      const currentSpent = userData.totalSpent || 0;

      await updateDoc(userRef, {
        totalOrders: currentOrders + 1,
        totalSpent: currentSpent + orderSync.totalAmount,
        loyaltyPoints: (userData.loyaltyPoints || 0) + Math.floor(orderSync.totalAmount / 1000),
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error actualizando estadísticas de usuario:', error);
  }
};

// Obtener items de una orden (mock - implementar con Airtable)
const getOrderItems = async (airtableOrderId: string): Promise<any[] | null> => {
  try {
    // Implementar llamada real a Airtable para obtener items
    // Por ahora retornamos null
    return null;
  } catch (error) {
    console.error('Error obteniendo items de orden:', error);
    return null;
  }
};

// Obtener orden desde Airtable (mock - implementar con Airtable)
const getOrderFromAirtable = async (airtableOrderId: string): Promise<any | null> => {
  try {
    // Implementar llamada real a Airtable
    // Por ahora retornamos null
    return null;
  } catch (error) {
    console.error('Error obteniendo orden desde Airtable:', error);
    return null;
  }
};

// Obtener sincronización de orden por ID de Airtable
const getOrderSyncByAirtableId = async (airtableOrderId: string): Promise<OrderSync | null> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.ORDER_SYNC),
      where('airtableOrderId', '==', airtableOrderId)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as OrderSync;

  } catch (error) {
    console.error('Error obteniendo sincronización de orden:', error);
    return null;
  }
};

// ===========================================
// ANÁLISIS Y REPORTES
// ===========================================

// Combinar datos de Firebase + Airtable para analytics
export const getHybridAnalytics = async () => {
  try {
    // Obtener datos de usuarios de Firebase
    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Obtener datos de órdenes sincronizadas
    const ordersSnapshot = await getDocs(collection(db, COLLECTIONS.ORDER_SYNC));
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Combinar datos para analytics
    const analytics = {
      totalUsers: users.length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      averageOrderValue: orders.length > 0 
        ? orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.length 
        : 0,
      ordersByStatus: orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      topCustomers: users
        .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
        .slice(0, 10)
        .map(user => ({
          userId: user.id,
          email: user.email,
          totalSpent: user.totalSpent || 0,
          totalOrders: user.totalOrders || 0
        }))
    };

    return analytics;

  } catch (error) {
    console.error('Error obteniendo analytics híbridos:', error);
    return null;
  }
};