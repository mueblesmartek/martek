// src/components/react/AdminProductsSpreadsheet.tsx - CORRECCIÓN COMPLETA DE ERRORES TYPESCRIPT
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminBulkActions } from './admin/AdminBulkActions';
import { AdminProductsTable } from './admin/AdminProductsTable';
import { 
  getAllProductsForAdmin, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  bulkInsertProducts,
  getCategories,
  generateSlug // ✅ AGREGAR IMPORT DE GENERATESLUG
} from '../../lib/supabase';
import type { Product, ProductRowForAdmin, ProductImage, CSVProduct, ValidationError, Category } from '../../lib/types';

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
  
  // ✅ RENOMBRAR PARA EVITAR CONFLICTO
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    'bases-sencillas', 'bases-dobles', 'bases-queen', 'bases-king', 'bases-cajones', 'bases-premium'
  ]);

  // ✅ PRODUCTOS SUCIOS (con cambios sin guardar)
  const dirtyProducts = useMemo(() => 
    products.filter(p => p.isDirty || p.isNew), 
    [products]
  );

  // ✅ FUNCIONES AUXILIARES DEFINIDAS PRIMERO
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
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

  const validateProduct = useCallback((product: ProductRowForAdmin): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // ✅ VALIDACIÓN MEJORADA
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

  // ✅ CARGAR CATEGORÍAS REALES
  useEffect(() => {
    const loadCategoryData = async () => {
      try {
        const cats = await getCategories();
        const categoryNames = cats.map((cat: Category) => cat.slug);
        setAvailableCategories(categoryNames.length > 0 ? categoryNames : [
          'bases-sencillas', 'bases-dobles', 'bases-queen', 
          'bases-king', 'bases-cajones', 'bases-premium'
        ]);
      } catch (error) {
        console.error('Error cargando categorías:', error);
        setAvailableCategories(['bases-sencillas', 'bases-dobles', 'bases-queen', 'bases-king', 'bases-cajones', 'bases-premium']);
      }
    };
    
    loadCategoryData();
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
const handleAddProduct = useCallback(() => {
  const tempId = `temp_${Date.now()}`;
  const newProduct: ProductRowForAdmin = {
    tempId,
    name: 'Nuevo Producto',
    price: 1000,
    category: availableCategories[0] || 'bases-sencillas',
    stock: 0,
    description: 'Descripción del producto',
    image_url: null,
    // ✅ OMITIR EL CAMPO IMAGES TEMPORALMENTE
    // images: [],
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
  showNotification('✅ Producto agregado. Edita los campos y guarda.', 'success');
}, [availableCategories, showNotification]);


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
  }, [showNotification]);

  // ✅ ELIMINAR PRODUCTO
  const handleProductDelete = useCallback(async (productId: string) => {
    const product = products.find(p => (p.id || p.tempId) === productId);
    
    if (!product) return;

    // Si es nuevo (temporal), solo remover del estado
    if (product.isNew && product.tempId) {
      setProducts(prev => prev.filter(p => p.tempId !== productId));
      setSelectedProducts(prev => prev.filter(id => id !== productId));
      showNotification('Producto removido', 'info');
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
  }, [products, showNotification]);

  // ✅ IMPORTAR DESDE CSV CON TIPOS CORREGIDOS
  const handleImportCSV = useCallback(async (csvProducts: CSVProduct[]) => {
    setIsLoading(true);
    
    try {
      // ✅ CONVERTIR CSVProduct A FORMATO COMPLETO
      const productsToInsert = csvProducts.map(csvProduct => ({
        name: csvProduct.name,
        description: csvProduct.description || '',
        price: csvProduct.price,
        category: csvProduct.category,
        stock: csvProduct.stock,
        image_url: csvProduct.image_url || null,
        is_active: true, // ✅ AGREGAR CAMPOS FALTANTES
        featured: false, // ✅ AGREGAR CAMPOS FALTANTES
        slug: generateSlug(csvProduct.name),
        meta_title: null,
        meta_description: null,
        images: []
      }));

      const insertedProducts = await bulkInsertProducts(productsToInsert);
      await loadProducts();
      showNotification(`✅ ${insertedProducts.length} productos importados`, 'success');
      
    } catch (error) {
      console.error('Error importing CSV:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showNotification(`❌ Error importando: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification, loadProducts]);

  // ✅ ELIMINAR MÚLTIPLES PRODUCTOS
  const handleBulkDelete = useCallback(async (productIds: string[]) => {
    if (!confirm(`¿Eliminar ${productIds.length} productos seleccionados?`)) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Eliminar de la base de datos
      const deletePromises = productIds
        .map(id => products.find(p => p.id === id))
        .filter(p => p && p.id)
        .map(p => deleteProduct(p!.id!));

      await Promise.all(deletePromises);

      // Remover todos del estado
      setProducts(prev => prev.filter(p => 
        !productIds.includes(p.id || p.tempId || '')
      ));
      setSelectedProducts([]);

      showNotification(`✅ ${productIds.length} productos eliminados`, 'success');
      
    } catch (error) {
      console.error('Error bulk deleting:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showNotification(`❌ Error eliminando productos: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [products, showNotification]);

  // ✅ GUARDAR TODOS LOS CAMBIOS CON MEJOR MANEJO DE ERRORES
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
          const errorMessage = result.reason instanceof Error ? result.reason.message : 'Error desconocido';
          errors.push(`Producto ${index + 1}: ${errorMessage}`);
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
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showNotification(`❌ Error guardando productos: ${errorMessage}`, 'error');
      setLastError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [dirtyProducts, validateProduct, showNotification, loadProducts]);

  // ✅ MANEJO DE ERRORES DE VALIDACIÓN
  const handleValidationError = useCallback((productId: string, errors: ValidationError[]) => {
    console.warn(`Validation errors for product ${productId}:`, errors);
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
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Guardar Cambios ({dirtyProducts.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{products.length}</div>
            <div className="text-sm text-blue-800">Total Productos</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{dirtyProducts.length}</div>
            <div className="text-sm text-green-800">Sin Guardar</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{selectedProducts.length}</div>
            <div className="text-sm text-purple-800">Seleccionados</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{availableCategories.length}</div>
            <div className="text-sm text-gray-800">Categorías</div>
          </div>
        </div>
      </div>

      {/* Acciones bulk */}
      <AdminBulkActions
        products={products}
        onBulkUpdate={handleBulkUpdate}
        onBulkDelete={handleBulkDelete}
        onBulkImport={handleImportCSV}
        selectedProducts={selectedProducts}
        onSelectionChange={setSelectedProducts}
        isLoading={isLoading}
        dirtyCount={dirtyProducts.length}
      />

      {/* Tabla de productos */}
      <AdminProductsTable
        products={products}
        categories={availableCategories}
        selectedProducts={selectedProducts}
        onSelectionChange={setSelectedProducts}
        onProductUpdate={handleProductUpdate}
        onProductDelete={handleProductDelete}
        onValidationError={handleValidationError}
        isLoading={isLoading}
      />

      {/* Error display */}
      {lastError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Errores encontrados:</h3>
              <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap">{lastError}</pre>
            </div>
            <button 
              onClick={() => setLastError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}