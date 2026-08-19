import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { JwtPayload } from "../shared/types/jwt.types";
import { env } from "./env";

const ACCESS_SECRET = env.jwtAccessSecret as Secret;
const REFRESH_SECRET = env.jwtRefreshSecret as Secret;

const ACCESS_EXPIRES =
  env.jwtAccessExpires;

const REFRESH_EXPIRES =
  env.jwtRefreshExpires;

export function generateAccessToken(
  payload: JwtPayload
): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES as SignOptions["expiresIn"],
  });
}

export function generateRefreshToken(
  payload: JwtPayload
): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(
  token: string
): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(
  token: string
): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}