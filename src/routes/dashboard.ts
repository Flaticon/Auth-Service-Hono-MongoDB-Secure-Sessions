import { Hono } from 'hono';
import { authenticateSession, requireRole, requireAdmin } from '../utils/auth';
import { User } from '../models/User';
import { Session } from '../models/Session';
import type { IUserPublic } from '../types';

const dashboard = new Hono();

// Todas las rutas del dashboard requieren autenticación
dashboard.use('*', authenticateSession);

/**
 * GET /dashboard
 * Dashboard principal del usuario
 */
dashboard.get('/', async (c) => {
  try {
    const user = c.get('user') as IUserPublic;
    
    // Obtener estadísticas básicas del usuario
    const sessionStats = await Session.getStats(user._id);
    
    return c.json({
      success: true,
      data: {
        user: {
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          profile: user.profile
        },
        stats: {
          activeSessions: sessionStats.active,
          totalSessions: sessionStats.total,
          sessionsThisWeek: sessionStats.thisWeek
        }
      }
    });
  } catch (error) {
    console.error('Dashboard route error:', error);
    return c.json({
      success: false,
      error: 'Failed to load dashboard'
    }, 500);
  }
});

/**
 * GET /dashboard/profile
 * Perfil detallado del usuario
 */
dashboard.get('/profile', async (c) => {
  try {
    const user = c.get('user') as IUserPublic;
    
    return c.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Profile route error:', error);
    return c.json({
      success: false,
      error: 'Failed to get profile'
    }, 500);
  }
});

/**
 * GET /dashboard/activity
 * Actividad reciente del usuario
 */
dashboard.get('/activity', async (c) => {
  try {
    const user = c.get('user') as IUserPublic;
    
    // Obtener sesiones recientes del usuario
    const sessions = await Session.findActiveByUser(user._id);
    
    const recentActivity = sessions.slice(0, 10).map(session => ({
      id: session._id,
      type: 'session',
      action: 'login',
      timestamp: session.createdAt,
      metadata: {
        device: session.metadata.device,
        ipAddress: session.metadata.ipAddress?.replace(/\.\d+$/, '.***'), // Ocultar últimos dígitos de IP
        userAgent: session.metadata.userAgent?.substring(0, 50) + '...'
      }
    }));
    
    return c.json({
      success: true,
      data: recentActivity
    });
  } catch (error) {
    console.error('Activity route error:', error);
    return c.json({
      success: false,
      error: 'Failed to get activity'
    }, 500);
  }
});

/**
 * GET /dashboard/security
 * Información de seguridad del usuario
 */
dashboard.get('/security', async (c) => {
  try {
    const user = c.get('user') as IUserPublic;
    
    const sessions = await Session.findActiveByUser(user._id);
    const sessionStats = await Session.getStats(user._id);
    
    return c.json({
      success: true,
      data: {
        activeSessions: sessions.length,
        totalSessions: sessionStats.total,
        lastLogin: sessions[0]?.lastAccess || user.updatedAt,
        accountCreated: user.createdAt,
        twoFactorEnabled: false, // TODO: Implementar 2FA
        sessions: sessions.map(session => ({
          id: session._id,
          device: session.metadata.device,
          location: session.metadata.location || 'Unknown',
          ipAddress: session.metadata.ipAddress?.replace(/\.\d+$/, '.***'),
          createdAt: session.createdAt,
          lastAccess: session.lastAccess,
          isCurrent: session.token === (c.req.header('X-Session-Token') || c.req.cookie('sessionToken'))
        }))
      }
    });
  } catch (error) {
    console.error('Security route error:', error);
    return c.json({
      success: false,
      error: 'Failed to get security information'
    }, 500);
  }
});

// ===================================
// RUTAS DE ADMINISTRACIÓN
// ===================================

/**
 * GET /dashboard/admin/users
 * Lista de usuarios (solo admin)
 */
dashboard.get('/admin/users', requireAdmin, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search');
    
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const result = await User.findMany(filter, page, limit);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Admin users route error:', error);
    return c.json({
      success: false,
      error: 'Failed to get users'
    }, 500);
  }
});

/**
 * GET /dashboard/admin/stats
 * Estadísticas generales (solo admin)
 */
dashboard.get('/admin/stats', requireAdmin, async (c) => {
  try {
    const [userCount, sessionStats] = await Promise.all([
      User.count(),
      Session.getStats()
    ]);
    
    return c.json({
      success: true,
      data: {
        totalUsers: userCount,
        activeSessions: sessionStats.active,
        totalSessions: sessionStats.total,
        newSessionsThisWeek: sessionStats.thisWeek
      }
    });
  } catch (error) {
    console.error('Admin stats route error:', error);
    return c.json({
      success: false,
      error: 'Failed to get statistics'
    }, 500);
  }
});

/**
 * PUT /dashboard/admin/users/:userId/role
 * Cambiar rol de usuario (solo admin)
 */
dashboard.put('/admin/users/:userId/role', requireAdmin, async (c) => {
  try {
    const userId = c.req.param('userId');
    const { role } = await c.req.json();
    
    if (!userId || !role) {
      return c.json({
        success: false,
        error: 'User ID and role are required'
      }, 400);
    }
    
    if (!['user', 'admin', 'moderator'].includes(role)) {
      return c.json({
        success: false,
        error: 'Invalid role'
      }, 400);
    }
    
    const updated = await User.updateProfile(userId, { role });
    
    if (!updated) {
      return c.json({
        success: false,
        error: 'User not found or failed to update'
      }, 404);
    }
    
    return c.json({
      success: true,
      message: `User role updated to ${role}`
    });
  } catch (error) {
    console.error('Update user role route error:', error);
    return c.json({
      success: false,
      error: 'Failed to update user role'
    }, 500);
  }
});

/**
 * PUT /dashboard/admin/users/:userId/status
 * Activar/desactivar usuario (solo admin)
 */
dashboard.put('/admin/users/:userId/status', requireAdmin, async (c) => {
  try {
    const userId = c.req.param('userId');
    const { isActive } = await c.req.json();
    
    if (!userId || typeof isActive !== 'boolean') {
      return c.json({
        success: false,
        error: 'User ID and status are required'
      }, 400);
    }
    
    const updated = isActive 
      ? await User.reactivate(userId)
      : await User.deactivate(userId);
    
    if (!updated) {
      return c.json({
        success: false,
        error: 'User not found or failed to update'
      }, 404);
    }
    
    // Si se desactiva el usuario, invalidar todas sus sesiones
    if (!isActive) {
      await Session.invalidateAllForUser(userId);
    }
    
    return c.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Update user status route error:', error);
    return c.json({
      success: false,
      error: 'Failed to update user status'
    }, 500);
  }
});

/**
 * GET /dashboard/admin/sessions
 * Ver todas las sesiones activas (solo admin)
 */
dashboard.get('/admin/sessions', requireAdmin, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    
    // Esta función no existe en el modelo, la implementaremos simple
    const sessions = await Session.getStats();
    
    return c.json({
      success: true,
      data: {
        totalActive: sessions.active,
        total: sessions.total
      },
      message: 'Session details require individual user lookup'
    });
  } catch (error) {
    console.error('Admin sessions route error:', error);
    return c.json({
      success: false,
      error: 'Failed to get sessions'
    }, 500);
  }
});

export default dashboard;