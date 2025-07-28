// src/components/react/CheckoutSummary.tsx - MIGRADO A useCartStorage
import React, { useState } from 'react';
import { useCartStorage } from '../../hooks/useCartStorage'; // ✅ CAMBIO: De CartContext a useCartStorage

interface CheckoutSummaryProps {
  // ✅ CAMBIO: En vez de depender de CheckoutContext, recibir datos como props
  customerName?: string;
  customerAddress?: string;
  paymentMethod?: string;
  currentStep?: number;
  className?: string;
}

export function CheckoutSummary({ 
  customerName,
  customerAddress,
  paymentMethod,
  currentStep = 1,
  className = ''
}: CheckoutSummaryProps) {
  // ✅ CAMBIO: useCart → useCartStorage
  const { items, total, itemCount } = useCartStorage();
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // ✅ CÁLCULOS LOCALES (antes dependían de Context)
  const subtotal = items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
  const shipping = subtotal >= 100000 ? 0 : 15000; // Free shipping over 100k
  const tax = subtotal * 0.19; // 19% IVA in Colombia
  const couponDiscount = appliedCoupon ? (subtotal * appliedCoupon.discount / 100) : 0;
  const orderTotal = subtotal + shipping + tax - couponDiscount;

  // ✅ VALIDACIÓN DE CUPONES (Lógica local)
  const validateCoupon = (code: string) => {
    const validCoupons = {
      'WELCOME10': { discount: 10, description: '10% de descuento para nuevos clientes' },
      'SAVE15': { discount: 15, description: '15% de descuento' },
      'FREESHIPING': { discount: 0, description: 'Envío gratis', freeShipping: true }
    };

    return validCoupons[code.toUpperCase() as keyof typeof validCoupons] || null;
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError('Ingresa un código de cupón');
      return;
    }

    const coupon = validateCoupon(couponCode.trim());
    if (coupon) {
      setAppliedCoupon({
        code: couponCode.toUpperCase(),
        discount: coupon.discount
      });
      setCouponError('');
      setCouponCode('');
    } else {
      setCouponError('Código de cupón inválido');
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  // ✅ ESTADO DE CARRITO VACÍO
  if (items.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen del Pedido</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M20 13h4v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6h4" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Tu carrito está vacío</p>
          <a 
            href="/productos" 
            className="inline-block mt-4 text-gray-800 underline text-sm hover:text-gray-700"
          >
            Continuar comprando
          </a>
        </div>
      </div>
    );
  }

  // ✅ COMPONENTE PRINCIPAL
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Resumen del Pedido ({itemCount} {itemCount === 1 ? 'producto' : 'productos'})
      </h3>
      
      {/* ✅ LISTA DE PRODUCTOS */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-3">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
              <img
                src={item.product_image || '/images/placeholder.jpg'}
                alt={item.product_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiM5OTk5OTkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEwIDEwaDQ0djQ0SDEweiIgZmlsbD0iI2Y5ZmFmYiIvPjxwYXRoIGQ9Ik0yMCAyMGgyNHYyNEgyMHoiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=';
                }}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-800 text-sm truncate">
                {item.product_name}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                {item.product_category}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-600">
                  Cantidad: {item.quantity}
                </span>
                <span className="text-sm font-bold text-gray-800">
                  ${(item.product_price * item.quantity).toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ CÓDIGO DE CUPÓN */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Código de cupón
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Ingresa tu código"
            disabled={!!appliedCoupon}
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={!!appliedCoupon}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Aplicar
          </button>
        </div>
        
        {couponError && (
          <p className="mt-2 text-sm text-red-600">{couponError}</p>
        )}
        
        {appliedCoupon && (
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-green-600 font-medium">
              ✅ Cupón {appliedCoupon.code} aplicado
            </span>
            <button
              type="button"
              onClick={removeCoupon}
              className="text-red-600 hover:text-red-700 underline"
            >
              Remover
            </button>
          </div>
        )}
      </div>

      {/* ✅ DESGLOSE DE COSTOS */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">${subtotal.toLocaleString('es-CO')}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Envío</span>
          <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
            {shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-CO')}`}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">IVA (19%)</span>
          <span className="font-medium">${tax.toLocaleString('es-CO')}</span>
        </div>
        
        {appliedCoupon && appliedCoupon.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Descuento ({appliedCoupon.discount}%)</span>
            <span className="font-medium text-green-600">
              -${couponDiscount.toLocaleString('es-CO')}
            </span>
          </div>
        )}
        
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${orderTotal.toLocaleString('es-CO')}</span>
          </div>
        </div>
      </div>

      {/* ✅ INFORMACIÓN ADICIONAL SEGÚN EL PASO */}
      {currentStep >= 2 && customerName && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Información de envío</h4>
          <p className="text-sm text-gray-600">{customerName}</p>
          {customerAddress && (
            <p className="text-xs text-gray-500 mt-1">{customerAddress}</p>
          )}
        </div>
      )}

      {currentStep >= 3 && paymentMethod && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Método de pago</h4>
          <p className="text-sm text-gray-600">
            {paymentMethod === 'card' ? '💳 Tarjeta de Crédito/Débito' : 
             paymentMethod === 'pse' ? '🏦 PSE' : 
             '📱 Nequi'}
          </p>
        </div>
      )}

      {/* ✅ INFORMACIÓN DE ENVÍO */}
      <div className="text-center space-y-2 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          📦 Embalaje discreto garantizado
        </p>
        <p className="text-xs text-gray-500">
          🚚 Entrega estimada: 2-5 días hábiles
        </p>
        {shipping === 0 && (
          <p className="text-xs text-green-600 font-medium">
            ✅ Envío gratis por compra superior a $100.000
          </p>
        )}
      </div>
    </div>
  );
}