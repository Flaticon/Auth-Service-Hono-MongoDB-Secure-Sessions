import { User } from '../models/User';
import { Session } from '../models/Session';
import { generateJWT } from '../utils/crypto';
import { validateLoginData, validateRegisterData } from '../utils/validators';
import type { 
  IAuthResponse, 
  ILoginRequest, 
  IRegisterRequest, 
  IUserPublic, 
  ISessionMetadata,
  IApiResponse
} from '../types';

export class AuthService {
  /**
   * Registra un nuevo usuario
   */
  static async register(
    userData: IRegisterRequest, 
    metadata: ISessionMetadata = {}
  ): Promise<IAuthResponse> {
    try {
      // Validar datos de entrada
      const validation = validateRegisterData(userData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }
      
      // Crear usuario
      const user = await User.create(userData);
      
      // Crear sesión
      const session = await Session.create(user._id, metadata);
      
      // Generar JWT
      const token = generateJWT({
        userId: user._id.toString(),
        username: user.username,
        role: user.role
      });
      
      return {
        success: true,
        user,
        token,
        sessionToken: session.token
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }
  
  /**
   * Inicia sesión de usuario
   */
  static async login(
    credentials: ILoginRequest, 
    metadata: ISessionMetadata = {}
  ): Promise<IAuthResponse> {
    try {
      // Validar datos de entrada
      const validation = validateLoginData(credentials);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }
      
      // Autenticar usuario
      const user = await User.authenticate(credentials.identifier, credentials.password);
      
      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }
      
      // Crear sesión
      const session = await Session.create(user._id, metadata);
      
      // Generar JWT
      const token = generateJWT({
        userId: user._id.toString(),
        username: user.username,
        role: user.role
      });
      
      return {
        success: true,
        user,
        token,
        sessionToken: session.token
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed'
      };
    }
  }
  
  /**
   * Cierra sesión del usuario
   */
  static async logout(sessionToken: string): Promise<IApiResponse<null>> {
    try {
      const invalidated = await Session.invalidate(sessionToken);
      
      return {
        success: invalidated,
        message: invalidated ? 'Logged out successfully' : 'Session not found'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Logout failed'
      };
    }
  }
  
  /**
   * Cierra todas las sesiones del usuario
   */
  static async logoutAll(userId: string): Promise<IApiResponse<{ sessionsInvalidated: number }>> {
    try {
      const count = await Session.invalidateAllForUser(userId);
      
      return {
        success: true,
        data: { sessionsInvalidated: count },
        message: `${count} sessions invalidated`
      };
    } catch (error) {
      console.error('Logout all error:', error);
      return {
        success: false,
        error: 'Failed to logout from all sessions'
      };
    }
  }
  
  /**
   * Verifica token de sesión y retorna usuario
   */
  static async verifySession(sessionToken: string): Promise<IApiResponse<{
    user: IUserPublic;
    session: any;
  }>> {
    try {
      if (!sessionToken) {
        return {
          success: false,
          error: 'Session token required'
        };
      }
      
      const session = await Session.findByToken(sessionToken);
      
      if (!session) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }
      
      const user = await User.findPublicById(session.userId);
      
      if (!user || !user.isActive) {
        return {
          success: false,
          error: 'User not found or inactive'
        };
      }
      
      return {
        success: true,
        data: { user, session }
      };
    } catch (error) {
      console.error('Session verification error:', error);
      return {
        success: false,
        error: 'Session verification failed'
      };
    }
  }
  
  /**
   * Actualiza contraseña del usuario
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<IApiResponse<null>> {
    try {
      // Verificar usuario y contraseña actual
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }
      
      // Verificar contraseña actual (necesitamos el método authenticate que verifica password)
      const authenticatedUser = await User.authenticate(user.username, currentPassword);
      if (!authenticatedUser) {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }
      
      // Actualizar contraseña
      const updated = await User.updatePassword(userId, newPassword);
      
      if (!updated) {
        return {
          success: false,
          error: 'Failed to update password'
        };
      }
      
      // Invalidar todas las sesiones del usuario (opcional, por seguridad)
      await Session.invalidateAllForUser(userId);
      
      return {
        success: true,
        message: 'Password updated successfully. Please log in again.'
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change password'
      };
    }
  }
  
  /**
   * Obtiene perfil del usuario
   */
  static async getProfile(userId: string): Promise<IApiResponse<IUserPublic>> {
    try {
      const user = await User.findPublicById(userId);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }
      
      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: 'Failed to get profile'
      };
    }
  }
  
  /**
   * Actualiza perfil del usuario
   */
  static async updateProfile(
    userId: string,
    updates: Partial<IUserPublic>
  ): Promise<IApiResponse<IUserPublic>> {
    try {
      // Remover campos que no se pueden actualizar
      const { _id, createdAt, ...allowedUpdates } = updates;
      
      const updated = await User.updateProfile(userId, allowedUpdates);
      
      if (!updated) {
        return {
          success: false,
          error: 'Failed to update profile'
        };
      }
      
      // Obtener usuario actualizado
      const user = await User.findPublicById(userId);
      
      return {
        success: true,
        data: user!,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: 'Failed to update profile'
      };
    }
  }
  
  /**
   * Obtiene sesiones activas del usuario
   */
  static async getActiveSessions(userId: string): Promise<IApiResponse<any[]>> {
    try {
      const sessions = await Session.findActiveByUser(userId);
      
      // Limpiar datos sensibles de las sesiones
      const cleanSessions = sessions.map(session => ({
        id: session._id,
        createdAt: session.createdAt,
        lastAccess: session.lastAccess,
        metadata: {
          userAgent: session.metadata.userAgent,
          ipAddress: session.metadata.ipAddress,
          device: session.metadata.device,
          location: session.metadata.location
        }
      }));
      
      return {
        success: true,
        data: cleanSessions
      };
    } catch (error) {
      console.error('Get active sessions error:', error);
      return {
        success: false,
        error: 'Failed to get active sessions'
      };
    }
  }
  
  /**
   * Revoca sesión específica
   */
  static async revokeSession(
    userId: string, 
    sessionId: string
  ): Promise<IApiResponse<null>> {
    try {
      // Verificar que la sesión pertenece al usuario
      const session = await Session.findById(sessionId);
      
      if (!session || session.userId.toString() !== userId) {
        return {
          success: false,
          error: 'Session not found or unauthorized'
        };
      }
      
      const revoked = await Session.invalidateById(sessionId);
      
      return {
        success: revoked,
        message: revoked ? 'Session revoked successfully' : 'Failed to revoke session'
      };
    } catch (error) {
      console.error('Revoke session error:', error);
      return {
        success: false,
        error: 'Failed to revoke session'
      };
    }
  }
}