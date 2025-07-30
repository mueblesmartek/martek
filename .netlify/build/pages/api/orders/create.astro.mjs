import { s as supabase } from '../../../chunks/supabase_BUlU90FG.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
function validatePrice(price) {
  const numPrice = typeof price === "number" ? price : parseFloat(price);
  return !isNaN(numPrice) && numPrice >= 0 ? numPrice : 0;
}
function generateOrderNumber() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MT${timestamp.slice(-8)}${random}`;
}
function validateOrderData(data) {
  const errors = [];
  if (!data || typeof data !== "object") {
    errors.push({ field: "root", message: "Datos de orden requeridos" });
    return { isValid: false, errors };
  }
  const total = validatePrice(data.total);
  if (total <= 0) {
    errors.push({ field: "total", message: "Total debe ser mayor a 0" });
  }
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  const cleanData = {
    total,
    subtotal: total * 0.84,
    tax: total * 0.16,
    shipping_cost: 0,
    shipping_address: {
      full_name: "Test User",
      email: "test@test.com",
      phone: "3001234567",
      address_line_1: "Test Address",
      city: "Bogotá",
      state: "Bogotá",
      postal_code: "110111",
      country: "Colombia"
    },
    items: [{
      product_id: "test-123",
      product_name: "Test Product",
      price: total,
      quantity: 1,
      total
    }],
    payment_method: "pending"
  };
  return { isValid: true, errors: [], cleanData };
}
const POST = async ({ request }) => {
  console.log("📦 POST /api/orders/create - Iniciando...");
  if (!supabase) {
    return new Response(JSON.stringify({
      success: false,
      error: "Database not available",
      code: "DATABASE_ERROR"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    let requestData;
    try {
      const rawBody = await request.text();
      console.log("Raw body:", rawBody);
      if (!rawBody || rawBody.trim() === "") {
        throw new Error("Request body está vacío");
      }
      if (rawBody.includes("Content-Disposition: form-data")) {
        console.log("📋 Detectado FormData");
        const match = rawBody.match(/name="data"[\s\S]*?\r?\n\r?\n([\s\S]*?)\r?\n------/);
        if (match && match[1]) {
          const jsonData = match[1].trim();
          console.log("📋 JSON extraído:", jsonData);
          requestData = JSON.parse(jsonData);
        } else {
          throw new Error("No se pudo extraer datos del FormData");
        }
      } else {
        console.log("📄 Detectado JSON directo");
        requestData = JSON.parse(rawBody);
      }
    } catch (parseError) {
      console.error("❌ Error parseando datos:", parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : "Error de parsing";
      return new Response(JSON.stringify({
        success: false,
        error: "Datos inválidos",
        details: errorMessage,
        code: "INVALID_DATA"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log("📋 Datos recibidos:", requestData);
    const validation = validateOrderData(requestData);
    if (!validation.isValid) {
      console.error("❌ Datos inválidos:", validation.errors);
      return new Response(JSON.stringify({
        success: false,
        error: "Datos de orden inválidos",
        validation_errors: validation.errors,
        code: "VALIDATION_ERROR"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const orderData = validation.cleanData;
    const finalOrderData = {
      order_number: generateOrderNumber(),
      user_id: null,
      total: orderData.total,
      subtotal: orderData.subtotal,
      tax: orderData.tax,
      shipping_cost: orderData.shipping_cost,
      shipping_address: orderData.shipping_address,
      billing_address: orderData.shipping_address,
      items: orderData.items,
      payment_method: orderData.payment_method,
      customer_notes: orderData.customer_notes,
      status: "pending",
      payment_status: "pending",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const { data: createdOrder, error: createError } = await supabase.from("orders").insert([finalOrderData]).select().single();
    if (createError) {
      console.error("❌ Error creando orden:", createError);
      return new Response(JSON.stringify({
        success: false,
        error: "Error creando la orden en la base de datos",
        details: createError.message,
        code: "DATABASE_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log("✅ Orden creada exitosamente:", createdOrder.order_number);
    return new Response(JSON.stringify({
      success: true,
      message: "Orden creada exitosamente",
      data: {
        id: createdOrder.id,
        order_number: createdOrder.order_number,
        total: createdOrder.total,
        status: createdOrder.status,
        payment_status: createdOrder.payment_status,
        created_at: createdOrder.created_at
      }
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("❌ Error general:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return new Response(JSON.stringify({
      success: false,
      error: "Error interno del servidor",
      message: "Ocurrió un error inesperado al procesar tu pedido",
      details: errorMessage,
      code: "INTERNAL_ERROR",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const GET = async () => {
  return new Response(JSON.stringify({
    success: true,
    message: "Endpoint de creación de órdenes activo",
    version: "3.0-simplified",
    methods: ["POST"],
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
