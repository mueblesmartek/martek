// src/components/react/ProductMultiImageUploader.tsx - GESTOR DE MÚLTIPLES IMÁGENES
import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { ProductImage } from '../../lib/types';

interface ProductMultiImageUploaderProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  disabled?: boolean;
  productName?: string;
  maxImages?: number;
}

export function ProductMultiImageUploader({ 
  images = [],
  onImagesChange,
  disabled = false,
  productName = 'producto',
  maxImages = 5
}: ProductMultiImageUploaderProps) {
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'device' | 'url'>('device');
  const [imageUrl, setImageUrl] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ SUBIR ARCHIVO DESDE DISPOSITIVO
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files || files.length === 0 || !supabase) return;

    setIsUploading(true);
    const newImages: ProductImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validar archivo
        if (!file.type.startsWith('image/')) {
          console.warn(`Archivo ${file.name} no es una imagen`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          console.warn(`Archivo ${file.name} es muy grande (máximo 10MB)`);
          continue;
        }

        // Generar nombre único
        const fileExt = file.name.split('.').pop();
        const cleanName = productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const fileName = `products/${cleanName}-${Date.now()}-${i}.${fileExt}`;

        // Subir a Supabase Storage
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error(`Error subiendo ${file.name}:`, error);
          continue;
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);

        newImages.push({
          id: `img_${Date.now()}_${i}`,
          url: urlData.publicUrl,
          alt: file.name.replace(/\.[^/.]+$/, ''),
          isPrimary: images.length === 0 && i === 0, // Primera imagen es primary si no hay otras
          sortOrder: images.length + i
        });
      }

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages].slice(0, maxImages);
        onImagesChange(updatedImages);
        showNotification(`✅ ${newImages.length} imagen(es) subida(s) exitosamente`, 'success');
      }

    } catch (error) {
      console.error('Error uploading images:', error);
      showNotification('Error subiendo imágenes', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [images, onImagesChange, productName, maxImages]);

  // ✅ SUBIR DESDE URL
  const handleUrlUpload = useCallback(async () => {
    if (!imageUrl.trim() || images.length >= maxImages) return;

    const newImage: ProductImage = {
      id: `img_${Date.now()}`,
      url: imageUrl.trim(),
      isPrimary: images.length === 0,
      sortOrder: images.length
    };

    const updatedImages = [...images, newImage];
    onImagesChange(updatedImages);
    setImageUrl('');
    showNotification('✅ Imagen agregada desde URL', 'success');
  }, [imageUrl, images, onImagesChange, maxImages]);

  // ✅ ELIMINAR IMAGEN
  const removeImage = useCallback((imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    
    // Si eliminamos la imagen primary, hacer primary a la primera
    if (updatedImages.length > 0) {
      const hasPrimary = updatedImages.some(img => img.isPrimary);
      if (!hasPrimary) {
        updatedImages[0].isPrimary = true;
      }
    }
    
    onImagesChange(updatedImages);
    showNotification('🗑️ Imagen eliminada', 'info');
  }, [images, onImagesChange]);

  // ✅ MARCAR COMO IMAGEN PRINCIPAL
  const setPrimaryImage = useCallback((imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  // ✅ REORDENAR IMÁGENES (DRAG & DROP)
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    
    // Remover el item arrastrado
    newImages.splice(draggedIndex, 1);
    
    // Insertar en la nueva posición
    newImages.splice(dropIndex, 0, draggedItem);
    
    // Actualizar sortOrder
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      sortOrder: index
    }));
    
    onImagesChange(updatedImages);
    setDraggedIndex(null);
  };

  // ✅ FUNCIONES DE UTILIDAD
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    // Simple notification - puedes usar tu sistema existente
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-6">
      
      {/* ✅ HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          🖼️ Imágenes del Producto ({images.length}/{maxImages})
        </h3>
        
        {images.length > 0 && (
          <div className="text-sm text-gray-500">
            Arrastra para reordenar • Click en ⭐ para marcar como principal
          </div>
        )}
      </div>

      {/* ✅ GALERÍA DE IMÁGENES EXISTENTES */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable={!disabled}
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`relative group border-2 rounded-lg overflow-hidden transition-all ${
                image.isPrimary ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              } ${draggedIndex === index ? 'opacity-50' : ''} ${
                disabled ? 'cursor-not-allowed' : 'cursor-move'
              }`}
            >
              {/* Imagen */}
              <div className="aspect-square bg-gray-100">
                <img
                  src={image.url}
                  alt={image.alt || `Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder-product.jpg';
                  }}
                />
              </div>

              {/* Overlay con controles */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  
                  {/* Botón Primary */}
                  <button
                    type="button"
                    onClick={() => setPrimaryImage(image.id)}
                    disabled={disabled || image.isPrimary}
                    className={`p-2 rounded-full text-white transition-colors ${
                      image.isPrimary 
                        ? 'bg-blue-500 cursor-default' 
                        : 'bg-gray-700 hover:bg-blue-500'
                    }`}
                    title={image.isPrimary ? 'Imagen principal' : 'Marcar como principal'}
                  >
                    ⭐
                  </button>

                  {/* Botón Eliminar */}
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    disabled={disabled}
                    className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                    title="Eliminar imagen"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Badge de imagen principal */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Principal
                </div>
              )}

              {/* Número de orden */}
              <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ MÉTODOS DE SUBIDA */}
      {canAddMore && !disabled && (
        <div className="space-y-4">
          
          {/* Pestañas de métodos */}
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setUploadMethod('device')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                uploadMethod === 'device'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📱 Desde Dispositivo
            </button>
            <button
              type="button"
              onClick={() => setUploadMethod('url')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                uploadMethod === 'url'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🔗 Desde URL
            </button>
          </div>

          {/* Área de subida desde dispositivo */}
          {uploadMethod === 'device' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                disabled={isUploading}
              />
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isUploading
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                {isUploading ? (
                  <div className="space-y-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-gray-600">Subiendo imágenes...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600">Haz clic para seleccionar</span> o arrastra imágenes aquí
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, JPEG hasta 10MB • Máximo {maxImages - images.length} imágenes más
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Área de subida desde URL */}
          {uploadMethod === 'url' && (
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleUrlUpload}
                  disabled={!imageUrl.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ MENSAJE CUANDO SE ALCANZA EL LÍMITE */}
      {!canAddMore && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-700">
            ⚠️ Límite alcanzado: máximo {maxImages} imágenes por producto
          </p>
        </div>
      )}

      {/* ✅ ESTADO VACÍO */}
      {images.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Sin imágenes</h4>
          <p className="text-sm text-gray-600">
            Agrega imágenes para mostrar tu producto desde diferentes ángulos
          </p>
        </div>
      )}
    </div>
  );
}