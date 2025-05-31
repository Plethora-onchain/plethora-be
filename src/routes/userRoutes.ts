import { Router, Request, Response } from 'express';
import { verifyPrivyToken } from '../middleware/verifyPrivyToken';
import { UserController } from '../controllers/user.controller';

const router = Router();
const userController = new UserController();

// Route for updating an authenticated user's information
router.put('/me', verifyPrivyToken, async (req: Request, res: Response) => {
  return userController.updateCurrentUser(req, res);
});

// Route for getting a user by username
router.get('/username/:username', verifyPrivyToken, async (req: Request, res: Response) => {
  return userController.getUserByUsernameRoute(req, res);
});

export default router; 