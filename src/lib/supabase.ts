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

// ==========================================
// FUNCIONES ADMIN - BÁSICAS
// ==========================================

/**
 * ✅ FUNCIÓN CRÍTICA: Obtener TODOS los productos para admin
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
 * ✅ Obtener estadísticas básicas para el dashboard
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

/**
 * ✅ Crear nuevo producto
 */
export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  if (!supabase) {
    throw new Error('Supabase no configurado');
  }
  
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      log('Error creando producto', error.message);
      throw new Error(error.message);
    }

    log(`Producto creado: ${data?.name}`);
    return data;
  } catch (err) {
    log('Excepción creando producto', err);
    throw err;
  }
}

/**
 * ✅ Actualizar producto existente
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  if (!supabase) {
    throw new Error('Supabase no configurado');
  }
  
  try {
    console.log(`🔄 Actualizando producto ID: ${id}`);
    console.log('📝 Datos a actualizar:', {
      name: updates.name,
      featured: updates.featured,
      is_active: updates.is_active,
      price: updates.price,
      stock: updates.stock
    });

    // ✅ ASEGURAR que los booleanos sean realmente booleanos
    const cleanUpdates = {
      ...updates,
      featured: updates.featured !== undefined ? Boolean(updates.featured) : undefined,
      is_active: updates.is_active !== undefined ? Boolean(updates.is_active) : undefined,
      updated_at: new Date().toISOString()
    };

    // ✅ Remover campos undefined para evitar problemas
    Object.keys(cleanUpdates).forEach(key => {
      if (cleanUpdates[key] === undefined) {
        delete cleanUpdates[key];
      }
    });

    console.log('🧹 Datos limpiados para DB:', cleanUpdates);

    const { data, error } = await supabase
      .from('products')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error en updateProduct:', error);
      throw new Error(error.message);
    }

    console.log('✅ Producto actualizado en DB:', {
      id: data.id,
      name: data.name,
      featured: data.featured,
      is_active: data.is_active
    });

    log(`Producto actualizado: ${data?.name}`);
    return data;
  } catch (err) {
    console.error('❌ Excepción en updateProduct:', err);
    log('Excepción actualizando producto', err);
    throw err;
  }
}

/**
 * ✅ FUNCIÓN QUE FALTABA: Eliminar producto
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
 * ✅ Inserción masiva de productos (para importar CSV)
 */
export async function bulkInsertProducts(products: Omit<Product, 'id' | 'created_at' | 'updated_at'>[]): Promise<Product[]> {
  if (!supabase) {
    throw new Error('Supabase no configurado');
  }
  
  try {
    console.log(`➕ Insertando ${products.length} productos:`);
    products.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name}: featured=${product.featured}, active=${product.is_active}`);
    });

    const productsWithTimestamps = products.map(product => ({
      ...product,
      // ✅ ASEGURAR que los booleanos sean correctos
      featured: Boolean(product.featured),
      is_active: Boolean(product.is_active),
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
    data?.forEach((product, index) => {
      if (index < 3) { // Solo los primeros 3
        console.log(`  ✓ ${product.name}: featured=${product.featured}, active=${product.is_active}`);
      }
    });

    log(`${data?.length || 0} productos insertados masivamente`);
    return data || [];
  } catch (err) {
    console.error('❌ Excepción en bulkInsertProducts:', err);
    log('Excepción en inserción masiva', err);
    throw err;
  }
}

// ==========================================
// FUNCIONES DE CATEGORÍAS
// ==========================================

/**
 * Obtener categorías activas
 */
export async function getCategories(): Promise<Category[]> {
  if (!supabase) {
    log('Sin configuración - devolviendo categorías vacías');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      log('Error obteniendo categorías', error.message);
      return [];
    }

    const categories = data || [];
    log(`${categories.length} categorías obtenidas`);
    return categories;
  } catch (err) {
    log('Excepción obteniendo categorías', err);
    return [];
  }
}

// ==========================================
// FUNCIONES DE UTILIDAD
// ==========================================

/**
 * ✅ Generar slug desde texto
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens
    .trim();
}


/**
 * ✅ Verificar conexión a Supabase
 */
export function testConnection(): boolean {
  if (!supabase) {
    log('❌ No hay conexión a Supabase');
    return false;
  }
  
  log('✅ Conexión a Supabase disponible');
  return true;
}
// ✅ AGREGAR ESTAS FUNCIONES AL ARCHIVO src/lib/supabase.ts

/**
 * ✅ Obtener pedidos por email del cliente
 */
export async function getOrdersByEmail(email: string): Promise<Order[]> {
  if (!supabase) {
    log('Sin configuración - no se pueden obtener pedidos');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .contains('shipping_address', { email: email.toLowerCase().trim() })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      log('Error obteniendo pedidos por email', error.message);
      return [];
    }

    const orders = data || [];
    log(`${orders.length} pedidos encontrados para ${email}`);
    return orders;
  } catch (err) {
    log('Excepción obteniendo pedidos por email', err);
    return [];
  }
}

/**
 * ✅ Obtener pedido por número de orden
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  if (!supabase) {
    log('Sin configuración - no se puede obtener pedido');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber.trim())
      .single();

    if (error) {
      log('Error obteniendo pedido por número', error.message);
      return null;
    }

    log(`Pedido ${orderNumber} encontrado`);
    return data;
  } catch (err) {
    log('Excepción obteniendo pedido por número', err);
    return null;
  }
}

/**
 * ✅ Buscar pedidos por email O número de orden
 */
export async function searchOrders(searchParams: {
  email?: string;
  orderNumber?: string;
}): Promise<Order[]> {
  if (!supabase) {
    log('Sin configuración - no se pueden buscar pedidos');
    return [];
  }

  try {
    // Si hay número de orden, buscar por eso (más específico)
    if (searchParams.orderNumber?.trim()) {
      const order = await getOrderByNumber(searchParams.orderNumber);
      return order ? [order] : [];
    }
    
    // Si hay email, buscar por email
    if (searchParams.email?.trim()) {
      return await getOrdersByEmail(searchParams.email);
    }

    log('No hay parámetros de búsqueda válidos');
    return [];
  } catch (err) {
    log('Error en búsqueda de pedidos', err);
    return [];
  }
}

/**
 * ✅ Obtener estadísticas de pedidos para un email
 */
export async function getOrderStatsForEmail(email: string) {
  if (!supabase) {
    return null;
  }

  try {
    const orders = await getOrdersByEmail(email);
    
    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
      completedOrders: orders.filter(order => order.payment_status === 'completed').length,
      pendingOrders: orders.filter(order => order.payment_status === 'pending').length,
      lastOrderDate: orders.length > 0 ? orders[0].created_at : null
    };

    log(`Estadísticas calculadas para ${email}`, stats);
    return stats;
  } catch (err) {
    log('Error calculando estadísticas de pedidos', err);
    return null;
  }
}