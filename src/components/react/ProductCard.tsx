// src/components/react/ProductCard.tsx - ACTUALIZADO CON HOOK Y MÚLTIPLES IMÁGENES
import React, { useState, useCallback } from 'react';
import { useCartStorage } from '../../hooks/useCartStorage';
import { ProductImage } from './ProductImageGallery';
import { getPrimaryImageUrl, hasMultipleImages } from '../../lib/types';
import type { Product } from '../../lib/types';

interface ProductCardProps {
  product: Product;
  showQuickAdd?: boolean;
  showDescription?: boolean;
  variant?: 'grid' | 'list' | 'compact';
  className?: string;
}

export function ProductCard({ 
  product, 
  showQuickAdd = true, 
  showDescription = true,
  variant = 'grid',
  className = '' 
}: ProductCardProps) {
  
  // ✅ Usar el nuevo hook sin Context
  const { 
    addItem, 
    getItemByProductId, 
    isInCart, 
    getProductQuantity,
    isLoading: cartLoading 
  } = useCartStorage();
  
  const [isAdding, setIsAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);

  // ✅ Estados derivados
  const cartItem = getItemByProductId(product.id);
  const productInCart = isInCart(product.id);
  const cartQuantity = getProductQuantity(product.id);
  const primaryImageUrl = getPrimaryImageUrl(product);
  const hasMultiple = hasMultipleImages(product);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  // ✅ AGREGAR AL CARRITO
  const handleAddToCart = useCallback(async () => {
    if (isAdding || isOutOfStock) return;
    
    setIsAdding(true);
    try {
      await addItem(product, quantity);
      setQuantity(1); // Reset cantidad después de agregar
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  }, [addItem, product, quantity, isAdding, isOutOfStock]);

  // ✅ MANEJAR ERROR DE IMAGEN
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.currentTarget;
  if (!target.dataset.fallbackAttempted) {
    target.dataset.fallbackAttempted = 'true';
    target.src = 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#f9fafb"/>
        <rect x="75" y="75" width="50" height="50" fill="#e5e7eb" rx="4"/>
        <circle cx="90" cy="90" r="4" fill="#d1d5db"/>
        <path d="M80 110 L90 100 L100 110 L110 100 L120 120 L80 120 Z" fill="#d1d5db"/>
      </svg>
    `);
  }
};


  // ✅ RENDERIZADO SEGÚN VARIANTE
  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow ${className}`}>
        
        {/* Imagen pequeña */}
        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
          <img
            src={imageError ? '/images/placeholder-product.jpg' : primaryImageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
          {hasMultiple && (
            <div className="absolute top-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
              {product.images?.length || 1}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-gray-800 truncate">
            <a 
              href={`/producto/${product.slug || product.id}`}
              className="hover:text-gray-700 transition-colors"
            >
              {product.name}
            </a>
          </h3>
          <p className="text-lg font-bold text-gray-800">
            ${product.price.toLocaleString()}
          </p>
        </div>

        {/* Quick add */}
        {showQuickAdd && !isOutOfStock && (
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="px-3 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {isAdding ? '...' : productInCart ? `+${cartQuantity}` : '+'}
          </button>
        )}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`flex space-x-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow ${className}`}>
        
        {/* Imagen */}
        <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          <ProductImage 
            product={product}
            className="w-full h-full"
            showMultipleIndicator={true}
          />
        </div>

        {/* Info */}
        <div className="flex-1 space-y-2">
          
          {/* Header */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              {product.category}
            </p>
            <h3 className="font-medium text-gray-800">
              <a 
                href={`/producto/${product.slug || product.id}`}
                className="hover:text-gray-700 transition-colors"
              >
                {product.name}
              </a>
            </h3>
          </div>

          {/* Descripción */}
          {showDescription && product.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Precio y stock */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-800">
                ${product.price.toLocaleString()}
              </p>
              {isLowStock && (
                <p className="text-xs text-orange-600">Solo {product.stock} disponibles</p>
              )}
            </div>

            {showQuickAdd && (
              <div className="flex items-center space-x-2">
                {!isOutOfStock && (
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    {Array.from({ length: Math.min(product.stock, 10) }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                )}

                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || isOutOfStock}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isOutOfStock
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-700'
                  }`}
                >
                  {isOutOfStock ? 'Agotado' : isAdding ? 'Agregando...' : productInCart ? `En carrito (${cartQuantity})` : 'Agregar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ✅ VARIANTE GRID (DEFAULT)
  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group ${className}`}>
      
      {/* ✅ IMAGEN CON BADGES */}
      <div className="relative">
        <a href={`/producto/${product.slug || product.id}`}>
          <ProductImage 
            product={product}
            className="aspect-square"
            showMultipleIndicator={true}
          />
        </a>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-1">
          {isOutOfStock && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
              ❌ Agotado
            </span>
          )}
          {product.featured && !isOutOfStock && (
            <span className="bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded">
              ⭐ Destacado
            </span>
          )}
          {isLowStock && (
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded">
              ⚠️ Últimas {product.stock}
            </span>
          )}
        </div>

        {/* Quick view button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={`/producto/${product.slug || product.id}`}
            className="w-8 h-8 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-md transition-all"
            title="Vista rápida"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </a>
        </div>

        {/* Cart indicator */}
        {productInCart && (
          <div className="absolute bottom-3 right-3 w-6 h-6 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {cartQuantity}
          </div>
        )}
      </div>

      {/* ✅ INFORMACIÓN DEL PRODUCTO */}
      <div className="p-4 space-y-3">
        
        {/* Categoría */}
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
          {product.category}
        </p>

        {/* Nombre */}
        <h3 className="font-medium text-gray-800 line-clamp-2 leading-tight">
          <a 
            href={`/producto/${product.slug || product.id}`}
            className="hover:text-gray-700 transition-colors"
          >
            {product.name}
          </a>
        </h3>

        {/* Descripción */}
        {showDescription && product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Precio */}
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-gray-800">
            ${product.price.toLocaleString()}
          </p>
          
          {product.price >= 100000 && (
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
              🚚 Envío gratis
            </span>
          )}
        </div>

        {/* ✅ ACCIONES */}
        {showQuickAdd && (
          <div className="space-y-2">
            
            {/* Selector de cantidad (solo si no está agotado) */}
            {!isOutOfStock && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Cantidad:</span>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {Array.from({ length: Math.min(product.stock, 10) }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Botón principal */}
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={handleAddToCart}
                disabled={isAdding || isOutOfStock || cartLoading}
                className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : productInCart
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-900 text-white hover:bg-gray-700'
                }`}
              >
                {isAdding ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Agregando...</span>
                  </div>
                ) : isOutOfStock ? (
                  '❌ Agotado'
                ) : productInCart ? (
                  `✅ En carrito (${cartQuantity})`
                ) : (
                  '🛒 Agregar al carrito'
                )}
              </button>

              {/* Botón ver detalles */}
              <a
                href={`/producto/${product.slug || product.id}`}
                className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors text-center"
              >
                👁️ Ver detalles
              </a>
            </div>
          </div>
        )}

        {/* Stock info */}
        {isLowStock && (
          <div className="bg-orange-50 border border-orange-200 rounded p-2">
            <p className="text-xs text-orange-700 font-medium">
              ⏰ ¡Últimas {product.stock} unidades disponibles!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}