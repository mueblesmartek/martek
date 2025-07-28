// src/components/react/ProductDetailActions.tsx - MIGRADO A useCartStorage
import React, { useState } from 'react';
import { useCartStorage } from '../../hooks/useCartStorage'; // ✅ CAMBIO: De CartContext a useCartStorage
import type { Product } from '../../lib/types';

interface ProductDetailActionsProps {
  product: Product;
}

export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  // ✅ CAMBIO: useCart → useCartStorage
  const { addItem } = useCartStorage();
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
      // ✅ CAMBIO: addToCart(product, quantity) → addItem(product, quantity)
      await addItem(product, quantity);
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

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    
    try {
      // ✅ CAMBIO: Agregar al carrito y luego redirigir
      await addItem(product, quantity);
      window.location.href = '/checkout';
    } catch (error) {
      console.error('Error in buy now:', error);
      // Redirigir de todas formas si hay error
      window.location.href = '/checkout';
    }
  };

  return (
    <div className="space-y-4">
      {/* Selector de cantidad */}
      {!isOutOfStock && (
        <div className="flex items-center space-x-4">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button 
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </button>
            
            <input 
              type="number" 
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              min="1" 
              max={maxQuantity}
              className="w-16 px-2 py-2 text-center border-0 focus:outline-none focus:ring-0"
            />
            
            <button 
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= maxQuantity}
              className="px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <span className="text-sm text-gray-500">máx {maxQuantity}</span>
        </div>
      )}
      
      {/* Botón principal de agregar al carrito */}
      <button 
        onClick={handleAddToCart}
        disabled={isAdding || isOutOfStock}
        className={`w-full py-4 px-6 rounded-lg font-medium transition-colors ${
          isOutOfStock
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : justAdded
            ? 'bg-green-600 text-white'
            : 'bg-gray-900 text-white hover:bg-gray-700'
        }`}
      >
        {isOutOfStock 
          ? '❌ Producto Agotado' 
          : justAdded 
          ? '✅ ¡Agregado al carrito!' 
          : isAdding 
          ? '⏳ Agregando...' 
          : '🛒 Agregar al Carrito'
        }
      </button>

      {/* Botón de comprar ahora */}
      {!isOutOfStock && (
        <button 
          onClick={handleBuyNow}
          disabled={isAdding}
          className="w-full border-2 border-red-600 text-gray-800 hover:bg-gray-900 hover:text-white py-4 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ⚡ Comprar Ahora
        </button>
      )}

      {/* Información adicional */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          🚚 Envío {product.price >= 100000 ? 'GRATIS' : '$15.000'}
        </p>
        <p className="text-xs text-gray-500">
          📦 Embalaje discreto garantizado
        </p>
      </div>
    </div>
  );
}