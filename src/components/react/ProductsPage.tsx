// src/components/react/ProductsPage.tsx - EL CEREBRO REACT
import React, { useState, useEffect, useMemo } from 'react';
import type { Product } from '../../lib/types';

interface ProductsPageProps {
  products: Product[];
  initialSearchQuery: string;
}

export function ProductsPage({ products, initialSearchQuery }: ProductsPageProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'name'>('featured');
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);

  // Filtrar y ordenar productos
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
      );
    }

    // Filtro de stock
    if (showOnlyInStock) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name': return a.name.localeCompare(b.name);
        case 'featured':
        default:
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [products, searchQuery, sortBy, showOnlyInStock]);

  // Manejar búsqueda
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('q') as string;
    setSearchQuery(query);
    
    // Actualizar URL sin recargar
    const url = new URL(window.location.href);
    if (query.trim()) {
      url.searchParams.set('q', query);
    } else {
      url.searchParams.delete('q');
    }
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <div>
      
      {/* Barra de búsqueda y filtros */}
      <section className="bg-gray-50 py-8">
        <div className="container">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Búsqueda */}
            <form onSubmit={handleSearch} className="max-w-md mx-auto">
              <div className="flex">
                <input 
                  type="text" 
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Buscar productos..."
                  className="flex-1 px-4 py-3 border border-gray-200 bg-white focus:border-gray-400 focus:outline-none"
                />
                <button 
                  type="submit"
                  className="px-6 py-3 bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Ordenamiento */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                >
                  <option value="featured">Destacados</option>
                  <option value="price-low">Precio: menor a mayor</option>
                  <option value="price-high">Precio: mayor a menor</option>
                  <option value="name">Nombre A-Z</option>
                </select>
              </div>

              {/* Filtro de stock */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showOnlyInStock}
                  onChange={(e) => setShowOnlyInStock(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Solo en stock</span>
              </label>
            </div>

            {/* Resultados counter */}
            <div className="text-center">
              <span className="inline-block px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded">
                {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} 
                {searchQuery && ` para "${searchQuery}"`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Productos */}
      <section className="py-12">
        <div className="container">
          
          {/* Estado vacío */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto space-y-8">
                
                <div className="w-20 h-20 border border-gray-200 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-2xl font-light text-gray-900">
                    {searchQuery ? 'Sin resultados' : 'Sin productos'}
                  </h2>
                  <p className="text-gray-500">
                    {searchQuery 
                      ? `No encontramos productos para "${searchQuery}"`
                      : 'Pronto tendremos productos disponibles'
                    }
                  </p>
                </div>
                
                {/* Botones de acción */}
                <div className="space-y-3">
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        window.history.replaceState({}, '', '/productos');
                      }}
                      className="block mx-auto border border-gray-300 px-6 py-2 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all"
                    >
                      Ver todos los productos
                    </button>
                  )}
                  <a 
                    href="/" 
                    className="block mx-auto border border-gray-300 px-6 py-2 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all"
                  >
                    Volver al inicio
                  </a>
                </div>
              </div>
            </div>
          ) : (
            
            /* Grid de productos */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Componente de tarjeta de producto
function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group text-center">
      <a href={`/producto/${product.slug}`} className="block space-y-4">
        
        {/* Imagen */}
        <div className="aspect-square bg-white border border-gray-100 overflow-hidden rounded-lg">
          {product.image_url ? (
            <img 
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <div className="w-16 h-16 border border-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 space-y-1">
            {product.featured && (
              <span className="inline-block bg-yellow-500 text-white text-xs px-2 py-1 rounded font-bold">
                ⭐ Destacado
              </span>
            )}
            {product.stock <= 5 && product.stock > 0 && (
              <span className="inline-block bg-orange-500 text-white text-xs px-2 py-1 rounded font-bold">
                ¡{product.stock} left!
              </span>
            )}
          </div>
        </div>
        
        {/* Info del producto */}
        <div className="space-y-2">
          <h3 className="font-light text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
          
          <p className="text-lg font-semibold text-gray-900">
            ${product.price.toLocaleString('es-CO')}
          </p>
          
          {/* Stock status */}
          <div className="flex items-center justify-center space-x-1">
            {product.stock > 0 ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500">
                  {product.stock <= 5 ? `Solo ${product.stock}` : 'Disponible'}
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                <span className="text-xs text-gray-400">Agotado</span>
              </>
            )}
          </div>
        </div>
      </a>
    </article>
  );
}