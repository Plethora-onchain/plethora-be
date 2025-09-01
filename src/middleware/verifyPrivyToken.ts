import { Request, Response, NextFunction } from 'express';
import { PrivyClient, AuthTokenClaims } from '@privy-io/server-auth';
import { config } from 'dotenv';


config();
// Extend the Express Request type
declare global {
  namespace Express {
    interface Request {
      privyUser?: AuthTokenClaims; // Use AuthTokenClaims from the SDK
    }
  }
}

const privyAppId = process.env.PRIVY_APP_ID;
const privyAppSecret = process.env.PRIVY_APP_SECRET;
const privyVerificationKey = process.env.PRIVY_VERIFICATION_KEY;

if (!privyAppId) {
  throw new Error('PRIVY_APP_ID environment variable is not set.');
}
if (!privyAppSecret) {
  throw new Error('PRIVY_APP_SECRET environment variable is not set.');
}
if (!privyVerificationKey) {
  console.warn('PRIVY_VERIFICATION_KEY not set; SDK will fetch it (less efficient).');
}

const privy = new PrivyClient(privyAppId, privyAppSecret);

export const verifyPrivyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', details: { reason: 'Missing or invalid Authorization header' } });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', details: { reason: 'Bearer token missing' } });
  }

  try {
    const decodedClaims = await privy.verifyAuthToken(token);
    
    req.privyUser = decodedClaims; // No cast needed if types match
    next();
  } catch (error: any) {
    let reason = 'Invalid token';
    let statusCode = error.status || (error.response && error.response.status) || 401;

    if (error.message) {
        if (error.message.includes('expired')) {
            reason = 'Token expired';
        } else if (error.message.includes('audience') || error.message.includes('APP_ID')) {
            reason = 'Invalid token audience';
        } else if (error.message.includes('issuer')) {
            reason = 'Invalid token issuer';
        } else if (error.message.includes('signature') || error.message.includes('format')) {
            reason = 'Invalid token signature or format';
        } else {
            reason = error.message;
        }
    } else if (typeof error === 'string') {
        reason = error;
    }

    console.error('Token verification error:', error);
    return res.status(statusCode).json({ error: 'Unauthorized', details: { reason } });
  }
};
