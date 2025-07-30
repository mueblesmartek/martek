export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  console.log("🧪 Headers test");
  const customHeader = request.headers.get("x-custom-data");
  const userAgent = request.headers.get("user-agent");
  const allHeaders = Object.fromEntries(request.headers.entries());
  return new Response(JSON.stringify({
    success: true,
    customHeader,
    userAgent,
    allHeaders,
    headerCount: Object.keys(allHeaders).length
  }), {
    headers: { "Content-Type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
