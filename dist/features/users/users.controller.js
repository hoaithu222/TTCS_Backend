"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersController = exports.deleteUserController = exports.updateUserController = exports.getUserController = void 0;
const users_service_1 = __importDefault(require("./users.service"));
const response_util_1 = require("../../shared/utils/response.util");
const getUserController = async (req, res) => {
    const { id } = req.params;
    const result = await users_service_1.default.getUser(id);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method);
    }
    return response_util_1.ResponseUtil.success(res, {
        message: "Lấy thông tin người dùng thành công",
        user: result.user,
    });
};
exports.getUserController = getUserController;
const updateUserController = async (req, res) => {
    const { id } = req.params;
    const result = await users_service_1.default.updateUser(id, req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method);
    }
    return response_util_1.ResponseUtil.success(res, {
        message: "Cập nhật người dùng thành công",
        user: result.user,
    });
};
exports.updateUserController = updateUserController;
const deleteUserController = async (req, res) => {
    const { id } = req.params;
    const result = await users_service_1.default.deleteUser(id);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method);
    }
    return response_util_1.ResponseUtil.success(res, { message: "Xóa người dùng thành công" });
};
exports.deleteUserController = deleteUserController;
const getUsersController = async (req, res) => {
    const result = await users_service_1.default.getUsers();
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, "Không thể lấy danh sách người dùng", 400, undefined, req.path, req.method);
    }
    return response_util_1.ResponseUtil.success(res, {
        message: "Lấy danh sách người dùng thành công",
        users: result.users,
    });
};
exports.getUsersController = getUsersController;
