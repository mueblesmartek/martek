// src/components/react/AdminProductsSpreadsheet.tsx - COMPONENTE PRINCIPAL REFACTORIZADO
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminBulkActions } from './admin/AdminBulkActions';
import { AdminProductsTable } from './admin/AdminProductsTable';
import { 
  getAllProductsForAdmin, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  bulkInsertProducts,
  generateSlug,
  supabase 
} from '../../lib/supabase';
import type { Product, ProductRowForAdmin, ProductImage, CSVProduct, ValidationError } from '../../lib/types';

interface AdminProductsSpreadsheetProps {
  initialProducts?: Product[];
  onProductsChange?: (products: Product[]) => void;
}

export function AdminProductsSpreadsheet({ 
  initialProducts = [], 
  onProductsChange 
}: AdminProductsSpreadsheetProps) {
  
  // ✅ ESTADO PRINCIPAL
  const [products, setProducts] = useState<ProductRowForAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([
    'juguetes', 'accesorios', 'lubricantes', 'lenceria', 'general'
  ]);

  // ✅ PRODUCTOS SUCIOS (con cambios sin guardar)
  const dirtyProducts = useMemo(() => 
    products.filter(p => p.isDirty || p.isNew), 
    [products]
  );

  // ✅ CARGAR PRODUCTOS INICIALES
  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts.map(product => ({
        ...product,
        isDirty: false,
        isNew: false
      })));
    } else {
      loadProducts();
    }
  }, []);

  // ✅ CARGAR PRODUCTOS DESDE SUPABASE
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setLastError(null);
    
    try {
      const data = await getAllProductsForAdmin();
      setProducts(data.map(product => ({
        ...product,
        isDirty: false,
        isNew: false
      })));
    } catch (error) {
      console.error('Error loading products:', error);
      setLastError('Error cargando productos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ ACTUALIZAR CAMPO DE PRODUCTO
  const handleProductUpdate = useCallback((productId: string, field: keyof Product, value: any) => {
    setProducts(prev => prev.map(product => {
      const id = product.id || product.tempId;
      if (id !== productId) return product;
      
      const updated = {
        ...product,
        [field]: value,
        isDirty: true,
        updated_at: new Date().toISOString()
      };

      // Auto-generar slug si se cambió el nombre
      if (field === 'name' && value) {
        updated.slug = generateSlug(value);
      }

      return updated;
    }));
  }, []);

  // ✅ AGREGAR PRODUCTO NUEVO
  const handleAddProduct = useCallback(() => {
    const tempId = `temp_${Date.now()}`;
    const newProduct: ProductRowForAdmin = {
      tempId,
      name: '',
      price: 0,
      category: 'general',
      stock: 0,
      description: '',
      image_url: null,
      images: [],
      is_active: true,
      featured: false,
      slug: null,
      meta_title: null,
      meta_description: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isNew: true,
      isDirty: true
    };
    
    setProducts(prev => [newProduct, ...prev]);
  }, []);

  // ✅ ELIMINAR PRODUCTO
  const handleProductDelete = useCallback(async (productId: string) => {
    const product = products.find(p => (p.id || p.tempId) === productId);
    
    if (!product) return;

    // Si es nuevo (temporal), solo remover del estado
    if (product.isNew && product.tempId) {
      setProducts(prev => prev.filter(p => p.tempId !== productId));
      setSelectedProducts(prev => prev.filter(id => id !== productId));
      return;
    }

    // Si es existente, confirmar y eliminar de la DB
    if (confirm(`¿Eliminar "${product.name}"?`)) {
      try {
        if (product.id) {
          await deleteProduct(product.id);
        }
        setProducts(prev => prev.filter(p => p.id !== productId));
        setSelectedProducts(prev => prev.filter(id => id !== productId));
        showNotification('✅ Producto eliminado', 'success');
      } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('❌ Error eliminando producto', 'error');
      }
    }
  }, [products]);

  // ✅ GUARDAR TODOS LOS CAMBIOS
  const handleSaveAll = useCallback(async () => {
    if (dirtyProducts.length === 0) return;

    setIsSaving(true);
    setLastError(null);

    try {
      const results = await Promise.allSettled(
        dirtyProducts.map(async (product) => {
          // Validar producto antes de guardar
          const validation = validateProduct(product);
          if (!validation.isValid) {
            throw new Error(`${product.name}: ${validation.errors.join(', ')}`);
          }

          if (product.isNew) {
            // Crear nuevo producto
            const { tempId, isNew, isDirty, errors, ...productData } = product;
            return await createProduct(productData as Omit<Product, 'id'>);
          } else if (product.id) {
            // Actualizar producto existente
            const { tempId, isNew, isDirty, errors, ...productData } = product;
            return await updateProduct(product.id, productData as Partial<Product>);
          }
        })
      );

      // Procesar resultados
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          errorCount++;
          errors.push(`Producto ${index + 1}: ${result.reason.message}`);
        }
      });

      if (errorCount === 0) {
        showNotification(`✅ ${successCount} productos guardados exitosamente`, 'success');
        await loadProducts(); // Recargar datos
      } else {
        showNotification(`⚠️ ${successCount} guardados, ${errorCount} errores`, 'warning');
        setLastError(errors.join('\n'));
      }

    } catch (error) {
      console.error('Error saving products:', error);
      setLastError('Error guardando productos');
      showNotification('❌ Error guardando productos', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [dirtyProducts, loadProducts]);

  // ✅ IMPORTACIÓN MASIVA
  const handleBulkImport = useCallback(async (csvProducts: CSVProduct[]) => {
    try {
      setIsLoading(true);
      const results = await bulkInsertProducts(csvProducts);
      
      if (results.length > 0) {
        showNotification(`✅ ${results.length} productos importados`, 'success');
        await loadProducts();
      }
    } catch (error) {
      console.error('Error importing products:', error);
      showNotification('❌ Error importando productos', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [loadProducts]);

  // ✅ ACTUALIZACIÓN MASIVA
  const handleBulkUpdate = useCallback((updates: Partial<Product>[]) => {
    setProducts(prev => prev.map(product => {
      const productId = product.id || product.tempId;
      const update = updates.find(u => u.id === productId);
      
      if (!update) return product;

      return {
        ...product,
        ...update,
        isDirty: true,
        updated_at: new Date().toISOString()
      };
    }));

    showNotification(`✅ ${updates.length} productos actualizados`, 'success');
  }, []);

  // ✅ ELIMINACIÓN MASIVA
  const handleBulkDelete = useCallback(async (productIds: string[]) => {
    try {
      setIsLoading(true);
      
      // Separar productos nuevos de existentes
      const existingIds = productIds.filter(id => 
        products.find(p => p.id === id && !p.isNew)
      );
      const newIds = productIds.filter(id => 
        products.find(p => p.tempId === id && p.isNew)
      );

      // Eliminar productos existentes de la DB
      if (existingIds.length > 0) {
        await Promise.all(existingIds.map(id => deleteProduct(id)));
      }

      // Remover todos del estado
      setProducts(prev => prev.filter(p => 
        !productIds.includes(p.id || p.tempId || '')
      ));
      setSelectedProducts([]);

      showNotification(`✅ ${productIds.length} productos eliminados`, 'success');
      
    } catch (error) {
      console.error('Error bulk deleting:', error);
      showNotification('❌ Error eliminando productos', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [products]);

  // ✅ VALIDACIÓN DE PRODUCTO
  const validateProduct = useCallback((product: ProductRowForAdmin): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!product.name?.trim()) {
      errors.push('Nombre es requerido');
    }

    if (!product.price || product.price <= 0) {
      errors.push('Precio debe ser mayor a 0');
    }

    if (product.stock === undefined || product.stock < 0) {
      errors.push('Stock debe ser 0 o mayor');
    }

    if (!product.category?.trim()) {
      errors.push('Categoría es requerida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // ✅ MANEJO DE ERRORES DE VALIDACIÓN
  const handleValidationError = useCallback((productId: string, errors: ValidationError[]) => {
    console.warn(`Validation errors for product ${productId}:`, errors);
    // Podrías implementar un estado de errores aquí si necesitas mostrarlos en la UI
  }, []);

  // ✅ NOTIFICACIONES SIMPLES
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    // Implementación simple - podrías usar tu sistema de notificaciones existente
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Toast simple
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white z-50 ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 
      type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }, []);

  // ✅ CALLBACK CUANDO CAMBIAN LOS PRODUCTOS
  useEffect(() => {
    if (onProductsChange) {
      const validProducts = products.filter(p => !p.isNew) as Product[];
      onProductsChange(validProducts);
    }
  }, [products, onProductsChange]);

  return (
    <div className="space-y-6">
      
      {/* ✅ HEADER CON ESTADÍSTICAS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              📊 Gestión de Productos
            </h1>
            <p className="text-gray-600 mt-1">
              Administra tu inventario de forma eficiente
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Botón agregar producto */}
            <button
              onClick={handleAddProduct}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Agregar Producto</span>
            </button>

            {/* Botón guardar cambios */}
            <button
              onClick={handleSaveAll}
              disabled={dirtyProducts.length === 0 || isSaving}
              className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                dirtyProducts.length === 0 || isSaving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Guardar Todo ({dirtyProducts.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{products.length}</div>
            <div className="text-sm text-blue-700">Total Productos</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {products.filter(p => p.is_active).length}
            </div>
            <div className="text-sm text-green-700">Activos</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{dirtyProducts.length}</div>
            <div className="text-sm text-yellow-700">Sin Guardar</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {products.filter(p => (p.stock || 0) <= 5).length}
            </div>
            <div className="text-sm text-red-700">Stock Bajo</div>
          </div>
        </div>
      </div>

      {/* ✅ ERROR DISPLAY */}
      {lastError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-900">Error</h4>
              <pre className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{lastError}</pre>
            </div>
            <button
              onClick={() => setLastError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ✅ ACCIONES MASIVAS */}
      <AdminBulkActions
        products={products}
        onBulkUpdate={handleBulkUpdate}
        onBulkDelete={handleBulkDelete}
        onBulkImport={handleBulkImport}
        selectedProducts={selectedProducts}
        onSelectionChange={setSelectedProducts}
        isLoading={isLoading}
        dirtyCount={dirtyProducts.length}
      />

      {/* ✅ TABLA DE PRODUCTOS */}
      <AdminProductsTable
        products={products}
        onProductUpdate={handleProductUpdate}
        onProductDelete={handleProductDelete}
        categories={categories}
        selectedProducts={selectedProducts}
        onSelectionChange={setSelectedProducts}
        onValidationError={handleValidationError}
        isLoading={isLoading}
      />

      {/* ✅ FOOTER CON ACCIONES RÁPIDAS */}
      <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {products.length > 0 ? (
            <span>
              Mostrando {products.length} productos • 
              {dirtyProducts.length > 0 && (
                <span className="text-yellow-600 font-medium ml-1">
                  {dirtyProducts.length} cambios sin guardar
                </span>
              )}
            </span>
          ) : (
            <span>No hay productos</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadProducts}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            🔄 Recargar
          </button>
          
          {dirtyProducts.length > 0 && (
            <button
              onClick={() => {
                if (confirm('¿Descartar todos los cambios no guardados?')) {
                  loadProducts();
                }
              }}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              🗑️ Descartar Cambios
            </button>
          )}
        </div>
      </div>
    </div>
  );
}