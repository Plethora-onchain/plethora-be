import { Response } from 'express';

// Base controller with common functionality
export abstract class BaseController {
  public respondWithSuccess(res: Response, message: string, data: any = null, status: number = 200) {
    return res.status(status).json({
      status: 'success',
      message,
      data
    });
  }


  public respondWithError(res: Response, message: string, errors: any = null, status: number = 400) {
    return res.status(status).json({
      status: 'error',
      message,
      errors
    });
  }

  public respondUnauthorized(res: Response, message: string = 'Unauthorized') {
    return this.respondWithError(res, message, null, 401);
  }

  public respondForbidden(res: Response, message: string = 'Forbidden') {
    return this.respondWithError(res, message, null, 403);
  }

  public respondNotFound(res: Response, message: string = 'Resource not found') {
    return this.respondWithError(res, message, null, 404);
  }

  public respondBadRequest(res: Response, message: string, errors: any = null) {
    return this.respondWithError(res, message, errors, 400);
  }

  public respondServerError(res: Response, message: string = 'Server error') {
    return this.respondWithError(res, message, null, 500);
  }
} 