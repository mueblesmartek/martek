// src/components/react/UserOrders.tsx
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Order, OrderItem } from '../../lib/types';

// Inicializar Supabase
const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL || '',
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY || ''
);

interface SearchFormData {
  email: string;
  orderNumber: string;
}

export function UserOrders() {
  const [searchData, setSearchData] = useState<SearchFormData>({
    email: '',
    orderNumber: ''
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearched, setIsSearched] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string>('');

  // ✅ BUSCAR PEDIDOS POR EMAIL O NÚMERO DE ORDEN
  const searchOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchData.email.trim() && !searchData.orderNumber.trim()) {
      setError('Ingresa tu email o número de pedido');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      let query = supabase.from('orders').select('*');
      
      // Buscar por número de orden (exacto)
      if (searchData.orderNumber.trim()) {
        query = query.eq('order_number', searchData.orderNumber.trim());
      } 
      // Buscar por email en shipping_address
      else if (searchData.email.trim()) {
        // Como shipping_address es JSONB, necesitamos usar una función SQL
        query = query.contains('shipping_address', { email: searchData.email.trim() });
      }

      const { data, error: fetchError } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        console.error('Error fetching orders:', fetchError);
        setError('Error buscando pedidos. Intenta nuevamente.');
        return;
      }

      setOrders(data || []);
      setIsSearched(true);
      
      if (!data || data.length === 0) {
        setError(searchData.orderNumber.trim() 
          ? `No encontramos el pedido ${searchData.orderNumber.trim()}`
          : `No encontramos pedidos para ${searchData.email.trim()}`
        );
      }

    } catch (err) {
      console.error('Search error:', err);
      setError('Error buscando pedidos. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ OBTENER COLOR Y TEXTO DEL ESTADO
  const getOrderStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { 
          label: 'Pendiente', 
          className: 'bg-gray-100 text-gray-800 border-gray-200' 
        };
      case 'processing':
        return { 
          label: 'Procesando', 
          className: 'bg-gray-800 text-white border-gray-700' 
        };
      case 'shipped':
        return { 
          label: 'Enviado', 
          className: 'bg-gray-600 text-white border-gray-500' 
        };
      case 'delivered':
        return { 
          label: 'Entregado', 
          className: 'bg-gray-900 text-white border-gray-600' 
        };
      case 'cancelled':
        return { 
          label: 'Cancelado', 
          className: 'bg-gray-200 text-gray-700 border-gray-300' 
        };
      default:
        return { 
          label: status, 
          className: 'bg-gray-100 text-gray-800 border-gray-200' 
        };
    }
  };

  // ✅ OBTENER COLOR Y TEXTO DEL ESTADO DE PAGO
  const getPaymentStatusInfo = (paymentStatus: string) => {
    switch (paymentStatus.toLowerCase()) {
      case 'pending':
        return { 
          label: 'Pendiente', 
          className: 'bg-gray-100 text-gray-800' 
        };
      case 'completed':
      case 'paid':
        return { 
          label: 'Pagado', 
          className: 'bg-gray-800 text-white' 
        };
      case 'failed':
        return { 
          label: 'Falló', 
          className: 'bg-gray-200 text-gray-700' 
        };
      case 'refunded':
        return { 
          label: 'Reembolsado', 
          className: 'bg-gray-300 text-gray-800' 
        };
      default:
        return { 
          label: paymentStatus, 
          className: 'bg-gray-100 text-gray-800' 
        };
    }
  };

  // ✅ FORMATEAR FECHA
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ FORMATEAR PRECIO
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // ✅ LIMPIAR BÚSQUEDA
  const clearSearch = () => {
    setSearchData({ email: '', orderNumber: '' });
    setOrders([]);
    setIsSearched(false);
    setError('');
    setSelectedOrder(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* ✅ FORMULARIO DE BÚSQUEDA */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Buscar mis pedidos
        </h2>
        
        <form onSubmit={searchOrders} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email usado en la compra
              </label>
              <input
                type="email"
                value={searchData.email}
                onChange={(e) => setSearchData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="tu@email.com"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                O número de pedido
              </label>
              <input
                type="text"
                value={searchData.orderNumber}
                onChange={(e) => setSearchData(prev => ({ ...prev, orderNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="KS-123456AB"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || (!searchData.email.trim() && !searchData.orderNumber.trim())}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Buscando...' : 'Buscar pedidos'}
            </button>
            
            {isSearched && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Nueva búsqueda
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ✅ LISTA DE PEDIDOS */}
      {isSearched && !selectedOrder && (
        <div className="space-y-4">
          {orders.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Tus pedidos ({orders.length})
                </h3>
              </div>
              
              {orders.map((order) => {
                const statusInfo = getOrderStatusInfo(order.status);
                const paymentInfo = getPaymentStatusInfo(order.payment_status);
                
                return (
                  <div key={order.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">
                          Pedido #{order.order_number}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-2 md:mt-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${paymentInfo.className}`}>
                          {paymentInfo.label}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Total</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Método de pago</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {order.payment_method || 'No especificado'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Items</p>
                        <p className="text-sm text-gray-600">
                          {Array.isArray(order.items) ? order.items.length : 'N/A'} productos
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Ver detalles
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="bg-white rounded-lg border p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No encontramos pedidos
              </h3>
              <p className="text-gray-600">
                Verifica que el email o número de pedido sean correctos
              </p>
            </div>
          )}
        </div>
      )}

      {/* ✅ DETALLE DEL PEDIDO */}
      {selectedOrder && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Detalles del Pedido #{selectedOrder.order_number}
            </h3>
            <button
              onClick={() => setSelectedOrder(null)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Información de la orden */}
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Información del pedido</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="text-gray-800">{formatDate(selectedOrder.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getOrderStatusInfo(selectedOrder.status).className}`}>
                      {getOrderStatusInfo(selectedOrder.status).label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pago:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusInfo(selectedOrder.payment_status).className}`}>
                      {getPaymentStatusInfo(selectedOrder.payment_status).label}
                    </span>
                  </div>
                  {selectedOrder.payment_method && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Método de pago:</span>
                      <span className="text-gray-800 capitalize">{selectedOrder.payment_method}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dirección de envío */}
              {selectedOrder.shipping_address && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Dirección de envío</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium text-gray-800">{selectedOrder.shipping_address.full_name}</p>
                    <p>{selectedOrder.shipping_address.address}</p>
                    {selectedOrder.shipping_address.address_line2 && (
                      <p>{selectedOrder.shipping_address.address_line2}</p>
                    )}
                    <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}</p>
                    <p>{selectedOrder.shipping_address.postal_code}</p>
                    <p>{selectedOrder.shipping_address.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Items y totales */}
            <div className="space-y-6">
              
              {/* Productos */}
              {selectedOrder.items && Array.isArray(selectedOrder.items) && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Productos</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item: OrderItem, index: number) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{item.product_name}</p>
                          <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                          <p className="text-sm text-gray-600">{formatPrice(item.product_price)} c/u</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-800">
                            {formatPrice(item.subtotal || (item.product_price * item.quantity))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totales */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-3">Resumen</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-800">{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.shipping_cost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Envío:</span>
                      <span className="text-gray-800">{formatPrice(selectedOrder.shipping_cost)}</span>
                    </div>
                  )}
                  {selectedOrder.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">IVA:</span>
                      <span className="text-gray-800">{formatPrice(selectedOrder.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span className="text-gray-800">Total:</span>
                    <span className="text-gray-800">{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {selectedOrder.customer_notes && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Notas del pedido</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedOrder.customer_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="mt-8 pt-6 border-t flex gap-4">
            <button
              onClick={() => setSelectedOrder(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Volver a la lista
            </button>
            
            {selectedOrder.order_number && (
              <a
                href={`mailto:soporte@mueblesmartek.com?subject=Consulta sobre pedido ${selectedOrder.order_number}`}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Contactar soporte
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}