"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReviewController = exports.updateReviewController = exports.listReviewsController = exports.getReviewController = exports.createReviewController = void 0;
const reviews_service_1 = __importDefault(require("./reviews.service"));
const response_util_1 = require("../../shared/utils/response.util");
const createReviewController = async (req, res) => {
    const result = await reviews_service_1.default.create(req, req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.created(res, result.review);
};
exports.createReviewController = createReviewController;
const getReviewController = async (req, res) => {
    const { id } = req.params;
    const result = await reviews_service_1.default.get(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.review);
};
exports.getReviewController = getReviewController;
const listReviewsController = async (req, res) => {
    const result = await reviews_service_1.default.list(req.query);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.items, "Success", 200, 1, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    });
};
exports.listReviewsController = listReviewsController;
const updateReviewController = async (req, res) => {
    const { id } = req.params;
    const result = await reviews_service_1.default.update(req, id, req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.review);
};
exports.updateReviewController = updateReviewController;
const deleteReviewController = async (req, res) => {
    const { id } = req.params;
    const result = await reviews_service_1.default.delete(req, id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.review);
};
exports.deleteReviewController = deleteReviewController;
