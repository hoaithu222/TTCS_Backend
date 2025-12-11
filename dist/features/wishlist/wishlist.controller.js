"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWishlistController = exports.clearWishlistController = exports.removeFromWishlistController = exports.addToWishlistController = exports.getWishlistController = void 0;
const wishlist_service_1 = __importDefault(require("./wishlist.service"));
const response_util_1 = require("../../shared/utils/response.util");
const getWishlistController = async (req, res) => {
    const result = await wishlist_service_1.default.getOrCreate(req);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, { wishlist: result.wishlist });
};
exports.getWishlistController = getWishlistController;
const addToWishlistController = async (req, res) => {
    const { productId } = req.params;
    const result = await wishlist_service_1.default.addItem(req, productId);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, { wishlist: result.wishlist }, result.message);
};
exports.addToWishlistController = addToWishlistController;
const removeFromWishlistController = async (req, res) => {
    const { productId } = req.params;
    const result = await wishlist_service_1.default.removeItem(req, productId);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, { wishlist: result.wishlist }, "Đã xóa sản phẩm khỏi danh sách yêu thích");
};
exports.removeFromWishlistController = removeFromWishlistController;
const clearWishlistController = async (req, res) => {
    const result = await wishlist_service_1.default.clear(req);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, { wishlist: result.wishlist }, "Đã xóa toàn bộ danh sách yêu thích");
};
exports.clearWishlistController = clearWishlistController;
const checkWishlistController = async (req, res) => {
    const { productId } = req.params;
    const result = await wishlist_service_1.default.checkItem(req, productId);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, { isInWishlist: result.isInWishlist });
};
exports.checkWishlistController = checkWishlistController;
