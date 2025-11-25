import { Router } from "express";
import {
  generateProductDescriptionController,
  generateProductMetaController,
  generateChatResponseController,
  generateProductComparisonController,
  visualSearchController,
} from "./ai.controller";

const router = Router();

router.post("/product-description", generateProductDescriptionController);
router.post("/product-meta", generateProductMetaController);
router.post("/chat", generateChatResponseController);
router.post("/product-comparison", generateProductComparisonController);
router.post("/visual-search", visualSearchController);

export default router;

