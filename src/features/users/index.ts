import { Router } from "express";
import {
  getUserController,
  getUsersController,
  updateUserController,
  deleteUserController,
  updateUserAvatarController,
  suspendUserController,
  unlockUserController,
} from "./users.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const router = Router();

// Định nghĩa các route cụ thể trước (như /users/:id/suspend, /users/:id/unlock) để tránh conflict với route generic /users/:id
router.post(
  "/users/:id/suspend",
  authenticateToken,
  authorize(["admin"]),
  suspendUserController
);
router.post(
  "/users/:id/unlock",
  authenticateToken,
  authorize(["admin"]),
  unlockUserController
);
router.patch("/users/:id/avatar", updateUserAvatarController);

// Sau đó mới định nghĩa các route generic
router.get("/users", getUsersController);
router.get("/users/:id", getUserController);
router.put("/users/:id", updateUserController);
router.patch("/users/update/:id", updateUserController);
router.delete("/users/:id", deleteUserController);

export default router;
