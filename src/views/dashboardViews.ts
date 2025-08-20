import { Hono } from 'hono';
import { authenticateSession, requireRole, requireAdmin } from '../utils/auth.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';

const dashboard = new Hono();

/**
 * GET /dashboard
 * Página principal del dashboard (requiere autenticación)
 */
dashboard.get('/', authenticateSession, async (c) => {
  try {
    const user = c.get('user');
    const session = c.get('session');
    
    // Obtener estadísticas básicas del usuario
    const sessionStats = await Session.getStats(user._id);
    
    return c.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          profile: user.profile
        },
        session: {
          createdAt: session.createdAt,
          lastAccess: session.lastAccess,
          device: session.metadata.device,
          ipAddress: session.metadata.ipAddress
        },
        stats: {
          activeSessions: sessionStats.active,
          totalSessions: sessionStats.total,
          sessionsThisWeek: sessionStats.thisWeek
        }
      },
      message: `Welcome back, ${user.username}!`
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
 * Obtiene perfil detallado del usuario
 */
dashboard.get('/profile', authenticateSession, async (c) => {
  try {
    const user = c.get('user');
    
    // Obtener información adicional
    const activeSessions = await Session.findActiveByUser(user._id);
    
    return c.json({
      success: true,
      data: {
        profile: user,
        security: {
          activeSessions: activeSessions.length,
          lastLogin: activeSessions[0]?.createdAt || null,
          recentSessions: activeSessions.slice(0, 5).map(s => ({
            id: s._id,
            createdAt: s.createdAt,
            lastAccess: s.lastAccess,
            device: s.metadata.device,
            ipAddress: s.metadata.ipAddress,
            location: s.metadata.location
          }))
        }
      }
    });
  } catch (error) {
    console.error('Dashboard profile route error:', error);
    return c.json({
      success: false,
      error: 'Failed to load profile'
    }, 500);
  }
});

/**
 * GET /dashboard/settings
 * Configuraciones del usuario
 */
dashboard.get('/settings', authenticateSession, async (c) => {
  try {
    const user = c.get('user');
    
    return c.json({
      success: true,
      data: {
        account: {
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        preferences: user.profile.preferences || {},
        privacy: {
          profileVisibility: user.profile.profileVisibility || 'private',
          emailNotifications: user.profile.emailNotifications !== false,
          twoFactorEnabled: false // TODO: implementar 2FA
        }
      }
    });
  } catch (error) {
    console.error('Dashboard settings route error:', error);
    return c.json({
      success: false,
      error: 'Failed to load settings'
    }, 500);
  }
});

/**
 * PUT /dashboard/settings
 * Actualiza configuraciones del usuario
 */
dashboard.put('/settings', authenticateSession, async (c) => {
  try {
    const user = c.get('user');
    const settings = await c.req.json();
    
    // Extraer configuraciones válidas
    const { preferences, privacy, ...otherSettings } = settings;
    
    const updates: any = {
      'profile.preferences': preferences,
      'profile.profileVisibility': privacy?.profileVisibility,
      'profile.emailNotifications': privacy?.emailNotifications,
      updatedAt: new Date()
    };
    
    // Remover valores undefined
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });
    
    const updated = await User.updateProfile(user._id.toString(), updates);
    
    if (!updated) {
      return c.json({
        success: false,
        error: 'Failed to update settings'
      }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update settings route error:', error);
    return c.json({
      success: false,
      error: 'Failed to update settings'
    }, 500);
  }
});

// ===================================
// RUTAS DE ADMINISTRACIÓN
// ===================================

/**
 * GET /dashboard/admin
 * Panel de administración (solo admins)
 */
dashboard.get('/admin', authenticateSession, requireAdmin, async (c) => {
  try {
    // Obtener estadísticas generales
    const [totalUsers, activeUsers, totalSessions, activeSessions] = await Promise.all([
      User.count(),
      User.count({ isActive: true }),
      Session.getStats(),
      Session.getStats()
    ]);
    
    return c.json({
      success: true,
      data: {
        stats: {
          users: {
            total: totalUsers,
            active: activeUsers,
            inactive: totalUsers - activeUsers
          },
          sessions: {
            total: totalSessions.total,
            active: activeSessions.active,
            thisWeek: totalSessions.thisWeek
          }
        },
        systemInfo: {
          nodeVersion: process.version,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          environment: process.env.NODE_ENV
        }
      }
    });
  } catch (error) {
    console.error('Admin dashboard route error:', error);
    return c.json({
      success: false,
      error: 'Failed to load admin dashboard'
    }, 500);
  }
});

/**
 * GET /dashboard/admin/users
 * Lista usuarios (solo admins o moderadores)
 */
dashboard.get('/admin/users', authenticateSession, requireRole('admin', 'moderator'), async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const search = c.req.query('search');
    
    let filter: any = {};
    
    // Filtro de búsqueda
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
    console.error('Admin users list route error:', error);
    return c.json({
      success: false,
      error: 'Failed to load users'
    }, 500);
  }
});

/**
 * PUT /dashboard/admin/users/:userId/status
 * Cambia estado de usuario (solo admins)
 */
dashboard.put('/admin/users/:userId/status', authenticateSession, requireAdmin, async (c) => {
  try {
    const userId = c.req.param('userId');
    const { isActive } = await c.req.json();
    
    if (!userId) {
      return c.json({
        success: false,
        error: 'User ID is required'
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
    
    // Si se desactiva, invalidar todas sus sesiones
    if (!isActive) {
      await Session.invalidateAllForUser(userId);
    }
    
    return c.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Admin update user status route error:', error);
    return c.json({
      success: false,
      error: 'Failed to update user status'
    }, 500);
  }
});

/**
 * GET /dashboard/admin/sessions
 * Lista todas las sesiones activas (solo admins)
 */
dashboard.get('/admin/sessions', authenticateSession, requireAdmin, async (c) => {
  try {
    const stats = await Session.getStats();
    
    return c.json({
      success: true,
      data: {
        summary: stats,
        message: 'Use specific endpoints to get session details'
      }
    });
  } catch (error) {
    console.error('Admin sessions route error:', error);
    return c.json({
      success: false,
      error: 'Failed to load sessions'
    }, 500);
  }
});

/**
 * POST /dashboard/admin/cleanup
 * Limpia sesiones expiradas (solo admins)
 */
dashboard.post('/admin/cleanup', authenticateSession, requireAdmin, async (c) => {
  try {
    const deletedCount = await Session.cleanExpiredSessions();
    
    return c.json({
      success: true,
      data: { deletedSessions: deletedCount },
      message: `Cleaned up ${deletedCount} expired sessions`
    });
  } catch (error) {
    console.error('Admin cleanup route error:', error);
    return c.json({
      success: false,
      error: 'Failed to cleanup sessions'
    }, 500);
  }
});

export default dashboard;