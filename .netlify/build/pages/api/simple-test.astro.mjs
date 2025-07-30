export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async ({ request }) => {
  console.log("🔥 SIMPLE TEST - Starting");
  const contentType = request.headers.get("content-type");
  const contentLength = request.headers.get("content-length");
  let textResult = "NOT_TRIED";
  try {
    const body = await request.text();
    textResult = `SUCCESS: length=${body.length}, content="${body}"`;
  } catch (e) {
    textResult = `ERROR: ${e.message}`;
  }
  return new Response(JSON.stringify({
    test: "simple-basic",
    content_type: contentType,
    content_length: contentLength,
    result: textResult,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }), {
    headers: { "Content-Type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
