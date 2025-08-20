"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.connectDB = connectDB;
exports.getDb = getDb;
exports.closeDB = closeDB;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno
dotenv_1.default.config();
// Validar variables de entorno requeridas
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    throw new Error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
}
// Configuración
const config = {
    MONGO_URI: process.env.MONGO_URI,
    DB_NAME: process.env.DB_NAME || 'auth_service',
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    SESSION_TTL_SECONDS: process.env.SESSION_TTL_SECONDS || '604800',
    PORT: process.env.PORT || '3000',
    NODE_ENV: process.env.NODE_ENV || 'development',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
};
exports.config = config;
// Cliente MongoDB con configuración optimizada
const client = new mongodb_1.MongoClient(config.MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
});
let cachedDb = null;
/**
 * Conecta a MongoDB y configura índices necesarios
 */
async function connectDB() {
    try {
        if (cachedDb)
            return cachedDb;
        console.log('🔄 Connecting to MongoDB...');
        await client.connect();
        cachedDb = client.db(config.DB_NAME);
        // Configurar índices
        await ensureIndexes(cachedDb);
        console.log('✅ Connected to MongoDB successfully');
        return cachedDb;
    }
    catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
    }
}
/**
 * Configura todos los índices necesarios para el sistema de auth
 */
async function ensureIndexes(db) {
    try {
        // Índice único para username en usuarios
        await db.collection('users').createIndex({ username: 1 }, { unique: true });
        // Índice único para email en usuarios (sparse para permitir nulls)
        await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
        // Índice compuesto para busqueda por username o email
        await db.collection('users').createIndex({ username: 1, email: 1 });
        // Índice para sesiones con TTL (expiran automáticamente)
        const ttlSeconds = parseInt(config.SESSION_TTL_SECONDS);
        await db.collection('sessions').createIndex({ createdAt: 1 }, { expireAfterSeconds: ttlSeconds });
        // Índice único para tokens de sesión
        await db.collection('sessions').createIndex({ token: 1 }, { unique: true });
        // Índice para sesiones por usuario
        await db.collection('sessions').createIndex({ userId: 1, isActive: 1 });
        // Índice para tokens de reset de contraseña con TTL
        await db.collection('passwordResets').createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 } // 1 hora
        );
        await db.collection('passwordResets').createIndex({ token: 1 }, { unique: true });
        console.log('✅ Database indexes created successfully');
    }
    catch (error) {
        console.error('❌ Error creating indexes:', error);
        throw error;
    }
}
/**
 * Obtiene la instancia de la base de datos
 */
function getDb() {
    if (!cachedDb) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return cachedDb;
}
/**
 * Cierra la conexión a MongoDB
 */
async function closeDB() {
    if (client) {
        await client.close();
        cachedDb = null;
        console.log('🔴 MongoDB connection closed');
    }
}
// Manejo de cierre graceful
process.on('SIGINT', async () => {
    await closeDB();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await closeDB();
    process.exit(0);
});
