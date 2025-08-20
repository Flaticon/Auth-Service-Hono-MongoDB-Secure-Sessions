import type { IAuthResponse, ILoginRequest, IRegisterRequest, IUserPublic, ISessionMetadata, IApiResponse } from '../types';
export declare class AuthService {
    /**
     * Registra un nuevo usuario
     */
    static register(userData: IRegisterRequest, metadata?: ISessionMetadata): Promise<IAuthResponse>;
    /**
     * Inicia sesión de usuario
     */
    static login(credentials: ILoginRequest, metadata?: ISessionMetadata): Promise<IAuthResponse>;
    /**
     * Cierra sesión del usuario
     */
    static logout(sessionToken: string): Promise<IApiResponse<null>>;
    /**
     * Cierra todas las sesiones del usuario
     */
    static logoutAll(userId: string): Promise<IApiResponse<{
        sessionsInvalidated: number;
    }>>;
    /**
     * Verifica token de sesión y retorna usuario
     */
    static verifySession(sessionToken: string): Promise<IApiResponse<{
        user: IUserPublic;
        session: any;
    }>>;
    /**
     * Actualiza contraseña del usuario
     */
    static changePassword(userId: string, currentPassword: string, newPassword: string): Promise<IApiResponse<null>>;
    /**
     * Obtiene perfil del usuario
     */
    static getProfile(userId: string): Promise<IApiResponse<IUserPublic>>;
    /**
     * Actualiza perfil del usuario
     */
    static updateProfile(userId: string, updates: Partial<IUserPublic>): Promise<IApiResponse<IUserPublic>>;
    /**
     * Obtiene sesiones activas del usuario
     */
    static getActiveSessions(userId: string): Promise<IApiResponse<any[]>>;
    /**
     * Revoca sesión específica
     */
    static revokeSession(userId: string, sessionId: string): Promise<IApiResponse<null>>;
}
