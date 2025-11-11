import { Router } from "express";
import {
  getUserController,
  getUsersController,
  updateUserController,
  deleteUserController,
  updateUserAvatarController,
} from "./users.controller";

const router = Router();

router.get("/users", getUsersController);
router.get("/users/:id", getUserController);
router.put("/users/:id", updateUserController);
router.patch("/users/update/:id", updateUserController);
router.patch("/users/:id/avatar", updateUserAvatarController);
router.delete("/users/:id", deleteUserController);

export default router;
