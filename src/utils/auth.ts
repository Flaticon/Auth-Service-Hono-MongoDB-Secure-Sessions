import { Context, Next } from 'hono';
import { AuthService } from '../services/authService.js';
import { verifyJWT } from './crypto.js';
import type { IJWTPayload, UserRole } from '../types.js';

/**
 * Middleware para autenticar requests usando JWT
 */
export async function authenticateJWT(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return c.json({ 
      success: false, 
      error: 'Access token required' 
    }, 401);
  }
  
  try {
    const payload = verifyJWT(token) as IJWTPayload;
    
    // Añadir información del usuario al contexto
    c.set('user', {
      userId: payload.userId,
      username: payload.username,
      role: payload.role
    });
    
    await next();
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Invalid or expired token' 
    }, 403);
  }
}

/**
 * Middleware para autenticar usando session token
 */
export async function authenticateSession(c: Context, next: Next) {
  const sessionToken = c.req.header('X-Session-Token') || 
                      c.req.cookie('sessionToken');
  
  if (!sessionToken) {
    return c.json({ 
      success: false, 
      error: 'Session token required' 
    }, 401);
  }
  
  try {
    const result = await AuthService.verifySession(sessionToken);
    
    if (!result.success || !result.data) {
      return c.json({ 
        success: false, 
        error: result.error || 'Invalid session' 
      }, 401);
    }
    
    // Añadir usuario y sesión al contexto
    c.set('user', result.data.user);
    c.set('session', result.data.session);
    
    await next();
  } catch (error) {
    console.error('Session authentication error:', error);
    return c.json({ 
      success: false, 
      error: 'Authentication error' 
    }, 500);
  }
}

/**
 * Middleware para verificar roles específicos
 */
export function requireRole(...roles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ 
        success: false, 
        error: 'Authentication required' 
      }, 401);
    }
    
    const userRole = user.role || (user as any).role;
    
    if (!roles.includes(userRole)) {
      return c.json({ 
        success: false, 
        error: 'Insufficient permissions',
        required: roles,
        current: userRole
      }, 403);
    }
    
    await next();
  };
}

/**
 * Middleware para verificar que el usuario es admin
 */
export function requireAdmin(c: Context, next: Next) {
  return requireRole('admin')(c, next);
}

/**
 * Middleware para verificar que el usuario es el propietario del recurso
 */
export function requireOwnership(getUserIdFromParams: (c: Context) => string) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ 
        success: false, 
        error: 'Authentication required' 
      }, 401);
    }
    
    const resourceUserId = getUserIdFromParams(c);
    const currentUserId = user._id?.toString() || (user as any).userId;
    
    // Admin puede acceder a todo
    if (user.role === 'admin') {
      await next();
      return;
    }
    
    // Verificar ownership
    if (currentUserId !== resourceUserId) {
      return c.json({ 
        success: false, 
        error: 'Access denied. You can only access your own resources.' 
      }, 403);
    }
    
    await next();
  };
}

/**
 * Middleware opcional - no falla si no hay autenticación
 */
export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.split(' ')[1];
  const sessionToken = c.req.header('X-Session-Token') || c.req.cookie('sessionToken');
  
  // Intentar JWT primero
  if (token) {
    try {
      const payload = verifyJWT(token) as IJWTPayload;
      c.set('user', {
        userId: payload.userId,
        username: payload.username,
        role: payload.role
      });
    } catch (error) {
      // JWT inválido, continuar sin usuario
    }
  }
  // Intentar sesión si no hay JWT válido
  else if (sessionToken) {
    try {
      const result = await AuthService.verifySession(sessionToken);
      if (result.success && result.data) {
        c.set('user', result.data.user);
        c.set('session', result.data.session);
      }
    } catch (error) {
      // Sesión inválida, continuar sin usuario
    }
  }
  
  await next();
}

/**
 * Extrae IP del request (considerando proxies)
 */
export function getClientIP(c: Context): string {
  return c.req.header('X-Forwarded-For') || 
         c.req.header('X-Real-IP') || 
         c.req.header('CF-Connecting-IP') || 
         'unknown';
}

/**
 * Extrae metadatos de sesión del request
 */
export function getSessionMetadata(c: Context) {
  return {
    userAgent: c.req.header('User-Agent') || '',
    ipAddress: getClientIP(c),
    device: extractDeviceInfo(c.req.header('User-Agent') || ''),
  };
}

/**
 * Extrae información del dispositivo del User-Agent
 */
function extractDeviceInfo(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  
  // Detectar móvil
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    if (/iPhone/.test(userAgent)) return 'iPhone';
    if (/iPad/.test(userAgent)) return 'iPad';
    if (/Android/.test(userAgent)) return 'Android';
    return 'Mobile';
  }
  
  // Detectar navegadores de escritorio
  if (/Chrome/.test(userAgent)) return 'Chrome Desktop';
  if (/Firefox/.test(userAgent)) return 'Firefox Desktop';
  if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return 'Safari Desktop';
  if (/Edge/.test(userAgent)) return 'Edge Desktop';
  
  return 'Desktop';
}

/**
 * Middleware de rate limiting simple
 */
export function createRateLimit(maxRequests: number, windowMs: number) {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return async (c: Context, next: Next) => {
    const key = getClientIP(c);
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Limpiar entradas antiguas
    for (const [ip, data] of requests.entries()) {
      if (data.resetTime < windowStart) {
        requests.delete(ip);
      }
    }
    
    // Obtener o crear contador para esta IP
    let requestData = requests.get(key);
    if (!requestData || requestData.resetTime < windowStart) {
      requestData = { count: 0, resetTime: now + windowMs };
      requests.set(key, requestData);
    }
    
    // Verificar límite
    if (requestData.count >= maxRequests) {
      return c.json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      }, 429);
    }
    
    // Incrementar contador
    requestData.count++;
    
    await next();
  };
}