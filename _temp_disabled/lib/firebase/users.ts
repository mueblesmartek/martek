// src/lib/firebase/users.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  sendEmailVerification,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

import { auth, db, firebaseUtils, COLLECTIONS } from './config';
import type { UserProfile, UserAddress, UserPreferences, WishlistItem } from './config';

// Interfaces para registro y login
export interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  marketingConsent?: boolean;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  marketingConsent?: boolean;
}

export interface AddressData {
  type: 'shipping' | 'billing';
  firstName: string;
  lastName: string;
  company?: string;
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

// ===========================================
// AUTENTICACIÓN
// ===========================================

// Registrar nuevo usuario
export const signUp = async (data: SignUpData): Promise<{
  user: User | null;
  error: string | null;
}> => {
  try {
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const user = userCredential.user;

    // Crear perfil en Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      phone: data.phone || '',
      dateOfBirth: data.dateOfBirth || '',
      emailVerified: user.emailVerified,
      marketingConsent: data.marketingConsent || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalOrders: 0,
      totalSpent: 0,
      loyaltyPoints: 0
    };

    await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userProfile);

    // Crear preferencias por defecto
    const defaultPreferences: UserPreferences = {
      userId: user.uid,
      newsletterSubscription: data.marketingConsent || false,
      smsNotifications: false,
      orderUpdates: true,
      promotions: data.marketingConsent || false,
      productRecommendations: true,
      language: 'es',
      currency: 'COP',
      timezone: 'America/Bogota',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, COLLECTIONS.USER_PREFERENCES, user.uid), defaultPreferences);

    // Enviar email de verificación
    if (import.meta.env.PUBLIC_ENV === 'production') {
      await sendEmailVerification(user);
    }

    return { user, error: null };

  } catch (error: any) {
    console.error('Error en registro:', error);
    return { user: null, error: firebaseUtils.handleError(error) };
  }
};

// Iniciar sesión
export const signIn = async (data: SignInData): Promise<{
  user: User | null;
  error: string | null;
}> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const user = userCredential.user;

    // Actualizar último login
    await updateLastLogin(user.uid);

    return { user, error: null };

  } catch (error: any) {
    console.error('Error en login:', error);
    return { user: null, error: firebaseUtils.handleError(error) };
  }
};

// Cerrar sesión
export const signOut = async (): Promise<{ error: string | null }> => {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: any) {
    console.error('Error cerrando sesión:', error);
    return { error: firebaseUtils.handleError(error) };
  }
};

// Recuperar contraseña
export const resetPassword = async (email: string): Promise<{ error: string | null }> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error: any) {
    console.error('Error enviando email de recuperación:', error);
    return { error: firebaseUtils.handleError(error) };
  }
};

// Actualizar contraseña
export const updateUserPassword = async (newPassword: string): Promise<{ error: string | null }> => {
  try {
    const user = auth.currentUser;
    if (!user) return { error: 'Usuario no autenticado' };

    await updatePassword(user, newPassword);
    return { error: null };
  } catch (error: any) {
    console.error('Error actualizando contraseña:', error);
    return { error: firebaseUtils.handleError(error) };
  }
};

// Observer de cambios de autenticación
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// ===========================================
// GESTIÓN DE PERFIL
// ===========================================

// Obtener perfil del usuario
export const getUserProfile = async (userId?: string): Promise<UserProfile | null> => {
  try {
    const uid = userId || firebaseUtils.getCurrentUserId();
    if (!uid) return null;

    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    
    if (!userDoc.exists()) {
      return null;
    }

    return userDoc.data() as UserProfile;

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return null;
  }
};

// Actualizar perfil del usuario
export const updateUserProfile = async (updates: UpdateProfileData): Promise<boolean> => {
  try {
    const userId = firebaseUtils.getCurrentUserId();
    if (!userId) return false;

    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(doc(db, COLLECTIONS.USERS, userId), updateData);
    return true;

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    firebaseUtils.handleError(error);
    return false;
  }
};

// Actualizar último login
const updateLastLogin = async (userId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error actualizando último login:', error);
  }
};

// ===========================================
// GESTIÓN DE DIRECCIONES
// ===========================================

// Obtener direcciones del usuario
export const getUserAddresses = async (type?: 'shipping' | 'billing'): Promise<UserAddress[]> => {
  try {
    const userId = firebaseUtils.getCurrentUserId();
    if (!userId) return [];

    let q = query(
      collection(db, COLLECTIONS.USER_ADDRESSES),
      where('userId', '==', userId),
      orderBy('isDefault', 'desc'),
      orderBy('createdAt', 'desc')
    );

    if (type) {
      q = query(
        collection(db, COLLECTIONS.USER_ADDRESSES),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('isDefault', 'desc'),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserAddress[];

  } catch (error) {
    console.error('Error obteniendo direcciones:', error);
    return [];
  }
};

// Agregar nueva dirección
export const addUserAddress = async (addressData: AddressData): Promise<string | null> => {
  try {
    const userId = firebaseUtils.getCurrentUserId();
    if (!userId) return null;

    const batch = writeBatch(db);

    // Si es dirección por defecto, desmarcar otras del mismo tipo
    if (addressData.isDefault) {
      const existingAddresses = await getUserAddresses(addressData.type);
      existingAddresses.forEach(addr => {
        if (addr.isDefault) {
          const addrRef = doc(db, COLLECTIONS.USER_ADDRESSES, addr.id);
          batch.update(addrRef, { isDefault: false });
        }
      });
    }

    // Crear nueva dirección
    const newAddressRef = doc(collection(db, COLLECTIONS.USER_ADDRESSES));
    const newAddress: Omit<UserAddress, 'id'> = {
      userId,
      type: addressData.type,
      firstName: addressData.firstName,
      lastName: addressData.lastName,
      company: addressData.company,
      streetAddress: addressData.streetAddress,
      apartment: addressData.apartment,
      city: addressData.city,
      state: addressData.state,
      postalCode: addressData.postalCode,
      country: addressData.country,
      phone: addressData.phone,
      isDefault: addressData.isDefault || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    batch.set(newAddressRef, newAddress);
    await batch.commit();

    return newAddressRef.id;

  } catch (error) {
    console.error('Error agregando dirección:', error);
    firebaseUtils.handleError(error);
    return null;
  }
};

// Actualizar dirección
export const updateUserAddress = async (
  addressId: string,
  updates: Partial<AddressData>
): Promise<boolean> => {
  try {
    const userId = firebaseUtils.getCurrentUserId();
    if (!userId) return false;

    const batch = writeBatch(db);

    // Si se marca como por defecto, desmarcar otras del mismo tipo
    if (updates.isDefault && updates.type) {
      const existingAddresses = await getUserAddresses(updates.type);
      existingAddresses.forEach(addr => {
        if (addr.isDefault && addr.id !== addressId) {
          const addrRef = doc(db, COLLECTIONS.USER_ADDRESSES, addr.id);
          batch.update(addrRef, { isDefault: false });
        }
      });
    }

    // Actualizar dirección
    const addressRef = doc(db, COLLECTIONS.USER_ADDRESSES, addressId);
    batch.update(addressRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    await batch.commit();
    return true;

  } catch (error) {
    console.error('Error actualizando dirección:', error);
    firebaseUtils.handleError(error);
    return false;
  }
};

// Eliminar dirección
export const deleteUserAddress = async (addressId: string): Promise<boolean> => {
  try {
    const userId = firebaseUtils.getCurrentUserId();
    if (!userId) return false;

    await deleteDoc(doc(db, COLLECTIONS.USER_ADDRESSES, addressId));
    return true;

  } catch (error) {
    console.error('Error eliminando dirección:', error);
    firebaseUtils.handleError(error);
    return false;
  }
};

// ===========================================
// PREFERENCIAS DE USUARIO
// ===========================================

// Obtener preferencias del usuario
export const getUserPreferences = async (): Promise<UserPreferences | null> => {
  try {
    const userId = firebaseUtils.getCurrentUserId();
    if (!userId) return null;

    const prefsDoc = await getDoc(doc(db, COLLECTIONS.USER_PREFERENCES, userId));
    
    if (!prefsDoc.exists()) {
      return null;
    }

    return prefsDoc.data() as UserPreferences;

  } catch (error) {
    console.error('Error obteniendo preferencias:', error);
    return null;
  }
};

// Actualizar preferencias del usuario
export const updateUserPreferences = async (
  updates: Partial<UserPreferences>
): Promise<boolean> => {
  try {
    const userId = firebaseUtils.getCurrentUserId();
    if (!userId) return false;

    await updateDoc(doc(db, COLLECTIONS.USER_PREFERENCES, userId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    return true;

  } catch (error) {
    console.error('Error actualizando preferencias:', error);
    firebaseUtils.handleError(error);
    return false;
  }
};

// ===========================================
// WISHLIST
// ===========================================

// Obtener wishlist del usuario
export const getUserWishlist = async (): Promise<WishlistItem[]> => {
  try {
    const userId = firebaseUtils.getCurrentUserId();
    if (!userId) return [];

    const q = query(
      collection(db, COLLECTIONS.WISHLISTS),
      where('userId', '==', userId),
      orderBy('addedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WishlistItem[];

  } catch (error) {
    console.error('Error obteniendo wishlist:', error);
    return [];
  }
};

// Agregar producto a wishlist
export const addToWishlist = async (productId: string, productData?: any): Promise<boolean> => {
  try {
    const userId = firebaseUtils.getCurrentUserId();
    if (!userId) return false;

    // Verificar si ya existe
    const existing = await isInWishlist(productId);
    if (existing) return true;

    const wishlistItem: Omit<WishlistItem, 'id'> = {
      userId,
      productId,
      addedAt: new Date().toISOString(),
      productData
    };

    await addDoc(collection(db, COLLECTIONS.WISHLISTS), wishlistItem);
    return true;

  } catch (error) {
    console.error('Error agregando a wishlist:', error);
    firebaseUtils.handleError(error);
    return false;
  }
};

// Quitar producto de wishlist
export const removeFromWishlist = async (productId: string): Promise<boolean> => {
  try {
    const userId = firebaseUtils.getCurrentUserId();
    if (!userId) return false;

    const q = query(
      collection(db, COLLECTIONS.WISHLISTS),
      where('userId', '==', userId),
      where('productId', '==', productId)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return true;

    // Eliminar todos los documentos que coincidan
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return true;

  } catch (error) {
    console.error('Error quitando de wishlist:', error);
    firebaseUtils.handleError(error);
    return false;
  }
};

// Verificar si producto está en wishlist
export const isInWishlist = async (productId: string): Promise<boolean> => {
  try {
    const userId = firebaseUtils.getCurrentUserId();
    if (!userId) return false;

    const q = query(
      collection(db, COLLECTIONS.WISHLISTS),
      where('userId', '==', userId),
      where('productId', '==', productId)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;

  } catch (error) {
    console.error('Error verificando wishlist:', error);
    return false;
  }
};

// ===========================================
// UTILIDADES
// ===========================================

// Verificar si el email ya existe
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('email', '==', email)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;

  } catch (error) {
    console.error('Error verificando email:', error);
    return false;
  }
};

// Eliminar cuenta de usuario
export const deleteUserAccount = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const userId = user.uid;
    const batch = writeBatch(db);

    // Marcar perfil como eliminado
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    batch.update(userRef, {
      email: `deleted_${userId}@deleted.com`,
      firstName: '[ELIMINADO]',
      lastName: '[ELIMINADO]',
      phone: '',
      updatedAt: new Date().toISOString()
    });

    // Eliminar datos relacionados
    const [addresses, wishlist, preferences] = await Promise.all([
      getUserAddresses(),
      getUserWishlist(),
      getUserPreferences()
    ]);

    // Eliminar direcciones
    addresses.forEach(addr => {
      batch.delete(doc(db, COLLECTIONS.USER_ADDRESSES, addr.id));
    });

    // Eliminar wishlist
    wishlist.forEach(item => {
      batch.delete(doc(db, COLLECTIONS.WISHLISTS, item.id));
    });

    // Eliminar preferencias
    if (preferences) {
      batch.delete(doc(db, COLLECTIONS.USER_PREFERENCES, userId));
    }

    await batch.commit();

    // Cerrar sesión
    await signOut();

    return true;

  } catch (error) {
    console.error('Error eliminando cuenta:', error);
    firebaseUtils.handleError(error);
    return false;
  }
};

// Obtener estadísticas del usuario (para admin)
export const getUserStats = async (userId: string) => {
  try {
    const [profile, addresses, wishlist] = await Promise.all([
      getUserProfile(userId),
      getUserAddresses(),
      getUserWishlist()
    ]);

    return {
      profile,
      totalAddresses: addresses.length,
      wishlistCount: wishlist.length,
      hasShippingAddress: addresses.some(addr => addr.type === 'shipping'),
      hasBillingAddress: addresses.some(addr => addr.type === 'billing'),
      lastActivity: profile?.lastLogin || profile?.createdAt
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas de usuario:', error);
    return null;
  }
};