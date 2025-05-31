import { Request, Response } from 'express';
import { PrismaClient, User } from '../../generated/prisma';
import { BaseController } from './base.controller';
import { UserController } from './user.controller';

interface AuthRequestBody {
  email?: string;
  name?: string;
  username?: string; // Username can be optional here, but UserController will require it for creation
}

export class AuthController extends BaseController {
  private prisma: PrismaClient;
  private userController: UserController;

  constructor() {
    super();
    this.prisma = new PrismaClient();
    this.userController = new UserController();
  }

  async authenticateOrCreateUser(req: Request, res: Response) {
    if (!req.privyUser || !req.privyUser.userId) {
      return this.respondUnauthorized(res, 'User identifier not found in token');
    }

    const privyIdFromToken = req.privyUser.userId;
    const { email, name, username } = req.body as AuthRequestBody;

    if (email !== undefined && typeof email !== 'string') {
      return this.respondBadRequest(res, 'Invalid email format');
    }
    if (name !== undefined && typeof name !== 'string') {
      return this.respondBadRequest(res, 'Invalid name format');
    }
    // Username validation will be implicitly handled by Prisma schema or UserController if it becomes required there for creation

    try {
      let user = await this.userController.getUserByPrivyId(privyIdFromToken);

      if (user) {
        // User exists, authentication successful
        const userResponse = {
          id: user.id,
          privyId: user.privyId,
          email: user.email,
          name: user.name,
          username: user.username
        };
        return this.respondWithSuccess(res, 'Authentication successful', userResponse, 200);
      } else {
        // User does not exist, create them
        // Now we need to ensure username is provided if we are creating a user.
        if (!username || typeof username !== 'string' || username.trim() === '') {
          return this.respondBadRequest(res, 'Username is required for new user registration.');
        }

        // Username uniqueness check is now primarily handled by userController.createUser
        // userController.createUser will throw an error if username is taken.

        user = await this.userController.createUser({ 
          privyId: privyIdFromToken, 
          username, 
          email, 
          name 
        });

        const userResponse = {
          id: user.id,
          privyId: user.privyId,
          email: user.email,
          name: user.name,
          username: user.username
        };
        return this.respondWithSuccess(res, 'User created successfully', userResponse, 201);
      }
    } catch (error: any) {
      console.error('Error in authenticateOrCreateUser:', error);
      // Handle specific error for username taken, if thrown by UserController
      if (error.code === 'P2002_USERNAME') {
        return this.respondBadRequest(res, error.message);
      }
      // This will catch Prisma's P2002 for other unique fields like email if createUser doesn't catch them first
      if (error.code === 'P2002') { 
        const targetFields = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : 'field';
        return this.respondBadRequest(res, `A user with this ${targetFields} already exists.`);
      }
      if (error.name === 'PrismaClientValidationError') {
          return this.respondBadRequest(res, 'Input data is invalid or missing required fields.', { specificError: error.message });
      }
      return this.respondServerError(res, 'Could not authenticate or create user');
    }
  }
} 