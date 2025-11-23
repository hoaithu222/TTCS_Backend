"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConfigurationController = exports.updateConfigurationController = exports.createConfigurationController = exports.getConfigurationByIdController = exports.getAllConfigurationsController = exports.getActiveConfigurationController = void 0;
const home_configuration_service_1 = __importDefault(require("./home-configuration.service"));
const response_util_1 = require("../../shared/utils/response.util");
// Get active configuration (public)
const getActiveConfigurationController = async (req, res) => {
    const result = await home_configuration_service_1.default.getActiveConfiguration();
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.configuration);
};
exports.getActiveConfigurationController = getActiveConfigurationController;
// Get all configurations (admin only)
const getAllConfigurationsController = async (req, res) => {
    console.log("🔍 [Home Config] GET /admin/configuration called");
    const currentUser = req.currentUser;
    if (!currentUser || currentUser.role !== "admin") {
        console.log("❌ [Home Config] Unauthorized access");
        return response_util_1.ResponseUtil.error(res, "Bạn không có quyền truy cập", 403);
    }
    console.log("✅ [Home Config] User authorized, fetching configurations");
    const result = await home_configuration_service_1.default.getAllConfigurations();
    if (!result.ok) {
        console.log("❌ [Home Config] Service error:", result.message);
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    console.log("✅ [Home Config] Success, returning", result.configurations?.length || 0, "configurations");
    return response_util_1.ResponseUtil.success(res, { configurations: result.configurations });
};
exports.getAllConfigurationsController = getAllConfigurationsController;
// Get configuration by ID (public - for user selection)
const getConfigurationByIdController = async (req, res) => {
    // Allow public access for user configuration selection
    // No authentication required
    const { id } = req.params;
    const result = await home_configuration_service_1.default.getConfigurationById(id);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.configuration);
};
exports.getConfigurationByIdController = getConfigurationByIdController;
// Create configuration (admin only)
const createConfigurationController = async (req, res) => {
    const currentUser = req.currentUser;
    if (!currentUser || currentUser.role !== "admin") {
        return response_util_1.ResponseUtil.error(res, "Bạn không có quyền tạo cấu hình", 403);
    }
    const result = await home_configuration_service_1.default.createConfiguration(req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.configuration, "Tạo cấu hình thành công");
};
exports.createConfigurationController = createConfigurationController;
// Update configuration (admin only)
const updateConfigurationController = async (req, res) => {
    const currentUser = req.currentUser;
    if (!currentUser || currentUser.role !== "admin") {
        return response_util_1.ResponseUtil.error(res, "Bạn không có quyền cập nhật cấu hình", 403);
    }
    const { id } = req.params;
    const result = await home_configuration_service_1.default.updateConfiguration(id, req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.configuration, "Cập nhật cấu hình thành công");
};
exports.updateConfigurationController = updateConfigurationController;
// Delete configuration (admin only)
const deleteConfigurationController = async (req, res) => {
    const currentUser = req.currentUser;
    if (!currentUser || currentUser.role !== "admin") {
        return response_util_1.ResponseUtil.error(res, "Bạn không có quyền xóa cấu hình", 403);
    }
    const { id } = req.params;
    const result = await home_configuration_service_1.default.deleteConfiguration(id);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, null, "Xóa cấu hình thành công");
};
exports.deleteConfigurationController = deleteConfigurationController;
