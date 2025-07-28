// src/components/react/NotificationSystem.tsx - VERSIÓN SIMPLIFICADA
import React, { useState, useEffect, createContext, useContext } from 'react';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (message: string, type?: Notification['type'], duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Hook para usar notificaciones
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    // Si no hay context, crear funciones dummy para evitar errores
    return {
      notifications: [],
      showNotification: (message: string, type?: Notification['type']) => {
        console.log(`[${type?.toUpperCase() || 'INFO'}] ${message}`);
      },
      removeNotification: () => {}
    };
  }
  return context;
}

// Provider de notificaciones
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Función para mostrar notificación
  const showNotification = (
    message: string, 
    type: Notification['type'] = 'info', 
    duration: number = 5000
  ) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notification: Notification = {
      id,
      message,
      type,
      duration
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remover después del duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  // Función para remover notificación
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      showNotification,
      removeNotification
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

// Contenedor de notificaciones (UI simplificada)
function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`
            border rounded-lg p-4 shadow-lg transition-all duration-300
            ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
            ${notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
            ${notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : ''}
            ${notification.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
          `}
        >
          <div className="flex items-start">
            <div className="flex-1">
              <p className="text-sm font-medium">
                {notification.message}
              </p>
            </div>
            
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => removeNotification(notification.id)}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ✅ FUNCIÓN GLOBAL PARA USAR FUERA DE REACT
let globalShowNotification: ((message: string, type?: Notification['type']) => void) | null = null;

export function setGlobalNotification(fn: (message: string, type?: Notification['type']) => void) {
  globalShowNotification = fn;
}

// Función standalone para usar en cualquier lugar
export function showNotification(message: string, type: Notification['type'] = 'info') {
  if (globalShowNotification) {
    globalShowNotification(message, type);
  } else {
    // Fallback a console si no hay sistema de notificaciones
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}