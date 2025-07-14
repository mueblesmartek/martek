// src/lib/airtable/products.ts
import { base, TABLES, FIELDS, PRODUCT_STATUS, airtableUtils } from './config';
import type { Product, ProductFilter } from '../../types/product';

// Caché simple en memoria
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Función para obtener datos del caché
const getFromCache = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

// Función para guardar en caché
const setCache = (key: string, data: any, ttl: number) => {
  cache.set(key, { data, timestamp: Date.now(), ttl });
};

// Convertir registro de Airtable a objeto Product
const airtableToProduct = (record: any): Product => {
  const fields = record.fields;
  
  return {
    id: fields[FIELDS.PRODUCTS.ID] || record.id,
    name: fields[FIELDS.PRODUCTS.NAME] || '',
    description: fields[FIELDS.PRODUCTS.DESCRIPTION] || '',
    price: parseFloat(fields[FIELDS.PRODUCTS.PRICE] || '0'),
    originalPrice: fields[FIELDS.PRODUCTS.ORIGINAL_PRICE] ? parseFloat(fields[FIELDS.PRODUCTS.ORIGINAL_PRICE]) : undefined,
    images: fields[FIELDS.PRODUCTS.IMAGES] || [],
    category: fields[FIELDS.PRODUCTS.CATEGORY] || '',
    subcategory: fields[FIELDS.PRODUCTS.SUBCATEGORY],
    brand: fields[FIELDS.PRODUCTS.BRAND],
    inStock: Boolean(fields[FIELDS.PRODUCTS.IN_STOCK]),
    stockQuantity: parseInt(fields[FIELDS.PRODUCTS.STOCK_QUANTITY] || '0'),
    sku: fields[FIELDS.PRODUCTS.SKU],
    featured: Boolean(fields[FIELDS.PRODUCTS.FEATURED]),
    isNew: Boolean(fields[FIELDS.PRODUCTS.IS_NEW]),
    rating: fields[FIELDS.PRODUCTS.RATING] ? parseFloat(fields[FIELDS.PRODUCTS.RATING]) : undefined,
    reviewCount: fields[FIELDS.PRODUCTS.REVIEW_COUNT] ? parseInt(fields[FIELDS.PRODUCTS.REVIEW_COUNT]) : undefined,
    tags: fields[FIELDS.PRODUCTS.TAGS] || [],
    specifications: fields[FIELDS.PRODUCTS.SPECIFICATIONS] ? JSON.parse(fields[FIELDS.PRODUCTS.SPECIFICATIONS]) : undefined,
    variants: fields[FIELDS.PRODUCTS.VARIANTS] ? JSON.parse(fields[FIELDS.PRODUCTS.VARIANTS]) : undefined,
    status: fields[FIELDS.PRODUCTS.STATUS] || PRODUCT_STATUS.ACTIVE,
    createdAt: fields[FIELDS.PRODUCTS.CREATED_AT] || record._rawJson?.createdTime || '',
    updatedAt: fields[FIELDS.PRODUCTS.UPDATED_AT] || ''
  };
};

// Obtener todos los productos con filtros
export const getProducts = async (filters?: ProductFilter): Promise<Product[]> => {
  try {
    const cacheKey = `products_${JSON.stringify(filters || {})}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    // Construir fórmula de filtro para Airtable
    const filterFormulas: string[] = [];
    
    // Solo productos activos por defecto
    filterFormulas.push(`{${FIELDS.PRODUCTS.STATUS}} = '${PRODUCT_STATUS.ACTIVE}'`);
    
    if (filters?.category) {
      filterFormulas.push(`{${FIELDS.PRODUCTS.CATEGORY}} = '${filters.category}'`);
    }
    
    if (filters?.inStock) {
      filterFormulas.push(`{${FIELDS.PRODUCTS.IN_STOCK}} = TRUE()`);
    }
    
    if (filters?.featured) {
      filterFormulas.push(`{${FIELDS.PRODUCTS.FEATURED}} = TRUE()`);
    }
    
    if (filters?.minPrice || filters?.maxPrice) {
      if (filters.minPrice) {
        filterFormulas.push(`{${FIELDS.PRODUCTS.PRICE}} >= ${filters.minPrice}`);
      }
      if (filters.maxPrice) {
        filterFormulas.push(`{${FIELDS.PRODUCTS.PRICE}} <= ${filters.maxPrice}`);
      }
    }
    
    if (filters?.search) {
      filterFormulas.push(`OR(
        SEARCH('${filters.search}', {${FIELDS.PRODUCTS.NAME}}),
        SEARCH('${filters.search}', {${FIELDS.PRODUCTS.DESCRIPTION}})
      )`);
    }

    // Configurar parámetros de consulta
    const queryParams: any = {
      maxRecords: 100,
      pageSize: 50
    };

    if (filterFormulas.length > 0) {
      queryParams.filterByFormula = filterFormulas.length === 1 
        ? filterFormulas[0]
        : `AND(${filterFormulas.join(', ')})`;
    }

    // Configurar ordenamiento
    if (filters?.sortBy) {
      const sortField = getSortField(filters.sortBy);
      queryParams.sort = [{
        field: sortField,
        direction: filters.sortOrder === 'desc' ? 'desc' : 'asc'
      }];
    }

    const records = await base(TABLES.PRODUCTS)
      .select(queryParams)
      .all();

    const products = records.map(airtableToProduct);
    
    // Guardar en caché por 5 minutos
    setCache(cacheKey, products, 5 * 60 * 1000);
    
    return products;

  } catch (error) {
    airtableUtils.handleError(error);
    return [];
  }
};

// Obtener un producto por ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const cacheKey = `product_${id}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const record = await base(TABLES.PRODUCTS).find(id);
    const product = airtableToProduct(record);
    
    // Guardar en caché por 10 minutos
    setCache(cacheKey, product, 10 * 60 * 1000);
    
    return product;

  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }
    airtableUtils.handleError(error);
    return null;
  }
};

// Obtener productos por categoría
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  return getProducts({ category });
};

// Obtener productos destacados
export const getFeaturedProducts = async (limit: number = 8): Promise<Product[]> => {
  try {
    const cacheKey = `featured_products_${limit}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const records = await base(TABLES.PRODUCTS)
      .select({
        filterByFormula: `AND(
          {${FIELDS.PRODUCTS.FEATURED}} = TRUE(),
          {${FIELDS.PRODUCTS.STATUS}} = '${PRODUCT_STATUS.ACTIVE}',
          {${FIELDS.PRODUCTS.IN_STOCK}} = TRUE()
        )`,
        maxRecords: limit,
        sort: [{ field: FIELDS.PRODUCTS.CREATED_AT, direction: 'desc' }]
      })
      .all();

    const products = records.map(airtableToProduct);
    
    // Guardar en caché por 15 minutos
    setCache(cacheKey, products, 15 * 60 * 1000);
    
    return products;

  } catch (error) {
    airtableUtils.handleError(error);
    return [];
  }
};

// Obtener productos nuevos
export const getNewProducts = async (limit: number = 8): Promise<Product[]> => {
  try {
    const cacheKey = `new_products_${limit}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const records = await base(TABLES.PRODUCTS)
      .select({
        filterByFormula: `AND(
          {${FIELDS.PRODUCTS.IS_NEW}} = TRUE(),
          {${FIELDS.PRODUCTS.STATUS}} = '${PRODUCT_STATUS.ACTIVE}',
          {${FIELDS.PRODUCTS.IN_STOCK}} = TRUE()
        )`,
        maxRecords: limit,
        sort: [{ field: FIELDS.PRODUCTS.CREATED_AT, direction: 'desc' }]
      })
      .all();

    const products = records.map(airtableToProduct);
    
    // Guardar en caché por 15 minutos
    setCache(cacheKey, products, 15 * 60 * 1000);
    
    return products;

  } catch (error) {
    airtableUtils.handleError(error);
    return [];
  }
};

// Obtener productos relacionados
export const getRelatedProducts = async (productId: string, limit: number = 6): Promise<Product[]> => {
  try {
    // Primero obtener el producto actual para conocer su categoría
    const currentProduct = await getProductById(productId);
    if (!currentProduct) return [];

    const records = await base(TABLES.PRODUCTS)
      .select({
        filterByFormula: `AND(
          {${FIELDS.PRODUCTS.CATEGORY}} = '${currentProduct.category}',
          {${FIELDS.PRODUCTS.ID}} != '${productId}',
          {${FIELDS.PRODUCTS.STATUS}} = '${PRODUCT_STATUS.ACTIVE}',
          {${FIELDS.PRODUCTS.IN_STOCK}} = TRUE()
        )`,
        maxRecords: limit,
        sort: [{ field: FIELDS.PRODUCTS.RATING, direction: 'desc' }]
      })
      .all();

    return records.map(airtableToProduct);

  } catch (error) {
    airtableUtils.handleError(error);
    return [];
  }
};

// Buscar productos
export const searchProducts = async (query: string, limit: number = 20): Promise<Product[]> => {
  if (!query.trim()) return [];
  
  return getProducts({ 
    search: query.trim(),
    inStock: true 
  });
};

// Obtener productos en oferta
export const getProductsOnSale = async (limit: number = 12): Promise<Product[]> => {
  try {
    const cacheKey = `sale_products_${limit}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const records = await base(TABLES.PRODUCTS)
      .select({
        filterByFormula: `AND(
          {${FIELDS.PRODUCTS.ORIGINAL_PRICE}} > {${FIELDS.PRODUCTS.PRICE}},
          {${FIELDS.PRODUCTS.STATUS}} = '${PRODUCT_STATUS.ACTIVE}',
          {${FIELDS.PRODUCTS.IN_STOCK}} = TRUE()
        )`,
        maxRecords: limit,
        sort: [{ field: FIELDS.PRODUCTS.CREATED_AT, direction: 'desc' }]
      })
      .all();

    const products = records.map(airtableToProduct);
    
    // Guardar en caché por 10 minutos
    setCache(cacheKey, products, 10 * 60 * 1000);
    
    return products;

  } catch (error) {
    airtableUtils.handleError(error);
    return [];
  }
};

// Actualizar stock de producto (para compras)
export const updateProductStock = async (productId: string, quantityToSubtract: number): Promise<boolean> => {
  try {
    const product = await getProductById(productId);
    if (!product) return false;

    const newQuantity = (product.stockQuantity || 0) - quantityToSubtract;
    
    await base(TABLES.PRODUCTS).update(productId, {
      [FIELDS.PRODUCTS.STOCK_QUANTITY]: Math.max(0, newQuantity),
      [FIELDS.PRODUCTS.IN_STOCK]: newQuantity > 0,
      [FIELDS.PRODUCTS.UPDATED_AT]: new Date().toISOString()
    });

    // Invalidar caché
    cache.delete(`product_${productId}`);
    
    return true;

  } catch (error) {
    airtableUtils.handleError(error);
    return false;
  }
};

// Obtener categorías únicas de productos
export const getProductCategories = async (): Promise<string[]> => {
  try {
    const cacheKey = 'product_categories';
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const records = await base(TABLES.PRODUCTS)
      .select({
        filterByFormula: `{${FIELDS.PRODUCTS.STATUS}} = '${PRODUCT_STATUS.ACTIVE}'`,
        fields: [FIELDS.PRODUCTS.CATEGORY]
      })
      .all();

    const categories = [...new Set(
      records
        .map(record => record.fields[FIELDS.PRODUCTS.CATEGORY])
        .filter(Boolean)
    )];
    
    // Guardar en caché por 30 minutos
    setCache(cacheKey, categories, 30 * 60 * 1000);
    
    return categories;

  } catch (error) {
    airtableUtils.handleError(error);
    return [];
  }
};

// Helper para obtener el campo de ordenamiento
const getSortField = (sortBy: string): string => {
  switch (sortBy) {
    case 'price':
      return FIELDS.PRODUCTS.PRICE;
    case 'name':
      return FIELDS.PRODUCTS.NAME;
    case 'rating':
      return FIELDS.PRODUCTS.RATING;
    case 'newest':
      return FIELDS.PRODUCTS.CREATED_AT;
    default:
      return FIELDS.PRODUCTS.CREATED_AT;
  }
};

// Limpiar caché manualmente
export const clearProductsCache = () => {
  cache.clear();
};

// Estadísticas de productos (para admin)
export const getProductStats = async () => {
  try {
    const allProducts = await getProducts();
    
    return {
      total: allProducts.length,
      inStock: allProducts.filter(p => p.inStock).length,
      outOfStock: allProducts.filter(p => !p.inStock).length,
      featured: allProducts.filter(p => p.featured).length,
      onSale: allProducts.filter(p => p.originalPrice && p.originalPrice > p.price).length,
      byCategory: allProducts.reduce((acc: Record<string, number>, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {})
    };

  } catch (error) {
    airtableUtils.handleError(error);
    return null;
  }
};