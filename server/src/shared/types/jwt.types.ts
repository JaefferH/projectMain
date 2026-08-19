// src/shared/types/jwt.types.ts
export interface JwtPayload {
  userId: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}