import validator from 'validator';
import type { IValidationResult, ILoginRequest, IRegisterRequest } from '../types.js';

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  return validator.isEmail(email);
}

/**
 * Valida fortaleza de contraseña
 */
export function validatePassword(password: string): IValidationResult {
  const errors: string[] = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida formato de username
 */
export function validateUsername(username: string): IValidationResult {
  const errors: string[] = [];
  
  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  
  if (username.length > 30) {
    errors.push('Username must be less than 30 characters long');
  }
  
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, dots, hyphens and underscores');
  }
  
  // No puede empezar o terminar con caracteres especiales
  if (/^[_.-]|[_.-]$/.test(username)) {
    errors.push('Username cannot start or end with special characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida datos de registro completos
 */
export function validateRegisterData(data: IRegisterRequest): IValidationResult {
  const errors: string[] = [];
  
  // Validar username
  const usernameValidation = validateUsername(data.username);
  if (!usernameValidation.isValid) {
    errors.push(...usernameValidation.errors);
  }
  
  // Validar email si se proporciona
  if (data.email) {
    if (!isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }
  }
  
  // Validar contraseña
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida datos de login
 */
export function validateLoginData(data: ILoginRequest): IValidationResult {
  const errors: string[] = [];
  
  if (!data.identifier || data.identifier.trim().length === 0) {
    errors.push('Username or email is required');
  }
  
  if (!data.password || data.password.length === 0) {
    errors.push('Password is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitiza entrada de texto
 */
export function sanitizeInput(input: string): string {
  return validator.escape(input.trim());
}

/**
 * Valida ObjectId de MongoDB
 */
export function isValidObjectId(id: string): boolean {
  return validator.isMongoId(id);
}

/**
 * Valida que un string no esté vacío después de trim
 */
export function isNotEmpty(value: string): boolean {
  return value && value.trim().length > 0;
}

/**
 * Valida longitud de string
 */
export function validateLength(value: string, min: number, max: number): IValidationResult {
  const errors: string[] = [];
  
  if (value.length < min) {
    errors.push(`Must be at least ${min} characters long`);
  }
  
  if (value.length > max) {
    errors.push(`Must be less than ${max} characters long`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}