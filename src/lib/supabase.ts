// src/lib/supabase.ts - ARCHIVO LIMPIO SIN CÓDIGO DE REACT
import { createClient } from '@supabase/supabase-js';
import type { Product, Category, Order } from './types';

// Variables de entorno
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Cliente de Supabase
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ✅ LOG HELPER
function log(message: string, data?: any) {
  console.log(`[SUPABASE] ${message}`, data || '');
}

// ==========================================
// FUNCIONES BÁSICAS DE PRODUCTOS
// ==========================================

/**
 * Obtener productos activos para el frontend
 */
export async function getProducts(): Promise<Product[]> {
  if (!supabase) {
    log('Sin configuración - devolviendo array vacío');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      log('Error obteniendo productos', error.message);
      return [];
    }

    const products = data || [];
    log(`${products.length} productos obtenidos`);
    return products;
  } catch (err) {
    log('Excepción obteniendo productos', err);
    return [];
  }
}

/**
 * Obtener productos destacados
 */
export async function getFeaturedProducts(limit: number = 6): Promise<Product[]> {
  if (!supabase) {
    log('Sin configuración - devolviendo array vacío para productos destacados');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      log('Error obteniendo productos destacados', error.message);
      return [];
    }

    const products = data || [];
    log(`${products.length} productos destacados obtenidos`);
    return products;
  } catch (err) {
    log('Excepción obteniendo productos destacados', err);
    return [];
  }
}

/**
 * Obtener producto por slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!supabase) {
    log('Sin configuración - producto no encontrado');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      log(`Producto con slug "${slug}" no encontrado`, error.message);
      return null;
    }

    log(`Producto encontrado: ${data?.name}`);
    return data;
  } catch (err) {
    log('Excepción obteniendo producto por slug', err);
    return null;
  }
}

/**
 * Buscar productos
 */
export async function searchProducts(searchTerm: string): Promise<Product[]> {
  if (!supabase) {
    log('Sin configuración - búsqueda no disponible');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      log('Error en búsqueda de productos', error.message);
      return [];
    }

    const products = data || [];
    log(`${products.length} productos encontrados para "${searchTerm}"`);
    return products;
  } catch (err) {
    log('Excepción en búsqueda de productos', err);
    return [];
  }
}

/**
 * Obtener categorías
 */
export async function getCategories(): Promise<Category[]> {
  console.log('🔍 getCategories() llamada');
  
  if (!supabase) {
    console.log('❌ Supabase no configurado');
    return [];
  }
  
  try {
    console.log('📡 Haciendo query a categories...');
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    console.log('📊 Raw response:', { data, error });
    
    if (error) {
      console.error('❌ Error de Supabase:', error);
      return [];
    }

    const categories = data || [];
    console.log(`✅ ${categories.length} categorías activas encontradas`);
    
    return categories;
    
  } catch (err) {
    console.error('💥 Excepción en getCategories():', err);
    return [];
  }
}

// ==========================================
// FUNCIONES ADMIN
// ==========================================

/**
 * Obtener productos para admin
 */
export async function getAllProductsForAdmin(): Promise<Product[]> {
  if (!supabase) {
    log('Sin configuración - devolviendo array vacío para admin');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      log('Error obteniendo productos para admin', error.message);
      throw new Error(error.message);
    }

    const products = data || [];
    log(`${products.length} productos obtenidos para admin`);
    return products;
  } catch (err) {
    log('Excepción obteniendo productos para admin', err);
    throw err;
  }
}

/**
 * Crear nuevo producto
 */
export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  if (!supabase) {
    throw new Error('Supabase no configurado');
  }
  
  try {
    // ✅ VALIDAR DATOS ANTES DE INSERTAR
    if (!productData.name?.trim()) {
      throw new Error('Nombre del producto es requerido');
    }
    
    if (!productData.price || productData.price <= 0) {
      throw new Error('Precio debe ser mayor a 0');
    }
    
    if (!productData.category?.trim()) {
      throw new Error('Categoría es requerida');
    }

    // ✅ VALIDAR IMÁGENES SI EXISTEN
    if (productData.images && productData.images.length > 0) {
      const imageValidation = validateImages(productData.images);
      if (!imageValidation.isValid) {
        throw new Error(`Error en imágenes: ${imageValidation.errors.join(', ')}`);
      }
    }

    // ✅ PREPARAR DATOS CON TODAS LAS IMÁGENES HABILITADAS
    const cleanData = {
      name: productData.name.trim(),
      description: productData.description?.trim() || '',
      price: Number(productData.price),
      category: productData.category.trim(),
      stock: Number(productData.stock || 0),
      image_url: productData.image_url || null,
      // 🟢 HABILITAR MÚLTIPLES IMÁGENES
      images: productData.images && productData.images.length > 0 ? productData.images : [],
      is_active: Boolean(productData.is_active ?? true),
      featured: Boolean(productData.featured ?? false),
      slug: productData.slug || generateSlug(productData.name),
      meta_title: productData.meta_title || null,
      meta_description: productData.meta_description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('🔄 Creando producto CON images:', {
      name: cleanData.name,
      imageCount: cleanData.images.length,
      hasImageUrl: !!cleanData.image_url
    });

    const { data, error } = await supabase
      .from('products')
      .insert(cleanData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error de Supabase:', error);
      throw new Error(`Error de base de datos: ${error.message}`);
    }

    console.log('✅ Producto creado con', data.images?.length || 0, 'imágenes');
    log(`Producto creado: ${data?.name} con ${data.images?.length || 0} imágenes`);
    return data;
  } catch (err) {
    console.error('❌ Excepción creando producto:', err);
    log('Excepción creando producto', err);
    throw err;
  }
}

/**
 * Actualizar producto existente
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  if (!supabase) {
    throw new Error('Supabase no configurado');
  }
  
  try {
    console.log(`🔄 Actualizando producto ID: ${id}`);
    
    // ✅ VALIDAR IMÁGENES SI EXISTEN EN LA ACTUALIZACIÓN
    if (updates.images !== undefined && updates.images && updates.images.length > 0) {
      const imageValidation = validateImages(updates.images);
      if (!imageValidation.isValid) {
        throw new Error(`Error en imágenes: ${imageValidation.errors.join(', ')}`);
      }
    }
    
    // ✅ CREAR OBJETO LIMPIO MANUALMENTE
    const cleanUpdates: Record<string, any> = {};
    
    // Procesar cada campo individualmente
    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.description !== undefined) cleanUpdates.description = updates.description;
    if (updates.price !== undefined) cleanUpdates.price = updates.price;
    if (updates.category !== undefined) cleanUpdates.category = updates.category;
    if (updates.stock !== undefined) cleanUpdates.stock = updates.stock;
    if (updates.image_url !== undefined) cleanUpdates.image_url = updates.image_url;
    
    // 🟢 HABILITAR CAMPO IMAGES
    if (updates.images !== undefined) {
      cleanUpdates.images = updates.images && updates.images.length > 0 ? updates.images : [];
    }
    
    if (updates.is_active !== undefined) cleanUpdates.is_active = updates.is_active;
    if (updates.featured !== undefined) cleanUpdates.featured = updates.featured;
    if (updates.slug !== undefined) cleanUpdates.slug = updates.slug;
    if (updates.meta_title !== undefined) cleanUpdates.meta_title = updates.meta_title;
    if (updates.meta_description !== undefined) cleanUpdates.meta_description = updates.meta_description;
    
    // Siempre actualizar timestamp
    cleanUpdates.updated_at = new Date().toISOString();

    console.log('🔄 Actualizando con', cleanUpdates.images?.length || 0, 'imágenes');

    const { data, error } = await supabase
      .from('products')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando producto:', error);
      throw new Error(error.message);
    }

    console.log('✅ Producto actualizado con', data.images?.length || 0, 'imágenes');
    log(`Producto actualizado: ${data?.name} con ${data.images?.length || 0} imágenes`);
    return data;
  } catch (err) {
    console.error('❌ Excepción actualizando producto:', err);
    log('Excepción actualizando producto', err);
    throw err;
  }
}

export async function migrateImageUrlToImages(productId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no configurado');
  }

  try {
    // Obtener producto actual
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, name, image_url, images')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      console.log('❌ No se pudo obtener producto para migración');
      return;
    }

    // Si ya tiene múltiples imágenes, no migrar
    if (product.images && product.images.length > 0) {
      console.log('✅ Producto ya tiene múltiples imágenes');
      return;
    }

    // Si tiene image_url, convertir a formato múltiple
    if (product.image_url) {
      const migratedImages = [{
        id: `migrated_${Date.now()}`,
        url: product.image_url,
        alt: product.name || 'Imagen del producto',
        isPrimary: true,
        sortOrder: 0
      }];

      await updateProduct(productId, { images: migratedImages });
      console.log('✅ Imagen migrada de image_url a images array');
    }
  } catch (err) {
    console.error('❌ Error migrando imagen:', err);
  }
}

function validateImages(images: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(images)) {
    return { isValid: false, errors: ['Images debe ser un array'] };
  }
  
  if (images.length === 0) {
    return { isValid: true, errors: [] }; // Vacío es válido
  }
  
  // Verificar que hay al menos una imagen primary
  const primaryImages = images.filter(img => img.isPrimary);
  if (primaryImages.length === 0) {
    errors.push('Debe haber al menos una imagen marcada como principal');
  } else if (primaryImages.length > 1) {
    errors.push('Solo puede haber una imagen principal');
  }
  
  // Verificar IDs únicos
  const ids = images.map(img => img.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push('Los IDs de las imágenes deben ser únicos');
  }
  
  // Verificar URLs válidas
  images.forEach((img, index) => {
    if (!img.url || !img.url.trim()) {
      errors.push(`La imagen ${index + 1} no tiene URL válida`);
    }
    if (!img.id || !img.id.trim()) {
      errors.push(`La imagen ${index + 1} no tiene ID válido`);
    }
    if (typeof img.isPrimary !== 'boolean') {
      errors.push(`La imagen ${index + 1} debe tener isPrimary como boolean`);
    }
    if (typeof img.sortOrder !== 'number') {
      errors.push(`La imagen ${index + 1} debe tener sortOrder como número`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
/**
 * Obtener categoría por slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!supabase) {
    log('Sin configuración - categoría no encontrada');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      log(`Categoría con slug "${slug}" no encontrada`, error.message);
      return null;
    }

    log(`Categoría encontrada: ${data?.name}`);
    return data;
  } catch (err) {
    log('Excepción obteniendo categoría por slug', err);
    return null;
  }
}

/**
 * Obtener productos por categoría
 */
export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  if (!supabase) {
    log('Sin configuración - devolviendo array vacío');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', categorySlug)
      .eq('is_active', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      log('Error obteniendo productos por categoría', error.message);
      return [];
    }

    const products = data || [];
    log(`${products.length} productos obtenidos para categoría "${categorySlug}"`);
    return products;
  } catch (err) {
    log('Excepción obteniendo productos por categoría', err);
    return [];
  }
}

/**
 * Eliminar producto
 */
export async function deleteProduct(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no configurado');
  }
  
  try {
    console.log(`🗑️ Eliminando producto ID: ${id}`);

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error eliminando producto:', error);
      throw new Error(error.message);
    }

    console.log('✅ Producto eliminado correctamente');
    log(`Producto eliminado: ${id}`);
  } catch (err) {
    console.error('❌ Excepción eliminando producto:', err);
    log('Excepción eliminando producto', err);
    throw err;
  }
}

/**
 * Insertar múltiples productos
 */
export async function bulkInsertProducts(products: Omit<Product, 'id' | 'created_at' | 'updated_at'>[]): Promise<Product[]> {
  if (!supabase) {
    throw new Error('Supabase no configurado');
  }
  
  try {
    console.log(`➕ Insertando ${products.length} productos`);

    const productsWithTimestamps = products.map(product => ({
      ...product,
      featured: Boolean(product.featured),
      is_active: Boolean(product.is_active),
      images: product.images && product.images.length > 0 ? product.images : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('products')
      .insert(productsWithTimestamps)
      .select();

    if (error) {
      console.error('❌ Error en bulkInsertProducts:', error);
      throw new Error(error.message);
    }

    console.log(`✅ ${data?.length || 0} productos insertados correctamente`);
    log(`${data?.length || 0} productos insertados masivamente`);
    return data || [];
  } catch (err) {
    console.error('❌ Excepción en bulkInsertProducts:', err);
    log('Excepción en inserción masiva', err);
    throw err;
  }
}

// ==========================================
// FUNCIONES DE ÓRDENES
// ==========================================

/**
 * Crear nueva orden
 */
export async function createOrder(orderData: {
  user_id?: string;
  items: any[];
  total: number;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  shipping_address: any;
  billing_address?: any;
  payment_method?: string;
  customer_notes?: string;
}): Promise<any> {
  if (!supabase) {
    throw new Error('Supabase no configurado');
  }
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...orderData,
        payment_status: 'pending',
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      log('Error creando orden', error.message);
      throw new Error(error.message);
    }

    log(`Orden creada: ${data?.order_number}`);
    return data;
  } catch (err) {
    log('Excepción creando orden', err);
    throw err;
  }
}

/**
 * Obtener órdenes por usuario
 */
export async function getUserOrders(userId: string): Promise<any[]> {
  if (!supabase) {
    log('Sin configuración - devolviendo órdenes vacías');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      log('Error obteniendo órdenes del usuario', error.message);
      return [];
    }

    const orders = data || [];
    log(`${orders.length} órdenes obtenidas para usuario ${userId}`);
    return orders;
  } catch (err) {
    log('Excepción obteniendo órdenes del usuario', err);
    return [];
  }
}

/**
 * Obtener orden por ID
 */
export async function getOrderById(orderId: string): Promise<any | null> {
  if (!supabase) {
    log('Sin configuración - orden no encontrada');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      log('Error obteniendo orden por ID', error.message);
      return null;
    }

    log(`Orden obtenida: ${data?.order_number}`);
    return data;
  } catch (err) {
    log('Excepción obteniendo orden por ID', err);
    return null;
  }
}

/**
 * Actualizar estado de orden
 */
export async function updateOrderStatus(orderId: string, status: string): Promise<any> {
  if (!supabase) {
    throw new Error('Supabase no configurado');
  }
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'shipped' && { shipped_at: new Date().toISOString() }),
        ...(status === 'delivered' && { delivered_at: new Date().toISOString() })
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      log('Error actualizando estado de orden', error.message);
      throw new Error(error.message);
    }

    log(`Estado de orden actualizado: ${data?.order_number} -> ${status}`);
    return data;
  } catch (err) {
    log('Excepción actualizando estado de orden', err);
    throw err;
  }
}

// ==========================================
// FUNCIONES DE ESTADÍSTICAS
// ==========================================

/**
 * Obtener estadísticas básicas para el dashboard
 */
export async function getAdminStats() {
  const defaultStats = {
    totalProducts: 0,
    activeProducts: 0,
    featuredProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0
  };

  if (!supabase) {
    log('Sin configuración - devolviendo estadísticas por defecto');
    return defaultStats;
  }

  try {
    // Obtener conteos básicos
    const [
      { count: totalProducts },
      { count: activeProducts },
      { count: featuredProducts },
      { count: lowStockProducts },
      { count: totalOrders }
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('featured', true),
      supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock', 10),
      supabase.from('orders').select('*', { count: 'exact', head: true })
    ]);

    // Calcular revenue (opcional, puede fallar si no hay tabla orders)
    let totalRevenue = 0;
    try {
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total')
        .eq('payment_status', 'completed');
      
      totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    } catch (revenueError) {
      log('Error calculando revenue (normal si no hay órdenes)', revenueError);
    }

    const stats = {
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      featuredProducts: featuredProducts || 0,
      totalOrders: totalOrders || 0,
      totalRevenue,
      lowStockProducts: lowStockProducts || 0
    };

    log('Estadísticas cargadas', stats);
    return stats;

  } catch (err) {
    log('Error obteniendo estadísticas', err);
    return defaultStats;
  }
}

// ==========================================
// UTILIDADES
// ==========================================

/**
 * Generar slug desde texto
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens
    .trim();
}

/**
 * Obtener todas las funciones disponibles (para debug)
 */
export function getAvailableFunctions(): string[] {
  return [
    'getProducts',
    'getFeaturedProducts', 
    'getProductBySlug',
    'searchProducts',
    'getCategories',
    'getAllProductsForAdmin',
    'createProduct',
    'updateProduct',
    'deleteProduct',
    'bulkInsertProducts',
    'createOrder',
    'getUserOrders',
    'getOrderById',
    'updateOrderStatus',
    'getAdminStats',
    'generateSlug'
  ];
}