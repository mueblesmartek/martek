// src/components/react/admin/AdminBulkActions.tsx
import React, { useState, useRef, useCallback } from 'react';
import type { ProductRowForAdmin, Product, CSVProduct, ValidationError } from '../../../lib/types';

interface AdminBulkActionsProps {
  products: ProductRowForAdmin[];
  onBulkUpdate: (updates: Partial<Product>[]) => void;
  onBulkDelete: (productIds: string[]) => void;
  onBulkImport: (products: CSVProduct[]) => void;
  selectedProducts: string[];
  onSelectionChange: (productIds: string[]) => void;
  isLoading: boolean;
  dirtyCount: number;
}

export function AdminBulkActions({
  products,
  onBulkUpdate,
  onBulkDelete,
  onBulkImport,
  selectedProducts,
  onSelectionChange,
  isLoading,
  dirtyCount
}: AdminBulkActionsProps) {
  
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'update' | 'delete' | 'import'>('update');
  const [importData, setImportData] = useState('');
  const [bulkUpdateFields, setBulkUpdateFields] = useState({
    category: '',
    is_active: '',
    featured: '',
    price_adjustment: '',
    stock_adjustment: ''
  });
  const [importErrors, setImportErrors] = useState<ValidationError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ SELECCIÓN MASIVA
  const handleSelectAll = useCallback(() => {
    const allIds = products.map(p => p.id || p.tempId || '').filter(Boolean);
    if (selectedProducts.length === allIds.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allIds);
    }
  }, [products, selectedProducts, onSelectionChange]);

  // ✅ IMPORTAR CSV
  const handleFileImport = useCallback(async (file: File) => {
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setImportErrors([{ field: 'file', message: 'El archivo debe tener al menos una línea de encabezados y una de datos' }]);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['name', 'price', 'category', 'stock'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        setImportErrors([{ 
          field: 'headers', 
          message: `Faltan columnas requeridas: ${missingHeaders.join(', ')}` 
        }]);
        return;
      }

      const products: CSVProduct[] = [];
      const errors: ValidationError[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length !== headers.length) {
          errors.push({ 
            field: `line_${i}`, 
            message: `Línea ${i}: número de columnas incorrecto` 
          });
          continue;
        }

        const product: any = {};
        headers.forEach((header, index) => {
          product[header] = values[index];
        });

        // Validaciones
        if (!product.name || !product.name.trim()) {
          errors.push({ field: `line_${i}`, message: `Línea ${i}: nombre requerido` });
          continue;
        }

        const price = Number(product.price);
        if (isNaN(price) || price <= 0) {
          errors.push({ field: `line_${i}`, message: `Línea ${i}: precio inválido` });
          continue;
        }

        const stock = Number(product.stock);
        if (isNaN(stock) || stock < 0) {
          errors.push({ field: `line_${i}`, message: `Línea ${i}: stock inválido` });
          continue;
        }

        products.push({
          name: product.name.trim(),
          price: price,
          category: product.category?.trim() || 'general',
          stock: stock,
          description: product.description?.trim() || '',
          image_url: product.image_url?.trim() || ''
        });
      }

      if (errors.length > 0) {
        setImportErrors(errors);
        return;
      }

      setImportErrors([]);
      onBulkImport(products);
      setShowBulkModal(false);
      
    } catch (error) {
      setImportErrors([{ field: 'file', message: 'Error leyendo el archivo' }]);
    }
  }, [onBulkImport]);

  // ✅ ACTUALIZACIÓN MASIVA
  const handleBulkUpdate = useCallback(() => {
    if (selectedProducts.length === 0) return;

    const updates: Partial<Product>[] = selectedProducts.map(productId => {
      const baseUpdate: any = { id: productId };

      if (bulkUpdateFields.category) {
        baseUpdate.category = bulkUpdateFields.category;
      }
      
      if (bulkUpdateFields.is_active !== '') {
        baseUpdate.is_active = bulkUpdateFields.is_active === 'true';
      }
      
      if (bulkUpdateFields.featured !== '') {
        baseUpdate.featured = bulkUpdateFields.featured === 'true';
      }

      // Ajustes de precio
      if (bulkUpdateFields.price_adjustment) {
        const product = products.find(p => (p.id || p.tempId) === productId);
        if (product && product.price) {
          const adjustment = Number(bulkUpdateFields.price_adjustment);
          if (!isNaN(adjustment)) {
            if (bulkUpdateFields.price_adjustment.includes('%')) {
              baseUpdate.price = product.price * (1 + adjustment / 100);
            } else {
              baseUpdate.price = product.price + adjustment;
            }
          }
        }
      }

      // Ajustes de stock
      if (bulkUpdateFields.stock_adjustment) {
        const product = products.find(p => (p.id || p.tempId) === productId);
        if (product && typeof product.stock === 'number') {
          const adjustment = Number(bulkUpdateFields.stock_adjustment);
          if (!isNaN(adjustment)) {
            baseUpdate.stock = Math.max(0, product.stock + adjustment);
          }
        }
      }

      return baseUpdate;
    });

    onBulkUpdate(updates);
    setShowBulkModal(false);
    setBulkUpdateFields({
      category: '',
      is_active: '',
      featured: '',
      price_adjustment: '',
      stock_adjustment: ''
    });
  }, [selectedProducts, bulkUpdateFields, products, onBulkUpdate]);

  // ✅ ELIMINACIÓN MASIVA
  const handleBulkDelete = useCallback(() => {
    if (selectedProducts.length === 0) return;
    
    if (confirm(`¿Estás seguro de eliminar ${selectedProducts.length} productos seleccionados?`)) {
      onBulkDelete(selectedProducts);
      setShowBulkModal(false);
    }
  }, [selectedProducts, onBulkDelete]);

  return (
    <>
      {/* ✅ BARRA DE ACCIONES */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          
          {/* Selección */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedProducts.length === products.length && products.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                Seleccionar todo ({selectedProducts.length}/{products.length})
              </span>
            </label>

            {selectedProducts.length > 0 && (
              <div className="text-sm text-blue-600 font-medium">
                {selectedProducts.length} productos seleccionados
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center space-x-2">
            
            {/* Importar CSV */}
            <button
              onClick={() => {
                setBulkAction('import');
                setShowBulkModal(true);
              }}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Importar CSV</span>
            </button>

            {/* Acciones masivas */}
            {selectedProducts.length > 0 && (
              <>
                <button
                  onClick={() => {
                    setBulkAction('update');
                    setShowBulkModal(true);
                  }}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Editar ({selectedProducts.length})</span>
                </button>

                <button
                  onClick={() => {
                    setBulkAction('delete');
                    setShowBulkModal(true);
                  }}
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Eliminar ({selectedProducts.length})</span>
                </button>
              </>
            )}

            {/* Contador de cambios */}
            {dirtyCount > 0 && (
              <div className="px-3 py-2 bg-yellow-100 text-yellow-800 text-sm rounded-md">
                {dirtyCount} cambios sin guardar
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ MODAL DE ACCIONES MASIVAS */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowBulkModal(false)}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              
              {/* Header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {bulkAction === 'import' && '📥 Importar Productos desde CSV'}
                    {bulkAction === 'update' && `✏️ Editar ${selectedProducts.length} Productos`}
                    {bulkAction === 'delete' && `🗑️ Eliminar ${selectedProducts.length} Productos`}
                  </h3>
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Contenido del modal */}
                <div className="space-y-4">
                  
                  {/* IMPORTAR CSV */}
                  {bulkAction === 'import' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Formato del CSV</h4>
                        <p className="text-sm text-blue-700 mb-2">
                          El archivo debe tener las siguientes columnas (en este orden):
                        </p>
                        <code className="text-xs bg-blue-100 px-2 py-1 rounded block">
                          name,price,category,stock,description,image_url
                        </code>
                      </div>

                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileImport(file);
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>

                      {importErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                          <h4 className="text-sm font-medium text-red-900 mb-2">Errores encontrados:</h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {importErrors.map((error, index) => (
                              <li key={index}>• {error.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* EDITAR MASIVO */}
                  {bulkAction === 'update' && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Los campos que dejes vacíos no se modificarán en los productos seleccionados.
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoría
                          </label>
                          <select
                            value={bulkUpdateFields.category}
                            onChange={(e) => setBulkUpdateFields(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">No cambiar</option>
                            <option value="juguetes">Juguetes</option>
                            <option value="accesorios">Accesorios</option>
                            <option value="lubricantes">Lubricantes</option>
                            <option value="lenceria">Lencería</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estado
                          </label>
                          <select
                            value={bulkUpdateFields.is_active}
                            onChange={(e) => setBulkUpdateFields(prev => ({ ...prev, is_active: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">No cambiar</option>
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Destacado
                          </label>
                          <select
                            value={bulkUpdateFields.featured}
                            onChange={(e) => setBulkUpdateFields(prev => ({ ...prev, featured: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">No cambiar</option>
                            <option value="true">Sí</option>
                            <option value="false">No</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ajuste de precio
                          </label>
                          <input
                            type="text"
                            value={bulkUpdateFields.price_adjustment}
                            onChange={(e) => setBulkUpdateFields(prev => ({ ...prev, price_adjustment: e.target.value }))}
                            placeholder="+10000 o -15%"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ajuste de stock
                        </label>
                        <input
                          type="number"
                          value={bulkUpdateFields.stock_adjustment}
                          onChange={(e) => setBulkUpdateFields(prev => ({ ...prev, stock_adjustment: e.target.value }))}
                          placeholder="+10 o -5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* ELIMINAR MASIVO */}
                  {bulkAction === 'delete' && (
                    <div className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div>
                            <h4 className="text-sm font-medium text-red-900">¿Estás seguro?</h4>
                            <p className="text-sm text-red-700 mt-1">
                              Esta acción eliminará permanentemente {selectedProducts.length} productos y no se puede deshacer.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {bulkAction === 'import' && (
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:w-auto sm:text-sm"
                  >
                    Cerrar
                  </button>
                )}

                {bulkAction === 'update' && (
                  <>
                    <button
                      onClick={handleBulkUpdate}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Actualizar Productos
                    </button>
                    <button
                      onClick={() => setShowBulkModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      Cancelar
                    </button>
                  </>
                )}

                {bulkAction === 'delete' && (
                  <>
                    <button
                      onClick={handleBulkDelete}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Sí, Eliminar
                    </button>
                    <button
                      onClick={() => setShowBulkModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input oculto para archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileImport(file);
        }}
      />
    </>
  );
}