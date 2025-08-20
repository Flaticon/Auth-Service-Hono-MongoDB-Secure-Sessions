import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../db.js';
import type { IJWTPayload } from '../types.js';

/**
 * Genera hash seguro de contraseña usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verifica contraseña contra hash almacenado
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Genera JWT token con payload
 */
export function generateJWT(payload: Omit<IJWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(
    payload as any, 
    config.JWT_SECRET, 
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

/**
 * Verifica y decodifica JWT token
 */
export function verifyJWT(token: string): IJWTPayload {
  try {
    return jwt.verify(token, config.JWT_SECRET) as IJWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Genera token aleatorio seguro para sesiones
 */
export function generateSecureToken(length: number = 64): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Genera token para reset de contraseña
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash para tokens de verificación (para almacenar de forma segura)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Genera un ID único
 */
export function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}