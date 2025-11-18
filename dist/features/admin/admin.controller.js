"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductStatisticsController = exports.getUserStatisticsController = void 0;
const admin_service_1 = __importDefault(require("./admin.service"));
const response_util_1 = require("../../shared/utils/response.util");
const getUserStatisticsController = async (req, res) => {
    const result = await admin_service_1.default.getUserStatistics();
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method);
    }
    return response_util_1.ResponseUtil.success(res, result.statistics, "Lấy thống kê người dùng thành công");
};
exports.getUserStatisticsController = getUserStatisticsController;
const getProductStatisticsController = async (req, res) => {
    const result = await admin_service_1.default.getProductStatistics();
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method);
    }
    return response_util_1.ResponseUtil.success(res, result.statistics, "Lấy thống kê sản phẩm thành công");
};
exports.getProductStatisticsController = getProductStatisticsController;
