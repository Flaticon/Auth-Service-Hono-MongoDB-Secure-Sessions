import { Hono } from 'hono';
import { AuthService } from '../services/authService';
import { 
  authenticateJWT, 
  authenticateSession, 
  getSessionMetadata,
  requireOwnership,
  createRateLimit
} from '../utils/auth';
import type { ILoginRequest, IRegisterRequest } from '../types';

const auth = new Hono();

/**
 * Función auxiliar para simular cookies
 */
function getSimulatedCookie(c: any, name: string): string | undefined {
  try {
    const cookieHeader = c.req.header('Cookie');
    if (!cookieHeader) return undefined;
    
    const cookies = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    return cookies[name];
  } catch (error) {
    return undefined;
  }
}

// Rate limiting para rutas de autenticación
const authRateLimit = createRateLimit(5, 15 * 60 * 1000); // 5 requests per 15 minutes

/**
 * POST /auth/register
 * Registra un nuevo usuario
 */
auth.post('/register', authRateLimit, async (c) => {
  try {
    const body = await c.req.json() as IRegisterRequest;
    const { username, email, password, profile } = body;
    
    if (!username || !password) {
      return c.json({
        success: false,
        error: 'Username and password are required'
      }, 400);
    }
    
    const metadata = getSessionMetadata(c);
    
    const result = await AuthService.register(
      { username, email, password, profile },
      metadata
    );
    
    if (result.success && result.sessionToken) {
      // Configurar cookie de sesión
      c.header('Set-Cookie', 
        `sessionToken=${result.sessionToken}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
      );
    }
    
    return c.json(result, result.success ? 201 : 400);
  } catch (error) {
    console.error('Register route error:', error);
    return c.json({
      success: false,
      error: 'Registration failed'
    }, 500);
  }
});

/**
 * POST /auth/login
 * Inicia sesión de usuario
 */
auth.post('/login', authRateLimit, async (c) => {
  try {
    const body = await c.req.json() as ILoginRequest;
    const { identifier, password } = body;
    
    if (!identifier || !password) {
      return c.json({
        success: false,
        error: 'Username/email and password are required'
      }, 400);
    }
    
    const metadata = getSessionMetadata(c);
    
    const result = await AuthService.login({ identifier, password }, metadata);
    
    if (result.success && result.sessionToken) {
      // Configurar cookie de sesión
      c.header('Set-Cookie', 
        `sessionToken=${result.sessionToken}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
      );
    }
    
    return c.json(result, result.success ? 200 : 401);
  } catch (error) {
    console.error('Login route error:', error);
    return c.json({
      success: false,
      error: 'Login failed'
    }, 500);
  }
});

/**
 * POST /auth/logout
 * Cierra sesión del usuario
 */
auth.post('/logout', authenticateSession, async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token') || getSimulatedCookie(c, 'sessionToken');
    
    if (!sessionToken) {
      return c.json({
        success: false,
        error: 'No session token provided'
      }, 400);
    }
    
    const result = await AuthService.logout(sessionToken);
    
    // Limpiar cookie
    if (result.success) {
      c.header('Set-Cookie', 
        'sessionToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
      );
    }
    
    return c.json(result);
  } catch (error) {
    console.error('Logout route error:', error);
    return c.json({
      success: false,
      error: 'Logout failed'
    }, 500);
  }
});

/**
 * POST /auth/logout-all
 * Cierra todas las sesiones del usuario
 */
auth.post('/logout-all', authenticateSession, async (c) => {
  try {
    const user = c.get('user') as any;
    
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found in context'
      }, 401);
    }
    
    const result = await AuthService.logoutAll(user._id.toString());
    
    // Limpiar cookie de la sesión actual también
    if (result.success) {
      c.header('Set-Cookie', 
        'sessionToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
      );
    }
    
    return c.json(result);
  } catch (error) {
    console.error('Logout all route error:', error);
    return c.json({
      success: false,
      error: 'Failed to logout from all sessions'
    }, 500);
  }
});

/**
 * GET /auth/me
 * Obtiene información del usuario actual
 */
auth.get('/me', authenticateSession, async (c) => {
  try {
    const user = c.get('user');
    
    return c.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me route error:', error);
    return c.json({
      success: false,
      error: 'Failed to get user information'
    }, 500);
  }
});

/**
 * GET /auth/verify
 * Verifica si el token JWT es válido
 */
auth.get('/verify', authenticateJWT, async (c) => {
  try {
    const user = c.get('user');
    
    return c.json({
      success: true,
      data: user,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Verify route error:', error);
    return c.json({
      success: false,
      error: 'Token verification failed'
    }, 500);
  }
});

/**
 * PUT /auth/profile
 * Actualiza el perfil del usuario
 */
auth.put('/profile', authenticateSession, async (c) => {
  try {
    const user = c.get('user');
    const updates = await c.req.json();
    
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found in context'
      }, 401);
    }
    
    const result = await AuthService.updateProfile(user._id.toString(), updates);
    
    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('Update profile route error:', error);
    return c.json({
      success: false,
      error: 'Failed to update profile'
    }, 500);
  }
});

/**
 * PUT /auth/change-password
 * Cambia la contraseña del usuario
 */
auth.put('/change-password', authenticateSession, async (c) => {
  try {
    const user = c.get('user');
    const { currentPassword, newPassword } = await c.req.json();
    
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found in context'
      }, 401);
    }
    
    if (!currentPassword || !newPassword) {
      return c.json({
        success: false,
        error: 'Current password and new password are required'
      }, 400);
    }
    
    const result = await AuthService.changePassword(
      user._id.toString(),
      currentPassword,
      newPassword
    );
    
    // Si el cambio fue exitoso, limpiar cookie para forzar re-login
    if (result.success) {
      c.header('Set-Cookie', 
        'sessionToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
      );
    }
    
    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('Change password route error:', error);
    return c.json({
      success: false,
      error: 'Failed to change password'
    }, 500);
  }
});

/**
 * GET /auth/sessions
 * Obtiene sesiones activas del usuario
 */
auth.get('/sessions', authenticateSession, async (c) => {
  try {
    const user = c.get('user');
    
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found in context'
      }, 401);
    }
    
    const result = await AuthService.getActiveSessions(user._id.toString());
    
    return c.json(result, result.success ? 200 : 500);
  } catch (error) {
    console.error('Get sessions route error:', error);
    return c.json({
      success: false,
      error: 'Failed to get active sessions'
    }, 500);
  }
});

/**
 * DELETE /auth/sessions/:sessionId
 * Revoca una sesión específica
 */
auth.delete('/sessions/:sessionId', authenticateSession, async (c) => {
  try {
    const user = c.get('user');
    const sessionId = c.req.param('sessionId');
    
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found in context'
      }, 401);
    }
    
    if (!sessionId) {
      return c.json({
        success: false,
        error: 'Session ID is required'
      }, 400);
    }
    
    const result = await AuthService.revokeSession(user._id.toString(), sessionId);
    
    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('Revoke session route error:', error);
    return c.json({
      success: false,
      error: 'Failed to revoke session'
    }, 500);
  }
});

/**
 * GET /auth/refresh
 * Refresca la sesión actual (actualiza lastAccess)
 */
auth.get('/refresh', authenticateSession, async (c) => {
  try {
    const user = c.get('user') as any;
    const session = c.get('session') as any;
    
    return c.json({
      success: true,
      data: {
        user,
        session: session ? {
          id: session._id,
          lastAccess: session.lastAccess
        } : null
      },
      message: 'Session refreshed'
    });
  } catch (error) {
    console.error('Refresh route error:', error);
    return c.json({
      success: false,
      error: 'Failed to refresh session'
    }, 500);
  }
});

export default auth;