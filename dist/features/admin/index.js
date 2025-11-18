"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const adminRouter = (0, express_1.Router)();
// User statistics (admin only)
adminRouter.get("/users/statistics", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), admin_controller_1.getUserStatisticsController);
// Product statistics (admin only)
adminRouter.get("/products/statistics", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), admin_controller_1.getProductStatisticsController);
exports.default = adminRouter;
