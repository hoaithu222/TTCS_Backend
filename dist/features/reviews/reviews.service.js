"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ReviewModel_1 = __importDefault(require("../../models/ReviewModel"));
const OrderModel_1 = __importStar(require("../../models/OrderModel"));
const OrderItem_1 = __importDefault(require("../../models/OrderItem"));
const ProductModal_1 = __importDefault(require("../../models/ProductModal"));
const ShopModel_1 = __importDefault(require("../../models/ShopModel"));
class ReviewsService {
    static async create(req, data) {
        const currentUser = req.currentUser;
        const userId = currentUser?.id?.toString() || req.user?.userId;
        if (!userId) {
            return { ok: false, status: 401, message: "Unauthorized" };
        }
        if (!data.orderId || !data.orderItemId) {
            return { ok: false, status: 400, message: "Thiếu thông tin đơn hàng" };
        }
        if (!data.productId || !data.shopId) {
            return { ok: false, status: 400, message: "Thiếu thông tin sản phẩm" };
        }
        if (typeof data.rating !== "number" || data.rating < 1 || data.rating > 5) {
            return { ok: false, status: 400, message: "Điểm đánh giá không hợp lệ" };
        }
        const session = await ReviewModel_1.default.startSession();
        session.startTransaction();
        const abortWith = async (status, message) => {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            session.endSession();
            return { ok: false, status, message };
        };
        try {
            const order = await OrderModel_1.default.findById(data.orderId)
                .select("userId status shopId orderItems isReview")
                .session(session);
            if (!order) {
                return abortWith(404, "Đơn hàng không tồn tại");
            }
            const isOwner = order.userId.toString() === userId.toString();
            if (!isOwner && currentUser?.role !== "admin") {
                return abortWith(403, "Bạn không thể đánh giá đơn hàng này");
            }
            if (order.status !== OrderModel_1.OrderStatus.DELIVERED) {
                return abortWith(400, "Chỉ có thể đánh giá khi đơn hàng đã giao thành công");
            }
            if (order.shopId.toString() !== data.shopId.toString()) {
                return abortWith(400, "Shop không khớp với đơn hàng");
            }
            const orderItem = await OrderItem_1.default.findById(data.orderItemId).session(session);
            if (!orderItem) {
                return abortWith(404, "Sản phẩm trong đơn không tồn tại");
            }
            const belongsToOrder = orderItem.orderId?.toString() === order._id.toString() ||
                order.orderItems?.some((itemId) => itemId.toString() === orderItem._id.toString());
            if (!belongsToOrder) {
                return abortWith(400, "Sản phẩm không thuộc đơn hàng cần đánh giá");
            }
            if (orderItem.productId.toString() !== data.productId.toString()) {
                return abortWith(400, "Sản phẩm không hợp lệ");
            }
            if (orderItem.isReviewed) {
                return abortWith(400, "Bạn đã đánh giá sản phẩm này");
            }
            const existingReview = await ReviewModel_1.default.findOne({
                orderItemId: orderItem._id,
            }).session(session);
            if (existingReview) {
                return abortWith(400, "Bạn đã đánh giá sản phẩm này");
            }
            const [createdReview] = await ReviewModel_1.default.create([
                {
                    userId,
                    productId: data.productId,
                    shopId: data.shopId,
                    orderId: data.orderId,
                    orderItemId: data.orderItemId,
                    rating: data.rating,
                    comment: data.comment,
                    images: data.images || [],
                    isVerified: true,
                },
            ], { session });
            await OrderItem_1.default.findByIdAndUpdate(orderItem._id, { isReviewed: true }, { session });
            const [totalItems, reviewedItems] = await Promise.all([
                OrderItem_1.default.countDocuments({ orderId: order._id }).session(session),
                OrderItem_1.default.countDocuments({ orderId: order._id, isReviewed: true }).session(session),
            ]);
            if (totalItems > 0 && reviewedItems === totalItems) {
                await OrderModel_1.default.findByIdAndUpdate(order._id, { isReview: true }, { session });
            }
            await session.commitTransaction();
            session.endSession();
            await ReviewsService.refreshAggregates(data.productId, data.shopId);
            return { ok: true, review: createdReview };
        }
        catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            session.endSession();
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
    static async get(id) {
        const review = await ReviewModel_1.default.findById(id);
        if (!review)
            return {
                ok: false,
                status: 404,
                message: "Review không tồn tại",
            };
        return { ok: true, review };
    }
    static async list(query) {
        try {
            const page = Number.isFinite(query.page) && query.page > 0
                ? query.page
                : 1;
            const limit = Number.isFinite(query.limit) && query.limit > 0
                ? Math.min(query.limit, 100)
                : 10;
            const skip = (page - 1) * limit;
            const filter = {};
            if (query.productId)
                filter.productId = query.productId;
            if (query.shopId)
                filter.shopId = query.shopId;
            if (query.userId)
                filter.userId = query.userId;
            const sortField = query.sortBy || "createdAt";
            const sortDir = (query.sortOrder || "desc") === "asc" ? 1 : -1;
            const sort = { [sortField]: sortDir };
            const [items, total] = await Promise.all([
                ReviewModel_1.default.find(filter).skip(skip).limit(limit).sort(sort),
                ReviewModel_1.default.countDocuments(filter),
            ]);
            return { ok: true, items, total, page, limit };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    static async getShopReviews(shopId, query) {
        try {
            const page = Number.isFinite(query.page) && query.page && query.page > 0
                ? query.page
                : 1;
            const limit = Number.isFinite(query.limit) && query.limit && query.limit > 0
                ? Math.min(query.limit, 100)
                : 10;
            const skip = (page - 1) * limit;
            const sortField = query.sortBy || "createdAt";
            const sort = { [sortField]: -1 };
            const filter = { shopId };
            const [reviews, total] = await Promise.all([
                ReviewModel_1.default.find(filter)
                    .populate({
                    path: "userId",
                    select: "name avatar",
                })
                    .populate({
                    path: "images",
                    select: "url publicId",
                })
                    .populate({
                    path: "productId",
                    select: "_id name images",
                    populate: {
                        path: "images",
                        select: "_id url publicId",
                    },
                })
                    .skip(skip)
                    .limit(limit)
                    .sort(sort)
                    .lean(),
                ReviewModel_1.default.countDocuments(filter),
            ]);
            const ratingStats = await ReviewModel_1.default.aggregate([
                { $match: { shopId: new mongoose_1.default.Types.ObjectId(shopId) } },
                {
                    $group: {
                        _id: null,
                        averageRating: { $avg: "$rating" },
                        totalReviews: { $sum: 1 },
                        ratingDistribution: {
                            $push: "$rating",
                        },
                    },
                },
            ]);
            const ratingDistribution = ratingStats[0]?.ratingDistribution || [];
            const distribution = {};
            ratingDistribution.forEach((rating) => {
                distribution[rating.toString()] =
                    (distribution[rating.toString()] || 0) + 1;
            });
            const mappedReviews = reviews.map((review) => ({
                _id: review._id,
                productId: review.productId?._id || review.productId,
                product: review.productId
                    ? {
                        _id: review.productId._id || review.productId,
                        name: review.productId.name || "",
                        image: review.productId.images?.[0]?.url ||
                            review.productId.images?.[0],
                    }
                    : undefined,
                userId: review.userId?._id || review.userId,
                user: review.userId
                    ? {
                        _id: review.userId._id || review.userId,
                        name: review.userId.name || "",
                        avatar: review.userId.avatar,
                    }
                    : undefined,
                rating: review.rating,
                title: review.title || undefined,
                comment: review.comment || undefined,
                images: review.images?.map((img) => img?.url || img) || [],
                isVerified: review.isVerified || false,
                helpfulCount: review.helpfulCount || 0,
                createdAt: review.createdAt,
            }));
            return {
                ok: true,
                reviews: mappedReviews,
                averageRating: ratingStats[0]?.averageRating || 0,
                totalReviews: ratingStats[0]?.totalReviews || 0,
                ratingDistribution: distribution,
                page,
                limit,
                total,
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    static async update(req, id, data) {
        const currentUser = req.currentUser;
        const review = await ReviewModel_1.default.findById(id);
        if (!review)
            return {
                ok: false,
                status: 404,
                message: "Review không tồn tại",
            };
        if (review.userId.toString() !== currentUser.id.toString())
            return { ok: false, status: 403, message: "Forbidden" };
        const updated = await ReviewModel_1.default.findByIdAndUpdate(id, data, {
            new: true,
        });
        if (updated) {
            await ReviewsService.refreshAggregates(updated.productId.toString(), updated.shopId.toString());
        }
        return { ok: true, review: updated };
    }
    static async delete(req, id) {
        const currentUser = req.currentUser;
        const review = await ReviewModel_1.default.findById(id);
        if (!review)
            return {
                ok: false,
                status: 404,
                message: "Review không tồn tại",
            };
        if (review.userId.toString() !== currentUser.id.toString())
            return { ok: false, status: 403, message: "Forbidden" };
        const deleted = await ReviewModel_1.default.findByIdAndDelete(id);
        if (deleted) {
            await ReviewsService.refreshAggregates(deleted.productId.toString(), deleted.shopId.toString());
        }
        return { ok: true, review: deleted };
    }
    static async refreshAggregates(productId, shopId) {
        try {
            await Promise.all([
                ReviewsService.updateProductStats(productId),
                ReviewsService.updateShopStats(shopId),
            ]);
        }
        catch (error) {
            console.error("[reviews] refresh aggregates failed:", error);
        }
    }
    static async updateProductStats(productId) {
        const objectId = new mongoose_1.default.Types.ObjectId(productId);
        const stats = await ReviewModel_1.default.aggregate([
            { $match: { productId: objectId } },
            {
                $group: {
                    _id: "$productId",
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);
        const averageRating = stats[0]?.averageRating ?? 0;
        const totalReviews = stats[0]?.totalReviews ?? 0;
        await ProductModal_1.default.findByIdAndUpdate(productId, {
            rating: averageRating,
            reviewCount: totalReviews,
        });
    }
    static async updateShopStats(shopId) {
        const objectId = new mongoose_1.default.Types.ObjectId(shopId);
        const stats = await ReviewModel_1.default.aggregate([
            { $match: { shopId: objectId } },
            {
                $group: {
                    _id: "$shopId",
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);
        const averageRating = stats[0]?.averageRating ?? 0;
        const totalReviews = stats[0]?.totalReviews ?? 0;
        await ShopModel_1.default.findByIdAndUpdate(shopId, {
            rating: averageRating,
            reviewCount: totalReviews,
        });
    }
}
exports.default = ReviewsService;
