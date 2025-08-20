"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongodb_1 = require("mongodb");
const db_1 = require("../db");
const crypto_1 = require("../utils/crypto");
const validators_1 = require("../utils/validators");
class User {
    /**
     * Crea un nuevo usuario en la base de datos
     */
    static async create(userData) {
        const db = (0, db_1.getDb)();
        // Validar datos de entrada
        const validation = (0, validators_1.validateRegisterData)(userData);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        // Verificar si el usuario ya existe
        const existingUser = await db.collection('users').findOne({
            $or: [
                { username: userData.username },
                ...(userData.email ? [{ email: userData.email }] : [])
            ]
        });
        if (existingUser) {
            throw new Error('Username or email already exists');
        }
        // Crear hash de contraseña
        const passwordHash = await (0, crypto_1.hashPassword)(userData.password);
        // Preparar datos del usuario
        const newUser = {
            username: userData.username.toLowerCase().trim(),
            email: userData.email?.toLowerCase().trim(),
            passwordHash,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            role: 'user',
            profile: userData.profile || {}
        };
        // Insertar usuario
        const result = await db.collection('users').insertOne(newUser);
        // Retornar usuario sin contraseña
        const { passwordHash: _, ...userWithoutPassword } = newUser;
        return {
            ...userWithoutPassword,
            _id: result.insertedId
        };
    }
    /**
     * Busca usuario por username o email
     */
    static async findByIdentifier(identifier) {
        const db = (0, db_1.getDb)();
        return await db.collection('users').findOne({
            $or: [
                { username: identifier.toLowerCase().trim() },
                { email: identifier.toLowerCase().trim() }
            ],
            isActive: true
        });
    }
    /**
     * Busca usuario por ID
     */
    static async findById(userId) {
        const db = (0, db_1.getDb)();
        const objectId = typeof userId === 'string' ? new mongodb_1.ObjectId(userId) : userId;
        return await db.collection('users').findOne({
            _id: objectId,
            isActive: true
        });
    }
    /**
     * Busca usuario público por ID (sin datos sensibles)
     */
    static async findPublicById(userId) {
        const user = await this.findById(userId);
        if (!user)
            return null;
        const { passwordHash, ...publicUser } = user;
        return publicUser;
    }
    /**
     * Autentica usuario con credenciales
     */
    static async authenticate(identifier, password) {
        const user = await this.findByIdentifier(identifier);
        if (!user || !user.isActive) {
            return null;
        }
        // Verificar contraseña
        const isValidPassword = await (0, crypto_1.verifyPassword)(password, user.passwordHash);
        if (!isValidPassword) {
            return null;
        }
        // Actualizar último acceso
        await this.updateLastAccess(user._id);
        // Retornar usuario sin datos sensibles
        const { passwordHash, ...publicUser } = user;
        return publicUser;
    }
    /**
     * Actualiza la contraseña del usuario
     */
    static async updatePassword(userId, newPassword) {
        const passwordValidation = (0, validators_1.validatePassword)(newPassword);
        if (!passwordValidation.isValid) {
            throw new Error(`Invalid password: ${passwordValidation.errors.join(', ')}`);
        }
        const db = (0, db_1.getDb)();
        const objectId = typeof userId === 'string' ? new mongodb_1.ObjectId(userId) : userId;
        const passwordHash = await (0, crypto_1.hashPassword)(newPassword);
        const result = await db.collection('users').updateOne({ _id: objectId }, {
            $set: {
                passwordHash,
                updatedAt: new Date()
            }
        });
        return result.modifiedCount > 0;
    }
    /**
     * Actualiza el perfil del usuario
     */
    static async updateProfile(userId, profileData) {
        const db = (0, db_1.getDb)();
        const objectId = typeof userId === 'string' ? new mongodb_1.ObjectId(userId) : userId;
        // Remover campos que no se deben actualizar directamente
        const { _id, passwordHash, createdAt, ...allowedUpdates } = profileData;
        const result = await db.collection('users').updateOne({ _id: objectId }, {
            $set: {
                ...allowedUpdates,
                updatedAt: new Date()
            }
        });
        return result.modifiedCount > 0;
    }
    /**
     * Desactiva usuario (soft delete)
     */
    static async deactivate(userId) {
        const db = (0, db_1.getDb)();
        const objectId = typeof userId === 'string' ? new mongodb_1.ObjectId(userId) : userId;
        const result = await db.collection('users').updateOne({ _id: objectId }, {
            $set: {
                isActive: false,
                updatedAt: new Date()
            }
        });
        return result.modifiedCount > 0;
    }
    /**
     * Reactiva usuario
     */
    static async reactivate(userId) {
        const db = (0, db_1.getDb)();
        const objectId = typeof userId === 'string' ? new mongodb_1.ObjectId(userId) : userId;
        const result = await db.collection('users').updateOne({ _id: objectId }, {
            $set: {
                isActive: true,
                updatedAt: new Date()
            }
        });
        return result.modifiedCount > 0;
    }
    /**
     * Actualiza último acceso del usuario
     */
    static async updateLastAccess(userId) {
        const db = (0, db_1.getDb)();
        await db.collection('users').updateOne({ _id: userId }, { $set: { updatedAt: new Date() } });
    }
    /**
     * Busca usuarios con paginación
     */
    static async findMany(filter = {}, page = 1, limit = 10) {
        const db = (0, db_1.getDb)();
        const skip = (page - 1) * limit;
        // Añadir filtro de usuarios activos por defecto
        const searchFilter = { ...filter, isActive: true };
        const [users, total] = await Promise.all([
            db.collection('users')
                .find(searchFilter)
                .project({ passwordHash: 0 }) // Excluir hash de contraseña
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection('users').countDocuments(searchFilter)
        ]);
        return {
            users: users,
            total,
            page,
            limit
        };
    }
    /**
     * Cuenta total de usuarios
     */
    static async count(filter = {}) {
        const db = (0, db_1.getDb)();
        return await db.collection('users').countDocuments({ ...filter, isActive: true });
    }
}
exports.User = User;
