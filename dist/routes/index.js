"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/index.ts
const express_1 = require("express");
const features_1 = __importDefault(require("../features"));
const router = (0, express_1.Router)();
// Mount all feature routes
router.use("/", features_1.default);
exports.default = router;
