// src/components/react/ProductCard.tsx - COMPONENTE CORRECTO
import React from 'react';
import type { Product } from '../../lib/types';
import { getPrimaryImageUrl } from '../../lib/types';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export function ProductCard({ product, variant = 'default', className = '' }: ProductCardProps) {
  const primaryImage = getPrimaryImageUrl(product);
  
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const isOutOfStock = !product.is_active || product.stock <= 0;

  return (
    <article className={`group text-center ${className}`}>
      <a href={`/producto/${product.slug}`} className="block space-y-4">
        
        {/* Imagen */}
        <div className="aspect-square bg-white border border-gray-100 overflow-hidden rounded-lg relative">
          {primaryImage ? (
            <img 
              src={primaryImage} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Featured badge */}
          {product.featured && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
              Destacado
            </div>
          )}
          
          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-medium">Agotado</span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-800 group-hover:text-red-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
          
          <div className="space-y-1">
            <p className="text-lg font-semibold text-red-600">
              {formatPrice(product.price)}
            </p>
            
            {product.category && (
              <p className="text-sm text-gray-500 capitalize">
                {product.category}
              </p>
            )}
            
            {/* Stock info */}
            <div className="text-xs text-gray-400">
              {isOutOfStock ? (
                <span className="text-red-500">Sin stock</span>
              ) : product.stock <= 5 ? (
                <span className="text-amber-500">¡Últimas {product.stock} unidades!</span>
              ) : (
                <span>Disponible</span>
              )}
            </div>
          </div>
        </div>
      </a>
      
      {/* Quick add to cart button (optional) */}
      {!isOutOfStock && (
        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => {
              e.preventDefault();
              // Aquí puedes agregar la funcionalidad de agregar al carrito
              if (window.addProductToCart) {
                window.addProductToCart(
                  product.id,
                  product.name,
                  product.price,
                  primaryImage || '',
                  product.category || ''
                );
              }
            }}
            className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors text-sm"
          >
            Agregar al carrito
          </button>
        </div>
      )}
    </article>
  );
}

// Export default también para compatibilidad
export default ProductCard;