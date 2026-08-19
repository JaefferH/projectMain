// auth.routes.ts (updated)
import { Router } from 'express';
import { authController } from './auth.controller';
import { 
  loginSchema, 
  refreshTokenSchema, 
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendResetTokenSchema,
  updateProfileSchema
} from './auth.validation';
import { authenticate } from '@middleware/auth.middleware';
import { rateLimiters } from '@middleware/rateLimiter.middleware';
import { validate } from '@middleware/validate.middleware';
import { uploadImage } from '@middleware/upload.middleware';

const router = Router();

// Public routes with rate limiting
router.post('/login', rateLimiters.auth, validate(loginSchema), authController.login);
router.post('/forgot-password', rateLimiters.sensitive, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/resend-reset-token', rateLimiters.sensitive, validate(resendResetTokenSchema), authController.resendResetToken);
router.post('/reset-password', rateLimiters.sensitive, validate(resetPasswordSchema), authController.resetPassword);

// Regular public routes
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

// Protected routes
router.use(authenticate);
router.get("/telegram-link-code", authController.getTelegramLinkCode);
router.get('/me', authController.me);
router.patch(
  "/profile",
  uploadImage.single('photo'),
  validate(updateProfileSchema),
  authController.updateProfile
);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.post('/change-password', validate(changePasswordSchema), authController.changePassword);

export default router;