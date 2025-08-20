import { ObjectId } from 'mongodb';
import type { IUser, IUserPublic, IRegisterRequest } from '../types';
export declare class User {
    /**
     * Crea un nuevo usuario en la base de datos
     */
    static create(userData: IRegisterRequest): Promise<IUserPublic>;
    /**
     * Busca usuario por username o email
     */
    static findByIdentifier(identifier: string): Promise<IUser | null>;
    /**
     * Busca usuario por ID
     */
    static findById(userId: string | ObjectId): Promise<IUser | null>;
    /**
     * Busca usuario público por ID (sin datos sensibles)
     */
    static findPublicById(userId: string | ObjectId): Promise<IUserPublic | null>;
    /**
     * Autentica usuario con credenciales
     */
    static authenticate(identifier: string, password: string): Promise<IUserPublic | null>;
    /**
     * Actualiza la contraseña del usuario
     */
    static updatePassword(userId: string | ObjectId, newPassword: string): Promise<boolean>;
    /**
     * Actualiza el perfil del usuario
     */
    static updateProfile(userId: string | ObjectId, profileData: Partial<IUser>): Promise<boolean>;
    /**
     * Desactiva usuario (soft delete)
     */
    static deactivate(userId: string | ObjectId): Promise<boolean>;
    /**
     * Reactiva usuario
     */
    static reactivate(userId: string | ObjectId): Promise<boolean>;
    /**
     * Actualiza último acceso del usuario
     */
    private static updateLastAccess;
    /**
     * Busca usuarios con paginación
     */
    static findMany(filter?: Partial<IUser>, page?: number, limit?: number): Promise<{
        users: IUserPublic[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * Cuenta total de usuarios
     */
    static count(filter?: Partial<IUser>): Promise<number>;
}
