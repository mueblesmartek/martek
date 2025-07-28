// src/lib/supabase-admin.ts - FUNCIONES ADMIN CORREGIDAS
import { supabase } from './supabase';
import type { Product } from './types';

// Tipo para operaciones bulk
export interface BulkProductOperation {
  action: 'insert' | 'update' | 'delete';
  product: Partial<Product>;
}

// Tipo para resultados bulk
export interface BulkOperationResult {
  success: boolean;
  processed: number;
  errors: Array<{
    product: Partial<Product>;
    error: string;
  }>;
}

/**
 * Insertar múltiples productos de una vez
 */
export async function bulkInsertProducts(products: Partial<Product>[]): Promise<BulkOperationResult> {
  if (!supabase) {
    return {
      success: false,
      processed: 0,
      errors: [{ product: {}, error: 'Supabase no configurado' }]
    };
  }

  try {
    // Validar y preparar productos para inserción
    const validProducts = products.map(product => ({
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      slug: product.slug || generateSlug(product.name || ''),
      category: product.category || '', // ✅ CORREGIDO: usar 'category' no 'category_id'
      stock: product.stock || 0,
      is_active: product.is_active ?? true,
      featured: product.featured ?? false,
      image_url: product.image_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('products')
      .insert(validProducts)
      .select();

    if (error) {
      console.error('Bulk insert error:', error);
      return {
        success: false,
        processed: 0,
        errors: [{ product: {}, error: error.message }]
      };
    }

    return {
      success: true,
      processed: data?.length || 0,
      errors: []
    };

  } catch (err) {
    console.error('Exception during bulk insert:', err);
    return {
      success: false,
      processed: 0,
      errors: [{ product: {}, error: 'Error inesperado durante inserción' }]
    };
  }
}

/**
 * Actualizar múltiples productos de una vez
 */
export async function bulkUpdateProducts(products: Product[]): Promise<BulkOperationResult> {
  if (!supabase) {
    return {
      success: false,
      processed: 0,
      errors: [{ product: {}, error: 'Supabase no configurado' }]
    };
  }

  const errors: Array<{ product: Partial<Product>; error: string }> = [];
  let processed = 0;

  try {
    // Actualizar productos uno por uno para mejor control de errores
    for (const product of products) {
      if (!product.id) {
        errors.push({ product, error: 'ID de producto requerido para actualización' });
        continue;
      }

      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category, // ✅ CORREGIDO: usar 'category' no 'category_id'
          stock: product.stock,
          is_active: product.is_active,
          featured: product.featured,
          image_url: product.image_url,
          slug: product.slug,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (error) {
        errors.push({ product, error: error.message });
      } else {
        processed++;
      }
    }

    return {
      success: errors.length === 0,
      processed,
      errors
    };

  } catch (err) {
    console.error('Exception during bulk update:', err);
    return {
      success: false,
      processed,
      errors: [...errors, { product: {}, error: 'Error inesperado durante actualización' }]
    };
  }
}

/**
 * Eliminar múltiples productos
 */
export async function bulkDeleteProducts(productIds: string[]): Promise<BulkOperationResult> {
  if (!supabase) {
    return {
      success: false,
      processed: 0,
      errors: [{ product: {}, error: 'Supabase no configurado' }]
    };
  }

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', productIds);

    if (error) {
      console.error('Bulk delete error:', error);
      return {
        success: false,
        processed: 0,
        errors: [{ product: {}, error: error.message }]
      };
    }

    return {
      success: true,
      processed: productIds.length,
      errors: []
    };

  } catch (err) {
    console.error('Exception during bulk delete:', err);
    return {
      success: false,
      processed: 0,
      errors: [{ product: {}, error: 'Error inesperado durante eliminación' }]
    };
  }
}

/**
 * Ejecutar operaciones bulk mixtas
 */
export async function executeBulkOperations(operations: BulkProductOperation[]): Promise<BulkOperationResult> {
  const insertOps = operations
    .filter(op => op.action === 'insert')
    .map(op => op.product);
  
  const updateOps = operations
    .filter(op => op.action === 'update')
    .map(op => op.product as Product);
  
  const deleteOps = operations
    .filter(op => op.action === 'delete')
    .map(op => op.product.id)
    .filter(Boolean) as string[];

  let totalProcessed = 0;
  const allErrors: Array<{ product: Partial<Product>; error: string }> = [];

  // Ejecutar inserciones
  if (insertOps.length > 0) {
    const insertResult = await bulkInsertProducts(insertOps);
    totalProcessed += insertResult.processed;
    allErrors.push(...insertResult.errors);
  }

  // Ejecutar actualizaciones
  if (updateOps.length > 0) {
    const updateResult = await bulkUpdateProducts(updateOps);
    totalProcessed += updateResult.processed;
    allErrors.push(...updateResult.errors);
  }

  // Ejecutar eliminaciones
  if (deleteOps.length > 0) {
    const deleteResult = await bulkDeleteProducts(deleteOps);
    totalProcessed += deleteResult.processed;
    allErrors.push(...deleteResult.errors);
  }

  return {
    success: allErrors.length === 0,
    processed: totalProcessed,
    errors: allErrors
  };
}

/**
 * Obtener todas las categorías para el admin
 */
export async function getAdminCategories() {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error getting admin categories:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception getting admin categories:', err);
    return [];
  }
}

/**
 * Crear nueva categoría
 */
export async function createCategory(category: {
  name: string;
  slug?: string;
  description?: string;
}) {
  if (!supabase) {
    throw new Error('Supabase no configurado');
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: category.name,
      slug: category.slug || generateSlug(category.name),
      description: category.description || null,
      is_active: true,
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Validar productos antes de operaciones bulk
 */
export function validateProductsForBulk(products: Partial<Product>[]): Array<{
  product: Partial<Product>;
  errors: string[];
}> {
  return products.map(product => {
    const errors: string[] = [];

    // Validaciones básicas
    if (!product.name?.trim()) {
      errors.push('Nombre es requerido');
    }

    if (!product.price || product.price <= 0) {
      errors.push('Precio debe ser mayor a 0');
    }

    if (product.stock === undefined || product.stock < 0) {
      errors.push('Stock debe ser mayor o igual a 0');
    }

    if (!product.category?.trim()) { // ✅ CORREGIDO: usar 'category' no 'category_id'
      errors.push('Categoría es requerida');
    }

    // Validar slug si está presente
    if (product.slug && !isValidSlug(product.slug)) {
      errors.push('Slug contiene caracteres inválidos');
    }

    return {
      product,
      errors
    };
  });
}

/**
 * Generar estadísticas del admin
 */
export async function getAdminStats() {
  if (!supabase) {
    return null;
  }

  try {
    // Contar productos
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Contar productos activos
    const { count: activeProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Contar productos destacados
    const { count: featuredProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('featured', true);

    // Contar categorías
    const { count: totalCategories } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    return {
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      featuredProducts: featuredProducts || 0,
      totalCategories: totalCategories || 0,
      inactiveProducts: (totalProducts || 0) - (activeProducts || 0)
    };

  } catch (err) {
    console.error('Error getting admin stats:', err);
    return null;
  }
}

/**
 * Buscar productos duplicados
 */
export async function findDuplicateProducts(): Promise<Array<{
  field: string;
  value: string;
  products: Product[];
}>> {
  if (!supabase) {
    return [];
  }

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*');

    if (error || !products) {
      console.error('Error getting products for duplicate check:', error);
      return [];
    }

    const duplicates: Array<{
      field: string;
      value: string;
      products: Product[];
    }> = [];

    // Buscar duplicados por nombre
    const nameGroups = products.reduce((acc, product) => {
      const name = product.name.toLowerCase().trim();
      if (!acc[name]) acc[name] = [];
      acc[name].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    Object.entries(nameGroups).forEach(([name, prods]) => {
      if ((prods as Product[]).length > 1) {
        duplicates.push({
          field: 'name',
          value: name,
          products: prods as Product[]
        });
      }
    });

    // Buscar duplicados por slug
    const slugGroups = products.reduce((acc, product) => {
      if (!product.slug) return acc;
      const slug = product.slug.toLowerCase().trim();
      if (!acc[slug]) acc[slug] = [];
      acc[slug].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    Object.entries(slugGroups).forEach(([slug, prods]) => {
      if ((prods as Product[]).length > 1) {
        duplicates.push({
          field: 'slug',
          value: slug,
          products: prods as Product[]
        });
      }
    });

    return duplicates;

  } catch (err) {
    console.error('Error finding duplicates:', err);
    return [];
  }
}

// Utilidades
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens
    .trim();
}

function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

// Exportar funciones principales
export const AdminSupabase = {
  bulkInsertProducts,
  bulkUpdateProducts,
  bulkDeleteProducts,
  executeBulkOperations,
  getAdminCategories,
  createCategory,
  validateProductsForBulk,
  getAdminStats,
  findDuplicateProducts,
  generateSlug,
  isValidSlug
};