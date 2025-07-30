// src/components/react/CheckoutForm.tsx - FORMULARIO DE CHECKOUT COMPLETAMENTE CORREGIDO
import React, { useState, useEffect } from 'react';

// ✅ INTERFACES TIPADAS
interface CheckoutFormData {
  // Información personal
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  
  // Dirección de envío
  address: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  
  // Pago y términos
  paymentMethod: 'card' | 'pse' | 'nequi' | '';
  termsAccepted: boolean;
  marketingAccepted: boolean;
  notes: string;
}

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  product_image?: string;
  product_category?: string;
}

interface OrderTotals {
  items: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

// ✅ CONSTANTES
const CART_STORAGE_KEY = 'martek-cart';
const COLOMBIAN_STATES = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
  'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
  'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
  'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
  'Vaupés', 'Vichada'
];

export function CheckoutForm() {
  // ✅ ESTADOS DEL COMPONENTE
  const [items, setItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState<OrderTotals>({ items: 0, subtotal: 0, shipping: 0, tax: 0, total: 0 });
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CheckoutFormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    paymentMethod: '',
    termsAccepted: false,
    marketingAccepted: false,
    notes: ''
  });

  // ✅ FUNCIONES UTILITARIAS
  const validatePrice = (price: any): number => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    return !isNaN(numPrice) && numPrice >= 0 ? numPrice : 0;
  };

  const formatPrice = (price: number): string => {
    try {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(validatePrice(price));
    } catch (error) {
      return `$${validatePrice(price).toLocaleString('es-CO')}`;
    }
  };

  const calculateTotals = (cartItems: CartItem[]): OrderTotals => {
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (validatePrice(item.product_price) * item.quantity);
    }, 0);

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const shipping = subtotal >= 100000 ? 0 : 15000; // Envío gratis > 100k
    const tax = Math.round(subtotal * 0.19); // IVA 19%
    const total = subtotal + shipping + tax;

    return { items: totalItems, subtotal, shipping, tax, total };
  };

  // ✅ CARGAR CARRITO AL INICIO
  useEffect(() => {
    const loadCart = () => {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        const cartItems = stored ? JSON.parse(stored) : [];
        
        // Validar estructura de items
        const validatedItems = cartItems.map((item: any) => ({
          id: item.id || `temp_${Date.now()}`,
          product_id: item.product_id || item.id,
          product_name: item.product_name || item.name || 'Producto sin nombre',
          product_price: validatePrice(item.product_price || item.price),
          quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
          product_image: item.product_image || item.image || null,
          product_category: item.product_category || item.category || ''
        }));

        setItems(validatedItems);
        setTotals(calculateTotals(validatedItems));

        console.log('✅ Carrito cargado en checkout:', validatedItems.length, 'items');
      } catch (error) {
        console.error('Error cargando carrito:', error);
        setItems([]);
      }
    };

    loadCart();

    // Escuchar cambios del carrito
    const handleCartUpdate = () => loadCart();
    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  // ✅ VALIDACIONES MEJORADAS
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Información personal
        // Email
        if (!formData.email.trim()) {
          newErrors.email = 'Email es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Ingresa un email válido';
        }

        // Nombre
        if (!formData.firstName.trim()) {
          newErrors.firstName = 'Nombre es requerido';
        } else if (formData.firstName.trim().length < 2) {
          newErrors.firstName = 'Nombre debe tener al menos 2 caracteres';
        }

        // Apellido
        if (!formData.lastName.trim()) {
          newErrors.lastName = 'Apellido es requerido';
        } else if (formData.lastName.trim().length < 2) {
          newErrors.lastName = 'Apellido debe tener al menos 2 caracteres';
        }

        // Teléfono colombiano
        if (!formData.phone.trim()) {
          newErrors.phone = 'Teléfono es requerido';
        } else {
          const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
          if (!/^(\+57|57)?[3][0-9]{9}$/.test(cleanPhone)) {
            newErrors.phone = 'Ingresa un teléfono celular colombiano válido (ej: 3001234567)';
          }
        }
        break;

      case 2: // Dirección de envío
        if (!formData.address.trim()) {
          newErrors.address = 'Dirección es requerida';
        } else if (formData.address.trim().length < 10) {
          newErrors.address = 'Ingresa una dirección completa';
        }

        if (!formData.city.trim()) {
          newErrors.city = 'Ciudad es requerida';
        }

        if (!formData.state.trim()) {
          newErrors.state = 'Departamento es requerido';
        } else if (!COLOMBIAN_STATES.includes(formData.state)) {
          newErrors.state = 'Selecciona un departamento válido';
        }

        if (!formData.postalCode.trim()) {
          newErrors.postalCode = 'Código postal es requerido';
        } else if (!/^\d{6}$/.test(formData.postalCode)) {
          newErrors.postalCode = 'Código postal debe tener 6 dígitos';
        }
        break;

      case 3: // Método de pago y términos
        if (!formData.paymentMethod) {
          newErrors.paymentMethod = 'Selecciona un método de pago';
        }

        if (!formData.termsAccepted) {
          newErrors.termsAccepted = 'Debes aceptar los términos y condiciones';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ MANEJAR CAMBIOS EN FORMULARIO
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Limpiar error cuando el usuario empiece a escribir/seleccionar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ✅ NAVEGACIÓN ENTRE PASOS
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step: number) => {
    if (step < currentStep || validateStep(currentStep)) {
      setCurrentStep(step);
    }
  };

  // ✅ CREAR ORDEN
  const createOrder = async () => {
    try {
      const orderData = {
        total: totals.total,
        subtotal: totals.subtotal,
        tax: totals.tax,
        shipping_cost: totals.shipping,
        shipping_address: {
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          address_line_1: formData.address,
          address_line_2: formData.addressLine2 || null,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          country: 'Colombia'
        },
        billing_address: {
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          address_line_1: formData.address,
          address_line_2: formData.addressLine2 || null,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          country: 'Colombia'
        },
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.product_price,
          quantity: item.quantity,
          total: validatePrice(item.product_price) * item.quantity
        })),
        payment_method: formData.paymentMethod,
        customer_notes: formData.notes || null,
        status: 'pending',
        payment_status: 'pending'
      };

      console.log('📦 Creando orden:', orderData);

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creando la orden');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ Orden creada exitosamente:', result.data);
        
        // Limpiar carrito
        localStorage.removeItem(CART_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: [] } }));
        
        // Redirigir a página de pago
        window.location.href = `/checkout/pagos?order=${result.data.id}`;
        
        return result.data;
      } else {
        throw new Error(result.error || 'Error desconocido creando la orden');
      }

    } catch (error) {
      console.error('❌ Error creando orden:', error);
      throw error;
    }
  };

  // ✅ ENVÍO FINAL DEL FORMULARIO
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3) || items.length === 0) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      await createOrder();
    } catch (error) {
      console.error('Error en checkout:', error);
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Error procesando el pedido. Por favor intenta de nuevo.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ RENDERIZADO CONDICIONAL PARA CARRITO VACÍO
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l-2.5 5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-gray-800 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-600 mb-6">Agrega algunos productos antes de proceder al checkout</p>
        <a href="/productos" 
           className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors">
          Ir a productos
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* ✅ INDICADOR DE PASOS */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <button
                onClick={() => goToStep(step)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep === step
                    ? 'bg-gray-900 text-white'
                    : currentStep > step
                    ? 'bg-green-600 text-white cursor-pointer hover:bg-green-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                disabled={step > currentStep}
              >
                {currentStep > step ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step
                )}
              </button>
              
              {step < 3 && (
                <div className={`h-0.5 w-16 ml-4 ${currentStep > step ? 'bg-green-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Información</span>
          <span>Dirección</span>
          <span>Pago</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ✅ FORMULARIO PRINCIPAL */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <form onSubmit={handleSubmit}>
              
              {/* PASO 1: INFORMACIÓN PERSONAL */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Información de Contacto</h2>
                  
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="tu@email.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  {/* Nombre y Apellido */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Juan"
                      />
                      {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Pérez"
                      />
                      {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono celular *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="3001234567"
                    />
                    <p className="mt-1 text-xs text-gray-500">Solo números, sin espacios ni guiones</p>
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>

                  {/* Botón Siguiente */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 2: DIRECCIÓN DE ENVÍO */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Dirección de Envío</h2>
                  
                  {/* Dirección */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Calle 123 #45-67"
                    />
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                  </div>

                  {/* Dirección línea 2 */}
                  <div>
                    <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">
                      Apartamento, piso, etc. (opcional)
                    </label>
                    <input
                      type="text"
                      id="addressLine2"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Apto 301, Piso 2, etc."
                    />
                  </div>

                  {/* Ciudad y Departamento */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Bogotá"
                      />
                      {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                        Departamento *
                      </label>
                      <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                          errors.state ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Seleccionar departamento</option>
                        {COLOMBIAN_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
                    </div>
                  </div>

                  {/* Código Postal */}
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Código postal *
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                        errors.postalCode ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="110111"
                      maxLength={6}
                    />
                    <p className="mt-1 text-xs text-gray-500">6 dígitos</p>
                    {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>}
                  </div>

                  {/* Botones */}
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Regresar
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 3: MÉTODO DE PAGO */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Método de Pago</h2>
                  
                  {/* Métodos de pago */}
                  <div className="space-y-3">
                    <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.paymentMethod === 'card' ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={formData.paymentMethod === 'card'}
                          onChange={handleInputChange}
                          className="mr-3"
                        />
                        <div className="flex items-center">
                          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <div>
                            <p className="font-medium">Tarjeta de Crédito/Débito</p>
                            <p className="text-sm text-gray-500">Visa, Mastercard, American Express</p>
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.paymentMethod === 'pse' ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="pse"
                          checked={formData.paymentMethod === 'pse'}
                          onChange={handleInputChange}
                          className="mr-3"
                        />
                        <div className="flex items-center">
                          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <div>
                            <p className="font-medium">PSE</p>
                            <p className="text-sm text-gray-500">Pago desde tu banco</p>
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.paymentMethod === 'nequi' ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="nequi"
                          checked={formData.paymentMethod === 'nequi'}
                          onChange={handleInputChange}
                          className="mr-3"
                        />
                        <div className="flex items-center">
                          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="font-medium">Nequi</p>
                            <p className="text-sm text-gray-500">Pago desde tu app Nequi</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {errors.paymentMethod && <p className="text-sm text-red-600">{errors.paymentMethod}</p>}

                  {/* Notas adicionales */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Notas adicionales (opcional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Instrucciones especiales para la entrega..."
                    />
                  </div>

                  {/* Términos y condiciones */}
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="termsAccepted"
                        name="termsAccepted"
                        checked={formData.termsAccepted}
                        onChange={handleInputChange}
                        className="mt-1 mr-3"
                      />
                      <label htmlFor="termsAccepted" className="text-sm text-gray-700">
                        Acepto los{' '}
                        <a href="/terminos" target="_blank" className="text-gray-900 underline hover:no-underline">
                          términos y condiciones
                        </a>{' '}
                        y la{' '}
                        <a href="/privacidad" target="_blank" className="text-gray-900 underline hover:no-underline">
                          política de privacidad
                        </a>
                        *
                      </label>
                    </div>
                    {errors.termsAccepted && <p className="text-sm text-red-600">{errors.termsAccepted}</p>}

                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="marketingAccepted"
                        name="marketingAccepted"
                        checked={formData.marketingAccepted}
                        onChange={handleInputChange}
                        className="mt-1 mr-3"
                      />
                      <label htmlFor="marketingAccepted" className="text-sm text-gray-700">
                        Quiero recibir ofertas y novedades por email (opcional)
                      </label>
                    </div>
                  </div>

                  {/* Error de envío */}
                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <p className="text-sm text-red-800">{errors.submit}</p>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={isSubmitting}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Regresar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.termsAccepted}
                      className="px-8 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Procesando...
                        </>
                      ) : (
                        `Pagar ${formatPrice(totals.total)}`
                      )}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>

        {/* ✅ RESUMEN DEL PEDIDO */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Resumen del pedido</h3>
            
            {/* Items */}
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex items-center space-x-3">
                  <img 
                    src={item.product_image || '/placeholder-product.jpg'} 
                    alt={item.product_name}
                    className="w-12 h-12 object-cover rounded bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">{formatPrice(validatePrice(item.product_price) * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="space-y-2 mb-6 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({totals.items} productos)</span>
                <span>{formatPrice(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Envío</span>
                <span className={totals.shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {totals.shipping === 0 ? 'Gratis' : formatPrice(totals.shipping)}
                </span>
              </div>
              {totals.subtotal < 100000 && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                  💡 Agrega {formatPrice(100000 - totals.subtotal)} más para envío gratis
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>IVA (19%)</span>
                <span>{formatPrice(totals.tax)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>{formatPrice(totals.total)}</span>
              </div>
            </div>

            {/* Información de seguridad */}
            <div className="bg-gray-50 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-600">Pago 100% seguro con Wompi</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}