import { ObjectId } from 'mongodb';

// ===================================
// INTERFACES DE USUARIO
// ===================================

export interface IUser {
  _id?: ObjectId;
  username: string;
  email?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  role: UserRole;
  profile: IUserProfile;
}

export interface IUserProfile {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  [key: string]: any;
}

export interface IUserPublic {
  _id: ObjectId;
  username: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  role: UserRole;
  profile: IUserProfile;
}

export type UserRole = 'user' | 'admin' | 'moderator';

// ===================================
// INTERFACES DE SESIÓN
// ===================================

export interface ISession {
  _id?: ObjectId;
  userId: ObjectId;
  token: string;
  createdAt: Date;
  lastAccess: Date;
  isActive: boolean;
  metadata: ISessionMetadata;
}

export interface ISessionMetadata {
  userAgent?: string;
  ipAddress?: string;
  device?: string;
  location?: string;
  [key: string]: any;
}

// ===================================
// INTERFACES DE AUTENTICACIÓN
// ===================================

export interface ILoginRequest {
  identifier: string; // username o email
  password: string;
}

export interface IRegisterRequest {
  username: string;
  email?: string;
  password: string;
  profile?: Partial<IUserProfile>;
}

export interface IAuthResponse {
  success: boolean;
  user?: IUserPublic;
  token?: string;
  sessionToken?: string;
  error?: string;
}

export interface IJWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ===================================
// INTERFACES DE VALIDACIÓN
// ===================================

export interface IValidationResult {
  isValid: boolean;
  errors: string[];
}

// ===================================
// INTERFACES DE RESPUESTA API
// ===================================

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  message?: string;
}

// ===================================
// TIPOS DE VARIABLES DE ENTORNO
// ===================================

export interface IEnvConfig {
  MONGO_URI: string;
  DB_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  SESSION_TTL_SECONDS: string;
  PORT: string;
  NODE_ENV: 'development' | 'production' | 'test';
  ALLOWED_ORIGINS?: string;
}

// ===================================
// TIPOS DE CONTEXTO HONO
// ===================================

export interface IAuthContext {
  user?: IUserPublic;
  session?: ISession;
}

// ===================================
// TIPOS EXTENDIDOS PARA HONO
// ===================================

declare module '@hono/node-server' {
  interface Context {
    user?: IUserPublic;
    session?: ISession;
  }
}