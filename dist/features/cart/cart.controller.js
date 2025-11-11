"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCartController = exports.removeCartItemController = exports.updateCartItemController = exports.addCartItemController = exports.getCartController = void 0;
const cart_service_1 = __importDefault(require("./cart.service"));
const response_util_1 = require("../../shared/utils/response.util");
const getCartController = async (req, res) => {
    const result = await cart_service_1.default.getOrCreate(req);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.cart);
};
exports.getCartController = getCartController;
const addCartItemController = async (req, res) => {
    const result = await cart_service_1.default.addItem(req, req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.cart);
};
exports.addCartItemController = addCartItemController;
const updateCartItemController = async (req, res) => {
    const { itemId } = req.params;
    const result = await cart_service_1.default.updateItem(req, itemId, req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.cart);
};
exports.updateCartItemController = updateCartItemController;
const removeCartItemController = async (req, res) => {
    const { itemId } = req.params;
    const result = await cart_service_1.default.removeItem(req, itemId);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.cart);
};
exports.removeCartItemController = removeCartItemController;
const clearCartController = async (req, res) => {
    const result = await cart_service_1.default.clear(req);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.cart);
};
exports.clearCartController = clearCartController;
