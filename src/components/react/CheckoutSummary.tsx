// src/components/react/CheckoutSummary.tsx
import React, { useState } from 'react';
import { useCart } from '../../stores/CartContext';
import { useCheckout } from '../../stores/CheckoutContext';

export function CheckoutSummary() {
  const { items } = useCart();
  const { 
    formData, 
    currentStep, 
    getDisplayName, 
    getDisplayAddress, 
    getDisplayPaymentMethod 
  } = useCheckout();
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
  const shipping = subtotal >= 100000 ? 0 : 15000; // Free shipping over 100k
  const tax = subtotal * 0.19; // 19% IVA in Colombia
  const couponDiscount = appliedCoupon ? (subtotal * appliedCoupon.discount / 100) : 0;
  const orderTotal = subtotal + shipping + tax - couponDiscount;

  // Mock coupon validation
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

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Pedido</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M20 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2-2" />
            </svg>
          </div>
          <p className="text-gray-600">Tu carrito está vacío</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Resumen del Pedido</h3>
      
      {/* Customer Information */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Información del Cliente
        </h4>
        
        <div className="space-y-2 text-sm">
          {/* Contact Info */}
          {getDisplayName() && (
            <div className="flex justify-between">
              <span className="text-gray-600">Nombre:</span>
              <span className="font-medium text-gray-900">{getDisplayName()}</span>
            </div>
          )}
          
          {formData.email && (
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{formData.email}</span>
            </div>
          )}
          
          {formData.phone && (
            <div className="flex justify-between">
              <span className="text-gray-600">Teléfono:</span>
              <span className="font-medium text-gray-900">{formData.phone}</span>
            </div>
          )}
          
          {/* Shipping Address */}
          {getDisplayAddress() && (
            <>
              <div className="border-t border-gray-200 pt-2 mt-3">
                <span className="text-gray-600 font-medium">Dirección de envío:</span>
              </div>
              <div className="text-gray-900">
                {getDisplayAddress()}
              </div>
            </>
          )}
          
          {/* Payment Method */}
          {getDisplayPaymentMethod() && currentStep >= 3 && (
            <>
              <div className="border-t border-gray-200 pt-2 mt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Método de pago:</span>
                  <span className="font-medium text-gray-900">{getDisplayPaymentMethod()}</span>
                </div>
              </div>
            </>
          )}
          
          {/* Empty state when no info yet */}
          {!getDisplayName() && !formData.email && !formData.phone && (
            <div className="text-center py-4">
              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-xs">Completa tu información para verla aquí</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Order Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
              <img
                src={item.product_image || '/images/placeholder-product.jpg'}
                alt={item.product_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder-product.jpg';
                }}
              />
              <div className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {item.quantity}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                {item.product_name}
              </h4>
              <p className="text-xs text-gray-500 capitalize">
                {item.product_category}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">
                  ${item.product_price.toLocaleString('es-CO')} × {item.quantity}
                </span>
                <span className="font-semibold text-gray-900">
                  ${(item.product_price * item.quantity).toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon Code Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Código de descuento</h4>
        
        {!appliedCoupon ? (
          <>
            <div className="flex space-x-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setCouponError('');
                }}
                placeholder="Ingresa tu código"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-4 py-2 bg-primary-500 text-white rounded-md text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                Aplicar
              </button>
            </div>
            {couponError && (
              <p className="text-red-500 text-xs mt-2">{couponError}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              ¿Tienes un código de descuento? Ingrésalo aquí
            </p>
          </>
        ) : (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-800">
                {appliedCoupon.code} aplicado
              </span>
            </div>
            <button
              onClick={removeCoupon}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remover
            </button>
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="space-y-3 pb-4 border-b border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal ({items.length} productos)</span>
          <span className="font-medium">${subtotal.toLocaleString('es-CO')}</span>
        </div>
        
        {appliedCoupon && appliedCoupon.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Descuento ({appliedCoupon.code})</span>
            <span className="font-medium text-green-600">
              -${couponDiscount.toLocaleString('es-CO')}
            </span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Envío</span>
          <span className="font-medium">
            {shipping === 0 ? (
              <span className="text-green-600">Gratis</span>
            ) : (
              `$${shipping.toLocaleString('es-CO')}`
            )}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">IVA (19%)</span>
          <span className="font-medium">${tax.toLocaleString('es-CO')}</span>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-4 mb-6">
        <span>Total</span>
        <span className="text-primary-600">${orderTotal.toLocaleString('es-CO')}</span>
      </div>

      {/* Shipping Notice */}
      <div className="mb-6">
        {subtotal >= 100000 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-green-800 font-medium">
              🎉 ¡Envío gratis incluido!
            </span>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-800">
              Agrega ${(100000 - subtotal).toLocaleString('es-CO')} más para envío gratis
            </span>
          </div>
        )}
      </div>

      {/* Security Badges */}
      <div className="space-y-3 text-xs text-gray-500">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Pago 100% seguro</span>
        </div>
        
        <div className="flex items-center">
          <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>Envío discreto garantizado</span>
        </div>
        
        <div className="flex items-center">
          <svg className="w-4 h-4 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Garantía de satisfacción</span>
        </div>
      </div>
    </div>
  );
}