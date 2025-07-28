// src/components/react/ProductsFilter.tsx
import React, { useState, useEffect } from 'react';
import type { Product } from '../../lib/types';

interface ProductsFilterProps {
  products: Product[];
  onFilterChange: (filteredProducts: Product[]) => void;
  currentCategory?: string;
}

interface FilterState {
  priceRange: [number, number];
  sortBy: 'featured' | 'price-low' | 'price-high' | 'name' | 'newest';
  inStock: boolean;
  minPrice: number;
  maxPrice: number;
}

export function ProductsFilter({ products, onFilterChange, currentCategory }: ProductsFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Calculate price range from products
  const allPrices = products.map(p => p.price);
  const minPossiblePrice = Math.min(...allPrices) || 0;
  const maxPossiblePrice = Math.max(...allPrices) || 1000000;
  
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [minPossiblePrice, maxPossiblePrice],
    sortBy: 'featured',
    inStock: false,
    minPrice: minPossiblePrice,
    maxPrice: maxPossiblePrice
  });

  // Update filter state when products change
  useEffect(() => {
    const allPrices = products.map(p => p.price);
    const minPrice = Math.min(...allPrices) || 0;
    const maxPrice = Math.max(...allPrices) || 1000000;
    
    setFilters(prev => ({
      ...prev,
      minPrice: minPrice,
      maxPrice: maxPrice,
      priceRange: [minPrice, maxPrice]
    }));
  }, [products]);

  // Apply filters whenever filters change
  useEffect(() => {
    let filteredProducts = [...products];

    // Filter by price range
    filteredProducts = filteredProducts.filter(
      product => product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
    );

    // Filter by stock
    if (filters.inStock) {
      filteredProducts = filteredProducts.filter(product => product.stock > 0);
    }

    // Sort products
    filteredProducts.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'featured':
        default:
          // Featured first, then by creation date
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    onFilterChange(filteredProducts);
  }, [filters, products, onFilterChange]);

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    setFilters(prev => ({
      ...prev,
      priceRange: type === 'min' 
        ? [Math.min(value, prev.priceRange[1]), prev.priceRange[1]]
        : [prev.priceRange[0], Math.max(value, prev.priceRange[0])]
    }));
  };

  const resetFilters = () => {
    setFilters({
      priceRange: [filters.minPrice, filters.maxPrice],
      sortBy: 'featured',
      inStock: false,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice
    });
  };

  const formatPrice = (price: number) => `$${price.toLocaleString('es-CO')}`;

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg"
        >
          <span className="font-medium text-gray-900">Filtros</span>
          <svg 
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filter Panel */}
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${isOpen ? 'block' : 'hidden lg:block'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          <button 
            onClick={resetFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Limpiar todo
          </button>
        </div>

        {/* Sort By */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Ordenar por
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="featured">Destacados</option>
            <option value="price-low">Precio: menor a mayor</option>
            <option value="price-high">Precio: mayor a menor</option>
            <option value="name">Nombre A-Z</option>
            <option value="newest">Más nuevos</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Rango de precio
          </label>
          
          <div className="space-y-4">
            {/* Price Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mínimo</label>
                <input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) => handlePriceChange('min', parseInt(e.target.value) || 0)}
                  min={filters.minPrice}
                  max={filters.maxPrice}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Máximo</label>
                <input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceChange('max', parseInt(e.target.value) || 0)}
                  min={filters.minPrice}
                  max={filters.maxPrice}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="px-2">
              <input
                type="range"
                min={filters.minPrice}
                max={filters.maxPrice}
                value={filters.priceRange[0]}
                onChange={(e) => handlePriceChange('min', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #f20530 0%, #f20530 ${((filters.priceRange[0] - filters.minPrice) / (filters.maxPrice - filters.minPrice)) * 100}%, #e5e7eb ${((filters.priceRange[0] - filters.minPrice) / (filters.maxPrice - filters.minPrice)) * 100}%, #e5e7eb 100%)`
                }}
              />
              <input
                type="range"
                min={filters.minPrice}
                max={filters.maxPrice}
                value={filters.priceRange[1]}
                onChange={(e) => handlePriceChange('max', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer -mt-2"
                style={{
                  background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${((filters.priceRange[1] - filters.minPrice) / (filters.maxPrice - filters.minPrice)) * 100}%, #f20530 ${((filters.priceRange[1] - filters.minPrice) / (filters.maxPrice - filters.minPrice)) * 100}%, #f20530 100%)`
                }}
              />
              
              {/* Price Labels */}
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{formatPrice(filters.priceRange[0])}</span>
                <span>{formatPrice(filters.priceRange[1])}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Filter */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))}
              className="mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Solo productos en stock
            </span>
          </label>
        </div>

        {/* Quick Filters */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Filtros rápidos
          </label>
          <div className="space-y-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, priceRange: [0, 50000] }))}
              className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              Menos de $50,000
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, priceRange: [50000, 150000] }))}
              className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              $50,000 - $150,000
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, priceRange: [150000, 300000] }))}
              className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              $150,000 - $300,000
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, priceRange: [300000, filters.maxPrice] }))}
              className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              Más de $300,000
            </button>
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p className="mb-1">
              <span className="font-medium">Rango:</span> {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
            </p>
            <p className="mb-1">
              <span className="font-medium">Orden:</span> {
                filters.sortBy === 'featured' ? 'Destacados' :
                filters.sortBy === 'price-low' ? 'Precio ↑' :
                filters.sortBy === 'price-high' ? 'Precio ↓' :
                filters.sortBy === 'name' ? 'Nombre A-Z' :
                'Más nuevos'
              }
            </p>
            {filters.inStock && (
              <p>
                <span className="font-medium">Solo en stock</span>
              </p>
            )}
            {currentCategory && (
              <p>
                <span className="font-medium">Categoría:</span> {currentCategory}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}