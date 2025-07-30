// src/types/cart.d.ts - SIMPLIFICADO: SOLO RE-EXPORTA DE CartTypes.ts

// ✅ IMPORTAR TODO DESDE EL ARCHIVO MAESTRO
export type {
  CartItem,
  CartTotals,
  CartEventDetail,
  CartManagerInterface,
  PriceUtilsInterface,
  ProductForCart,
  CartNotificationOptions
} from '../lib/CartTypes';

// ✅ IMPORTAR CONSTANTES
export { CART_CONFIG, isValidCartItem, isValidCartTotals } from '../lib/CartTypes';

// ✅ NAMESPACE PARA ORGANIZACIÓN (OPCIONAL)
export namespace Cart {
  export type Item = import('../lib/CartTypes').CartItem;
  export type Totals = import('../lib/CartTypes').CartTotals;
  export type Manager = import('../lib/CartTypes').CartManagerInterface;
  export type PriceUtils = import('../lib/CartTypes').PriceUtilsInterface;
}

// NO MÁS DECLARACIONES GLOBALES - TODAS ESTÁN EN CartTypes.ts