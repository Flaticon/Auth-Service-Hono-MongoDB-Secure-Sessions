import { ObjectId } from 'mongodb';
import { getDb } from '../db';
import { generateSecureToken } from '../utils/crypto';
import type { ISession, ISessionMetadata } from '../types';

export class Session {
  /**
   * Crea una nueva sesión para un usuario
   */
  static async create(
    userId: string | ObjectId, 
    metadata: ISessionMetadata = {}
  ): Promise<ISession> {
    const db = getDb();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const sessionData: Omit<ISession, '_id'> = {
      userId: objectId,
      token: generateSecureToken(64),
      createdAt: new Date(),
      lastAccess: new Date(),
      isActive: true,
      metadata: {
        userAgent: metadata.userAgent || '',
        ipAddress: metadata.ipAddress || '',
        device: metadata.device || '',
        location: metadata.location || '',
        ...metadata
      }
    };
    
    const result = await db.collection<ISession>('sessions').insertOne(sessionData);
    
    return {
      ...sessionData,
      _id: result.insertedId
    };
  }
  
  /**
   * Busca sesión activa por token
   */
  static async findByToken(token: string): Promise<ISession | null> {
    const db = getDb();
    
    const session = await db.collection<ISession>('sessions').findOne({
      token,
      isActive: true
    });
    
    if (session) {
      // Actualizar último acceso
      await db.collection<ISession>('sessions').updateOne(
        { _id: session._id },
        { $set: { lastAccess: new Date() } }
      );
      
      // Retornar sesión actualizada
      return { ...session, lastAccess: new Date() };
    }
    
    return session;
  }
  
  /**
   * Busca sesión por ID
   */
  static async findById(sessionId: string | ObjectId): Promise<ISession | null> {
    const db = getDb();
    const objectId = typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId;
    
    return await db.collection<ISession>('sessions').findOne({
      _id: objectId,
      isActive: true
    });
  }
  
  /**
   * Invalida una sesión específica
   */
  static async invalidate(token: string): Promise<boolean> {
    const db = getDb();
    
    const result = await db.collection<ISession>('sessions').updateOne(
      { token, isActive: true },
      { $set: { isActive: false } }
    );
    
    return result.modifiedCount > 0;
  }
  
  /**
   * Invalida sesión por ID
   */
  static async invalidateById(sessionId: string | ObjectId): Promise<boolean> {
    const db = getDb();
    const objectId = typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId;
    
    const result = await db.collection<ISession>('sessions').updateOne(
      { _id: objectId },
      { $set: { isActive: false } }
    );
    
    return result.modifiedCount > 0;
  }
  
  /**
   * Invalida todas las sesiones de un usuario
   */
  static async invalidateAllForUser(userId: string | ObjectId): Promise<number> {
    const db = getDb();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const result = await db.collection<ISession>('sessions').updateMany(
      { userId: objectId, isActive: true },
      { $set: { isActive: false } }
    );
    
    return result.modifiedCount;
  }
  
  /**
   * Obtiene todas las sesiones activas de un usuario
   */
  static async findActiveByUser(userId: string | ObjectId): Promise<ISession[]> {
    const db = getDb();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    return await db.collection<ISession>('sessions')
      .find({ userId: objectId, isActive: true })
      .sort({ lastAccess: -1 })
      .toArray();
  }
  
  /**
   * Limpia sesiones expiradas manualmente (aunque MongoDB lo hace automáticamente)
   */
  static async cleanExpiredSessions(): Promise<number> {
    const db = getDb();
    
    // Sesiones más antiguas que el TTL configurado
    const ttlSeconds = parseInt(process.env.SESSION_TTL_SECONDS || '604800');
    const expirationDate = new Date(Date.now() - (ttlSeconds * 1000));
    
    const result = await db.collection<ISession>('sessions').deleteMany({
      createdAt: { $lt: expirationDate }
    });
    
    return result.deletedCount || 0;
  }
  
  /**
   * Actualiza metadatos de sesión
   */
  static async updateMetadata(
    sessionId: string | ObjectId, 
    metadata: Partial<ISessionMetadata>
  ): Promise<boolean> {
    const db = getDb();
    const objectId = typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId;
    
    const result = await db.collection<ISession>('sessions').updateOne(
      { _id: objectId, isActive: true },
      { 
        $set: { 
          'metadata': { ...metadata },
          lastAccess: new Date()
        } 
      }
    );
    
    return result.modifiedCount > 0;
  }
  
  /**
   * Obtiene estadísticas de sesiones
   */
  static async getStats(userId?: string | ObjectId): Promise<{
    active: number;
    total: number;
    thisWeek: number;
  }> {
    const db = getDb();
    const baseFilter = userId ? { userId: typeof userId === 'string' ? new ObjectId(userId) : userId } : {};
    
    const weekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
    
    const [active, total, thisWeek] = await Promise.all([
      db.collection<ISession>('sessions').countDocuments({ ...baseFilter, isActive: true }),
      db.collection<ISession>('sessions').countDocuments(baseFilter),
      db.collection<ISession>('sessions').countDocuments({ 
        ...baseFilter, 
        createdAt: { $gte: weekAgo }
      })
    ]);
    
    return { active, total, thisWeek };
  }
}