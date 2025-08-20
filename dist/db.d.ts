import { Db } from 'mongodb';
import type { IEnvConfig } from './types';
declare const config: IEnvConfig;
/**
 * Conecta a MongoDB y configura índices necesarios
 */
export declare function connectDB(): Promise<Db>;
/**
 * Obtiene la instancia de la base de datos
 */
export declare function getDb(): Db;
/**
 * Cierra la conexión a MongoDB
 */
export declare function closeDB(): Promise<void>;
export { config };
