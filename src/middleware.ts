// src/middleware.ts - DESCOMENTAR TODO EL CÓDIGO
import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

// ✅ DECLARACIONES DE TIPOS LOCALES PARA EVITAR CONFLICTOS
interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    [key: string]: any;
  };
  created_at: string;
  [key: string]: any;
}



// ✅ MIDDLEWARE CORREGIDO CON MANEJO DE TIPOS EXPLÍCITO
export const onRequest = defineMiddleware(async (context, next) => {
  const sessionCookie = context.cookies.get('sb-access-token');
  
  if (sessionCookie && supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(sessionCookie.value);
      
      if (!error && user) {
        // ✅ CASTING EXPLÍCITO PARA RESOLVER EL ERROR TYPESCRIPT
        (context.locals as any).user = user as SupabaseUser;
      }
    } catch (error) {
      console.log('Error in middleware auth check:', error);
      // Token inválido, limpiar cookie
      context.cookies.delete('sb-access-token');
      context.cookies.delete('sb-refresh-token');
    }
  }
  
  return next();
});

// ✅ DECLARACIÓN DE MÓDULO PARA AUGMENTAR ASTRO LOCALS
declare global {
  namespace App {
    interface Locals {
      user?: SupabaseUser | null;
    }
  }
}

export {};