import { Router, Request, Response } from "express";
import { ResponseUtil } from "../../shared/utils/response.util";

const router = Router();

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
router.get("/", (req: Request, res: Response) => {
  ResponseUtil.success(res, null, "Server is running");
});

export default router;
