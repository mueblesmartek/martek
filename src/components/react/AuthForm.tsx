// src/components/react/AuthForm.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface AuthFormProps {
  mode: 'login' | 'register';
  redirectTo?: string;
}

export function AuthForm({ mode, redirectTo = '/' }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Solo para registro
    if (mode === 'register') {
      // Nombre completo
      if (!formData.fullName) {
        newErrors.fullName = 'El nombre completo es requerido';
      }

      // Confirmar contraseña
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirma tu contraseña';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!supabase) {
      alert('Error de configuración. Contacta al administrador.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;

        if (data.user) {
          // Redirigir al usuario
          window.location.href = redirectTo;
        }
      } else {
        // Registro
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          alert('¡Cuenta creada exitosamente! Revisa tu email para confirmar tu cuenta.');
          // Redirigir a login
          window.location.href = '/login';
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Manejar errores específicos
      if (error.message.includes('Invalid login credentials')) {
        setErrors({ email: 'Email o contraseña incorrectos' });
      } else if (error.message.includes('User already registered')) {
        setErrors({ email: 'Este email ya está registrado' });
      } else {
        alert('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Nombre completo (solo registro) */}
        {mode === 'register' && (
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className={`input w-full ${errors.fullName ? 'border-red-500' : ''}`}
              placeholder="Tu nombre completo"
              disabled={loading}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`input w-full ${errors.email ? 'border-red-500' : ''}`}
            placeholder="tu@email.com"
            disabled={loading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Contraseña */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={`input w-full ${errors.password ? 'border-red-500' : ''}`}
            placeholder="Mínimo 6 caracteres"
            disabled={loading}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Confirmar contraseña (solo registro) */}
        {mode === 'register' && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`input w-full ${errors.confirmPassword ? 'border-red-500' : ''}`}
              placeholder="Repite tu contraseña"
              disabled={loading}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        )}

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary btn-lg"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...'}
            </div>
          ) : (
            mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
          )}
        </button>

        {/* Enlaces adicionales */}
        <div className="text-center space-y-2">
          {mode === 'login' && (
            <a
              href="/recuperar-password"
              className="text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </a>
          )}
          
          <div className="text-sm text-gray-600">
            {mode === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <a href="/registro" className="text-gray-800 hover:text-gray-700 font-medium">
                  Regístrate aquí
                </a>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <a href="/login" className="text-gray-800 hover:text-gray-700 font-medium">
                  Inicia sesión
                </a>
              </>
            )}
          </div>
        </div>
      </form>

      {/* Términos y condiciones (solo registro) */}
      {mode === 'register' && (
        <div className="mt-6 text-xs text-gray-500 text-center">
          Al crear una cuenta, aceptas nuestros{' '}
          <a href="/terminos" className="text-gray-700 hover:text-red-600">
            Términos y Condiciones
          </a>{' '}
          y{' '}
          <a href="/privacidad" className="text-gray-700 hover:text-red-600">
            Política de Privacidad
          </a>
        </div>
      )}
    </div>
  );
}