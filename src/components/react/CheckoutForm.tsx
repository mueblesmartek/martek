// src/components/react/CheckoutForm.tsx - LÓGICA COMPLETA CORREGIDA
import React, { useState, useEffect } from 'react';
import { useCartStorage } from '../../hooks/useCartStorage';
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

    const [user, setUser] = useState<any>(null);

  // ✅ USAR LOCALSTORAGE DIRECTAMENTE - SIN CONTEXT API
  const { 
    items, 
    total, 
    itemCount, 
    clearCart,
    isLoading: cartLoading 
  } = useCartStorage();

  useEffect(() => {
    checkAuthUser();
  }, []);

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

  // ✅ REDIRECCIONAR SI CARRITO VACÍO
  useEffect(() => {
    if (!cartLoading && items.length === 0 && !orderSuccess) {
      window.location.href = '/carrito';
    }
  }, [items.length, cartLoading, orderSuccess]);

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
        } else if (!/^[\d\s\+\-\(\)]{7,15}$/.test(formData.phone.replace(/\s/g, ''))) {
          newErrors.phone = 'Teléfono inválido';
        }
        break;
      
      case 2: // Dirección
        if (!formData.address.trim()) newErrors.address = 'Dirección es requerida';
        if (!formData.city.trim()) newErrors.city = 'Ciudad es requerida';
        if (!formData.state.trim()) newErrors.state = 'Departamento es requerido';
        if (!formData.postalCode.trim()) {
          newErrors.postalCode = 'Código postal es requerido';
        } else if (!/^\d{5,6}$/.test(formData.postalCode)) {
          newErrors.postalCode = 'Código postal inválido (5-6 dígitos)';
        }
        break;
      
      case 3: // Pago y términos
        if (!formData.paymentMethod) {
          newErrors.paymentMethod = 'Método de pago es requerido';
        }
        if (!formData.termsAccepted) {
          newErrors.termsAccepted = 'Debes aceptar los términos y condiciones';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ NAVEGACIÓN ENTRE PASOS
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ ACTUALIZAR CAMPO DEL FORMULARIO
  const updateField = (field: keyof CheckoutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // ✅ GENERAR NÚMERO DE ORDEN ÚNICO
  const generateOrderNumber = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `KS-${timestamp.slice(-6)}${random}`;
  };

  // ✅ CALCULAR COSTOS
  const calculateShipping = (): number => {
    if (total >= 100000) return 0; // Envío gratis si supera $100k
    return 15000; // Costo fijo de envío
  };

  const calculateTax = (): number => {
    return Math.round(total * 0.19); // IVA 19%
  };

  const shipping = calculateShipping();
  const tax = calculateTax();
  const finalTotal = total + shipping + tax;

  // ✅ CREAR ORDEN EN SUPABASE
const createOrder = async (): Promise<{ data: any; orderNumber: string }> => {
    try {
    const orderNumber = `KS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const orderData = {
      user_id: user?.id || null,
      order_number: orderNumber,
      subtotal: total,
      tax: 0,
      shipping_cost: 0,
      total: total,
      status: 'pending',
      payment_status: 'pending',
      payment_method: formData.paymentMethod,
      shipping_address: {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address_line_1: formData.address,
        address_line_2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postalCode,
        country: 'Colombia'
      },
      items: items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: item.product_price,
        quantity: item.quantity,
        subtotal: item.product_price * item.quantity
      })),
      customer_notes: formData.notes
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      throw new Error('Error al crear la orden');
    }

    return { data, orderNumber };
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw error;
  }
};

  // ✅ MOSTRAR INDICADOR SI ESTÁ LOGUEADO
  const renderUserInfo = () => {
    if (user) {
      return (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Logueado como: {user.user_metadata?.full_name || user.email}
                </p>
                <p className="text-xs text-gray-600">
                  Este pedido se asociará automáticamente a tu cuenta
                </p>
              </div>
            </div>
            <a 
              href="/mis-pedidos" 
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Ver mis pedidos
            </a>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // ✅ PROCESAR PAGO (Simulado - integrar con Wompi)
  const processPayment = async (
  orderNumber: string, 
  amount: number, 
  customerData: WompiPaymentData
): Promise<PaymentResult> => {
  console.log('Processing payment for order:', orderNumber);
  
  try {
    // Aquí integrarías con Wompi API
    // Por ahora simulación
    return new Promise<PaymentResult>((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: true, 
          transactionId: `TXN_${Date.now()}`,
          reference: orderNumber,
          status: 'APPROVED' 
        });
      }, 2000);
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

  // ✅ ENVIAR FORMULARIO
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateStep(3)) return;
  
  setIsSubmitting(true);
  
  try {
    // 1. Crear orden en la base de datos
    const { data: order, orderNumber: newOrderNumber } = await createOrder();
    
    // 2. Preparar datos del pago
    const paymentData: WompiPaymentData = {
      amount: total,
      reference: newOrderNumber,
      customerEmail: formData.email,
      customerData: {
        phone_number: formData.phone,
        full_name: formData.fullName
      },
      shippingAddress: {
        full_name: formData.fullName,
        phone: formData.phone,
        address_line_1: formData.address,
        address_line_2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postalCode,
        country: 'Colombia'
      }
    };
    
    // ✅ 3. PROCESAR PAGO CON TIPOS EXPLÍCITOS - LÍNEA 315 CORREGIDA
    const paymentResult: PaymentResult = await processPayment(
      newOrderNumber, 
      total, 
      paymentData
    );
    
    // ✅ 4. MANEJAR RESULTADO CON TIPOS SEGUROS
    if (paymentResult.success) {
      // Actualizar estado de la orden
      await supabase
        .from('orders')
        .update({ 
          payment_status: 'completed',
          status: 'processing',
          payment_reference: paymentResult.transactionId
        })
        .eq('id', order.id);
      
      // Limpiar carrito y mostrar éxito
      await clearCart();
      setOrderNumber(newOrderNumber);
      setOrderSuccess(true);
      
      // Mostrar notificación de éxito
      if (typeof window !== 'undefined' && window.showNotification) {
        window.showNotification('¡Pedido realizado exitosamente!', 'success');
      }
    } else {
      // Manejar error en pago
      const errorMessage = paymentResult.message || 'Error procesando el pago';
      setErrors({ payment: errorMessage });
      
      if (typeof window !== 'undefined' && window.showNotification) {
        window.showNotification(errorMessage, 'error');
      }
    }
  } catch (error) {
    console.error('Error in checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
    setErrors({ general: errorMessage });
    
    if (typeof window !== 'undefined' && window.showNotification) {
      window.showNotification('Error al procesar el pedido', 'error');
    }
  } finally {
    setIsSubmitting(false);
  }
};

  // ✅ MOSTRAR NOTIFICACIÓN
  const showNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg border max-w-sm transform transition-all duration-300 ${
      type === 'success' 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-red-50 border-red-200 text-red-800'
    }`;
    
    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-3 opacity-50 hover:opacity-100">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
  };

  // ✅ SI NO HAY ITEMS, MOSTRAR MENSAJE
  if (!cartLoading && items.length === 0 && !orderSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M20 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-600 mb-6">Agrega algunos productos para continuar con tu compra</p>
        <a 
          href="/productos" 
          className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Ver productos
        </a>
      </div>
    );
  }

  // ✅ MOSTRAR ÉXITO DE ORDEN
  if (orderSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido realizado exitosamente!</h2>
        <p className="text-gray-600 mb-4">Tu número de orden es: <strong>{orderNumber}</strong></p>
        <p className="text-gray-600 mb-6">Recibirás un email de confirmación en breve</p>
        <div className="space-y-3">
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors mr-4"
          >
            Seguir comprando
          </a>
          <a 
            href="/mis-pedidos" 
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Ver mis pedidos
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {renderUserInfo()}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ✅ FORMULARIO DE CHECKOUT */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ✅ INDICADOR DE PASOS */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  <div className={`ml-2 text-sm ${
                    currentStep >= step ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    {step === 1 && 'Información'}
                    {step === 2 && 'Dirección'}
                    {step === 3 && 'Pago'}
                  </div>
                  {step < 3 && (
                    <div className={`mx-4 h-px w-12 ${
                      currentStep > step ? 'bg-gray-900' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* ✅ PASO 1: INFORMACIÓN PERSONAL */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información personal</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="tu@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Juan Pérez"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="300 123 4567"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>
            )}

            {/* ✅ PASO 2: DIRECCIÓN */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dirección de envío</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Calle 123 #45-67"
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apartamento, suite, etc. (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => updateField('addressLine2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Apto 101"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Bogotá"
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departamento *
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                        errors.state ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Cundinamarca"
                    />
                    {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código postal *
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                      errors.postalCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="110111"
                  />
                  {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
                </div>
              </div>
            )}

            {/* ✅ PASO 3: PAGO Y TÉRMINOS */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Método de pago</h3>
                
                <div className="space-y-3">
                  {[
                    { id: 'card', label: 'Tarjeta de crédito/débito', icon: '💳' },
                    { id: 'pse', label: 'PSE', icon: '🏦' },
                    { id: 'nequi', label: 'Nequi', icon: '📱' }
                  ].map((method) => (
                    <label key={method.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={formData.paymentMethod === method.id}
                        onChange={(e) => updateField('paymentMethod', e.target.value)}
                        className="mr-3"
                      />
                      <span className="mr-2">{method.icon}</span>
                      <span className="text-gray-900">{method.label}</span>
                    </label>
                  ))}
                  {errors.paymentMethod && <p className="text-red-500 text-sm">{errors.paymentMethod}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas del pedido (opcional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Instrucciones especiales para el envío..."
                  />
                </div>

                {/* Términos y condiciones */}
                <div className="space-y-3">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={(e) => updateField('termsAccepted', e.target.checked)}
                      className="mr-3 mt-1"
                    />
                    <span className="text-sm text-gray-700">
                      Acepto los <a href="/terminos" className="text-gray-900 underline" target="_blank">términos y condiciones</a> y la <a href="/privacidad" className="text-gray-900 underline" target="_blank">política de privacidad</a> *
                    </span>
                  </label>
                  {errors.termsAccepted && <p className="text-red-500 text-sm">{errors.termsAccepted}</p>}

                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.marketingAccepted}
                      onChange={(e) => updateField('marketingAccepted', e.target.checked)}
                      className="mr-3 mt-1"
                    />
                    <span className="text-sm text-gray-700">
                      Quiero recibir ofertas y novedades por email
                    </span>
                  </label>
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{errors.submit}</p>
                  </div>
                )}
              </div>
            )}

            {/* ✅ BOTONES DE NAVEGACIÓN */}
            <div className="flex justify-between pt-6">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← Anterior
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Procesando...' : `Realizar pedido ${new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                  }).format(finalTotal)}`}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ✅ RESUMEN DEL PEDIDO */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg p-6 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del pedido</h3>
            
            {/* Items del carrito */}
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0">
                    {item.product_image && (
                      <img 
                        src={item.product_image} 
                        alt={item.product_name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Cantidad: {item.quantity}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0
                    }).format(item.product_price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                  }).format(total)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envío</span>
                <span className="text-gray-900">
                  {shipping === 0 ? 'Gratis' : new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                  }).format(shipping)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IVA (19%)</span>
                <span className="text-gray-900">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                  }).format(tax)}
                </span>
              </div>
              
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                  }).format(finalTotal)}
                </span>
              </div>
            </div>

            {/* Información de envío gratis */}
            {shipping > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  💡 Envío gratis en compras superiores a {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                  }).format(100000)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}