// src/components/react/ProductDetailActions.tsx - COMPONENTE FUNCIONAL
import React, { useState } from 'react';
import { useCart } from '../../stores/CartContext';
import type { Product } from '../../lib/types';

interface ProductDetailActionsProps {
  product: Product;
}

export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const isOutOfStock = !product.is_active || product.stock <= 0;
  const maxQuantity = Math.min(product.stock, 10); // Límite de 10 por compra

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (isAdding || isOutOfStock) return;

    setIsAdding(true);
    
    try {
      addToCart(product, quantity);
      setJustAdded(true);
      
      // Reset estado después de 2 segundos
      setTimeout(() => {
        setJustAdded(false);
        setIsAdding(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      setIsAdding(false);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    
    // Agregar al carrito y redirigir a checkout
    addToCart(product, quantity);
    window.location.href = '/checkout';
  };

  return (
    <div className="space-y-8">
      
      {/* Selector de Cantidad */}
      {!isOutOfStock && (
        <div className="space-y-4">
          <label htmlFor="quantity" className="block text-lg font-bold text-gray-900">
            Cantidad
          </label>
          <div className="flex items-center space-x-4">
            
            {/* Botón Decrementar */}
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-primary-500 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            {/* Input de Cantidad */}
            <div className="relative">
              <input
                type="number"
                id="quantity"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="w-24 text-center text-xl font-bold border-2 border-gray-300 rounded-xl py-3 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
            </div>
            
            {/* Botón Incrementar */}
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= maxQuantity}
              className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-primary-500 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            
            <div className="ml-4">
              <span className="text-sm text-gray-500">
                Máximo: {maxQuantity}
              </span>
            </div>
          </div>
          
          {/* Total Price */}
          <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-700">Total:</span>
              <span className="text-2xl font-bold text-primary-600">
                ${(product.price * quantity).toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="space-y-4">
        {isOutOfStock ? (
          <div className="space-y-4">
            {/* Botón Agotado */}
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 py-4 px-6 rounded-2xl font-bold text-lg cursor-not-allowed"
            >
              ❌ Producto Agotado
            </button>
            
            {/* Notificar Disponibilidad */}
            <button className="w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-2xl font-bold hover:bg-gray-50 transition-colors">
              🔔 Notificarme cuando esté disponible
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Botón Agregar al Carrito */}
            <button
              onClick={handleAddToCart}
              disabled={isAdding || justAdded}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
                justAdded
                  ? 'bg-green-500 text-white transform scale-105 shadow-lg'
                  : isAdding
                  ? 'bg-primary-400 text-white cursor-wait'
                  : 'bg-primary-500 hover:bg-primary-600 text-white hover:scale-105 hover:shadow-xl'
              }`}
            >
              {justAdded ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>¡Agregado al Carrito! ✅</span>
                </div>
              ) : isAdding ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Agregando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M20 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2-2" />
                  </svg>
                  <span>🛒 Agregar al Carrito</span>
                </div>
              )}
            </button>
            
            {/* Botón Comprar Ahora */}
            <button
              onClick={handleBuyNow}
              className="w-full border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>⚡ Comprar Ahora</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Acciones Adicionales */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        
        {/* Lista de Deseos */}
        <button className="flex items-center space-x-2 text-gray-600 hover:text-primary-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="font-medium">Favoritos</span>
        </button>
        
        {/* Compartir */}
        <button 
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: product.name,
                text: `Mira este increíble producto: ${product.name}`,
                url: window.location.href
              });
            } else {
              // Fallback: copiar al portapapeles
              navigator.clipboard.writeText(window.location.href);
              alert('¡Enlace copiado al portapapeles!');
            }
          }}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          <span className="font-medium">Compartir</span>
        </button>
      </div>

      {/* Badges de Confianza */}
      <div className="bg-gray-50 rounded-2xl p-6 space-y-3 border border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span><strong>Pago 100% seguro</strong> - Transacciones encriptadas</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-700">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <span><strong>Envío discreto</strong> - Paquete neutro en 24-48h</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-700">
          <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <span><strong>Garantía total</strong> - 30 días para devoluciones</span>
        </div>
      </div>

      {/* Advertencia de Stock Bajo */}
      {product.stock <= 5 && product.stock > 0 && (
        <div className="bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-200 rounded-2xl p-6 animate-pulse">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-orange-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-bold text-orange-800">🔥 ¡Pocas unidades disponibles!</p>
              <p className="text-orange-700">Solo quedan <strong>{product.stock} unidades</strong> en stock</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}