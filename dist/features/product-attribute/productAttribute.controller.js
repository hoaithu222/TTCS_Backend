"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProductAttributeController = exports.deleteProductAttributeController = exports.updateProductAttributeController = exports.createProductAttributeController = exports.getProductAttributeController = void 0;
const productAttribute_service_1 = __importDefault(require("./productAttribute.service"));
const response_util_1 = require("../../shared/utils/response.util");
const getProductAttributeController = async (req, res) => {
    const { id } = req.params;
    const result = await productAttribute_service_1.default.get(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.getProductAttributeController = getProductAttributeController;
const createProductAttributeController = async (req, res) => {
    const result = await productAttribute_service_1.default.create(req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.created(res, result.item, "Thêm thuộc tính sản phẩm thành công");
};
exports.createProductAttributeController = createProductAttributeController;
const updateProductAttributeController = async (req, res) => {
    const { id } = req.params;
    const result = await productAttribute_service_1.default.update(id, req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item, "Cập nhật thuộc tính sản phẩm thành công");
};
exports.updateProductAttributeController = updateProductAttributeController;
const deleteProductAttributeController = async (req, res) => {
    const { id } = req.params;
    const result = await productAttribute_service_1.default.delete(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item, "Xóa thuộc tính sản phẩm thành công");
};
exports.deleteProductAttributeController = deleteProductAttributeController;
const listProductAttributeController = async (req, res) => {
    const { page, limit, productId, attributeTypeId } = req.query;
    const result = await productAttribute_service_1.default.list({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        productId,
        attributeTypeId,
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
exports.listProductAttributeController = listProductAttributeController;
