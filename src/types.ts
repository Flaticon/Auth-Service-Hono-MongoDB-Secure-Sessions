import { ObjectId } from 'mongodb';

export interface IUser {
  _id?: ObjectId;
  username: string;
  email?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  role: string;
  profile: any;
}

export interface ISession {
  _id?: ObjectId;
  userId: ObjectId;
  token: string;
  createdAt: Date;
  lastAccess: Date;
  isActive: boolean;
  metadata: any;
}

export interface ILoginRequest {
  identifier: string;
  password: string;
}

export interface IRegisterRequest {
  username: string;
  email?: string;
  password: string;
  profile?: any;
}