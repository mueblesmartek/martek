// src/components/react/admin/AdminProductRow.tsx
import React, { useState, useCallback } from 'react';
import { ProductMultiImageUploader } from '../ProductMultiImageUploader';
import { getPrimaryImageUrl, getAllImages } from '../../../lib/types';
import type { ProductRowForAdmin, Product, ProductImage, ValidationError } from '../../../lib/types';

interface AdminProductRowProps {
  product: ProductRowForAdmin;
  index: number;
  onUpdate: (productId: string, field: keyof Product, value: any) => void;
  onDelete: (productId: string) => void;
  categories: string[];
  isEditing: boolean;
  onEditToggle: (productId: string) => void;
  onValidationError: (productId: string, errors: ValidationError[]) => void;
  isSelected: boolean;
  onSelectionChange: (isSelected: boolean) => void;
}

export function AdminProductRow({
  product,
  index,
  onUpdate,
  onDelete,
  categories,
  isEditing,
  onEditToggle,
  onValidationError,
  isSelected,
  onSelectionChange
}: AdminProductRowProps) {
  
  const [showImageModal, setShowImageModal] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // ✅ VALIDACIONES
  const validateField = useCallback((field: keyof Product, value: any): string | null => {
    switch (field) {
      case 'name':
        if (!value || !value.trim()) return 'Nombre es requerido';
        if (value.length > 255) return 'Nombre muy largo (máx 255 caracteres)';
        return null;
      
      case 'price':
        const price = Number(value);
        if (isNaN(price) || price <= 0) return 'Precio debe ser mayor a 0';
        return null;
      
      case 'stock':
        const stock = Number(value);
        if (isNaN(stock) || stock < 0) return 'Stock debe ser 0 o mayor';
        return null;
      
      case 'category':
        if (!value || !value.trim()) return 'Categoría es requerida';
        return null;
      
      default:
        return null;
    }
  }, []);

  // ✅ HANDLER PARA CAMBIOS EN CAMPOS
  const handleFieldChange = useCallback((field: keyof Product, value: any) => {
    const error = validateField(field, value);
    
    setLocalErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));

    onUpdate(product.id || product.tempId || '', field, value);
  }, [product.id, product.tempId, onUpdate, validateField]);

  // ✅ HANDLER PARA IMÁGENES
  const handleImagesChange = useCallback((images: ProductImage[]) => {
    onUpdate(product.id || product.tempId || '', 'images', images);
    
    // También actualizar image_url por compatibilidad
    const primaryImage = images.find(img => img.isPrimary);
    if (primaryImage) {
      onUpdate(product.id || product.tempId || '', 'image_url', primaryImage.url);
    }
  }, [product.id, product.tempId, onUpdate]);

  // ✅ OBTENER IMÁGENES ACTUALES
  const currentImages = getAllImages(product as Product);
  const primaryImageUrl = getPrimaryImageUrl(product as Product);

  return (
    <>
      <tr className={`border-b border-gray-200 hover:bg-gray-50 ${product.isDirty ? 'bg-yellow-50' : ''} ${product.isNew ? 'bg-green-50' : ''} ${isSelected ? 'bg-blue-50' : ''}`}>
        
        {/* Checkbox de selección */}
        <td className="w-12 px-3 py-2 text-center border-r border-gray-200 bg-gray-50">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectionChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </td>

        {/* Nombre */}
        <td className="px-3 py-2 border-r border-gray-200">
          <input
            type="text"
            value={product.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
              localErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Nombre del producto"
          />
          {localErrors.name && (
            <div className="text-xs text-red-600 mt-1">{localErrors.name}</div>
          )}
        </td>

        {/* Precio */}
        <td className="px-3 py-2 border-r border-gray-200">
          <input
            type="number"
            value={product.price || ''}
            onChange={(e) => handleFieldChange('price', Number(e.target.value))}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
              localErrors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="0"
            min="0"
            step="0.01"
          />
          {localErrors.price && (
            <div className="text-xs text-red-600 mt-1">{localErrors.price}</div>
          )}
        </td>

        {/* Categoría */}
        <td className="px-3 py-2 border-r border-gray-200">
          <select
            value={product.category || ''}
            onChange={(e) => handleFieldChange('category', e.target.value)}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
              localErrors.category ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          >
            <option value="">Seleccionar...</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {localErrors.category && (
            <div className="text-xs text-red-600 mt-1">{localErrors.category}</div>
          )}
        </td>

        {/* Stock */}
        <td className="px-3 py-2 border-r border-gray-200">
          <input
            type="number"
            value={product.stock ?? ''}
            onChange={(e) => handleFieldChange('stock', Number(e.target.value))}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
              localErrors.stock ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="0"
            min="0"
          />
          {localErrors.stock && (
            <div className="text-xs text-red-600 mt-1">{localErrors.stock}</div>
          )}
        </td>

        {/* Descripción */}
        <td className="px-3 py-2 border-r border-gray-200">
          <textarea
            value={product.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            placeholder="Descripción del producto"
            rows={2}
            maxLength={1000}
          />
        </td>

        {/* Imagen */}
        <td className="px-3 py-2 border-r border-gray-200">
          <div className="flex items-center space-x-2">
            {/* Thumbnail */}
            <div className="w-12 h-12 bg-gray-100 rounded border overflow-hidden flex-shrink-0">
              <img
  src={primaryImageUrl}
  alt={product.name || 'Producto'}
  className="w-full h-full object-cover"
  onError={(e) => {
    const target = e.currentTarget;
    if (!target.dataset.fallbackAttempted) {
      target.dataset.fallbackAttempted = 'true';
      // SVG directo - NO archivo físico
      target.src = 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
          <rect width="48" height="48" fill="#f3f4f6"/>
          <rect x="16" y="16" width="16" height="16" fill="#d1d5db" rx="2"/>
          <circle cx="22" cy="22" r="2" fill="#9ca3af"/>
          <path d="M18 28 L22 24 L26 28 L30 24 L32 32 L16 32 Z" fill="#9ca3af"/>
        </svg>
      `);
    }
  }}
/>
            </div>

            {/* Botón editar imágenes */}
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border transition-colors"
            >
              {currentImages.length > 1 ? `${currentImages.length} imgs` : 'Editar'}
            </button>
          </div>
        </td>

        {/* Estado */}
        <td className="px-3 py-2 border-r border-gray-200">
          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={product.is_active ?? true}
                onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-1 text-xs text-gray-600">Activo</span>
            </label>
          </div>
          <div className="mt-1">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={product.featured ?? false}
                onChange={(e) => handleFieldChange('featured', e.target.checked)}
                className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
              />
              <span className="ml-1 text-xs text-gray-600">Destacado</span>
            </label>
          </div>
        </td>

        {/* Acciones */}
        <td className="px-3 py-2 text-center">
          <div className="flex items-center justify-center space-x-1">
            
            {/* Número de fila o indicador NEW */}
            <div className="text-xs text-gray-500 mr-2">
              {product.isNew ? 'NEW' : `#${index + 1}`}
            </div>
            
            {/* Indicador de cambios */}
            {product.isDirty && (
              <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Cambios sin guardar"></div>
            )}
            
            {/* Indicador de nuevo */}
            {product.isNew && (
              <div className="w-2 h-2 bg-green-500 rounded-full" title="Producto nuevo"></div>
            )}

            {/* Botón eliminar */}
            <button
              onClick={() => onDelete(product.id || product.tempId || '')}
              className="w-6 h-6 text-red-500 hover:text-red-700 hover:bg-red-50 rounded flex items-center justify-center transition-colors"
              title="Eliminar producto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {/* ✅ MODAL DE IMÁGENES */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowImageModal(false)}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              
              {/* Header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800">
                    🖼️ Imágenes: {product.name || 'Producto sin nombre'}
                  </h3>
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Uploader de imágenes */}
                <ProductMultiImageUploader
                  images={currentImages}
                  onImagesChange={handleImagesChange}
                  productName={product.name || 'producto'}
                  maxImages={5}
                />
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Guardar y Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}