// src/routes/index.ts
import { Router } from "express";
import featuresRouter from "../features";

const router = Router();

// Mount all feature routes
router.use("/", featuresRouter);

export default router;
