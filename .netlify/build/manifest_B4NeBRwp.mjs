import '@astrojs/internal-helpers/path';
import 'cookie';
import 'kleur/colors';
import 'es-module-lexer';
import { N as NOOP_MIDDLEWARE_HEADER, h as decodeKey } from './chunks/astro/server_CI_eDUAH.mjs';
import 'clsx';
import 'html-escaper';

const NOOP_MIDDLEWARE_FN = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
};

const codeToStatusMap = {
  // Implemented from tRPC error code table
  // https://trpc.io/docs/server/error-handling#error-codes
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 405,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_CONTENT: 422,
  TOO_MANY_REQUESTS: 429,
  CLIENT_CLOSED_REQUEST: 499,
  INTERNAL_SERVER_ERROR: 500
};
Object.entries(codeToStatusMap).reduce(
  // reverse the key-value pairs
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/manuel/Downloads/ecommerce/mueble-martek/","adapterName":"@astrojs/netlify","routes":[{"file":"admin/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/admin","isIndex":false,"type":"page","pattern":"^\\/admin\\/?$","segments":[[{"content":"admin","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/admin.astro","pathname":"/admin","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"carrito/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/carrito","isIndex":false,"type":"page","pattern":"^\\/carrito\\/?$","segments":[[{"content":"carrito","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/carrito.astro","pathname":"/carrito","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"checkout/confirmacion/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/checkout/confirmacion","isIndex":false,"type":"page","pattern":"^\\/checkout\\/confirmacion\\/?$","segments":[[{"content":"checkout","dynamic":false,"spread":false}],[{"content":"confirmacion","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/checkout/confirmacion.astro","pathname":"/checkout/confirmacion","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"checkout/pagos/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/checkout/pagos","isIndex":false,"type":"page","pattern":"^\\/checkout\\/pagos\\/?$","segments":[[{"content":"checkout","dynamic":false,"spread":false}],[{"content":"pagos","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/checkout/pagos.astro","pathname":"/checkout/pagos","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"checkout/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/checkout","isIndex":false,"type":"page","pattern":"^\\/checkout\\/?$","segments":[[{"content":"checkout","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/checkout.astro","pathname":"/checkout","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"contacto/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/contacto","isIndex":false,"type":"page","pattern":"^\\/contacto\\/?$","segments":[[{"content":"contacto","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/contacto.astro","pathname":"/contacto","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"login/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/login","isIndex":false,"type":"page","pattern":"^\\/login\\/?$","segments":[[{"content":"login","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/login.astro","pathname":"/login","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"mis-pedidos/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/mis-pedidos","isIndex":false,"type":"page","pattern":"^\\/mis-pedidos\\/?$","segments":[[{"content":"mis-pedidos","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/mis-pedidos.astro","pathname":"/mis-pedidos","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"perfil/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/perfil","isIndex":false,"type":"page","pattern":"^\\/perfil\\/?$","segments":[[{"content":"perfil","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/perfil.astro","pathname":"/perfil","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"politicas/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/politicas","isIndex":false,"type":"page","pattern":"^\\/politicas\\/?$","segments":[[{"content":"politicas","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/politicas.astro","pathname":"/politicas","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"productos/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/productos","isIndex":false,"type":"page","pattern":"^\\/productos\\/?$","segments":[[{"content":"productos","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/productos.astro","pathname":"/productos","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"registro/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/registro","isIndex":false,"type":"page","pattern":"^\\/registro\\/?$","segments":[[{"content":"registro","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/registro.astro","pathname":"/registro","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"terminos/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/terminos","isIndex":false,"type":"page","pattern":"^\\/terminos\\/?$","segments":[[{"content":"terminos","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/terminos.astro","pathname":"/terminos","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"test/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/test","isIndex":false,"type":"page","pattern":"^\\/test\\/?$","segments":[[{"content":"test","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/test.astro","pathname":"/test","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/formdata-test","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/formdata-test\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"formdata-test","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/formdata-test.ts","pathname":"/api/formdata-test","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/headers-test","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/headers-test\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"headers-test","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/headers-test.ts","pathname":"/api/headers-test","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/orders/create","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/orders\\/create\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"orders","dynamic":false,"spread":false}],[{"content":"create","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/orders/create.ts","pathname":"/api/orders/create","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/orders/update-payment","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/orders\\/update-payment\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"orders","dynamic":false,"spread":false}],[{"content":"update-payment","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/orders/update-payment.ts","pathname":"/api/orders/update-payment","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/simple-order-test","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/simple-order-test\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"simple-order-test","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/simple-order-test.ts","pathname":"/api/simple-order-test","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/simple-test","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/simple-test\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"simple-test","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/simple-test.ts","pathname":"/api/simple-test","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/test","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/test\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"test","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/test.ts","pathname":"/api/test","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}}],"site":"https://mueblesmartek.com","base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/admin.astro",{"propagation":"none","containsHead":true}],["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/carrito.astro",{"propagation":"none","containsHead":true}],["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/categoria/[categoria].astro",{"propagation":"none","containsHead":true}],["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/checkout.astro",{"propagation":"none","containsHead":true}],["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/checkout/confirmacion.astro",{"propagation":"none","containsHead":true}],["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/checkout/pagos.astro",{"propagation":"none","containsHead":true}],["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/contacto.astro",{"propagation":"none","containsHead":true}],["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/index.astro",{"propagation":"none","containsHead":true}],["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/login.astro",{"propagation":"none","containsHead":true}],["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/mis-pedidos.astro",{"propagation":"none","containsHead":true}],["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/perfil.astro",{"propagation":"none","containsHead":true}],["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/politicas.astro",{"propagation":"none","containsHead":true}],["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/producto/[slug].astro",{"propagation":"none","containsHead":true}],["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/productos.astro",{"propagation":"none","containsHead":true}],["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/registro.astro",{"propagation":"none","containsHead":true}],["/Users/manuel/Downloads/ecommerce/mueble-martek/src/pages/terminos.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(o,t)=>{let i=async()=>{await(await o())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var s=(i,t)=>{let a=async()=>{await(await i())()};if(t.value){let e=matchMedia(t.value);e.matches?a():e.addEventListener(\"change\",a,{once:!0})}};(self.Astro||(self.Astro={})).media=s;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var l=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let a of e)if(a.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=l;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astro-page:src/pages/admin@_@astro":"pages/admin.astro.mjs","\u0000@astro-page:src/pages/api/formdata-test@_@ts":"pages/api/formdata-test.astro.mjs","\u0000@astro-page:src/pages/api/headers-test@_@ts":"pages/api/headers-test.astro.mjs","\u0000@astro-page:src/pages/api/orders/create@_@ts":"pages/api/orders/create.astro.mjs","\u0000@astro-page:src/pages/api/orders/update-payment@_@ts":"pages/api/orders/update-payment.astro.mjs","\u0000@astro-page:src/pages/api/simple-order-test@_@ts":"pages/api/simple-order-test.astro.mjs","\u0000@astro-page:src/pages/api/simple-test@_@ts":"pages/api/simple-test.astro.mjs","\u0000@astro-page:src/pages/api/test@_@ts":"pages/api/test.astro.mjs","\u0000@astro-page:src/pages/carrito@_@astro":"pages/carrito.astro.mjs","\u0000@astro-page:src/pages/categoria/[categoria]@_@astro":"pages/categoria/_categoria_.astro.mjs","\u0000@astro-page:src/pages/checkout/confirmacion@_@astro":"pages/checkout/confirmacion.astro.mjs","\u0000@astro-page:src/pages/checkout/pagos@_@astro":"pages/checkout/pagos.astro.mjs","\u0000@astro-page:src/pages/checkout@_@astro":"pages/checkout.astro.mjs","\u0000@astro-page:src/pages/contacto@_@astro":"pages/contacto.astro.mjs","\u0000@astro-page:src/pages/login@_@astro":"pages/login.astro.mjs","\u0000@astro-page:src/pages/mis-pedidos@_@astro":"pages/mis-pedidos.astro.mjs","\u0000@astro-page:src/pages/perfil@_@astro":"pages/perfil.astro.mjs","\u0000@astro-page:src/pages/politicas@_@astro":"pages/politicas.astro.mjs","\u0000@astro-page:src/pages/producto/[slug]@_@astro":"pages/producto/_slug_.astro.mjs","\u0000@astro-page:src/pages/productos@_@astro":"pages/productos.astro.mjs","\u0000@astro-page:src/pages/registro@_@astro":"pages/registro.astro.mjs","\u0000@astro-page:src/pages/terminos@_@astro":"pages/terminos.astro.mjs","\u0000@astro-page:src/pages/test@_@astro":"pages/test.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_B4NeBRwp.mjs","/astro/hoisted.js?q=1":"_astro/hoisted.SMmzrSQJ.js","/Users/manuel/Downloads/ecommerce/mueble-martek/src/components/react/AuthForm":"_astro/AuthForm.BSdMlDYZ.js","/Users/manuel/Downloads/ecommerce/mueble-martek/src/components/react/UserOrders":"_astro/UserOrders.YPYrXjt9.js","/astro/hoisted.js?q=0":"_astro/hoisted.--Xud20i.js","/astro/hoisted.js?q=2":"_astro/hoisted.x37jZGZa.js","/astro/hoisted.js?q=3":"_astro/hoisted.CZFbkrQ8.js","/astro/hoisted.js?q=4":"_astro/hoisted.BpJgd0Ws.js","/astro/hoisted.js?q=6":"_astro/hoisted.DksEl9tN.js","/Users/manuel/Downloads/ecommerce/mueble-martek/src/components/react/Cart":"_astro/Cart.DxxV3fgw.js","/Users/manuel/Downloads/ecommerce/mueble-martek/src/components/react/AdminDashboard":"_astro/AdminDashboard.ByW_BERp.js","@astrojs/react/client.js":"_astro/client.DrE9CFQR.js","/astro/hoisted.js?q=5":"_astro/hoisted.DLOetLtr.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/admin.C8zFZZOy.css","/_headers","/_redirects","/favicon.svg","/_astro/AdminDashboard.ByW_BERp.js","/_astro/AuthForm.BSdMlDYZ.js","/_astro/Cart.DxxV3fgw.js","/_astro/UserOrders.YPYrXjt9.js","/_astro/client.DrE9CFQR.js","/_astro/hoisted.--Xud20i.js","/_astro/hoisted.BpJgd0Ws.js","/_astro/hoisted.CZFbkrQ8.js","/_astro/hoisted.DLOetLtr.js","/_astro/hoisted.DksEl9tN.js","/_astro/hoisted.SMmzrSQJ.js","/_astro/hoisted.x37jZGZa.js","/_astro/index.CVf8TyFT.js","/_astro/index.CdkWeb-Q.js","/_astro/jsx-runtime.TBa3i5EZ.js","/_astro/supabase.CTCoAS4k.js","/js/cart-global.js","/js/cart.js","/images/Untitled-2.ai","/images/logo-kama-white.svg","/images/logo-kama.svg","/images/orquidia-kama.webp","/images/tacones.jpg","/images/tacones2.webp","/admin/index.html","/carrito/index.html","/checkout/confirmacion/index.html","/checkout/pagos/index.html","/checkout/index.html","/contacto/index.html","/login/index.html","/mis-pedidos/index.html","/perfil/index.html","/politicas/index.html","/productos/index.html","/registro/index.html","/terminos/index.html","/test/index.html","/index.html"],"buildFormat":"directory","checkOrigin":false,"serverIslandNameMap":[],"key":"HK/DW/31nnNLHXTi785KofnlALGIUgIvugSwX+U4MAg=","experimentalEnvGetSecretEnabled":false});

export { manifest };
