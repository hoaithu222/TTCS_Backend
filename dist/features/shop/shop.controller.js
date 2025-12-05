"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShopReviewsController = exports.unlockShopController = exports.suspendShopController = exports.rejectShopController = exports.approveShopController = exports.getShopStatusByUserIdController = exports.followersCountController = exports.isFollowingShopController = exports.unfollowShopController = exports.followShopController = exports.listShopController = exports.deleteShopController = exports.updateShopController = exports.createShopController = exports.getShopController = void 0;
const shop_service_1 = __importDefault(require("./shop.service"));
const response_util_1 = require("../../shared/utils/response.util");
const reviews_service_1 = __importDefault(require("../reviews/reviews.service"));
const getShopController = async (req, res) => {
    const { id } = req.params;
    const result = await shop_service_1.default.get(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.getShopController = getShopController;
const createShopController = async (req, res) => {
    const currentUser = req.user;
    if (!currentUser)
        return response_util_1.ResponseUtil.error(res, "Unauthorized", 401);
    const data = {
        ...req.body,
        userId: currentUser.userId,
    };
    const result = await shop_service_1.default.create(data);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.created(res, result.item);
};
exports.createShopController = createShopController;
const updateShopController = async (req, res) => {
    const { id } = req.params;
    const result = await shop_service_1.default.update(id, req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.updateShopController = updateShopController;
const deleteShopController = async (req, res) => {
    const { id } = req.params;
    const result = await shop_service_1.default.delete(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.deleteShopController = deleteShopController;
const listShopController = async (req, res) => {
    const { page, limit, userId, search, status, isActive, isVerified } = req.query;
    const parsedIsActive = typeof isActive === "string" ? isActive === "true" : undefined;
    const parsedIsVerified = typeof isVerified === "string" ? isVerified === "true" : undefined;
    const result = await shop_service_1.default.list({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        userId,
        search,
        status,
        isActive: parsedIsActive,
        isVerified: parsedIsVerified,
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
exports.listShopController = listShopController;
const followShopController = async (req, res) => {
    const { id } = req.params; // shopId
    const currentUser = req.user;
    if (!currentUser)
        return response_util_1.ResponseUtil.error(res, "Unauthorized", 401);
    const result = await shop_service_1.default.follow(id, currentUser.userId);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, {
        isFollowing: result.isFollowing,
        followersCount: result.followersCount,
    });
};
exports.followShopController = followShopController;
const unfollowShopController = async (req, res) => {
    const { id } = req.params; // shopId
    const currentUser = req.user;
    if (!currentUser)
        return response_util_1.ResponseUtil.error(res, "Unauthorized", 401);
    const result = await shop_service_1.default.unfollow(id, currentUser.userId);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, {
        isFollowing: result.isFollowing,
        followersCount: result.followersCount,
    });
};
exports.unfollowShopController = unfollowShopController;
const isFollowingShopController = async (req, res) => {
    const { id } = req.params; // shopId
    const currentUser = req.user;
    if (!currentUser)
        return response_util_1.ResponseUtil.error(res, "Unauthorized", 401);
    const result = await shop_service_1.default.isFollowing(id, currentUser.userId);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, "Error", 400);
    return response_util_1.ResponseUtil.success(res, {
        isFollowing: result.isFollowing,
        followersCount: result.followersCount,
    });
};
exports.isFollowingShopController = isFollowingShopController;
const followersCountController = async (req, res) => {
    const { id } = req.params; // shopId
    const result = await shop_service_1.default.followersCount(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, "Error", 400);
    return response_util_1.ResponseUtil.success(res, { count: result.count });
};
exports.followersCountController = followersCountController;
const getShopStatusByUserIdController = async (req, res) => {
    const { userId } = req.params;
    const result = await shop_service_1.default.getShopStatusByUserId(userId);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, {
        shopStatus: result.shopStatus,
        shop: result.shop,
    });
};
exports.getShopStatusByUserIdController = getShopStatusByUserIdController;
const approveShopController = async (req, res) => {
    const { id } = req.params;
    const result = await shop_service_1.default.approveShop(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.approveShopController = approveShopController;
const rejectShopController = async (req, res) => {
    const { id } = req.params;
    const result = await shop_service_1.default.rejectShop(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.rejectShopController = rejectShopController;
const suspendShopController = async (req, res) => {
    const { id } = req.params;
    const result = await shop_service_1.default.suspendShop(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.suspendShopController = suspendShopController;
const unlockShopController = async (req, res) => {
    const { id } = req.params;
    const result = await shop_service_1.default.unlockShop(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.unlockShopController = unlockShopController;
const getShopReviewsController = async (req, res) => {
    const { id } = req.params;
    const { page, limit, sortBy } = req.query;
    const result = await reviews_service_1.default.getShopReviews(id, {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sortBy,
    });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, {
        reviews: result.reviews,
        averageRating: result.averageRating,
        totalReviews: result.totalReviews,
        ratingDistribution: result.ratingDistribution,
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
        },
    });
};
exports.getShopReviewsController = getShopReviewsController;
