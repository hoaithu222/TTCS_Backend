"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOrderController = exports.updateOrderStatusController = exports.updateOrderController = exports.listOrdersController = exports.getOrderController = exports.createOrderController = void 0;
const orders_service_1 = __importDefault(require("./orders.service"));
const response_util_1 = require("../../shared/utils/response.util");
const createOrderController = async (req, res) => {
    const result = await orders_service_1.default.create(req, req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.created(res, result.order);
};
exports.createOrderController = createOrderController;
const getOrderController = async (req, res) => {
    const { id } = req.params;
    const result = await orders_service_1.default.get(req, id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.order);
};
exports.getOrderController = getOrderController;
const listOrdersController = async (req, res) => {
    const result = await orders_service_1.default.list(req, req.query);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.items, "Success", 200, 1, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    });
};
exports.listOrdersController = listOrdersController;
const updateOrderController = async (req, res) => {
    const { id } = req.params;
    const result = await orders_service_1.default.update(req, id, req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.order);
};
exports.updateOrderController = updateOrderController;
const updateOrderStatusController = async (req, res) => {
    const { id } = req.params;
    const { status, description } = req.body;
    const result = await orders_service_1.default.updateStatus(req, id, status, description);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.order);
};
exports.updateOrderStatusController = updateOrderStatusController;
const deleteOrderController = async (req, res) => {
    const { id } = req.params;
    const result = await orders_service_1.default.delete(req, id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.order);
};
exports.deleteOrderController = deleteOrderController;
