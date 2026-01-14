import { Router } from "express";
import {
  generateProductDescriptionController,
  generateProductMetaController,
  generateChatResponseController,
  generateProductComparisonController,
  visualSearchController,
} from "./ai.controller";
import { optionalAuth } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.post("/product-description", generateProductDescriptionController);
router.post("/product-meta", generateProductMetaController);
router.post("/chat", optionalAuth, generateChatResponseController); // Add optionalAuth to get userId if available
router.post("/product-comparison", generateProductComparisonController);
router.post("/visual-search", visualSearchController);

export default router;

