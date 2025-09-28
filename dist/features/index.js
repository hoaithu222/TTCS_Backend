"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_1 = __importDefault(require("./health"));
const auth_1 = __importDefault(require("./auth"));
const router = (0, express_1.Router)();
// Mount feature routes
router.use("/health", health_1.default);
router.use("/", auth_1.default);
exports.default = router;
