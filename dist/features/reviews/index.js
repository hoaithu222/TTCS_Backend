"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reviews_controller_1 = require("./reviews.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const reviewsRouter = (0, express_1.Router)();
// Public list for a product or shop; auth optional later; require auth for create
reviewsRouter.get("/", reviews_controller_1.listReviewsController);
reviewsRouter.get("/:id", reviews_controller_1.getReviewController);
reviewsRouter.post("/", auth_middleware_1.authenticateToken, reviews_controller_1.createReviewController);
reviewsRouter.put("/:id", auth_middleware_1.authenticateToken, reviews_controller_1.updateReviewController);
reviewsRouter.delete("/:id", auth_middleware_1.authenticateToken, reviews_controller_1.deleteReviewController);
exports.default = reviewsRouter;
