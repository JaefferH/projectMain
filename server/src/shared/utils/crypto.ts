import crypto from 'crypto';

export function generateResetToken(): string {
  // Generate a random 40-character hex string
  return crypto.randomBytes(40).toString('hex');
}

export function hashResetToken(token: string): string {
  // Hash the token before storing (optional but recommended)
  return crypto.createHash('sha256').update(token).digest('hex');
}