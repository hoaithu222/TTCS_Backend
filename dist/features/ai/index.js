"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("./ai.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post("/product-description", ai_controller_1.generateProductDescriptionController);
router.post("/product-meta", ai_controller_1.generateProductMetaController);
router.post("/chat", auth_middleware_1.optionalAuth, ai_controller_1.generateChatResponseController); // Add optionalAuth to get userId if available
router.post("/product-comparison", ai_controller_1.generateProductComparisonController);
router.post("/visual-search", ai_controller_1.visualSearchController);
exports.default = router;
