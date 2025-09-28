"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_util_1 = require("../../shared/utils/response.util");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is running
 */
router.get("/", (req, res) => {
    response_util_1.ResponseUtil.success(res, null, "Server is running");
});
exports.default = router;
