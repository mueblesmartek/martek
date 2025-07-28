// src/lib/shipping.ts - LÓGICA DE ENVÍO DINÁMICA
import type { ShippingAddress } from './types';

// Configuración de envío
export interface ShippingConfig {
  free_shipping_threshold: number;
  base_shipping_cost: number;
  weight_multiplier: number;
  distance_multiplier: number;
  express_cost: number;
  major_cities: string[];
  remote_areas: string[];
}

// Configuración por defecto
export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  free_shipping_threshold: 100000, // $100,000 COP
  base_shipping_cost: 15000,       // $15,000 COP
  weight_multiplier: 2000,         // $2,000 por kg adicional
  distance_multiplier: 5000,       // $5,000 para zonas remotas
  express_cost: 8000,              // $8,000 adicional para express
  major_cities: [
    'Bogotá D.C.',
    'Medellín',
    'Cali',
    'Barranquilla',
    'Cartagena',
    'Bucaramanga',
    'Pereira',
    'Santa Marta',
    'Ibagué',
    'Pasto',
    'Manizales',
    'Villavicencio'
  ],
  remote_areas: [
    'Amazonas',
    'Guainía',
    'Guaviare',
    'Vaupés',
    'Vichada',
    'San Andrés y Providencia'
  ]
};

// Opciones de envío
export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  delivery_time: string;
  is_express: boolean;
}

// Resultado del cálculo de envío
export interface ShippingCalculation {
  is_free: boolean;
  base_cost: number;
  additional_costs: number;
  total_cost: number;
  options: ShippingOption[];
  estimated_delivery: string;
  details: string[];
}

// ✅ CALCULAR COSTO DE ENVÍO
export function calculateShipping(
  subtotal: number,
  address: ShippingAddress,
  weight_kg: number = 1,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): ShippingCalculation {
  
  const details: string[] = [];
  let baseCost = config.base_shipping_cost;
  let additionalCosts = 0;

  // ✅ ENVÍO GRATIS POR MONTO
  if (subtotal >= config.free_shipping_threshold) {
    return {
      is_free: true,
      base_cost: 0,
      additional_costs: 0,
      total_cost: 0,
      options: [
        {
          id: 'free_standard',
          name: 'Envío Gratis',
          description: 'Envío estándar gratuito por compras superiores a $100,000',
          cost: 0,
          delivery_time: '3-5 días hábiles',
          is_express: false
        },
        {
          id: 'free_express',
          name: 'Envío Express',
          description: 'Envío rápido con costo adicional',
          cost: config.express_cost,
          delivery_time: '1-2 días hábiles',
          is_express: true
        }
      ],
      estimated_delivery: '3-5 días hábiles',
      details: ['Envío gratis por compra superior a $100,000']
    };
  }

  // ✅ COSTO POR PESO ADICIONAL
  if (weight_kg > 1) {
    const extraWeight = weight_kg - 1;
    const weightCost = Math.ceil(extraWeight) * config.weight_multiplier;
    additionalCosts += weightCost;
    details.push(`Peso adicional: ${extraWeight.toFixed(1)}kg (+$${weightCost.toLocaleString('es-CO')})`);
  }

  // ✅ COSTO POR ZONA REMOTA
  if (config.remote_areas.includes(address.state)) {
    additionalCosts += config.distance_multiplier;
    details.push(`Zona remota: ${address.state} (+$${config.distance_multiplier.toLocaleString('es-CO')})`);
  }

  // ✅ TIEMPO DE ENTREGA SEGÚN CIUDAD
  let deliveryTime = config.major_cities.includes(address.city) 
    ? '2-4 días hábiles' 
    : '4-7 días hábiles';

  if (config.remote_areas.includes(address.state)) {
    deliveryTime = '7-10 días hábiles';
  }

  const totalStandardCost = baseCost + additionalCosts;
  const totalExpressCost = totalStandardCost + config.express_cost;

  // ✅ OPCIONES DE ENVÍO
  const options: ShippingOption[] = [
    {
      id: 'standard',
      name: 'Envío Estándar',
      description: `Envío seguro y confiable a ${address.city}`,
      cost: totalStandardCost,
      delivery_time: deliveryTime,
      is_express: false
    }
  ];

  // Solo mostrar express para ciudades principales
  if (config.major_cities.includes(address.city)) {
    options.push({
      id: 'express',
      name: 'Envío Express',
      description: 'Entrega rápida en 1-2 días hábiles',
      cost: totalExpressCost,
      delivery_time: '1-2 días hábiles',
      is_express: true
    });
  }

  return {
    is_free: false,
    base_cost: baseCost,
    additional_costs: additionalCosts,
    total_cost: totalStandardCost,
    options,
    estimated_delivery: deliveryTime,
    details: details.length > 0 ? details : [`Envío estándar a ${address.city}`]
  };
}

// ✅ CALCULAR PESO ESTIMADO DEL CARRITO
export function calculateCartWeight(items: any[]): number {
  // Peso base por producto (estimado)
  const baseWeightPerItem = 0.2; // 200g por producto
  const maxWeightPerItem = 1.0;  // 1kg máximo por producto
  
  return items.reduce((totalWeight, item) => {
    // Peso estimado basado en la cantidad
    const itemWeight = Math.min(
      baseWeightPerItem * item.quantity,
      maxWeightPerItem * item.quantity
    );
    return totalWeight + itemWeight;
  }, 0);
}

// ✅ VALIDAR DIRECCIÓN DE ENVÍO
export function validateShippingAddress(address: ShippingAddress): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!address.full_name?.trim()) {
    errors.push('Nombre completo es requerido');
  }

  if (!address.email?.trim() || !/\S+@\S+\.\S+/.test(address.email)) {
    errors.push('Email válido es requerido');
  }

  if (!address.phone?.trim()) {
    errors.push('Teléfono es requerido');
  }

  if (!address.address_line_1?.trim()) {
    errors.push('Dirección es requerida');
  }

  if (!address.city?.trim()) {
    errors.push('Ciudad es requerida');
  }

  if (!address.state?.trim()) {
    errors.push('Departamento es requerido');
  }

  if (!address.postal_code?.trim()) {
    errors.push('Código postal es requerido');
  }

  if (address.country !== 'Colombia') {
    errors.push('Solo realizamos envíos dentro de Colombia');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ✅ OBTENER ZONAS DE COBERTURA
export function getCoverageInfo(): { 
  covered_cities: string[];
  remote_areas: string[];
  delivery_times: Record<string, string>;
} {
  return {
    covered_cities: DEFAULT_SHIPPING_CONFIG.major_cities,
    remote_areas: DEFAULT_SHIPPING_CONFIG.remote_areas,
    delivery_times: {
      'major_cities': '2-4 días hábiles',
      'standard_cities': '4-7 días hábiles',
      'remote_areas': '7-10 días hábiles'
    }
  };
}

// ✅ GENERAR NÚMERO DE SEGUIMIENTO
export function generateTrackingNumber(orderId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const orderPrefix = orderId.substring(0, 4).toUpperCase();
  
  return `KAM${orderPrefix}${timestamp}${random}`;
}

// ✅ ESTIMAR FECHA DE ENTREGA
export function estimateDeliveryDate(
  shippingOption: ShippingOption,
  orderDate: Date = new Date()
): { min_date: Date; max_date: Date; formatted: string } {
  
  const [minDays, maxDays] = shippingOption.delivery_time
    .match(/(\d+)-(\d+)/)
    ?.slice(1, 3)
    .map(Number) || [3, 5];

  const minDate = new Date(orderDate);
  const maxDate = new Date(orderDate);
  
  // Agregar días hábiles (excluyendo fines de semana)
  let daysAdded = 0;
  while (daysAdded < minDays) {
    minDate.setDate(minDate.getDate() + 1);
    if (minDate.getDay() !== 0 && minDate.getDay() !== 6) {
      daysAdded++;
    }
  }
  
  daysAdded = 0;
  while (daysAdded < maxDays) {
    maxDate.setDate(maxDate.getDate() + 1);
    if (maxDate.getDay() !== 0 && maxDate.getDay() !== 6) {
      daysAdded++;
    }
  }

  const formatted = `${minDate.toLocaleDateString('es-CO')} - ${maxDate.toLocaleDateString('es-CO')}`;

  return {
    min_date: minDate,
    max_date: maxDate,
    formatted
  };
}