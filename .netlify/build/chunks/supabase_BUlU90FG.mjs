import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://lhquqrbwsfbmstkjjduo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxocXVxcmJ3c2ZibXN0a2pqZHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NDQwNTgsImV4cCI6MjA2OTMyMDA1OH0.HrDpIGKM0VF5fDa9wi9Q5QYP5gcXT2UxmcDhvZG_TMw";
const supabase = createClient(supabaseUrl, supabaseAnonKey) ;
function log(message, data) {
  console.log(`[SUPABASE] ${message}`, data || "");
}
async function getProducts() {
  if (!supabase) {
    log("Sin configuración - devolviendo array vacío");
    return [];
  }
  try {
    const { data, error } = await supabase.from("products").select("*").eq("is_active", true).order("featured", { ascending: false }).order("created_at", { ascending: false });
    if (error) {
      log("Error obteniendo productos", error.message);
      return [];
    }
    const products = data || [];
    log(`${products.length} productos obtenidos`);
    return products;
  } catch (err) {
    log("Excepción obteniendo productos", err);
    return [];
  }
}
async function getFeaturedProducts(limit = 6) {
  if (!supabase) {
    log("Sin configuración - devolviendo array vacío para productos destacados");
    return [];
  }
  try {
    const { data, error } = await supabase.from("products").select("*").eq("is_active", true).eq("featured", true).order("created_at", { ascending: false }).limit(limit);
    if (error) {
      log("Error obteniendo productos destacados", error.message);
      return [];
    }
    const products = data || [];
    log(`${products.length} productos destacados obtenidos`);
    return products;
  } catch (err) {
    log("Excepción obteniendo productos destacados", err);
    return [];
  }
}
async function getCategories() {
  console.log("🔍 getCategories() llamada");
  if (!supabase) {
    console.log("❌ Supabase no configurado");
    return [];
  }
  try {
    console.log("📡 Haciendo query a categories...");
    const { data, error } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true });
    console.log("📊 Raw response:", { data, error });
    if (error) {
      console.error("❌ Error de Supabase:", error);
      return [];
    }
    const categories = data || [];
    console.log(`✅ ${categories.length} categorías activas encontradas`);
    return categories;
  } catch (err) {
    console.error("💥 Excepción en getCategories():", err);
    return [];
  }
}
async function getAllProductsForAdmin() {
  if (!supabase) {
    log("Sin configuración - devolviendo array vacío para admin");
    return [];
  }
  try {
    const { data, error } = await supabase.from("products").select("*").order("featured", { ascending: false }).order("created_at", { ascending: false });
    if (error) {
      log("Error obteniendo productos para admin", error.message);
      throw new Error(error.message);
    }
    const products = data || [];
    log(`${products.length} productos obtenidos para admin`);
    return products;
  } catch (err) {
    log("Excepción obteniendo productos para admin", err);
    throw err;
  }
}
async function createProduct(productData) {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }
  try {
    if (!productData.name?.trim()) {
      throw new Error("Nombre del producto es requerido");
    }
    if (!productData.price || productData.price <= 0) {
      throw new Error("Precio debe ser mayor a 0");
    }
    if (!productData.category?.trim()) {
      throw new Error("Categoría es requerida");
    }
    const cleanData = {
      name: productData.name.trim(),
      description: productData.description?.trim() || "",
      price: Number(productData.price),
      category: productData.category.trim(),
      stock: Number(productData.stock || 0),
      image_url: productData.image_url || null,
      // ✅ OMITIR EL CAMPO IMAGES TEMPORALMENTE
      // images: productData.images && productData.images.length > 0 ? productData.images : [],
      is_active: Boolean(productData.is_active ?? true),
      featured: Boolean(productData.featured ?? false),
      slug: productData.slug || generateSlug(productData.name),
      meta_title: productData.meta_title || null,
      meta_description: productData.meta_description || null,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    console.log("🔄 Creando producto SIN images:", cleanData);
    const { data, error } = await supabase.from("products").insert(cleanData).select().single();
    if (error) {
      console.error("❌ Error de Supabase:", error);
      throw new Error(`Error de base de datos: ${error.message}`);
    }
    console.log("✅ Producto creado:", data?.name);
    log(`Producto creado: ${data?.name}`);
    return data;
  } catch (err) {
    console.error("❌ Excepción creando producto:", err);
    log("Excepción creando producto", err);
    throw err;
  }
}
async function updateProduct(id, updates) {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }
  try {
    console.log(`🔄 Actualizando producto ID: ${id}`);
    const cleanUpdates = {};
    if (updates.name !== void 0) cleanUpdates.name = updates.name;
    if (updates.description !== void 0) cleanUpdates.description = updates.description;
    if (updates.price !== void 0) cleanUpdates.price = updates.price;
    if (updates.category !== void 0) cleanUpdates.category = updates.category;
    if (updates.stock !== void 0) cleanUpdates.stock = updates.stock;
    if (updates.image_url !== void 0) cleanUpdates.image_url = updates.image_url;
    if (updates.is_active !== void 0) cleanUpdates.is_active = updates.is_active;
    if (updates.featured !== void 0) cleanUpdates.featured = updates.featured;
    if (updates.slug !== void 0) cleanUpdates.slug = updates.slug;
    if (updates.meta_title !== void 0) cleanUpdates.meta_title = updates.meta_title;
    if (updates.meta_description !== void 0) cleanUpdates.meta_description = updates.meta_description;
    cleanUpdates.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    console.log("📝 Datos limpios para actualizar:", cleanUpdates);
    const { data, error } = await supabase.from("products").update(cleanUpdates).eq("id", id).select().single();
    if (error) {
      console.error("❌ Error actualizando producto:", error);
      throw new Error(`Error de base de datos: ${error.message}`);
    }
    if (!data) {
      throw new Error("Producto no encontrado");
    }
    console.log("✅ Producto actualizado:", data.name);
    log(`Producto actualizado: ${data.name}`);
    return data;
  } catch (err) {
    console.error("❌ Excepción actualizando producto:", err);
    log("Excepción actualizando producto", err);
    throw err;
  }
}
async function getCategoryBySlug(slug) {
  if (!supabase) {
    log("Sin configuración - categoría no encontrada");
    return null;
  }
  try {
    const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).eq("is_active", true).single();
    if (error) {
      if (error.code === "PGRST116") return null;
      log(`Categoría con slug "${slug}" no encontrada`, error.message);
      return null;
    }
    log(`Categoría encontrada: ${data?.name}`);
    return data;
  } catch (err) {
    log("Excepción obteniendo categoría por slug", err);
    return null;
  }
}
async function getProductsByCategory(categorySlug) {
  if (!supabase) {
    log("Sin configuración - devolviendo array vacío");
    return [];
  }
  try {
    const { data, error } = await supabase.from("products").select("*").eq("category", categorySlug).eq("is_active", true).order("featured", { ascending: false }).order("created_at", { ascending: false });
    if (error) {
      log("Error obteniendo productos por categoría", error.message);
      return [];
    }
    const products = data || [];
    log(`${products.length} productos obtenidos para categoría "${categorySlug}"`);
    return products;
  } catch (err) {
    log("Excepción obteniendo productos por categoría", err);
    return [];
  }
}
async function deleteProduct(id) {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }
  try {
    console.log(`🗑️ Eliminando producto ID: ${id}`);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("❌ Error eliminando producto:", error);
      throw new Error(error.message);
    }
    console.log("✅ Producto eliminado correctamente");
    log(`Producto eliminado: ${id}`);
  } catch (err) {
    console.error("❌ Excepción eliminando producto:", err);
    log("Excepción eliminando producto", err);
    throw err;
  }
}
async function bulkInsertProducts(products) {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }
  try {
    console.log(`➕ Insertando ${products.length} productos`);
    const productsWithTimestamps = products.map((product) => ({
      ...product,
      featured: Boolean(product.featured),
      is_active: Boolean(product.is_active),
      images: product.images && product.images.length > 0 ? product.images : [],
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }));
    const { data, error } = await supabase.from("products").insert(productsWithTimestamps).select();
    if (error) {
      console.error("❌ Error en bulkInsertProducts:", error);
      throw new Error(error.message);
    }
    console.log(`✅ ${data?.length || 0} productos insertados correctamente`);
    log(`${data?.length || 0} productos insertados masivamente`);
    return data || [];
  } catch (err) {
    console.error("❌ Excepción en bulkInsertProducts:", err);
    log("Excepción en inserción masiva", err);
    throw err;
  }
}
function generateSlug(name) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export { generateSlug as a, bulkInsertProducts as b, createProduct as c, deleteProduct as d, getCategories as e, getCategoryBySlug as f, getAllProductsForAdmin as g, getProductsByCategory as h, getProducts as i, getFeaturedProducts as j, supabase as s, updateProduct as u };
