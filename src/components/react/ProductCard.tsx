// src/components/react/ProductForm.tsx - CORRECCIÓN DE IMPORTACIONES
import React, { useState } from 'react';
import type { Product } from '../../lib/types';
// ✅ CORREGIR IMPORTACIÓN: createOrder -> createProduct
import { createProduct, updateProduct } from '../../lib/supabase';

interface ProductFormProps {
  product?: Product;
  onSave?: (product: Product) => void;
  onCancel?: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    category: product?.category || '',
    stock: product?.stock || 0,
    image_url: product?.image_url || '',
    featured: product?.featured || false,
    is_active: product?.is_active ?? true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      let savedProduct: Product;
      
      if (product?.id) {
        // Actualizar producto existente
        savedProduct = await updateProduct(product.id, formData);
      } else {
        // Crear nuevo producto
        savedProduct = await createProduct(formData);
      }

      onSave?.(savedProduct);
    } catch (error) {
      console.error('Error saving product:', error);
      setErrors({ general: 'Error al guardar el producto' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked 
              : type === 'number' ? parseFloat(value) || 0 
              : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Producto
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        {/* Precio */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Precio
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        {/* Categoría */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          >
            <option value="">Seleccionar categoría</option>
            <option value="Bases Sencillas">Bases Sencillas</option>
            <option value="Bases Dobles">Bases Dobles</option>
            <option value="Bases Queen">Bases Queen</option>
            <option value="Bases King">Bases King</option>
            <option value="Bases con Cajones">Bases con Cajones</option>
            <option value="Bases Premium">Bases Premium</option>
          </select>
        </div>

        {/* Stock */}
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
            Stock
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* URL de Imagen */}
        <div className="md:col-span-2">
          <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
            URL de Imagen
          </label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="https://ejemplo.com/imagen.jpg"
          />
        </div>

        {/* Descripción */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Descripción del producto..."
          />
        </div>

        {/* Checkboxes */}
        <div className="md:col-span-2 flex space-x-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Producto Destacado</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Producto Activo</span>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {errors.general && (
        <div className="text-red-600 text-sm">{errors.general}</div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? 'Guardando...' : product?.id ? 'Actualizar' : 'Crear'} Producto
        </button>
      </div>
    </form>
  );
}