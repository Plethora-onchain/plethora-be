import { Router, Request, Response } from 'express';
import { verifyPrivyToken } from '../middleware/verifyPrivyToken';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Route for authenticating a user and creating them if they don't exist
router.post('/', verifyPrivyToken, async (req: Request, res: Response) => {
  return authController.authenticateOrCreateUser(req, res);
});

export default router; 