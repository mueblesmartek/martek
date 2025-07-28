// src/components/react/ProductImageGallery.tsx - GALERÍA COMPLETA CON ZOOM Y NAVEGACIÓN
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Product, ProductImage } from '../../lib/types';
import { getAllImages, getPrimaryImage } from '../../lib/types';

interface ProductImageGalleryProps {
  product: Product;
  className?: string;
  showThumbnails?: boolean;
  enableZoom?: boolean;
  enableFullscreen?: boolean;
  autoplay?: boolean;
  autoplayInterval?: number;
}

export function ProductImageGallery({ 
  product, 
  className = '',
  showThumbnails = true,
  enableZoom = true,
  enableFullscreen = true,
  autoplay = false,
  autoplayInterval = 5000
}: ProductImageGalleryProps) {
  
  const images = getAllImages(product);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isPlaying, setIsPlaying] = useState(autoplay);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedImage = images[selectedIndex] || images[0];

  // ✅ AUTOPLAY FUNCTIONALITY
  useEffect(() => {
    if (isPlaying && images.length > 1 && !isFullscreen) {
      intervalRef.current = setInterval(() => {
        setSelectedIndex(prev => (prev + 1) % images.length);
      }, autoplayInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, images.length, isFullscreen, autoplayInterval]);

  // ✅ NAVEGACIÓN CON TECLADO
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextImage();
          break;
        case 'Escape':
          e.preventDefault();
          setIsFullscreen(false);
          setIsZoomed(false);
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  // ✅ NAVEGACIÓN
  const nextImage = useCallback(() => {
    setSelectedIndex(prev => (prev + 1) % images.length);
    setIsLoading(true);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setSelectedIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
    setIsLoading(true);
  }, [images.length]);

  const selectImage = useCallback((index: number) => {
    setSelectedIndex(index);
    setIsLoading(true);
    setIsZoomed(false);
  }, []);

  // ✅ ZOOM FUNCTIONALITY
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableZoom || !isZoomed || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomPosition({ 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)) 
    });
  }, [enableZoom, isZoomed]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/images/placeholder-product.jpg';
    setIsLoading(false);
  }, []);

  const toggleZoom = useCallback(() => {
    if (enableZoom) {
      setIsZoomed(prev => !prev);
    }
  }, [enableZoom]);

  const openFullscreen = useCallback(() => {
    if (enableFullscreen) {
      setIsFullscreen(true);
      setIsPlaying(false);
    }
  }, [enableFullscreen]);

  // ✅ TOUCH GESTURES (básico)
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && images.length > 1) {
      nextImage();
    }
    if (isRightSwipe && images.length > 1) {
      prevImage();
    }
  };

  if (images.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500">Sin imágenes disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* ✅ IMAGEN PRINCIPAL */}
      <div className="relative">
        <div 
          ref={containerRef}
          className={`aspect-square bg-gray-100 rounded-lg overflow-hidden relative group ${
            enableZoom ? 'cursor-zoom-in' : 'cursor-pointer'
          } ${isZoomed ? 'cursor-zoom-out' : ''}`}
          onClick={isZoomed ? toggleZoom : enableFullscreen ? openFullscreen : toggleZoom}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setIsZoomed(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Loading skeleton */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          )}

          {/* Imagen */}
          <img
            ref={imageRef}
            src={selectedImage.url}
            alt={selectedImage.alt || product.name}
            className={`w-full h-full object-cover transition-all duration-300 ${
              isZoomed ? 'scale-150' : 'scale-100'
            }`}
            style={isZoomed ? {
              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
            } : {}}
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
          />

          {/* Overlay de navegación */}
          {images.length > 1 && !isZoomed && (
            <>
              {/* Botón anterior */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Imagen anterior"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Botón siguiente */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Imagen siguiente"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Indicadores */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2">
            {/* Contador */}
            {images.length > 1 && (
              <div className="bg-black bg-opacity-75 text-white text-sm px-3 py-1 rounded-full">
                {selectedIndex + 1} / {images.length}
              </div>
            )}

            {/* Botón autoplay */}
            {images.length > 1 && autoplay && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(prev => !prev);
                }}
                className="w-8 h-8 bg-black bg-opacity-75 hover:bg-opacity-100 text-white rounded-full flex items-center justify-center transition-all"
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
            )}

            {/* Botón fullscreen */}
            {enableFullscreen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openFullscreen();
                }}
                className="w-8 h-8 bg-black bg-opacity-75 hover:bg-opacity-100 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                aria-label="Pantalla completa"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            )}
          </div>

          {/* Indicador de zoom */}
          {enableZoom && !isZoomed && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Click para zoom
            </div>
          )}
        </div>
      </div>

      {/* ✅ THUMBNAILS */}
      {showThumbnails && images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => selectImage(index)}
              className={`aspect-square bg-gray-100 rounded border-2 overflow-hidden transition-all ${
                index === selectedIndex 
                  ? 'border-gray-900 ring-2 ring-gray-200' 
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img
                src={image.url}
                alt={image.alt || `Vista ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/images/placeholder-product.jpg';
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* ✅ MODAL FULLSCREEN */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
          
          {/* Imagen en fullscreen */}
          <div className="relative max-w-screen-lg max-h-screen-lg w-full h-full flex items-center justify-center p-4">
            <img
              src={selectedImage.url}
              alt={selectedImage.alt || product.name}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = '/images/placeholder-product.jpg';
              }}
            />

            {/* Botón cerrar */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full flex items-center justify-center"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navegación en fullscreen */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full flex items-center justify-center"
                  aria-label="Imagen anterior"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full flex items-center justify-center"
                  aria-label="Imagen siguiente"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Contador en fullscreen */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-75 text-white text-sm px-3 py-1 rounded">
                  {selectedIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* Info de la imagen en fullscreen */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-sm px-3 py-2 rounded max-w-xs">
            <p className="font-medium">{product.name}</p>
            {selectedImage.alt && selectedImage.alt !== product.name && (
              <p className="text-gray-300">{selectedImage.alt}</p>
            )}
          </div>

          {/* Ayuda de teclado */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded">
            <p>← → navegar • ESPACIO play/pause • ESC cerrar</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ VERSIÓN SIMPLE PARA LISTAS DE PRODUCTOS
interface ProductImageProps {
  product: Product;
  className?: string;
  showMultipleIndicator?: boolean;
}

export function ProductImage({ 
  product, 
  className = '', 
  showMultipleIndicator = true 
}: ProductImageProps) {
  const images = getAllImages(product);
  const primaryImage = getPrimaryImage(product);
  const hasMultiple = images.length > 1;

  return (
    <div className={`relative bg-gray-100 rounded overflow-hidden ${className}`}>
      <img
        src={primaryImage?.url || '/images/placeholder-product.jpg'}
        alt={primaryImage?.alt || product.name}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = '/images/placeholder-product.jpg';
        }}
      />
      
      {showMultipleIndicator && hasMultiple && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{images.length}</span>
        </div>
      )}
    </div>
  );
}