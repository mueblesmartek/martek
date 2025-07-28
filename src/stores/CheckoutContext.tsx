// src/stores/CheckoutContext.tsx
import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

// Tipos para el checkout
export interface CheckoutFormData {
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

interface CheckoutState {
  formData: CheckoutFormData;
  currentStep: number;
  errors: Record<string, string>;
  isLoading: boolean;
}

type CheckoutAction =
  | { type: 'UPDATE_FIELD'; payload: { field: keyof CheckoutFormData; value: any } }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_FORM' };

interface CheckoutContextType {
  // Estado
  formData: CheckoutFormData;
  currentStep: number;
  errors: Record<string, string>;
  isLoading: boolean;
  
  // Acciones
  updateField: (field: keyof CheckoutFormData, value: any) => void;
  setStep: (step: number) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearError: (field: string) => void;
  setLoading: (loading: boolean) => void;
  resetForm: () => void;
  
  // Validación
  validateStep: (step: number) => boolean;
  
  // Helpers
  getDisplayName: () => string;
  getDisplayAddress: () => string;
  getDisplayPaymentMethod: () => string;
}

// Estado inicial
const initialFormData: CheckoutFormData = {
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
};

const initialState: CheckoutState = {
  formData: initialFormData,
  currentStep: 1,
  errors: {},
  isLoading: false
};

// Reducer
const checkoutReducer = (state: CheckoutState, action: CheckoutAction): CheckoutState => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.payload.field]: action.payload.value
        }
      };
      
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload
      };
      
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload
      };
      
    case 'CLEAR_ERROR':
      const newErrors = { ...state.errors };
      delete newErrors[action.payload];
      return {
        ...state,
        errors: newErrors
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
      
    case 'RESET_FORM':
      return initialState;
      
    default:
      return state;
  }
};

// Context
const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

// Provider Component
export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(checkoutReducer, initialState);

  // Actions
  const updateField = (field: keyof CheckoutFormData, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  };

  const setStep = (step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  const setErrors = (errors: Record<string, string>) => {
    dispatch({ type: 'SET_ERRORS', payload: errors });
  };

  const clearError = (field: string) => {
    dispatch({ type: 'CLEAR_ERROR', payload: field });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' });
  };

  // Validación
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Contact Information
      if (!state.formData.email) newErrors.email = 'Email es requerido';
      else if (!/\S+@\S+\.\S+/.test(state.formData.email)) newErrors.email = 'Email inválido';
      
      if (!state.formData.firstName) newErrors.firstName = 'Nombre es requerido';
      if (!state.formData.lastName) newErrors.lastName = 'Apellido es requerido';
      if (!state.formData.phone) newErrors.phone = 'Teléfono es requerido';
    }
    
    if (step === 2) {
      // Shipping Address
      if (!state.formData.address) newErrors.address = 'Dirección es requerida';
      if (!state.formData.city) newErrors.city = 'Ciudad es requerida';
      if (!state.formData.state) newErrors.state = 'Departamento es requerido';
      if (!state.formData.postalCode) newErrors.postalCode = 'Código postal es requerido';
    }
    
    if (step === 3) {
      // Payment & Terms
      if (!state.formData.paymentMethod) newErrors.paymentMethod = 'Método de pago es requerido';
      if (!state.formData.termsAccepted) newErrors.termsAccepted = 'Debes aceptar los términos y condiciones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helpers para mostrar información formateada
  const getDisplayName = (): string => {
    const { firstName, lastName } = state.formData;
    if (!firstName && !lastName) return '';
    return `${firstName} ${lastName}`.trim();
  };

  const getDisplayAddress = (): string => {
    const { address, addressLine2, city, state: stateValue, postalCode } = state.formData;
    
    if (!address && !city) return '';
    
    const parts = [];
    if (address) parts.push(address);
    if (addressLine2) parts.push(addressLine2);
    if (city) parts.push(city);
    if (stateValue) parts.push(stateValue);
    if (postalCode) parts.push(postalCode);
    
    return parts.join(', ');
  };

  const getDisplayPaymentMethod = (): string => {
    const methods = {
      'card': 'Tarjeta de Crédito/Débito',
      'pse': 'PSE',
      'nequi': 'Nequi'
    };
    return methods[state.formData.paymentMethod] || '';
  };

  const value: CheckoutContextType = {
    // Estado
    formData: state.formData,
    currentStep: state.currentStep,
    errors: state.errors,
    isLoading: state.isLoading,
    
    // Acciones
    updateField,
    setStep,
    setErrors,
    clearError,
    setLoading,
    resetForm,
    
    // Validación
    validateStep,
    
    // Helpers
    getDisplayName,
    getDisplayAddress,
    getDisplayPaymentMethod
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

// Hook personalizado
export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}

// Export context para uso avanzado
export { CheckoutContext };