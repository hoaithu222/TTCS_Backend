"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAttributeValueController = exports.deleteAttributeValueController = exports.updateAttributeValueController = exports.createAttributeValueController = exports.getAttributeValueController = void 0;
const attributeValue_service_1 = __importDefault(require("./attributeValue.service"));
const response_util_1 = require("../../shared/utils/response.util");
const getAttributeValueController = async (req, res) => {
    const { id } = req.params;
    const result = await attributeValue_service_1.default.get(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.getAttributeValueController = getAttributeValueController;
const createAttributeValueController = async (req, res) => {
    const result = await attributeValue_service_1.default.create(req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.created(res, result.item);
};
exports.createAttributeValueController = createAttributeValueController;
const updateAttributeValueController = async (req, res) => {
    const { id } = req.params;
    const result = await attributeValue_service_1.default.update(id, req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.updateAttributeValueController = updateAttributeValueController;
const deleteAttributeValueController = async (req, res) => {
    const { id } = req.params;
    const result = await attributeValue_service_1.default.delete(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.deleteAttributeValueController = deleteAttributeValueController;
const listAttributeValueController = async (req, res) => {
    const { page, limit, attributeTypeId, search } = req.query;
    const result = await attributeValue_service_1.default.list({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        attributeTypeId,
        search,
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
exports.listAttributeValueController = listAttributeValueController;
