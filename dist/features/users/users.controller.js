"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlockUserController = exports.suspendUserController = exports.getUsersController = exports.updateUserAvatarController = exports.deleteUserController = exports.updateUserController = exports.getUserController = void 0;
const users_service_1 = __importDefault(require("./users.service"));
const response_util_1 = require("../../shared/utils/response.util");
const getUserController = async (req, res) => {
    const { id } = req.params;
    const includeShopStatus = req.query.includeShopStatus === "true";
    const result = await users_service_1.default.getUser(id, includeShopStatus);
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
const updateUserAvatarController = async (req, res) => {
    const { id } = req.params;
    const { avatar } = req.body;
    const result = await users_service_1.default.updateAvatar(id, avatar || "");
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method);
    }
    return response_util_1.ResponseUtil.success(res, {
        message: "Cập nhật avatar thành công",
        user: result.user,
    });
};
exports.updateUserAvatarController = updateUserAvatarController;
const getUsersController = async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search;
    const status = req.query.status;
    const role = req.query.role;
    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder;
    const result = await users_service_1.default.getUsers(page, limit, search, status, role, sortBy, sortOrder);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message || "Không thể lấy danh sách người dùng", result.status || 400, undefined, req.path, req.method);
    }
    const paginationMeta = {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    };
    return response_util_1.ResponseUtil.success(res, {
        users: result.users,
        pagination: paginationMeta,
    }, "Lấy danh sách người dùng thành công", 200, 1, paginationMeta);
};
exports.getUsersController = getUsersController;
const suspendUserController = async (req, res) => {
    const { id } = req.params;
    const result = await users_service_1.default.suspendUser(id);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method);
    }
    return response_util_1.ResponseUtil.success(res, result.user, "Đã khóa người dùng thành công");
};
exports.suspendUserController = suspendUserController;
const unlockUserController = async (req, res) => {
    const { id } = req.params;
    const result = await users_service_1.default.unlockUser(id);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method);
    }
    return response_util_1.ResponseUtil.success(res, result.user, "Đã mở khóa người dùng thành công");
};
exports.unlockUserController = unlockUserController;
