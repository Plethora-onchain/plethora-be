import { PrismaClient, User } from '../../generated/prisma';
import { BaseController } from './base.controller';
import { Request, Response } from 'express';

interface UserCreateData {
  privyId: string;
  username: string;
  email?: string;
  name?: string;
}

interface UserUpdateData {
  email?: string;
  name?: string;
  username?: string;
}

interface UserUpdateRequestBody {
  email?: string;
  name?: string;
  username?: string;
}

export class UserController extends BaseController {
  private prisma: PrismaClient;

  constructor() {
    super();
    this.prisma = new PrismaClient();
  }

  async getUserByPrivyId(privyId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { privyId },
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error('Username is required and must be a non-empty string');
    }
    
    return this.prisma.user.findUnique({
      where: { username: username.trim() },
    });
  }

  async createUser(data: UserCreateData): Promise<User> {
    const existingUserByUsername = await this.getUserByUsername(data.username);
    if (existingUserByUsername) {
      throw Object.assign(new Error(`Username '${data.username}' is already taken.`), { code: 'P2002_USERNAME' });
    }

    const newUserData: any = {
      privyId: data.privyId,
      username: data.username,
    };

    if (data.email) {
      newUserData.email = data.email;
    }
    if (data.name) {
      newUserData.name = data.name;
    }

    return this.prisma.user.create({
      data: newUserData,
    });
  }

  async updateUser(privyId: string, data: UserUpdateData): Promise<User> {
    if (Object.keys(data).length === 0) {
      throw new Error('No update data provided');
    }

    if (data.username) {
      const existingUserByUsername = await this.getUserByUsername(data.username);
      if (existingUserByUsername && existingUserByUsername.privyId !== privyId) {
        throw Object.assign(new Error(`Username '${data.username}' is already taken.`), { code: 'P2002_USERNAME' });
      }
    }

    return this.prisma.user.update({
      where: { privyId },
      data,
    });
  }

  // Route handler for updating current user
  async updateCurrentUser(req: Request, res: Response) {
    if (!req.privyUser || !req.privyUser.userId) {
      return this.respondUnauthorized(res, 'User identifier not found in token');
    }

    const privyIdFromToken = req.privyUser.userId;
    const { email, name, username } = req.body as UserUpdateRequestBody;

    if (email !== undefined && typeof email !== 'string') {
      return this.respondBadRequest(res, 'Invalid email format');
    }
    if (name !== undefined && typeof name !== 'string') {
      return this.respondBadRequest(res, 'Invalid name format');
    }
    if (username !== undefined && (typeof username !== 'string' || username.trim() === '')) {
      return this.respondBadRequest(res, 'Invalid username format');
    }

    const updateData: { email?: string; name?: string; username?: string } = {};
    if (email !== undefined) {
      updateData.email = email;
    }
    if (name !== undefined) {
      updateData.name = name;
    }
    if (username !== undefined) {
      updateData.username = username;
    }

    if (Object.keys(updateData).length === 0) {
      return this.respondBadRequest(res, 'No update data provided (e.g., email, name, or username)');
    }

    try {
      const updatedUser = await this.updateUser(privyIdFromToken, updateData);

      const userResponse = {
        id: updatedUser.id,
        privyId: updatedUser.privyId,
        email: updatedUser.email,
        name: updatedUser.name,
        username: updatedUser.username,
      };

      return this.respondWithSuccess(res, 'User updated successfully', userResponse, 200);
    } catch (error: any) {
      console.error('Error in PUT /users/me:', error);
      if (error.code === 'P2002_USERNAME') {
        return this.respondBadRequest(res, error.message); 
      }
      if (error.message === 'No update data provided') {
        return this.respondBadRequest(res, error.message);
      }
      if (error.code === 'P2025') {
        return this.respondNotFound(res, 'User not found to update.');
      }
      if (error.code === 'P2002') { 
        const targetFields = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : 'field';
        return this.respondBadRequest(res, `A user with this ${targetFields} already exists.`);
      }
      if (error.name === 'PrismaClientValidationError') {
          return this.respondBadRequest(res, 'Input data is invalid or missing required fields.', { specificError: error.message });
      }
      return this.respondServerError(res, 'Could not update user');
    }
  }

  // Route handler for getting user by username
  async getUserByUsernameRoute(req: Request, res: Response) {
    const { username } = req.params;

    if (!username || username.trim() === '') {
      return this.respondBadRequest(res, 'Username is required');
    }

    try {
      const user = await this.getUserByUsername(username);

      if (!user) {
        return this.respondNotFound(res, 'User not found');
      }

      const userResponse = {
        id: user.id,
        privyId: user.privyId,
        email: user.email,
        name: user.name,
        username: user.username,
      };

      return this.respondWithSuccess(res, 'User found', userResponse, 200);
    } catch (error: any) {
      console.error('Error in GET /users/username/:username:', error);
      return this.respondServerError(res, 'Could not retrieve user');
    }
  }
} 