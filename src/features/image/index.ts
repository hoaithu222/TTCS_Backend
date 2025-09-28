import { Router } from "express";
import {
  getImageController,
  createImageController,
  updateImageController,
  deleteImageController,
  listImageController,
} from "./image.controller";
import {
  uploadImageMiddleware,
  uploadImageController,
} from "./image.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const imageRouter = Router();

imageRouter.get("/", listImageController);
imageRouter.get("/:id", getImageController);
imageRouter.post(
  "/",
  authenticateToken,
  authorize(["admin"]),
  createImageController
);
imageRouter.post("/upload", uploadImageMiddleware, uploadImageController);
imageRouter.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  updateImageController
);
imageRouter.delete(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  deleteImageController
);

export default imageRouter;
