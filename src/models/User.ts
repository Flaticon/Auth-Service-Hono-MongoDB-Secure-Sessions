import { ObjectId } from 'mongodb';
import { getDb } from '../db';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { validateRegisterData, validatePassword } from '../utils/validators';
import type { IUser, IUserPublic, IRegisterRequest, UserRole } from '../types';

export class User {
  /**
   * Crea un nuevo usuario en la base de datos
   */
  static async create(userData: IRegisterRequest): Promise<IUserPublic> {
    const db = getDb();
    
    // Validar datos de entrada
    const validation = validateRegisterData(userData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Verificar si el usuario ya existe
    const existingUser = await db.collection<IUser>('users').findOne({
      $or: [
        { username: userData.username },
        ...(userData.email ? [{ email: userData.email }] : [])
      ]
    });
    
    if (existingUser) {
      throw new Error('Username or email already exists');
    }
    
    // Crear hash de contraseña
    const passwordHash = await hashPassword(userData.password);
    
    // Preparar datos del usuario
    const newUser: Omit<IUser, '_id'> = {
      username: userData.username.toLowerCase().trim(),
      email: userData.email?.toLowerCase().trim(),
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      role: 'user' as UserRole,
      profile: userData.profile || {}
    };
    
    // Insertar usuario
    const result = await db.collection<IUser>('users').insertOne(newUser);
    
    // Retornar usuario sin contraseña
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return {
      ...userWithoutPassword,
      _id: result.insertedId
    } as IUserPublic;
  }
  
  /**
   * Busca usuario por username o email
   */
  static async findByIdentifier(identifier: string): Promise<IUser | null> {
    const db = getDb();
    
    return await db.collection<IUser>('users').findOne({
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
  static async findById(userId: string | ObjectId): Promise<IUser | null> {
    const db = getDb();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    return await db.collection<IUser>('users').findOne({
      _id: objectId,
      isActive: true
    });
  }
  
  /**
   * Busca usuario público por ID (sin datos sensibles)
   */
  static async findPublicById(userId: string | ObjectId): Promise<IUserPublic | null> {
    const user = await this.findById(userId);
    if (!user) return null;
    
    const { passwordHash, ...publicUser } = user;
    return publicUser as IUserPublic;
  }
  
  /**
   * Autentica usuario con credenciales
   */
  static async authenticate(identifier: string, password: string): Promise<IUserPublic | null> {
    const user = await this.findByIdentifier(identifier);
    
    if (!user || !user.isActive) {
      return null;
    }
    
    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }
    
    // Actualizar último acceso
    await this.updateLastAccess(user._id!);
    
    // Retornar usuario sin datos sensibles
    const { passwordHash, ...publicUser } = user;
    return publicUser as IUserPublic;
  }
  
  /**
   * Actualiza la contraseña del usuario
   */
  static async updatePassword(userId: string | ObjectId, newPassword: string): Promise<boolean> {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Invalid password: ${passwordValidation.errors.join(', ')}`);
    }
    
    const db = getDb();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const passwordHash = await hashPassword(newPassword);
    
    const result = await db.collection<IUser>('users').updateOne(
      { _id: objectId },
      { 
        $set: { 
          passwordHash, 
          updatedAt: new Date() 
        } 
      }
    );
    
    return result.modifiedCount > 0;
  }
  
  /**
   * Actualiza el perfil del usuario
   */
  static async updateProfile(userId: string | ObjectId, profileData: Partial<IUser>): Promise<boolean> {
    const db = getDb();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    // Remover campos que no se deben actualizar directamente
    const { _id, passwordHash, createdAt, ...allowedUpdates } = profileData;
    
    const result = await db.collection<IUser>('users').updateOne(
      { _id: objectId },
      { 
        $set: { 
          ...allowedUpdates,
          updatedAt: new Date() 
        } 
      }
    );
    
    return result.modifiedCount > 0;
  }
  
  /**
   * Desactiva usuario (soft delete)
   */
  static async deactivate(userId: string | ObjectId): Promise<boolean> {
    const db = getDb();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const result = await db.collection<IUser>('users').updateOne(
      { _id: objectId },
      { 
        $set: { 
          isActive: false,
          updatedAt: new Date() 
        } 
      }
    );
    
    return result.modifiedCount > 0;
  }
  
  /**
   * Reactiva usuario
   */
  static async reactivate(userId: string | ObjectId): Promise<boolean> {
    const db = getDb();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const result = await db.collection<IUser>('users').updateOne(
      { _id: objectId },
      { 
        $set: { 
          isActive: true,
          updatedAt: new Date() 
        } 
      }
    );
    
    return result.modifiedCount > 0;
  }
  
  /**
   * Actualiza último acceso del usuario
   */
  private static async updateLastAccess(userId: ObjectId): Promise<void> {
    const db = getDb();
    
    await db.collection<IUser>('users').updateOne(
      { _id: userId },
      { $set: { updatedAt: new Date() } }
    );
  }
  
  /**
   * Busca usuarios con paginación
   */
  static async findMany(
    filter: Partial<IUser> = {}, 
    page: number = 1, 
    limit: number = 10
  ): Promise<{ users: IUserPublic[]; total: number; page: number; limit: number }> {
    const db = getDb();
    const skip = (page - 1) * limit;
    
    // Añadir filtro de usuarios activos por defecto
    const searchFilter = { ...filter, isActive: true };
    
    const [users, total] = await Promise.all([
      db.collection<IUser>('users')
        .find(searchFilter)
        .project({ passwordHash: 0 }) // Excluir hash de contraseña
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<IUser>('users').countDocuments(searchFilter)
    ]);
    
    return {
      users: users as IUserPublic[],
      total,
      page,
      limit
    };
  }
  
  /**
   * Cuenta total de usuarios
   */
  static async count(filter: Partial<IUser> = {}): Promise<number> {
    const db = getDb();
    return await db.collection<IUser>('users').countDocuments({ ...filter, isActive: true });
  }
}