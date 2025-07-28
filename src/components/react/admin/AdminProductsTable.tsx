// src/components/react/admin/AdminProductsTable.tsx
import React, { useState, useMemo } from 'react';
import { AdminProductRow } from './AdminProductRow';
import type { ProductRowForAdmin, Product, ValidationError } from '../../../lib/types';

interface SortConfig {
  field: keyof Product | null;
  direction: 'asc' | 'desc';
}

interface AdminProductsTableProps {
  products: ProductRowForAdmin[];
  onProductUpdate: (productId: string, field: keyof Product, value: any) => void;
  onProductDelete: (productId: string) => void;
  categories: string[];
  selectedProducts: string[];
  onSelectionChange: (productIds: string[]) => void;
  onValidationError: (productId: string, errors: ValidationError[]) => void;
  isLoading: boolean;
}

export function AdminProductsTable({
  products,
  onProductUpdate,
  onProductDelete,
  categories,
  selectedProducts,
  onSelectionChange,
  onValidationError,
  isLoading
}: AdminProductsTableProps) {
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: 'asc' });
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ✅ ORDENAMIENTO
  const handleSort = (field: keyof Product) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // ✅ FILTRADO Y ORDENAMIENTO
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Filtro por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(search) ||
        product.description?.toLowerCase().includes(search) ||
        product.category?.toLowerCase().includes(search)
      );
    }

    // Filtro por categoría
    if (filterCategory) {
      filtered = filtered.filter(product => product.category === filterCategory);
    }

    // Filtro por estado
    if (filterStatus !== 'all') {
      switch (filterStatus) {
        case 'active':
          filtered = filtered.filter(product => product.is_active === true);
          break;
        case 'inactive':
          filtered = filtered.filter(product => product.is_active === false);
          break;
        case 'featured':
          filtered = filtered.filter(product => product.featured === true);
          break;
        case 'low_stock':
          filtered = filtered.filter(product => (product.stock || 0) <= 5);
          break;
        case 'new':
          filtered = filtered.filter(product => product.isNew === true);
          break;
        case 'dirty':
          filtered = filtered.filter(product => product.isDirty === true);
          break;
      }
    }

    // Ordenamiento
    if (sortConfig.field) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.field!];
        const bValue = b[sortConfig.field!];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' 
            ? aValue - bValue
            : bValue - aValue;
        }
        
        return 0;
      });
    }

    return filtered;
  }, [products, searchTerm, filterCategory, filterStatus, sortConfig]);

  // ✅ SELECCIÓN DE PRODUCTOS
  const handleProductSelection = (productId: string, isSelected: boolean) => {
    if (isSelected) {
      onSelectionChange([...selectedProducts, productId]);
    } else {
      onSelectionChange(selectedProducts.filter(id => id !== productId));
    }
  };

  // ✅ ICONOS DE ORDENAMIENTO
  const getSortIcon = (field: keyof Product) => {
    if (sortConfig.field !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      
      {/* ✅ FILTROS Y BÚSQUEDA */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Búsqueda
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="featured">Destacados</option>
              <option value="low_stock">Stock bajo (≤5)</option>
              <option value="new">Nuevos</option>
              <option value="dirty">Con cambios</option>
            </select>
          </div>

          {/* Estadísticas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estadísticas
            </label>
            <div className="text-sm text-gray-600">
              <div>Total: {products.length}</div>
              <div>Filtrados: {filteredAndSortedProducts.length}</div>
              <div>Seleccionados: {selectedProducts.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ TABLA */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            
            {/* Header */}
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-3 py-3 text-left border-r border-gray-200 bg-gray-100">
                  <input
                    type="checkbox"
                    checked={
                      filteredAndSortedProducts.length > 0 && 
                      filteredAndSortedProducts.every(p => 
                        selectedProducts.includes(p.id || p.tempId || '')
                      )
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        const allIds = filteredAndSortedProducts.map(p => p.id || p.tempId || '').filter(Boolean);
                        onSelectionChange([...new Set([...selectedProducts, ...allIds])]);
                      } else {
                        const filteredIds = filteredAndSortedProducts.map(p => p.id || p.tempId || '');
                        onSelectionChange(selectedProducts.filter(id => !filteredIds.includes(id)));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>

                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] border-r border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>📝 Nombre</span>
                    {getSortIcon('name')}
                  </div>
                </th>

                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] border-r border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center space-x-1">
                    <span>💰 Precio</span>
                    {getSortIcon('price')}
                  </div>
                </th>

                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px] border-r border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center space-x-1">
                    <span>🏷️ Categoría</span>
                    {getSortIcon('category')}
                  </div>
                </th>

                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] border-r border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center space-x-1">
                    <span>📦 Stock</span>
                    {getSortIcon('stock')}
                  </div>
                </th>

                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] border-r border-gray-200">
                  📄 Descripción
                </th>

                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] border-r border-gray-200">
                  🖼️ Imagen
                </th>

                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] border-r border-gray-200">
                  ⚙️ Estado
                </th>

                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  🔧 Acciones
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Cargando productos...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAndSortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                    {products.length === 0 ? (
                      <div>
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4v.01M6 9v.01" />
                        </svg>
                        <p className="text-lg font-medium text-gray-900 mb-2">No hay productos</p>
                        <p>Agrega tu primer producto para comenzar</p>
                      </div>
                    ) : (
                      <div>
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</p>
                        <p>Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAndSortedProducts.map((product, index) => {
                  const productId = product.id || product.tempId || '';
                  const isSelected = selectedProducts.includes(productId);
                  const isEditing = editingProduct === productId;

                  return (
                    <AdminProductRow
                      key={productId}
                      product={product}
                      index={index}
                      onUpdate={onProductUpdate}
                      onDelete={onProductDelete}
                      categories={categories}
                      isEditing={isEditing}
                      onEditToggle={setEditingProduct}
                      onValidationError={onValidationError}
                      isSelected={isSelected}
                      onSelectionChange={(isSelected) => handleProductSelection(productId, isSelected)}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ RESUMEN */}
      {filteredAndSortedProducts.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium">Productos mostrados:</span> {filteredAndSortedProducts.length}
            </div>
            <div>
              <span className="font-medium">Productos activos:</span> {filteredAndSortedProducts.filter(p => p.is_active).length}
            </div>
            <div>
              <span className="font-medium">Stock total:</span> {filteredAndSortedProducts.reduce((sum, p) => sum + (p.stock || 0), 0)}
            </div>
            <div>
              <span className="font-medium">Valor total:</span> ${filteredAndSortedProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}