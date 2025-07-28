// src/components/react/Cart.tsx - MIGRADO A useCartStorage
import React, { useState, useEffect } from 'react';
import { useCartStorage } from '../../hooks/useCartStorage'; // ✅ CAMBIO: De CartContext a useCartStorage

interface CartProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Cart({ isOpen = false, onClose, className = '' }: CartProps) {
  // ✅ CAMBIO: useCart → useCartStorage (FUNCIÓN CORRECTA)
  const { 
    items, 
    total, 
    itemCount, 
    removeItem, 
    updateQuantity,  // ✅ CORREGIDO: era updateItemQuantity
    isLoading 
  } = useCartStorage();

  // ✅ MANEJAR ESTADO DE APERTURA LOCALMENTE (si no se pasa como prop)
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Usar prop isOpen si se proporciona, sino usar estado interno
  const cartIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  
  // Función para cerrar carrito
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  // ✅ FUNCIÓN PARA ABRIR CARRITO (disponible globalmente)
  const handleOpen = () => {
    if (isOpen === undefined) {
      setInternalIsOpen(true);
    }
  };

  // ✅ HACER FUNCIONES DISPONIBLES GLOBALMENTE VIA EVENTOS
  useEffect(() => {
    // Solo si no se está controlando externamente
    if (isOpen === undefined) {
      const handleCartOpen = () => setInternalIsOpen(true);
      const handleCartClose = () => setInternalIsOpen(false);
      const handleCartToggle = () => setInternalIsOpen(prev => !prev);
      
      window.addEventListener('cart-open', handleCartOpen);
      window.addEventListener('cart-close', handleCartClose);
      window.addEventListener('cart-toggle', handleCartToggle);
    
      return () => {
        window.removeEventListener('cart-open', handleCartOpen);
        window.removeEventListener('cart-close', handleCartClose);
        window.removeEventListener('cart-toggle', handleCartToggle);
      };
    }
  }, [isOpen]);

  // ✅ ESCUCHAR EVENTOS DE CARRITO (ya no usar funciones globales inexistentes)
  useEffect(() => {
    const handleCartOpen = () => {
      if (isOpen === undefined) {
        setInternalIsOpen(true);
      }
    };

    const handleCartToggle = () => {
      if (isOpen === undefined) {
        setInternalIsOpen(prev => !prev);
      }
    };

    window.addEventListener('cart-open', handleCartOpen);
    window.addEventListener('cart-toggle', handleCartToggle);

    return () => {
      window.removeEventListener('cart-open', handleCartOpen);
      window.removeEventListener('cart-toggle', handleCartToggle);
    };
  }, [isOpen]);

  // ✅ MANEJAR ACTUALIZACIÓN DE CANTIDAD (CORREGIDO)
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(itemId);
    } else {
      // ✅ CORREGIDO: usar productId en lugar de itemId
      const item = items.find(item => item.id === itemId);
      if (item) {
        await updateQuantity(item.product_id, newQuantity);
      }
    }
  };

  // ✅ MANEJAR ELIMINACIÓN DE ITEM (CORREGIDO)
  const handleRemoveItem = async (itemId: string) => {
    // ✅ CORREGIDO: removeItem espera productId, no itemId
    const item = items.find(item => item.id === itemId);
    if (item) {
      await removeItem(item.product_id);
    }
  };

  // No renderizar si está cerrado
  if (!cartIsOpen) return null;

  const subtotal = total;
  const shipping = subtotal >= 100000 ? 0 : 15000; // Envío gratis sobre $100k
  const finalTotal = subtotal + shipping;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />
      
      {/* Cart Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ${className}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Carrito ({itemCount})
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar carrito"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          
          {/* Loading state */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Cargando carrito...</p>
              </div>
            </div>
          )}
          
          {/* Items o Empty State */}
          {!isLoading && items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Tu carrito está vacío</h3>
              <p className="text-gray-500 mb-6">Agrega productos increíbles y comienza a disfrutar</p>
              <button
                onClick={handleClose}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Continuar Comprando
              </button>
            </div>
          ) : !isLoading && (
            <>
              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    
                    {/* Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.product_image || '/images/placeholder-product.jpg'}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiM5OTk5OTkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTggOGg0OHY0OEg4eiIgZmlsbD0iI2Y5ZmFmYiIvPjxwYXRoIGQ9Ik0yMCAyMGgyOHYyOEgyMHoiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=';
                        }}
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 text-sm truncate">
                        {item.product_name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.product_category}
                      </p>
                      <p className="text-sm font-bold text-gray-800 mt-1">
                        ${item.product_price.toLocaleString('es-CO')}
                      </p>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                        aria-label="Disminuir cantidad"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                        aria-label="Aumentar cantidad"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Eliminar producto"
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
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${subtotal.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                      {shipping === 0 ? '¡Gratis!' : `$${shipping.toLocaleString('es-CO')}`}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${finalTotal.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Benefits */}
                {shipping === 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      ✓ Envío gratis incluido
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 text-sm">
                      Agrega ${(100000 - subtotal).toLocaleString('es-CO')} más para envío gratis
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <a 
                    href="/checkout" 
                    onClick={handleClose}
                    className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors text-center block font-medium"
                  >
                    Proceder al Checkout
                  </a>
                  
                  <button
                    onClick={handleClose}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Seguir comprando
                  </button>
                </div>

                {/* Security Info */}
                <div className="text-center pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    🔒 Compra 100% segura y discreta
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ✅ COMPONENTE WRAPPER PARA COMPATIBILIDAD CON .astro (CORREGIDO)
export function GlobalCart() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Eventos para abrir/cerrar carrito (sin funciones globales)
    const handleCartOpen = () => setIsOpen(true);
    const handleCartClose = () => setIsOpen(false);
    const handleCartToggle = () => setIsOpen(prev => !prev);

    window.addEventListener('cart-open', handleCartOpen);
    window.addEventListener('cart-close', handleCartClose);
    window.addEventListener('cart-toggle', handleCartToggle);

    return () => {
      window.removeEventListener('cart-open', handleCartOpen);
      window.removeEventListener('cart-close', handleCartClose);
      window.removeEventListener('cart-toggle', handleCartToggle);
    };
  }, []);

  return <Cart isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}