"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const otp_service_1 = __importDefault(require("./otp.service"));
const response_util_1 = require("../../shared/utils/response.util");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   - name: OTP
 *     description: One-Time Password operations
 */
/**
 * @swagger
 * /otp/request:
 *   post:
 *     summary: Request an OTP code
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, channel, purpose]
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: user@example.com
 *               channel:
 *                 type: string
 *                 enum: [email, phone]
 *                 example: email
 *               purpose:
 *                 type: string
 *                 example: login
 *     responses:
 *       200:
 *         description: OTP issued
 */
router.post("/request", async (req, res) => {
    const { identifier, channel, purpose } = req.body;
    const result = await otp_service_1.default.requestOtp(identifier, channel, purpose);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, { message: result.message });
});
/**
 * @swagger
 * /otp/verify:
 *   post:
 *     summary: Verify an OTP code
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, code, purpose]
 *             properties:
 *               identifier:
 *                 type: string
 *               code:
 *                 type: string
 *               purpose:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 */
router.post("/verify", async (req, res) => {
    const { identifier, code, purpose, smartOtpPassword } = req.body;
    const result = await otp_service_1.default.verifyOtp(identifier, code, purpose, smartOtpPassword);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, { message: result.message });
});
exports.default = router;
