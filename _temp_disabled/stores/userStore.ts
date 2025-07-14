// src/stores/userStore.ts
import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import { onAuthStateChange, type User } from 'firebase/auth';
import {
  getUserProfile,
  getUserAddresses,
  getUserPreferences,
  getUserWishlist,
  signOut,
  type UserProfile,
  type UserAddress,
  type UserPreferences
} from '../lib/firebase/users';
import { syncCartWithServer, loadCartFromServer } from './cartStore';

// Tipos para el estado del usuario
export interface UserState {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  
  // Profile data
  profile: UserProfile | null;
  addresses: UserAddress[];
  preferences: UserPreferences | null;
  wishlist: string[]; // Array de product IDs
  
  // UI state
  authModalOpen: boolean;
  authMode: 'login' | 'register' | 'forgot-password';
  
  // Error state
  error: string | null;
  
  // Last updated
  lastUpdated: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  marketingConsent?: boolean;
}

// ===========================================
// STORES PRINCIPALES
// ===========================================

// Estado principal del usuario
export const userStore = atom<UserState>({
  isAuthenticated: false,
  isLoading: true, // Comienza en true hasta verificar auth state
  user: null,
  profile: null,
  addresses: [],
  preferences: null,
  wishlist: [],
  authModalOpen: false,
  authMode: 'login',
  error: null,
  lastUpdated: new Date().toISOString()
});

// Loading states específicos
export const authLoading = atom<boolean>(false);
export const profileLoading = atom<boolean>(false);
export const wishlistLoading = atom<boolean>(false);

// Estados de preferencias (persistentes para UX)
export const userPrefs = persistentAtom<{
  theme: 'light' | 'dark';
  language: string;
  currency: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
}>('userPrefs', {
  theme: 'light',
  language: 'es',
  currency: 'COP',
  emailNotifications: true,
  smsNotifications: false
}, {
  encode: JSON.stringify,
  decode: JSON.parse
});

// ===========================================
// COMPUTED VALUES
// ===========================================

// Verificar si el usuario está completamente cargado
export const isUserReady = computed(userStore, (user) => 
  !user.isLoading && user.isAuthenticated && user.profile !== null
);

// Verificar si el perfil está completo
export const isProfileComplete = computed(userStore, (user) => {
  if (!user.profile) return false;
  
  return !!(
    user.profile.firstName &&
    user.profile.lastName &&
    user.profile.phone &&
    user.profile.emailVerified
  );
});

// Obtener nombre completo del usuario
export const userFullName = computed(userStore, (user) => {
  if (!user.profile) return 'Usuario';
  
  const firstName = user.profile.firstName || '';
  const lastName = user.profile.lastName || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (user.user?.email) {
    return user.user.email.split('@')[0];
  }
  
  return 'Usuario';
});

// Obtener dirección de envío por defecto
export const defaultShippingAddress = computed(userStore, (user) =>
  user.addresses.find(addr => addr.type === 'shipping' && addr.isDefault) || null
);

// Obtener dirección de facturación por defecto
export const defaultBillingAddress = computed(userStore, (user) =>
  user.addresses.find(addr => addr.type === 'billing' && addr.isDefault) || null
);

// Contador de wishlist
export const wishlistCount = computed(userStore, (user) => user.wishlist.length);

// Verificar si un producto está en wishlist
export const isInWishlist = (productId: string) => 
  computed(userStore, (user) => user.wishlist.includes(productId));

// ===========================================
// AUTH STATE OBSERVER
// ===========================================

// Inicializar observer de Firebase Auth
export const initAuthObserver = () => {
  if (typeof window === 'undefined') return;

  onAuthStateChange(async (firebaseUser) => {
    const currentState = userStore.get();
    
    if (firebaseUser) {
      // Usuario logueado
      userStore.set({
        ...currentState,
        isAuthenticated: true,
        isLoading: true,
        user: firebaseUser,
        error: null
      });
      
      // Cargar datos del usuario
      await loadUserData(firebaseUser.uid);
      
      // Sincronizar carrito
      await syncCartWithServer(firebaseUser.uid);
      
    } else {
      // Usuario no logueado
      userStore.set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        profile: null,
        addresses: [],
        preferences: null,
        wishlist: [],
        authModalOpen: false,
        authMode: 'login',
        error: null,
        lastUpdated: new Date().toISOString()
      });
    }
  });
};

// ===========================================
// CARGAR DATOS DEL USUARIO
// ===========================================

// Cargar todos los datos del usuario
const loadUserData = async (userId: string): Promise<void> => {
  try {
    profileLoading.set(true);
    
    // Cargar datos en paralelo
    const [profile, addresses, preferences, wishlist] = await Promise.all([
      getUserProfile(userId),
      getUserAddresses(),
      getUserPreferences(),
      getUserWishlist()
    ]);

    const currentState = userStore.get();
    userStore.set({
      ...currentState,
      isLoading: false,
      profile,
      addresses,
      preferences,
      wishlist,
      lastUpdated: new Date().toISOString()
    });

    // Sincronizar preferencias locales
    if (preferences) {
      userPrefs.set({
        theme: 'light', // Default
        language: preferences.language || 'es',
        currency: preferences.currency || 'COP',
        emailNotifications: preferences.orderUpdates ?? true,
        smsNotifications: preferences.smsNotifications ?? false
      });
    }

  } catch (error) {
    console.error('Error cargando datos del usuario:', error);
    const currentState = userStore.get();
    userStore.set({
      ...currentState,
      isLoading: false,
      error: 'Error cargando datos del usuario'
    });
  } finally {
    profileLoading.set(false);
  }
};

// Recargar perfil del usuario
export const reloadUserProfile = async (): Promise<boolean> => {
  try {
    const currentState = userStore.get();
    if (!currentState.user) return false;

    profileLoading.set(true);
    const profile = await getUserProfile(currentState.user.uid);
    
    userStore.set({
      ...currentState,
      profile,
      lastUpdated: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error recargando perfil:', error);
    return false;
  } finally {
    profileLoading.set(false);
  }
};

// Recargar direcciones del usuario
export const reloadUserAddresses = async (): Promise<boolean> => {
  try {
    const currentState = userStore.get();
    if (!currentState.user) return false;

    const addresses = await getUserAddresses();
    
    userStore.set({
      ...currentState,
      addresses,
      lastUpdated: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error recargando direcciones:', error);
    return false;
  }
};

// Recargar wishlist del usuario
export const reloadUserWishlist = async (): Promise<boolean> => {
  try {
    const currentState = userStore.get();
    if (!currentState.user) return false;

    wishlistLoading.set(true);
    const wishlist = await getUserWishlist();
    
    userStore.set({
      ...currentState,
      wishlist,
      lastUpdated: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error recargando wishlist:', error);
    return false;
  } finally {
    wishlistLoading.set(false);
  }
};

// ===========================================
// GESTIÓN DE WISHLIST
// ===========================================

// Agregar producto a wishlist
export const addToWishlist = async (productId: string, productData?: any): Promise<boolean> => {
  try {
    const currentState = userStore.get();
    if (!currentState.isAuthenticated) {
      setAuthModalOpen(true, 'login');
      return false;
    }

    wishlistLoading.set(true);
    
    // Importar dinámicamente para evitar problemas de SSR
    const { addToWishlist: firebaseAddToWishlist } = await import('../lib/firebase/users');
    const success = await firebaseAddToWishlist(productId, productData);
    
    if (success) {
      // Actualizar estado local
      userStore.set({
        ...currentState,
        wishlist: [...currentState.wishlist, productId],
        lastUpdated: new Date().toISOString()
      });

      showNotification('Producto agregado a favoritos');
      trackUserEvent('wishlist_add', { productId });
    }

    return success;
  } catch (error) {
    console.error('Error agregando a wishlist:', error);
    showNotification('Error al agregar a favoritos', 'error');
    return false;
  } finally {
    wishlistLoading.set(false);
  }
};

// Quitar producto de wishlist
export const removeFromWishlist = async (productId: string): Promise<boolean> => {
  try {
    const currentState = userStore.get();
    if (!currentState.isAuthenticated) return false;

    wishlistLoading.set(true);
    
    const { removeFromWishlist: firebaseRemoveFromWishlist } = await import('../lib/firebase/users');
    const success = await firebaseRemoveFromWishlist(productId);
    
    if (success) {
      // Actualizar estado local
      userStore.set({
        ...currentState,
        wishlist: currentState.wishlist.filter(id => id !== productId),
        lastUpdated: new Date().toISOString()
      });

      showNotification('Producto eliminado de favoritos');
      trackUserEvent('wishlist_remove', { productId });
    }

    return success;
  } catch (error) {
    console.error('Error quitando de wishlist:', error);
    showNotification('Error al eliminar de favoritos', 'error');
    return false;
  } finally {
    wishlistLoading.set(false);
  }
};

// Toggle producto en wishlist
export const toggleWishlist = async (productId: string, productData?: any): Promise<boolean> => {
  const currentState = userStore.get();
  const isCurrentlyInWishlist = currentState.wishlist.includes(productId);
  
  if (isCurrentlyInWishlist) {
    return await removeFromWishlist(productId);
  } else {
    return await addToWishlist(productId, productData);
  }
};

// ===========================================
// GESTIÓN DE AUTH MODAL
// ===========================================

// Abrir modal de autenticación
export const setAuthModalOpen = (open: boolean, mode: 'login' | 'register' | 'forgot-password' = 'login'): void => {
  const currentState = userStore.get();
  userStore.set({
    ...currentState,
    authModalOpen: open,
    authMode: mode,
    error: null
  });
};

// Cambiar modo del modal de auth
export const setAuthMode = (mode: 'login' | 'register' | 'forgot-password'): void => {
  const currentState = userStore.get();
  userStore.set({
    ...currentState,
    authMode: mode,
    error: null
  });
};

// ===========================================
// LOGOUT
// ===========================================

// Cerrar sesión
export const logout = async (): Promise<boolean> => {
  try {
    authLoading.set(true);
    
    const { signOut: firebaseSignOut } = await import('../lib/firebase/users');
    const { error } = await firebaseSignOut();
    
    if (error) {
      console.error('Error cerrando sesión:', error);
      showNotification('Error al cerrar sesión', 'error');
      return false;
    }

    // Limpiar datos locales
    userStore.set({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      profile: null,
      addresses: [],
      preferences: null,
      wishlist: [],
      authModalOpen: false,
      authMode: 'login',
      error: null,
      lastUpdated: new Date().toISOString()
    });

    // Reset preferencias a defaults
    userPrefs.set({
      theme: 'light',
      language: 'es',
      currency: 'COP',
      emailNotifications: true,
      smsNotifications: false
    });

    showNotification('Sesión cerrada exitosamente');
    trackUserEvent('logout');
    
    return true;
  } catch (error) {
    console.error('Error en logout:', error);
    showNotification('Error al cerrar sesión', 'error');
    return false;
  } finally {
    authLoading.set(false);
  }
};

// ===========================================
// GESTIÓN DE ERRORES
// ===========================================

// Limpiar error
export const clearUserError = (): void => {
  const currentState = userStore.get();
  userStore.set({
    ...currentState,
    error: null
  });
};

// Establecer error
export const setUserError = (error: string): void => {
  const currentState = userStore.get();
  userStore.set({
    ...currentState,
    error
  });
};

// ===========================================
// ACTUALIZACIÓN DE PREFERENCIAS
// ===========================================

// Actualizar preferencias locales
export const updateLocalPreferences = (prefs: Partial<typeof userPrefs.value>): void => {
  const current = userPrefs.get();
  userPrefs.set({
    ...current,
    ...prefs
  });
};

// Sincronizar preferencias con Firebase
export const syncPreferencesWithFirebase = async (): Promise<boolean> => {
  try {
    const currentState = userStore.get();
    if (!currentState.isAuthenticated) return false;

    const localPrefs = userPrefs.get();
    
    const { updateUserPreferences } = await import('../lib/firebase/users');
    const success = await updateUserPreferences({
      language: localPrefs.language,
      currency: localPrefs.currency,
      orderUpdates: localPrefs.emailNotifications,
      smsNotifications: localPrefs.smsNotifications
    });

    if (success) {
      // Recargar preferencias desde Firebase
      const { getUserPreferences } = await import('../lib/firebase/users');
      const updatedPrefs = await getUserPreferences();
      
      userStore.set({
        ...currentState,
        preferences: updatedPrefs,
        lastUpdated: new Date().toISOString()
      });
    }

    return success;
  } catch (error) {
    console.error('Error sincronizando preferencias:', error);
    return false;
  }
};

// ===========================================
// UTILIDADES DE PERFIL
// ===========================================

// Verificar si el usuario necesita completar su perfil
export const needsProfileCompletion = (): boolean => {
  const currentState = userStore.get();
  if (!currentState.profile) return true;

  return !(
    currentState.profile.firstName &&
    currentState.profile.lastName &&
    currentState.profile.phone &&
    currentState.profile.emailVerified
  );
};

// Obtener estadísticas del usuario
export const getUserStats = () => {
  const currentState = userStore.get();
  
  return {
    isAuthenticated: currentState.isAuthenticated,
    profileComplete: isProfileComplete.get(),
    hasAddresses: currentState.addresses.length > 0,
    hasShippingAddress: currentState.addresses.some(addr => addr.type === 'shipping'),
    hasBillingAddress: currentState.addresses.some(addr => addr.type === 'billing'),
    wishlistCount: currentState.wishlist.length,
    totalOrders: currentState.profile?.totalOrders || 0,
    totalSpent: currentState.profile?.totalSpent || 0,
    loyaltyPoints: currentState.profile?.loyaltyPoints || 0,
    memberSince: currentState.profile?.createdAt,
    lastLogin: currentState.profile?.lastLogin
  };
};

// ===========================================
// NOTIFICACIONES Y EVENTOS
// ===========================================

// Sistema de notificaciones del usuario
const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success'): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('user-notification', {
      detail: { message, type }
    }));
  }
};

// Sistema de tracking de eventos
const trackUserEvent = (event: string, data?: any): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('user-analytics', {
      detail: { event, data, timestamp: Date.now() }
    }));
  }
};

// ===========================================
// HELPERS PARA COMPONENTES
// ===========================================

// Requerir autenticación
export const requireAuth = (action: string = 'realizar esta acción'): boolean => {
  const currentState = userStore.get();
  
  if (!currentState.isAuthenticated) {
    setAuthModalOpen(true, 'login');
    showNotification(`Debes iniciar sesión para ${action}`, 'info');
    return false;
  }
  
  return true;
};

// Requerir perfil completo
export const requireCompleteProfile = (): boolean => {
  if (!requireAuth('completar tu perfil')) return false;
  
  if (needsProfileCompletion()) {
    showNotification('Por favor completa tu perfil antes de continuar', 'info');
    // Redirigir a completar perfil
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navigate-to-profile'));
    }
    return false;
  }
  
  return true;
};

// Exportar estado actual para debug
export const debugUserState = () => {
  console.log('User Store State:', userStore.get());
  console.log('User Preferences:', userPrefs.get());
  console.log('Auth Loading:', authLoading.get());
  console.log('Profile Loading:', profileLoading.get());
  console.log('Wishlist Loading:', wishlistLoading.get());
};