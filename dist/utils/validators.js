"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = isValidEmail;
exports.validatePassword = validatePassword;
exports.validateUsername = validateUsername;
exports.validateRegisterData = validateRegisterData;
exports.validateLoginData = validateLoginData;
exports.sanitizeInput = sanitizeInput;
exports.isValidObjectId = isValidObjectId;
exports.isNotEmpty = isNotEmpty;
exports.validateLength = validateLength;
const validator_1 = __importDefault(require("validator"));
/**
 * Valida formato de email
 */
function isValidEmail(email) {
    return validator_1.default.isEmail(email);
}
/**
 * Valida fortaleza de contraseña
 */
function validatePassword(password) {
    const errors = [];
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
function validateUsername(username) {
    const errors = [];
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
function validateRegisterData(data) {
    const errors = [];
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
function validateLoginData(data) {
    const errors = [];
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
function sanitizeInput(input) {
    return validator_1.default.escape(input.trim());
}
/**
 * Valida ObjectId de MongoDB
 */
function isValidObjectId(id) {
    return validator_1.default.isMongoId(id);
}
/**
 * Valida que un string no esté vacío después de trim
 */
function isNotEmpty(value) {
    return Boolean(value && value.trim().length > 0);
}
/**
 * Valida longitud de string
 */
function validateLength(value, min, max) {
    const errors = [];
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
