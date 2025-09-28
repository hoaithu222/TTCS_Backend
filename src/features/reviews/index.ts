import { Router } from "express";
import {
  createReviewController,
  updateReviewController,
  deleteReviewController,
  getReviewController,
  listReviewsController,
} from "./reviews.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const reviewsRouter = Router();

// Public list for a product or shop; auth optional later; require auth for create
reviewsRouter.get("/", listReviewsController);
reviewsRouter.get("/:id", getReviewController);
reviewsRouter.post("/", authenticateToken, createReviewController);
reviewsRouter.put("/:id", authenticateToken, updateReviewController);
reviewsRouter.delete("/:id", authenticateToken, deleteReviewController);

export default reviewsRouter;
