import { Router, Request, Response } from "express";
import OtpService from "./otp.service";
import { ResponseUtil } from "../../shared/utils/response.util";

const router = Router();

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
router.post("/request", async (req: Request, res: Response) => {
  const { identifier, channel, purpose } = req.body as any;
  const result = await OtpService.requestOtp(identifier, channel, purpose);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, { message: result.message });
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
router.post("/verify", async (req: Request, res: Response) => {
  const { identifier, code, purpose } = req.body as any;
  const result = await OtpService.verifyOtp(identifier, code, purpose);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, { message: result.message });
});

export default router;
