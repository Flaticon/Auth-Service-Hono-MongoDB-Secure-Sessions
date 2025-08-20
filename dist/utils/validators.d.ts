import type { IValidationResult, ILoginRequest, IRegisterRequest } from '../types.js';
/**
 * Valida formato de email
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Valida fortaleza de contraseña
 */
export declare function validatePassword(password: string): IValidationResult;
/**
 * Valida formato de username
 */
export declare function validateUsername(username: string): IValidationResult;
/**
 * Valida datos de registro completos
 */
export declare function validateRegisterData(data: IRegisterRequest): IValidationResult;
/**
 * Valida datos de login
 */
export declare function validateLoginData(data: ILoginRequest): IValidationResult;
/**
 * Sanitiza entrada de texto
 */
export declare function sanitizeInput(input: string): string;
/**
 * Valida ObjectId de MongoDB
 */
export declare function isValidObjectId(id: string): boolean;
/**
 * Valida que un string no esté vacío después de trim
 */
export declare function isNotEmpty(value: string): boolean;
/**
 * Valida longitud de string
 */
export declare function validateLength(value: string, min: number, max: number): IValidationResult;
