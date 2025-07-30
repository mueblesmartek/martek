// src/components/react/Cart.tsx - COMPONENTE ACTUALIZADO
import { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';

interface CartProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Cart({ isOpen, onClose, className = '' }: CartProps) {
  // ✅ USAR HOOK SIMPLIFICADO
  const { 
    items, 
    totalItems,
    totalPrice,
    isLoading,
    isReady,
    isEmpty,
    updateQuantity, 
    removeItem,
    formatPrice,
    clear
  } = useCart();

  // ✅ ESTADO LOCAL PARA APERTURA (si no se controla externamente)
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Determinar si usar prop o estado interno
  const cartIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  
  // ✅ FUNCIÓN PARA CERRAR
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  // ✅ ESCUCHAR EVENTOS GLOBALES (para botones del header)
  useEffect(() => {
    // Solo manejar eventos si no está controlado externamente
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

  // ✅ MANEJAR ACTUALIZACIÓN DE CANTIDAD
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  // ✅ MANEJAR ELIMINACIÓN DE ITEM
  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  // ✅ MANEJAR LIMPIAR CARRITO
  const handleClearCart = () => {
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      clear();
    }
  };

  // ✅ CALCULAR TOTALES
  const subtotal = totalPrice;
  const shipping = subtotal >= 100000 ? 0 : 15000;
  const tax = Math.round(subtotal * 0.19);
  const finalTotal = subtotal + shipping + tax;

  // No renderizar si está cerrado
  if (!cartIsOpen) return null;

  return (
    <>
      {/* ✅ OVERLAY */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* ✅ PANEL DEL CARRITO */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform ${className}`}>
        <div className="flex flex-col h-full">
          
          {/* ✅ HEADER */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Tu Carrito ({totalItems})
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Cerrar carrito"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ✅ CONTENIDO */}
          <div className="flex-1 overflow-hidden flex flex-col">
            
            {/* ✅ ESTADO DE CARGA */}
            {isLoading && !isReady && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando carrito...</p>
                </div>
              </div>
            )}

            {/* ✅ CARRITO VACÍO */}
            {isReady && isEmpty && (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l-2.5 5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Tu carrito está vacío</h3>
                  <p className="text-gray-600 mb-4">Agrega algunos productos para empezar</p>
                  <button
                    onClick={handleClose}
                    className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Seguir comprando
                  </button>
                </div>
              </div>
            )}

            {/* ✅ ITEMS DEL CARRITO */}
            {isReady && !isEmpty && (
              <>
                {/* Lista de productos */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                      
                      {/* Imagen */}
                      <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiM5OTk5OTkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEwIDEwaDIwYzEuMSAwIDIgLjkgMiAydjIwYzAgMS4xLS45IDItMiAySDE0Yy0xLjEgMC0yLS45LTItMlYxMmMwLTEuMS45LTIgMi0yem0xMCA4Yy0yLjIgMC00IDEuOC00IDRzMS44IDQgNCA0IDQtMS44IDQtNC0xLjgtNC00LTR6bTAgNmMtMS4xIDAtMi0uOS0yLTJzLjktMiAyLTIgMiAuOSAyIDItLjkgMi0yIDJ6Ii8+PC9zdmc+';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Información del producto */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">
                          {item.product_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatPrice(item.product_price)} c/u
                        </p>
                        {item.product_category && (
                          <p className="text-xs text-gray-500">
                            {item.product_category}
                          </p>
                        )}
                      </div>
                      
                      {/* Controles de cantidad */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <span className="text-lg">−</span>
                        </button>
                        
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-lg">+</span>
                        </button>
                      </div>
                      
                      {/* Botón eliminar */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        aria-label="Eliminar producto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* ✅ RESUMEN Y ACCIONES */}
                <div className="border-t border-gray-200 p-4 space-y-4">
                  
                  {/* Botón limpiar carrito */}
                  {items.length > 1 && (
                    <button
                      onClick={handleClearCart}
                      className="w-full text-red-600 hover:text-red-700 text-sm py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      🗑️ Vaciar carrito
                    </button>
                  )}

                  {/* Totales */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (19%)</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Envío</span>
                      <span className={shipping === 0 ? 'text-green-600' : ''}>
                        {shipping === 0 ? '¡Gratis!' : formatPrice(shipping)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatPrice(finalTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Beneficio de envío gratis */}
                  {shipping === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-800 text-sm font-medium flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        ✅ Envío gratis incluido
                      </p>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-blue-800 text-sm">
                        Agrega {formatPrice(100000 - subtotal)} más para envío gratis
                      </p>
                    </div>
                  )}

                  {/* Botones de acción */}
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

                  {/* Información de seguridad */}
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
      </div>
    </>
  );
}

// ✅ COMPONENTE WRAPPER PARA COMPATIBILIDAD GLOBAL
export function GlobalCart() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Eventos globales para abrir/cerrar carrito
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