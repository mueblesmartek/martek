export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async ({ request }) => {
  console.log("🧪 Simple order test");
  try {
    const body = await request.text();
    console.log("Body recibido:", body);
    return new Response(JSON.stringify({
      success: true,
      message: "Test funciona",
      bodyLength: body.length,
      bodyPreview: body.substring(0, 100)
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error en test:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
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
