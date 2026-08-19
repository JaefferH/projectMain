// src/shared/middleware/validate.ts
import { AppError } from '@shared/errors/AppError';
import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validate = (schema: z.ZodType<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues.map(e => e.message).join(', ');
        throw new AppError(errorMessage, 400);
      }
      throw error;
    }
  };
};