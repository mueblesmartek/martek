export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async ({ request }) => {
  console.log("🔥 SIMPLE TEST - Starting");
  const hasRequest = !!request;
  console.log("Has request:", hasRequest);
  const contentType = request.headers.get("content-type");
  const contentLength = request.headers.get("content-length");
  console.log("Content-Type:", contentType);
  console.log("Content-Length:", contentLength);
  let result1 = "NOT_TRIED";
  let result2 = "NOT_TRIED";
  let result3 = "NOT_TRIED";
  try {
    const body1 = await request.clone().text();
    result1 = `text(): length=${body1.length}, content="${body1}"`;
  } catch (e) {
    result1 = `text() ERROR: ${e.message}`;
  }
  try {
    const body2 = await request.clone().json();
    result2 = `json(): ${JSON.stringify(body2)}`;
  } catch (e) {
    result2 = `json() ERROR: ${e.message}`;
  }
  try {
    const buffer = await request.clone().arrayBuffer();
    const decoder = new TextDecoder();
    const body3 = decoder.decode(buffer);
    result3 = `arrayBuffer(): length=${body3.length}, content="${body3}"`;
  } catch (e) {
    result3 = `arrayBuffer() ERROR: ${e.message}`;
  }
  return new Response(JSON.stringify({
    test: "simple-basic",
    has_request: hasRequest,
    content_type: contentType,
    content_length: contentLength,
    method1: result1,
    method2: result2,
    method3: result3,
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
