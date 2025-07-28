// src/components/react/ProductImageUploader.tsx
import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface ProductImageUploaderProps {
  onImageUpload: (imageUrl: string | null) => void;
  currentImage?: string;
  disabled?: boolean;
  productName?: string; // Para nombrar mejor el archivo
}

export function ProductImageUploader({ 
  onImageUpload, 
  currentImage, 
  disabled = false,
  productName = 'producto'
}: ProductImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [uploadMethod, setUploadMethod] = useState<'device' | 'url' | 'googledrive'>('device');
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subir archivo desde dispositivo
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file || !supabase) return;

    setIsUploading(true);
    try {
      // Validar archivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor selecciona solo archivos de imagen');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('La imagen es muy grande. Máximo 10MB');
      }

      // Generar nombre único para el producto
      const fileExt = file.name.split('.').pop();
      const cleanName = productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const fileName = `products/${cleanName}-${Date.now()}.${fileExt}`;

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Error subiendo imagen: ${error.message}`);
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;
      setPreviewUrl(publicUrl);
      onImageUpload(publicUrl);
      
      showNotification('✅ Imagen de producto subida exitosamente', 'success');

    } catch (error) {
      console.error('Error uploading image:', error);
      const message = error instanceof Error ? error.message : 'Error subiendo imagen';
      showNotification(message, 'error');
    } finally {
      setIsUploading(false);
    }
  }, [onImageUpload, productName]);

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Manejar drop de archivo
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Subir desde URL (Google Drive, Dropbox, etc.)
  const handleUrlUpload = async () => {
    if (!imageUrl.trim()) {
      showNotification('Por favor ingresa una URL válida', 'error');
      return;
    }

    setIsUploading(true);
    try {
      // Para Google Drive, convertir link de compartir a link directo
      let finalUrl = imageUrl.trim();
      
      // Convertir Google Drive share link a direct link
      if (finalUrl.includes('drive.google.com/file/d/')) {
        const fileId = finalUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)?.[1];
        if (fileId) {
          finalUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
      }

      // Validar que sea una imagen válida
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('No se pudo cargar la imagen desde la URL'));
        img.src = finalUrl;
      });

      setPreviewUrl(finalUrl);
      onImageUpload(finalUrl);
      setImageUrl('');
      showNotification('✅ Imagen cargada desde URL', 'success');

    } catch (error) {
      console.error('Error loading image from URL:', error);
      showNotification('Error cargando imagen desde URL. Verifica que sea una imagen válida y pública', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Abrir Google Drive con instrucciones
  const openGoogleDriveInstructions = () => {
    const instructions = `
🔗 CÓMO SUBIR DESDE GOOGLE DRIVE:

1️⃣ Sube tu imagen a Google Drive
2️⃣ Haz clic derecho en la imagen → "Obtener enlace"
3️⃣ Cambia permisos a "Cualquiera con el enlace puede ver"
4️⃣ Copia el enlace y pégalo en "Desde URL"

O puedes usar el enlace directo que se genera automáticamente.

¿Quieres abrir Google Drive ahora?
    `;
    
    if (confirm(instructions)) {
      window.open('https://drive.google.com', '_blank');
    }
    
    // También cambiar a método URL para facilitar
    setUploadMethod('url');
  };

  // Remover imagen
  const removeImage = () => {
    setPreviewUrl(null);
    onImageUpload(null);
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Mostrar notificación
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const toast = document.createElement('div');
    const bgColor = 
      type === 'error' ? 'bg-gray-900' : 
      type === 'info' ? 'bg-blue-500' : 
      'bg-green-500';

    toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg z-50 transform transition-all duration-300 translate-x-full shadow-lg max-w-sm text-sm`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  return (
    <div className="space-y-4">
      
      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Imagen del producto
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Sube una imagen desde tu dispositivo, Google Drive, o cualquier URL pública
        </p>
      </div>

      {/* Métodos de subida */}
      <div className="flex items-center space-x-2 mb-4">
        <button
          type="button"
          onClick={() => setUploadMethod('device')}
          className={`px-3 py-1.5 text-xs rounded transition-colors ${
            uploadMethod === 'device'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📱 Dispositivo
        </button>
        
        <button
          type="button"
          onClick={() => setUploadMethod('url')}
          className={`px-3 py-1.5 text-xs rounded transition-colors ${
            uploadMethod === 'url'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🔗 URL/Drive
        </button>
        
        <button
          type="button"
          onClick={() => setUploadMethod('googledrive')}
          className={`px-3 py-1.5 text-xs rounded transition-colors ${
            uploadMethod === 'googledrive'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          💾 Instrucciones Drive
        </button>
      </div>

      {/* Área de subida desde dispositivo */}
      {uploadMethod === 'device' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
          
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              disabled || isUploading
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
            }`}
          >
            {isUploading ? (
              <div className="space-y-3">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-600">Subiendo imagen del producto...</p>
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
                    <span className="font-medium text-primary-600">Haz clic para seleccionar</span> o arrastra tu imagen aquí
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG hasta 10MB</p>
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
              placeholder="https://drive.google.com/file/d/... o cualquier URL de imagen"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={disabled || isUploading}
            />
            <button
              type="button"
              onClick={handleUrlUpload}
              disabled={disabled || isUploading || !imageUrl.trim()}
              className="px-4 py-2 bg-primary-500 text-white rounded-md text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? 'Cargando...' : 'Cargar'}
            </button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-700">
              💡 <strong>Google Drive:</strong> Pega el enlace de compartir y se convertirá automáticamente.<br/>
              <strong>Otras URLs:</strong> Cualquier imagen pública (Dropbox, OneDrive, etc.)
            </p>
          </div>
        </div>
      )}

      {/* Google Drive instrucciones */}
      {uploadMethod === 'googledrive' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={openGoogleDriveInstructions}
            disabled={disabled || isUploading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.5 5.5L12 15l5.5-9.5H6.5zm7.5 11L8.5 6H2l3.5 10.5h8.5zM15.5 18H22l-3.5-6h-6.5l3.5 6z"/>
            </svg>
            <span>Ver instrucciones de Google Drive</span>
          </button>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">📋 Pasos para Google Drive:</h4>
            <ol className="text-xs text-green-700 space-y-1 list-decimal list-inside">
              <li>Sube tu imagen a Google Drive</li>
              <li>Haz clic derecho → "Obtener enlace"</li>
              <li>Cambia a "Cualquier persona con el enlace"</li>
              <li>Copia el enlace y úsalo en "URL/Drive"</li>
            </ol>
            <button
              onClick={() => setUploadMethod('url')}
              className="mt-2 text-xs text-green-800 underline hover:text-green-900"
            >
              → Ir a "URL/Drive" para pegar el enlace
            </button>
          </div>
        </div>
      )}

      {/* Preview de imagen */}
      {previewUrl && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Vista previa:</h4>
            <button
              type="button"
              onClick={removeImage}
              className="text-red-500 hover:text-red-700 transition-colors p-1"
              title="Eliminar imagen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          
          <div className="relative">
            <img
              src={previewUrl}
              alt={`Vista previa - ${productName}`}
              className="w-full h-48 object-cover rounded-md border"
              onError={(e) => {
                showNotification('Error cargando imagen. Verifica la URL', 'error');
                (e.target as HTMLImageElement).src = '/images/placeholder-product.jpg';
              }}
            />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
              🖼️ Imagen del producto
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            ✅ Esta imagen se usará como imagen principal del producto
          </p>
        </div>
      )}

      {/* Tips cuando no hay imagen */}
      {!previewUrl && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">💡 Tips para mejores imágenes:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 📐 Usa imágenes cuadradas o rectangulares (1:1 o 4:3)</li>
            <li>• 🔍 Mínimo 800x800 pixeles para buena calidad</li>
            <li>• 💡 Fondo blanco o neutro funciona mejor</li>
            <li>• 📱 Prueba cómo se ve en móvil y desktop</li>
          </ul>
        </div>
      )}
    </div>
  );
}