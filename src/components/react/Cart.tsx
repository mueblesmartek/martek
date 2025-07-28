// src/components/react/Cart.tsx - COMPONENTE UI LIMPIO
import React from 'react';
import { useCart } from '../../stores/CartContext';

export function Cart() {
  const { items, total, itemCount, isOpen, toggleCart, removeFromCart, updateQuantity } = useCart();

  if (!isOpen) return null;

  const subtotal = total;
  const shipping = subtotal >= 100000 ? 0 : 15000; // Envío gratis sobre $100k
  const finalTotal = subtotal + shipping;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={toggleCart}
      />
      
      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Carrito ({itemCount})
          </h2>
          <button
            onClick={toggleCart}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          
          {/* Items o Empty State */}
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tu carrito está vacío</h3>
              <p className="text-gray-500 mb-6">Agrega productos increíbles y comienza a disfrutar</p>
              <button
                onClick={toggleCart}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-[#d6042a] transition-colors"
              >
                Continuar Comprando
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    
                    {/* Image */}
                    <img
                      src={item.product_image || '/images/placeholder-product.jpg'}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                    />
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {item.product_name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.product_category}
                      </p>
                      <p className="text-sm font-bold text-[#f20530] mt-1">
                        ${item.product_price.toLocaleString('es-CO')}
                      </p>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Summary & Checkout */}
              <div className="border-t border-gray-200 p-6 space-y-4">
                
                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Envío</span>
                    <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                      {shipping === 0 ? '¡Gratis!' : `$${shipping.toLocaleString('es-CO')}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-gray-500">
                      Envío gratis en compras superiores a $100,000
                    </p>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                    <span>Total</span>
                    <span>${finalTotal.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => window.location.href = '/checkout'}
                  className="w-full bg-gray-900 text-white py-4 rounded-lg font-bold text-lg hover:bg-[#d6042a] transition-colors"
                >
                  Proceder al Checkout
                </button>
                
                {/* Continue Shopping */}
                <button
                  onClick={toggleCart}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Continuar Comprando
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}