import { Router } from "express";
import {
  registerUserController,
  verifyEmailController,
  resendVerifyEmailController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
  refreshTokenController,
  logoutController,
} from "./auth.controller";
import { authenticateToken } from "../../shared/middlewares/auth.middleware";
import { getProfileController, updateProfileController } from "./profile.controller";

const router = Router();

router.post("/auth/register", registerUserController);
router.get("/auth/verify-email", verifyEmailController);
router.post("/auth/resend-verify-email", resendVerifyEmailController);
router.post("/auth/login", loginController);
router.post("/auth/forgot-password", forgotPasswordController);
router.post("/auth/reset-password", resetPasswordController);
router.post("/auth/refresh-token", refreshTokenController);
router.post("/auth/logout", authenticateToken, logoutController);
router.get("/auth/profile", authenticateToken, getProfileController);
router.put("/auth/profile", authenticateToken, updateProfileController);

export default router;
