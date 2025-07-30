export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async ({ request }) => {
  console.log("🧪 FormData Test - Starting");
  try {
    const contentType = request.headers.get("content-type") || "";
    console.log("Content-Type recibido:", contentType);
    console.log("Todos los headers:", Object.fromEntries(request.headers.entries()));
    const textBody = await request.clone().text();
    console.log("Body como texto (primeros 200 chars):", textBody.substring(0, 200));
    return new Response(JSON.stringify({
      success: true,
      contentType,
      textBody: textBody.substring(0, 200),
      bodyLength: textBody.length,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
