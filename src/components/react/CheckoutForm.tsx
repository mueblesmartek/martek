// src/components/react/CheckoutForm.tsx - MIGRADO A useCartStorage
import React, { useState, useEffect } from 'react';
import { useCartStorage } from '../../hooks/useCartStorage'; // ✅ CAMBIO: De CartContext a useCartStorage
import { createClient } from '@supabase/supabase-js';

// Inicializar Supabase
const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL || '',
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY || ''
);

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  reference?: string;
  status?: 'APPROVED' | 'DECLINED' | 'PENDING' | 'ERROR';
  message?: string;
}

interface WompiPaymentData {
  amount: number;
  reference: string;
  customerEmail: string;
  customerData?: {
    phone_number?: string;
    full_name?: string;
  };
  shippingAddress?: {
    full_name: string;
    phone: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

interface CheckoutFormData {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  paymentMethod: 'card' | 'pse' | 'nequi';
  termsAccepted: boolean;
  marketingAccepted: boolean;
  notes: string;
}

interface ShippingAddress {
  email: string;
  full_name: string;
  phone: string;
  address: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
}

export function CheckoutForm() {
  // ✅ CAMBIO: useCart → useCartStorage
  const { 
    items, 
    total, 
    itemCount, 
    clearCart,
    isLoading: cartLoading 
  } = useCartStorage();

  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    paymentMethod: 'card',
    termsAccepted: false,
    marketingAccepted: false,
    notes: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');

  // ✅ Verificar usuario autenticado al cargar
  useEffect(() => {
    checkAuthUser();
  }, []);

  // ✅ REDIRECCIONAR SI CARRITO VACÍO
  useEffect(() => {
    if (!cartLoading && items.length === 0 && !orderSuccess) {
      window.location.href = '/carrito';
    }
  }, [items.length, cartLoading, orderSuccess]);

  const checkAuthUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Si está logueado, pre-llenar el formulario con sus datos
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          fullName: user.user_metadata?.full_name || ''
        }));
      }
    } catch (err) {
      console.error('Error checking user:', err);
    }
  };

  // ✅ VALIDACIÓN POR PASOS
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Información personal
        if (!formData.email.trim()) {
          newErrors.email = 'Email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Email inválido';
        }
        
        if (!formData.fullName.trim()) {
          newErrors.fullName = 'Nombre completo es requerido';
        }
        
        if (!formData.phone.trim()) {
          newErrors.phone = 'Teléfono es requerido';
        }
        break;

      case 2: // Dirección de envío
        if (!formData.address.trim()) {
          newErrors.address = 'Dirección es requerida';
        }
        
        if (!formData.city.trim()) {
          newErrors.city = 'Ciudad es requerida';
        }
        
        if (!formData.state.trim()) {
          newErrors.state = 'Departamento es requerido';
        }
        
        if (!formData.postalCode.trim()) {
          newErrors.postalCode = 'Código postal es requerido';
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

    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ✅ AVANZAR AL SIGUIENTE PASO
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  // ✅ REGRESAR AL PASO ANTERIOR
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // ✅ PROCESAR PAGO (Simplificado para MVP)
  const processPayment = async (): Promise<PaymentResult> => {
    // Simulación de procesamiento de pago
    // En implementación real conectarías con Wompi aquí
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay

    // Simulación: 90% de éxito
    const success = Math.random() > 0.1;
    
    if (success) {
      return {
        success: true,
        transactionId: `TXN_${Date.now()}`,
        reference: `REF_${Date.now()}`,
        status: 'APPROVED',
        message: 'Pago procesado exitosamente'
      };
    } else {
      return {
        success: false,
        status: 'DECLINED',
        message: 'El pago fue rechazado. Por favor, intenta con otro método.'
      };
    }
  };

  // ✅ ENVÍO FINAL DEL FORMULARIO
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);

    try {
      // 1. Procesar pago
      const paymentResult = await processPayment();
      
      if (!paymentResult.success) {
        setErrors({ payment: paymentResult.message || 'Error en el pago' });
        setIsSubmitting(false);
        return;
      }

      // 2. Crear orden en Supabase
      const orderData = {
        total: total,
        subtotal: total * 0.84, // Aproximado sin IVA
        tax: total * 0.16, // Aproximado IVA
        shipping_cost: total >= 100000 ? 0 : 15000,
        items: items,
        shipping_address: {
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          address_line2: formData.addressLine2 || null,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode
        },
        billing_address: {
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          address_line2: formData.addressLine2 || null,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode
        },
        payment_method: formData.paymentMethod,
        payment_status: 'paid',
        payment_reference: paymentResult.reference,
        customer_notes: formData.notes || null,
        status: 'confirmed'
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        throw new Error('Error creando la orden: ' + orderError.message);
      }

      // 3. Limpiar carrito y mostrar éxito
      await clearCart();
      setOrderNumber(order.order_number || order.id.slice(0, 8).toUpperCase());
      setOrderSuccess(true);

    } catch (error) {
      console.error('Error en checkout:', error);
      setErrors({ 
        payment: error instanceof Error ? error.message : 'Error procesando la orden' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ CALCULAR TOTALES
  const subtotal = total;
  const shipping = subtotal >= 100000 ? 0 : 15000;
  const tax = subtotal * 0.19;
  const finalTotal = subtotal + shipping + tax;

  // ✅ MOSTRAR LOADING SI EL CARRITO ESTÁ CARGANDO
  if (cartLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-gray-600">Cargando carrito...</span>
      </div>
    );
  }

  // ✅ MOSTRAR ÉXITO SI LA ORDEN SE COMPLETÓ
  if (orderSuccess) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Orden confirmada!</h2>
        <p className="text-gray-600 mb-2">Tu pedido ha sido procesado exitosamente.</p>
        <p className="text-sm text-gray-500 mb-8">Número de orden: <strong>{orderNumber}</strong></p>
        
        <div className="space-y-4">
          <a 
            href="/mis-pedidos" 
            className="block w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Ver mis pedidos
          </a>
          <a 
            href="/productos" 
            className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Seguir comprando
          </a>
        </div>
      </div>
    );
  }

  // ✅ FORMULARIO PRINCIPAL
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario principal */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                <span className={`ml-2 text-sm ${
                  currentStep >= step ? 'text-gray-800' : 'text-gray-500'
                }`}>
                  {step === 1 ? 'Información' : step === 2 ? 'Envío' : 'Pago'}
                </span>
                {step < 3 && (
                  <div className={`w-16 h-px mx-4 ${
                    currentStep > step ? 'bg-gray-900' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Paso 1: Información personal */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Información de contacto</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="tu@email.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.fullName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nombre y apellidos"
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+57 300 123 4567"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Dirección de envío */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Dirección de envío</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Calle 123 #45-67"
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apartamento, suite, etc. (opcional)
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Apt 101, Torre A"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Bogotá"
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departamento *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        errors.state ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Cundinamarca"
                    />
                    {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código postal *
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        errors.postalCode ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="110111"
                    />
                    {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Método de pago */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Método de pago</h3>
              
              <div className="space-y-4 mb-6">
                {['card', 'pse', 'nequi'].map((method) => (
                  <label key={method} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={formData.paymentMethod === method}
                      onChange={handleInputChange}
                      className="text-gray-800 focus:ring-red-500"
                    />
                    <span className="ml-3 font-medium">
                      {method === 'card' ? '💳 Tarjeta de Crédito/Débito' : 
                       method === 'pse' ? '🏦 PSE' : 
                       '📱 Nequi'}
                    </span>
                  </label>
                ))}
                {errors.paymentMethod && <p className="text-sm text-red-600">{errors.paymentMethod}</p>}
              </div>

              <div className="space-y-4 mb-6">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleInputChange}
                    className="mt-1 text-gray-800 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Acepto los <a href="/terminos" className="text-gray-800 underline">términos y condiciones</a> y la <a href="/privacidad" className="text-gray-800 underline">política de privacidad</a> *
                  </span>
                </label>
                {errors.termsAccepted && <p className="text-sm text-red-600">{errors.termsAccepted}</p>}

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="marketingAccepted"
                    checked={formData.marketingAccepted}
                    onChange={handleInputChange}
                    className="mt-1 text-gray-800 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Quiero recibir ofertas y promociones especiales (opcional)
                  </span>
                </label>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas del pedido (opcional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Instrucciones especiales para la entrega..."
                />
              </div>

              {errors.payment && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{errors.payment}</p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gray-900 text-white px-8 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Procesando...' : `Pagar $${finalTotal.toLocaleString('es-CO')}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resumen lateral */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen del pedido</h3>
            
            {/* Items */}
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0">
                    <img
                      src={item.product_image || '/images/placeholder.jpg'}
                      alt={item.product_name}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Cantidad: {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    ${(item.product_price * item.quantity).toLocaleString('es-CO')}
                  </p>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Envío</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-CO')}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA (19%)</span>
                <span>${tax.toLocaleString('es-CO')}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>${finalTotal.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Beneficios de envío */}
            {shipping === 0 ? (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm font-medium flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  ¡Envío gratis incluido!
                </p>
              </div>
            ) : (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  Agrega ${(100000 - subtotal).toLocaleString('es-CO')} más para envío gratis
                </p>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}