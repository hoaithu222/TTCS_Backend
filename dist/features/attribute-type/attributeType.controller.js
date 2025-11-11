"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAttributeTypeController = exports.deleteAttributeTypeController = exports.updateAttributeTypeController = exports.createAttributeTypeController = exports.getAttributeTypeController = void 0;
const attributeType_service_1 = __importDefault(require("./attributeType.service"));
const response_util_1 = require("../../shared/utils/response.util");
const getAttributeTypeController = async (req, res) => {
    const { id } = req.params;
    const result = await attributeType_service_1.default.get(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.getAttributeTypeController = getAttributeTypeController;
const createAttributeTypeController = async (req, res) => {
    const result = await attributeType_service_1.default.create(req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.created(res, result.item);
};
exports.createAttributeTypeController = createAttributeTypeController;
const updateAttributeTypeController = async (req, res) => {
    const { id } = req.params;
    const result = await attributeType_service_1.default.update(id, req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.updateAttributeTypeController = updateAttributeTypeController;
const deleteAttributeTypeController = async (req, res) => {
    const { id } = req.params;
    const result = await attributeType_service_1.default.delete(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.deleteAttributeTypeController = deleteAttributeTypeController;
const listAttributeTypeController = async (req, res) => {
    const { page, limit, search, isActive, categoryId } = req.query;
    const result = await attributeType_service_1.default.list({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
        isActive: typeof isActive === "string" ? isActive === "true" : undefined,
        categoryId,
    });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.items, "Success", 200, 1, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    });
};
exports.listAttributeTypeController = listAttributeTypeController;
