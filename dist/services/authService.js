"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const User_1 = require("../models/User");
const Session_1 = require("../models/Session");
const crypto_1 = require("../utils/crypto");
const validators_1 = require("../utils/validators");
class AuthService {
    /**
     * Registra un nuevo usuario
     */
    static async register(userData, metadata = {}) {
        try {
            // Validar datos de entrada
            const validation = (0, validators_1.validateRegisterData)(userData);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.errors.join(', ')
                };
            }
            // Crear usuario
            const user = await User_1.User.create(userData);
            // Crear sesión
            const session = await Session_1.Session.create(user._id, metadata);
            // Generar JWT
            const token = (0, crypto_1.generateJWT)({
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
        }
        catch (error) {
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
    static async login(credentials, metadata = {}) {
        try {
            // Validar datos de entrada
            const validation = (0, validators_1.validateLoginData)(credentials);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.errors.join(', ')
                };
            }
            // Autenticar usuario
            const user = await User_1.User.authenticate(credentials.identifier, credentials.password);
            if (!user) {
                return {
                    success: false,
                    error: 'Invalid credentials'
                };
            }
            // Crear sesión
            const session = await Session_1.Session.create(user._id, metadata);
            // Generar JWT
            const token = (0, crypto_1.generateJWT)({
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
        }
        catch (error) {
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
    static async logout(sessionToken) {
        try {
            const invalidated = await Session_1.Session.invalidate(sessionToken);
            return {
                success: invalidated,
                message: invalidated ? 'Logged out successfully' : 'Session not found'
            };
        }
        catch (error) {
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
    static async logoutAll(userId) {
        try {
            const count = await Session_1.Session.invalidateAllForUser(userId);
            return {
                success: true,
                data: { sessionsInvalidated: count },
                message: `${count} sessions invalidated`
            };
        }
        catch (error) {
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
    static async verifySession(sessionToken) {
        try {
            if (!sessionToken) {
                return {
                    success: false,
                    error: 'Session token required'
                };
            }
            const session = await Session_1.Session.findByToken(sessionToken);
            if (!session) {
                return {
                    success: false,
                    error: 'Invalid or expired session'
                };
            }
            const user = await User_1.User.findPublicById(session.userId);
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
        }
        catch (error) {
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
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            // Verificar usuario y contraseña actual
            const user = await User_1.User.findById(userId);
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }
            // Verificar contraseña actual (necesitamos el método authenticate que verifica password)
            const authenticatedUser = await User_1.User.authenticate(user.username, currentPassword);
            if (!authenticatedUser) {
                return {
                    success: false,
                    error: 'Current password is incorrect'
                };
            }
            // Actualizar contraseña
            const updated = await User_1.User.updatePassword(userId, newPassword);
            if (!updated) {
                return {
                    success: false,
                    error: 'Failed to update password'
                };
            }
            // Invalidar todas las sesiones del usuario (opcional, por seguridad)
            await Session_1.Session.invalidateAllForUser(userId);
            return {
                success: true,
                message: 'Password updated successfully. Please log in again.'
            };
        }
        catch (error) {
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
    static async getProfile(userId) {
        try {
            const user = await User_1.User.findPublicById(userId);
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
        }
        catch (error) {
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
    static async updateProfile(userId, updates) {
        try {
            // Remover campos que no se pueden actualizar
            const { _id, createdAt, ...allowedUpdates } = updates;
            const updated = await User_1.User.updateProfile(userId, allowedUpdates);
            if (!updated) {
                return {
                    success: false,
                    error: 'Failed to update profile'
                };
            }
            // Obtener usuario actualizado
            const user = await User_1.User.findPublicById(userId);
            return {
                success: true,
                data: user,
                message: 'Profile updated successfully'
            };
        }
        catch (error) {
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
    static async getActiveSessions(userId) {
        try {
            const sessions = await Session_1.Session.findActiveByUser(userId);
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
        }
        catch (error) {
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
    static async revokeSession(userId, sessionId) {
        try {
            // Verificar que la sesión pertenece al usuario
            const session = await Session_1.Session.findById(sessionId);
            if (!session || session.userId.toString() !== userId) {
                return {
                    success: false,
                    error: 'Session not found or unauthorized'
                };
            }
            const revoked = await Session_1.Session.invalidateById(sessionId);
            return {
                success: revoked,
                message: revoked ? 'Session revoked successfully' : 'Failed to revoke session'
            };
        }
        catch (error) {
            console.error('Revoke session error:', error);
            return {
                success: false,
                error: 'Failed to revoke session'
            };
        }
    }
}
exports.AuthService = AuthService;
