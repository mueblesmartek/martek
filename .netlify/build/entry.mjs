import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_B4NeBRwp.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/admin.astro.mjs');
const _page2 = () => import('./pages/api/formdata-test.astro.mjs');
const _page3 = () => import('./pages/api/headers-test.astro.mjs');
const _page4 = () => import('./pages/api/orders/create.astro.mjs');
const _page5 = () => import('./pages/api/orders/update-payment.astro.mjs');
const _page6 = () => import('./pages/api/simple-order-test.astro.mjs');
const _page7 = () => import('./pages/api/simple-test.astro.mjs');
const _page8 = () => import('./pages/api/test.astro.mjs');
const _page9 = () => import('./pages/carrito.astro.mjs');
const _page10 = () => import('./pages/categoria/_categoria_.astro.mjs');
const _page11 = () => import('./pages/checkout/confirmacion.astro.mjs');
const _page12 = () => import('./pages/checkout/pagos.astro.mjs');
const _page13 = () => import('./pages/checkout.astro.mjs');
const _page14 = () => import('./pages/contacto.astro.mjs');
const _page15 = () => import('./pages/login.astro.mjs');
const _page16 = () => import('./pages/mis-pedidos.astro.mjs');
const _page17 = () => import('./pages/perfil.astro.mjs');
const _page18 = () => import('./pages/politicas.astro.mjs');
const _page19 = () => import('./pages/producto/_slug_.astro.mjs');
const _page20 = () => import('./pages/productos.astro.mjs');
const _page21 = () => import('./pages/registro.astro.mjs');
const _page22 = () => import('./pages/terminos.astro.mjs');
const _page23 = () => import('./pages/test.astro.mjs');
const _page24 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/admin.astro", _page1],
    ["src/pages/api/formdata-test.ts", _page2],
    ["src/pages/api/headers-test.ts", _page3],
    ["src/pages/api/orders/create.ts", _page4],
    ["src/pages/api/orders/update-payment.ts", _page5],
    ["src/pages/api/simple-order-test.ts", _page6],
    ["src/pages/api/simple-test.ts", _page7],
    ["src/pages/api/test.ts", _page8],
    ["src/pages/carrito.astro", _page9],
    ["src/pages/categoria/[categoria].astro", _page10],
    ["src/pages/checkout/confirmacion.astro", _page11],
    ["src/pages/checkout/pagos.astro", _page12],
    ["src/pages/checkout.astro", _page13],
    ["src/pages/contacto.astro", _page14],
    ["src/pages/login.astro", _page15],
    ["src/pages/mis-pedidos.astro", _page16],
    ["src/pages/perfil.astro", _page17],
    ["src/pages/politicas.astro", _page18],
    ["src/pages/producto/[slug].astro", _page19],
    ["src/pages/productos.astro", _page20],
    ["src/pages/registro.astro", _page21],
    ["src/pages/terminos.astro", _page22],
    ["src/pages/test.astro", _page23],
    ["src/pages/index.astro", _page24]
]);
const serverIslandMap = new Map();
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "e1461b3d-4e91-4214-855e-cce126be8184"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
