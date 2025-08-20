import type { IJWTPayload } from '../types.js';
/**
 * Genera hash seguro de contraseña usando bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verifica contraseña contra hash almacenado
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Genera JWT token con payload
 */
export declare function generateJWT(payload: Omit<IJWTPayload, 'iat' | 'exp'>): string;
/**
 * Verifica y decodifica JWT token
 */
export declare function verifyJWT(token: string): IJWTPayload;
/**
 * Genera token aleatorio seguro para sesiones
 */
export declare function generateSecureToken(length?: number): string;
/**
 * Genera token para reset de contraseña
 */
export declare function generateResetToken(): string;
/**
 * Hash para tokens de verificación (para almacenar de forma segura)
 */
export declare function hashToken(token: string): string;
/**
 * Genera un ID único
 */
export declare function generateId(): string;
