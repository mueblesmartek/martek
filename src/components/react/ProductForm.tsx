// src/components/react/CheckoutForm.tsx
import React, { useState, useEffect } from 'react';
import { useCart } from '../../stores/CartContext';
import { createOrder } from '../../lib/supabase';
import type { ShippingAddress } from '../../lib/types';

interface CheckoutFormData {
  email: string;
  firstName: string;
  lastName: string;
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

export function CheckoutForm() {
  const { items, total, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
    paymentMethod: 'card',
    termsAccepted: false,
    marketingAccepted: false,
    notes: ''
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      const emptyState = document.getElementById('empty-cart-state');
      const checkoutContent = document.getElementById('checkout-content');
      
      if (emptyState && checkoutContent) {
        emptyState.classList.remove('hidden');
        checkoutContent.classList.add('hidden');
      }
    }
  }, [items]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Contact Information
      if (!formData.email) newErrors.email = 'Email es requerido';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
      
      if (!formData.firstName) newErrors.firstName = 'Nombre es requerido';
      if (!formData.lastName) newErrors.lastName = 'Apellido es requerido';
      if (!formData.phone) newErrors.phone = 'Teléfono es requerido';
    }
    
    if (step === 2) {
      // Shipping Address
      if (!formData.address) newErrors.address = 'Dirección es requerida';
      if (!formData.city) newErrors.city = 'Ciudad es requerida';
      if (!formData.state) newErrors.state = 'Departamento es requerido';
      if (!formData.postalCode) newErrors.postalCode = 'Código postal es requerido';
    }
    
    if (step === 3) {
      // Payment & Terms
      if (!formData.paymentMethod) newErrors.paymentMethod = 'Método de pago es requerido';
      if (!formData.termsAccepted) newErrors.termsAccepted = 'Debes aceptar los términos y condiciones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3) || items.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // Prepare shipping address
      const shippingAddress: ShippingAddress = {
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        address_line_1: formData.address,
        address_line_2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postalCode,
        country: 'Colombia',
        additional_info: formData.notes
      };
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
      const shipping = subtotal >= 100000 ? 0 : 15000; // Free shipping over 100k
      const tax = subtotal * 0.19; // 19% IVA
      const orderTotal = subtotal + shipping + tax;
      
      // Prepare order items
      const orderItems = items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.product_price,
        quantity: item.quantity,
        total: item.product_price * item.quantity
      }));
      
      // Create order
      const order = await createOrder({
        total: orderTotal,
        subtotal,
        tax,
        shipping_cost: shipping,
        shipping_address: shippingAddress,
        billing_address: shippingAddress, // Same as shipping for now
        items: orderItems,
        payment_method: formData.paymentMethod,
        customer_notes: formData.notes
      });
      
      if (order) {
        // Clear cart
        clearCart();
        
        // Redirect to confirmation page
        window.location.href = `/checkout/confirmacion?order=${order.id}`;
      } else {
        throw new Error('Error creating order');
      }
      
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error al procesar el pedido. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return null; // Let the Astro page handle empty state
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit}>
        
        {/* Step 1: Contact Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Información de Contacto</h2>
            
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Tu nombre"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Tu apellido"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>
            
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="tu@email.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="300 123 4567"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Shipping Address */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Dirección de Envío</h2>
            
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Calle 123 #45-67"
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>
            
            <div>
              <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">
                Complemento de dirección (Opcional)
              </label>
              <input
                type="text"
                id="addressLine2"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Apto 101, Torre B, etc."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Bogotá"
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.state ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar</option>
                  <option value="Cundinamarca">Cundinamarca</option>
                  <option value="Antioquia">Antioquia</option>
                  <option value="Valle del Cauca">Valle del Cauca</option>
                  <option value="Atlántico">Atlántico</option>
                  <option value="Santander">Santander</option>
                  <option value="Bolívar">Bolívar</option>
                  <option value="Norte de Santander">Norte de Santander</option>
                  <option value="Córdoba">Córdoba</option>
                  <option value="Tolima">Tolima</option>
                  <option value="Huila">Huila</option>
                  <option value="Nariño">Nariño</option>
                  <option value="Meta">Meta</option>
                  <option value="Caldas">Caldas</option>
                  <option value="Risaralda">Risaralda</option>
                  <option value="Quindío">Quindío</option>
                  <option value="Boyacá">Boyacá</option>
                  <option value="Cauca">Cauca</option>
                  <option value="Magdalena">Magdalena</option>
                  <option value="La Guajira">La Guajira</option>
                  <option value="Cesar">Cesar</option>
                  <option value="Sucre">Sucre</option>
                  <option value="Casanare">Casanare</option>
                  <option value="Chocó">Chocó</option>
                  <option value="Caquetá">Caquetá</option>
                  <option value="Putumayo">Putumayo</option>
                  <option value="San Andrés y Providencia">San Andrés y Providencia</option>
                  <option value="Arauca">Arauca</option>
                  <option value="Amazonas">Amazonas</option>
                  <option value="Guainía">Guainía</option>
                  <option value="Guaviare">Guaviare</option>
                  <option value="Vaupés">Vaupés</option>
                  <option value="Vichada">Vichada</option>
                </select>
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
              </div>
              
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Código Postal *
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.postalCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="110111"
                />
                {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
              </div>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notas de entrega (Opcional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Instrucciones especiales para la entrega..."
              />
            </div>
          </div>
        )}
        
        {/* Step 3: Payment & Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Método de Pago</h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Tarjeta de Crédito/Débito</div>
                    <div className="text-sm text-gray-500">Visa, Mastercard, American Express</div>
                  </div>
                </label>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="pse"
                    checked={formData.paymentMethod === 'pse'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">PSE</div>
                    <div className="text-sm text-gray-500">Pago seguro en línea</div>
                  </div>
                </label>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="nequi"
                    checked={formData.paymentMethod === 'nequi'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Nequi</div>
                    <div className="text-sm text-gray-500">Pago con Nequi</div>
                  </div>
                </label>
              </div>
            </div>
            {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod}</p>}
            
            <div className="border-t border-gray-200 pt-6">
              <div className="space-y-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleInputChange}
                    className="mr-3 mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    Acepto los <a href="/terminos" className="text-primary-600 hover:underline">términos y condiciones</a> y la <a href="/privacidad" className="text-primary-600 hover:underline">política de privacidad</a> *
                  </span>
                </label>
                {errors.termsAccepted && <p className="text-red-500 text-xs">{errors.termsAccepted}</p>}
                
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="marketingAccepted"
                    checked={formData.marketingAccepted}
                    onChange={handleInputChange}
                    className="mr-3 mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    Acepto recibir comunicaciones promocionales por email
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-8">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Anterior
            </button>
          )}
          
          <div className="ml-auto">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className={`px-8 py-3 rounded-md font-semibold transition-colors ${
                  isLoading
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {isLoading ? 'Procesando...' : 'Finalizar Compra'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}