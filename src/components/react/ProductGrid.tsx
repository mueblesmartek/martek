// src/components/react/ProductGrid.tsx - CORREGIDO SIN IMPORTS INEXISTENTES
import React, { useState, useMemo } from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '../../lib/types';

interface ProductGridProps {
  products: Product[];
  variant?: 'default' | 'featured' | 'compact' | 'list';
  columns?: {
    mobile?: 1 | 2;
    tablet?: 2 | 3 | 4;
    desktop?: 3 | 4 | 5 | 6;
  };
  showFilters?: boolean;
  showSort?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
  itemsPerPage?: number;
  emptyState?: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'featured' | 'newest';

export function ProductGrid({
  products,
  variant = 'default',
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  showFilters = false,
  showSort = false,
  showSearch = false,
  showPagination = false,
  itemsPerPage = 12,
  emptyState,
  className = '',
  title,
  subtitle
}: ProductGridProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showOutOfStock, setShowOutOfStock] = useState(true);

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return cats.sort();
  }, [products]);

  // Filtrar y ordenar productos
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    }

    // Filtro por categoría
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Filtro por rango de precio
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Filtro por stock
    if (!showOutOfStock) {
      filtered = filtered.filter(product => product.is_active && product.stock > 0);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'featured':
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        case 'newest':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, sortBy, categoryFilter, priceRange, showOutOfStock]);

  // Paginación
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    if (!showPagination) return filteredAndSortedProducts;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage, itemsPerPage, showPagination]);

  // Clases del grid según columnas
  const getGridClasses = () => {
    if (variant === 'list') {
      return 'space-y-4';
    }
    
    const { mobile = 1, tablet = 2, desktop = 3 } = columns;
    return `grid gap-6 grid-cols-${mobile} md:grid-cols-${tablet} lg:grid-cols-${desktop}`;
  };

  return (
    <div className={`space-y-8 ${className}`}>
      
      {/* Header */}
      {(title || subtitle) && (
        <div className="text-center">
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
          <div className="w-20 h-px bg-gray-400 mx-auto mt-6"></div>
        </div>
      )}

      {/* Controles */}
      {(showSearch || showSort || showFilters) && (
        <div className="space-y-4">
          
          {/* Búsqueda */}
          {showSearch && (
            <div className="max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Filtros y Ordenamiento */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Filtros */}
            {showFilters && (
              <div className="flex flex-wrap gap-4 items-center">
                
                {/* Categorías */}
                {categories.length > 0 && (
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700"
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                )}

                {/* Toggle Stock */}
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showOutOfStock}
                    onChange={(e) => setShowOutOfStock(e.target.checked)}
                    className="rounded border-gray-300 text-gray-800 focus:ring-red-500"
                  />
                  <span>Mostrar agotados</span>
                </label>
              </div>
            )}

            {/* Ordenamiento */}
            {showSort && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700"
                >
                  <option value="featured">Destacados</option>
                  <option value="newest">Más recientes</option>
                  <option value="name-asc">Nombre A-Z</option>
                  <option value="name-desc">Nombre Z-A</option>
                  <option value="price-asc">Precio menor a mayor</option>
                  <option value="price-desc">Precio mayor a menor</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resultados Info */}
      {(showSearch || showFilters) && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {filteredAndSortedProducts.length} producto{filteredAndSortedProducts.length !== 1 ? 's' : ''} 
            {searchQuery && ` para "${searchQuery}"`}
          </span>
          
          {(searchQuery || categoryFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('');
                setCurrentPage(1);
              }}
              className="text-gray-800 hover:text-red-600 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Grid de Productos */}
      {paginatedProducts.length > 0 ? (
        <div className={getGridClasses()}>
          {paginatedProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product}
              showQuickAdd={variant !== 'list'}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          {emptyState || (
            <div>
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m16 0l-2-3m2 3l-2 3M4 13l2-3m-2 3l2 3" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No se encontraron productos
              </h3>
              <p className="text-gray-600">
                {searchQuery || categoryFilter
                  ? 'Intenta cambiar tus filtros o búsqueda'
                  : 'No hay productos disponibles en este momento'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Paginación */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Anterior
          </button>
          
          <div className="flex space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-lg ${
                    currentPage === page
                      ? 'bg-gray-900 text-white border-red-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

// Variants específicos para diferentes usos
export function FeaturedProductsGrid({ products, title, subtitle, className }: {
  products: Product[];
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <ProductGrid
      products={products}
      variant="featured"
      columns={{ mobile: 1, tablet: 2, desktop: 4 }}
      title={title}
      subtitle={subtitle}
      className={className}
    />
  );
}

export function ProductCatalogGrid({ products, className }: {
  products: Product[];
  className?: string;
}) {
  return (
    <ProductGrid
      products={products}
      variant="default"
      columns={{ mobile: 1, tablet: 2, desktop: 3 }}
      showSearch={true}
      showSort={true}
      showFilters={true}
      showPagination={true}
      itemsPerPage={16}
      className={className}
    />
  );
}

export function CompactProductsGrid({ products, title, columns, className }: {
  products: Product[];
  title?: string;
  columns?: { mobile?: 1 | 2; tablet?: 2 | 3 | 4; desktop?: 3 | 4 | 5 | 6 };
  className?: string;
}) {
  return (
    <ProductGrid
      products={products}
      variant="compact"
      columns={columns || { mobile: 2, tablet: 3, desktop: 6 }}
      title={title}
      className={className}
    />
  );
}