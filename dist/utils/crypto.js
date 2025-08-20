"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateJWT = generateJWT;
exports.verifyJWT = verifyJWT;
exports.generateSecureToken = generateSecureToken;
exports.generateResetToken = generateResetToken;
exports.hashToken = hashToken;
exports.generateId = generateId;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const db_js_1 = require("../db.js");
/**
 * Genera hash seguro de contraseña usando bcrypt
 */
async function hashPassword(password) {
    const saltRounds = 12;
    return await bcryptjs_1.default.hash(password, saltRounds);
}
/**
 * Verifica contraseña contra hash almacenado
 */
async function verifyPassword(password, hash) {
    return await bcryptjs_1.default.compare(password, hash);
}
/**
 * Genera JWT token con payload
 */
function generateJWT(payload) {
    return jsonwebtoken_1.default.sign(payload, db_js_1.config.JWT_SECRET, { expiresIn: db_js_1.config.JWT_EXPIRES_IN });
}
/**
 * Verifica y decodifica JWT token
 */
function verifyJWT(token) {
    try {
        return jsonwebtoken_1.default.verify(token, db_js_1.config.JWT_SECRET);
    }
    catch (error) {
        throw new Error('Invalid or expired token');
    }
}
/**
 * Genera token aleatorio seguro para sesiones
 */
function generateSecureToken(length = 64) {
    return crypto_1.default.randomBytes(length).toString('hex');
}
/**
 * Genera token para reset de contraseña
 */
function generateResetToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
/**
 * Hash para tokens de verificación (para almacenar de forma segura)
 */
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
/**
 * Genera un ID único
 */
function generateId() {
    return crypto_1.default.randomBytes(16).toString('hex');
}
