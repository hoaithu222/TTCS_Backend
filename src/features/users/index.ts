import { Router } from "express";
import {
  getUserController,
  getUsersController,
  updateUserController,
  deleteUserController,
} from "./users.controller";

const router = Router();

router.get("/users", getUsersController);
router.get("/users/:id", getUserController);
router.put("/users/:id", updateUserController);
router.patch("/users/update/:id", updateUserController);
router.delete("/users/:id", deleteUserController);

export default router;
