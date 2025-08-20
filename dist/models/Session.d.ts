import { ObjectId } from 'mongodb';
import type { ISession, ISessionMetadata } from '../types';
export declare class Session {
    /**
     * Crea una nueva sesión para un usuario
     */
    static create(userId: string | ObjectId, metadata?: ISessionMetadata): Promise<ISession>;
    /**
     * Busca sesión activa por token
     */
    static findByToken(token: string): Promise<ISession | null>;
    /**
     * Busca sesión por ID
     */
    static findById(sessionId: string | ObjectId): Promise<ISession | null>;
    /**
     * Invalida una sesión específica
     */
    static invalidate(token: string): Promise<boolean>;
    /**
     * Invalida sesión por ID
     */
    static invalidateById(sessionId: string | ObjectId): Promise<boolean>;
    /**
     * Invalida todas las sesiones de un usuario
     */
    static invalidateAllForUser(userId: string | ObjectId): Promise<number>;
    /**
     * Obtiene todas las sesiones activas de un usuario
     */
    static findActiveByUser(userId: string | ObjectId): Promise<ISession[]>;
    /**
     * Limpia sesiones expiradas manualmente (aunque MongoDB lo hace automáticamente)
     */
    static cleanExpiredSessions(): Promise<number>;
    /**
     * Actualiza metadatos de sesión
     */
    static updateMetadata(sessionId: string | ObjectId, metadata: Partial<ISessionMetadata>): Promise<boolean>;
    /**
     * Obtiene estadísticas de sesiones
     */
    static getStats(userId?: string | ObjectId): Promise<{
        active: number;
        total: number;
        thisWeek: number;
    }>;
}
