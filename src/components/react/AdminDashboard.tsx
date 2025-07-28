// src/components/react/AdminDashboard.tsx - VERSIÓN SIMPLIFICADA COMPATIBLE
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { NotificationProvider, useNotifications, setGlobalNotification } from './NotificationSystem';
import { AdminProductsSpreadsheet } from './AdminProductsSpreadsheet';

interface AdminStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
}

// Componente interno con acceso a notificaciones
function AdminDashboardContent() {
  const [user] = useState({ email: 'admin@kamasex.shop', full_name: 'Admin' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('products');
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0
  });

  const { showNotification } = useNotifications();

  // Configurar función global de notificaciones
  useEffect(() => {
    setGlobalNotification(showNotification);
  }, [showNotification]);

  // Cargar estadísticas al montar
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!supabase) {
      setLoading(false);
      showNotification('Supabase no configurado', 'error');
      return;
    }

    try {
      // Contar productos totales
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Contar productos activos
      const { count: activeProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Contar productos con stock bajo
      const { count: lowStockProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lt('stock', 10);

      // Contar órdenes totales
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Calcular revenue total
      const { data: ordersRevenue } = await supabase
        .from('orders')
        .select('total')
        .eq('payment_status', 'completed');

      const totalRevenue = ordersRevenue?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      setStats({
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        lowStockProducts: lowStockProducts || 0
      });

      showNotification('Estadísticas cargadas correctamente', 'success');

    } catch (error) {
      console.error('Error loading stats:', error);
      showNotification('Error cargando estadísticas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
                <p className="text-gray-600 mt-1">Kamasex.shop</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Bienvenido</p>
                  <p className="font-medium text-gray-800">{user.full_name}</p>
                </div>
                <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user.full_name?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'overview'
                  ? 'border-red-600 text-gray-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Resumen
            </button>
            
            <button
              onClick={() => setActiveTab('products')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'products'
                  ? 'border-red-600 text-gray-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Productos
            </button>
            
            <button
              onClick={() => setActiveTab('orders')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'orders'
                  ? 'border-red-600 text-gray-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Pedidos
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Resumen Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Total Products */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Productos</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {loading ? '...' : stats.totalProducts}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Products */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Productos Activos</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {loading ? '...' : stats.activeProducts}
                    </p>
                  </div>
                </div>
              </div>

              {/* Low Stock */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.823-.833-2.592 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {loading ? '...' : stats.lowStockProducts}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Pedidos</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {loading ? '...' : stats.totalOrders}
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-900 text-white rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {loading ? '...' : formatCurrency(stats.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('products')}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-800">Gestionar Productos</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Ver y editar productos del catálogo
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-800">Ver Pedidos</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Procesar y gestionar pedidos
                  </div>
                </button>
                
                <button
                  onClick={loadStats}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-800">Actualizar Datos</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Refrescar estadísticas
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab - Grid Excel Completo */}
        {activeTab === 'products' && (
          <AdminProductsSpreadsheet />
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Gestión de Pedidos</h3>
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h4 className="text-lg font-medium text-gray-800 mb-2">Gestión de Pedidos</h4>
              <p className="text-gray-600">
                Próximamente: Interface para gestionar pedidos, estados de envío y pagos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ COMPONENTE PRINCIPAL CON NOTIFICATIONPROVIDER
export function AdminDashboard() {
  return (
    <NotificationProvider>
      <AdminDashboardContent />
    </NotificationProvider>
  );
}