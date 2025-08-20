"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const mongodb_1 = require("mongodb");
const db_1 = require("../db");
const crypto_1 = require("../utils/crypto");
class Session {
    /**
     * Crea una nueva sesión para un usuario
     */
    static async create(userId, metadata = {}) {
        const db = (0, db_1.getDb)();
        const objectId = typeof userId === 'string' ? new mongodb_1.ObjectId(userId) : userId;
        const sessionData = {
            userId: objectId,
            token: (0, crypto_1.generateSecureToken)(64),
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
        const result = await db.collection('sessions').insertOne(sessionData);
        return {
            ...sessionData,
            _id: result.insertedId
        };
    }
    /**
     * Busca sesión activa por token
     */
    static async findByToken(token) {
        const db = (0, db_1.getDb)();
        const session = await db.collection('sessions').findOne({
            token,
            isActive: true
        });
        if (session) {
            // Actualizar último acceso
            await db.collection('sessions').updateOne({ _id: session._id }, { $set: { lastAccess: new Date() } });
            // Retornar sesión actualizada
            return { ...session, lastAccess: new Date() };
        }
        return session;
    }
    /**
     * Busca sesión por ID
     */
    static async findById(sessionId) {
        const db = (0, db_1.getDb)();
        const objectId = typeof sessionId === 'string' ? new mongodb_1.ObjectId(sessionId) : sessionId;
        return await db.collection('sessions').findOne({
            _id: objectId,
            isActive: true
        });
    }
    /**
     * Invalida una sesión específica
     */
    static async invalidate(token) {
        const db = (0, db_1.getDb)();
        const result = await db.collection('sessions').updateOne({ token, isActive: true }, { $set: { isActive: false } });
        return result.modifiedCount > 0;
    }
    /**
     * Invalida sesión por ID
     */
    static async invalidateById(sessionId) {
        const db = (0, db_1.getDb)();
        const objectId = typeof sessionId === 'string' ? new mongodb_1.ObjectId(sessionId) : sessionId;
        const result = await db.collection('sessions').updateOne({ _id: objectId }, { $set: { isActive: false } });
        return result.modifiedCount > 0;
    }
    /**
     * Invalida todas las sesiones de un usuario
     */
    static async invalidateAllForUser(userId) {
        const db = (0, db_1.getDb)();
        const objectId = typeof userId === 'string' ? new mongodb_1.ObjectId(userId) : userId;
        const result = await db.collection('sessions').updateMany({ userId: objectId, isActive: true }, { $set: { isActive: false } });
        return result.modifiedCount;
    }
    /**
     * Obtiene todas las sesiones activas de un usuario
     */
    static async findActiveByUser(userId) {
        const db = (0, db_1.getDb)();
        const objectId = typeof userId === 'string' ? new mongodb_1.ObjectId(userId) : userId;
        return await db.collection('sessions')
            .find({ userId: objectId, isActive: true })
            .sort({ lastAccess: -1 })
            .toArray();
    }
    /**
     * Limpia sesiones expiradas manualmente (aunque MongoDB lo hace automáticamente)
     */
    static async cleanExpiredSessions() {
        const db = (0, db_1.getDb)();
        // Sesiones más antiguas que el TTL configurado
        const ttlSeconds = parseInt(process.env.SESSION_TTL_SECONDS || '604800');
        const expirationDate = new Date(Date.now() - (ttlSeconds * 1000));
        const result = await db.collection('sessions').deleteMany({
            createdAt: { $lt: expirationDate }
        });
        return result.deletedCount || 0;
    }
    /**
     * Actualiza metadatos de sesión
     */
    static async updateMetadata(sessionId, metadata) {
        const db = (0, db_1.getDb)();
        const objectId = typeof sessionId === 'string' ? new mongodb_1.ObjectId(sessionId) : sessionId;
        const result = await db.collection('sessions').updateOne({ _id: objectId, isActive: true }, {
            $set: {
                'metadata': { ...metadata },
                lastAccess: new Date()
            }
        });
        return result.modifiedCount > 0;
    }
    /**
     * Obtiene estadísticas de sesiones
     */
    static async getStats(userId) {
        const db = (0, db_1.getDb)();
        const baseFilter = userId ? { userId: typeof userId === 'string' ? new mongodb_1.ObjectId(userId) : userId } : {};
        const weekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
        const [active, total, thisWeek] = await Promise.all([
            db.collection('sessions').countDocuments({ ...baseFilter, isActive: true }),
            db.collection('sessions').countDocuments(baseFilter),
            db.collection('sessions').countDocuments({
                ...baseFilter,
                createdAt: { $gte: weekAgo }
            })
        ]);
        return { active, total, thisWeek };
    }
}
exports.Session = Session;
