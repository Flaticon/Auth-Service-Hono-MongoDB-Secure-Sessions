import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { generateSecureToken } from '../utils/crypto.js';
import type { ISession, ISessionMetadata } from '../types.js';

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
        { _id: session._i