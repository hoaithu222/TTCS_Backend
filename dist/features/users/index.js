"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Định nghĩa các route cụ thể trước (như /users/:id/suspend, /users/:id/unlock) để tránh conflict với route generic /users/:id
router.post("/users/:id/suspend", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), users_controller_1.suspendUserController);
router.post("/users/:id/unlock", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), users_controller_1.unlockUserController);
router.patch("/users/:id/avatar", users_controller_1.updateUserAvatarController);
// Sau đó mới định nghĩa các route generic
router.get("/users", users_controller_1.getUsersController);
router.get("/users/:id", users_controller_1.getUserController);
router.put("/users/:id", users_controller_1.updateUserController);
router.patch("/users/update/:id", users_controller_1.updateUserController);
router.delete("/users/:id", users_controller_1.deleteUserController);
exports.default = router;
