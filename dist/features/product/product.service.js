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
const ProductModal_1 = __importStar(require("../../models/ProductModal"));
const ReviewModel_1 = __importDefault(require("../../models/ReviewModel"));
const ChatConversation_1 = __importDefault(require("../../models/ChatConversation"));
const mongoose_1 = require("mongoose");
const notification_service_1 = require("../../shared/services/notification.service");
const chat_service_1 = __importDefault(require("../chat/chat.service"));
// Helper function to map product to frontend format
const mapProduct = async (product) => {
    if (!product)
        return product;
    // Populate variant images if they are ObjectIds
    let mappedVariants = product.variants || [];
    if (mappedVariants.length > 0) {
        const ImageModel = (await Promise.resolve().then(() => __importStar(require("../../models/ImageModel")))).default;
        mappedVariants = await Promise.all(mappedVariants.map(async (variant) => {
            // If variant.image is an ObjectId string, fetch the image URL
            if (variant.image &&
                typeof variant.image === "string" &&
                variant.image.match(/^[0-9a-fA-F]{24}$/)) {
                try {
                    const imageDoc = await ImageModel.findById(variant.image).lean();
                    if (imageDoc && imageDoc.url) {
                        return { ...variant, image: imageDoc.url };
                    }
                }
                catch (err) {
                    console.error("Failed to populate variant image:", err);
                }
            }
            return variant;
        }));
    }
    return {
        ...product,
        variants: mappedVariants,
        shop: product.shopId
            ? {
                _id: product.shopId._id || product.shopId,
                name: product.shopId.name || "",
                logo: product.shopId.logo,
                rating: product.shopId.rating,
            }
            : undefined,
        category: product.categoryId
            ? {
                _id: product.categoryId._id || product.categoryId,
                name: product.categoryId.name || "",
                slug: product.categoryId.slug,
            }
            : undefined,
        subCategory: product.subCategoryId
            ? {
                _id: product.subCategoryId._id || product.subCategoryId,
                name: product.subCategoryId.name || "",
                slug: product.subCategoryId.slug,
            }
            : undefined,
        finalPrice: product.price - (product.discount || 0),
    };
};
class ProductService {
    static async get(id) {
        const product = await ProductModal_1.default.findById(id)
            .populate({
            path: "images",
            select: "url publicId _id",
        })
            .populate({
            path: "shopId",
            select: "name logo rating _id",
        })
            .populate({
            path: "categoryId",
            select: "name slug _id",
        })
            .populate({
            path: "subCategoryId",
            select: "name slug _id",
        })
            .lean();
        if (!product)
            return {
                ok: false,
                status: 404,
                message: "Product không tồn tại",
            };
        // Increment view count (don't await to avoid blocking response)
        ProductModal_1.default.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).catch(() => { });
        return { ok: true, product: await mapProduct(product) };
    }
    static async create(data) {
        try {
            // Auto approve products when shop creates them
            const productData = {
                ...data,
                status: ProductModal_1.ProductStatus.APPROVED,
                isActive: true,
            };
            const product = await ProductModal_1.default.create(productData);
            return { ok: true, product };
        }
        catch (error) {
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
    static async update(id, data) {
        const product = await ProductModal_1.default.findByIdAndUpdate(id, data, {
            new: true,
        });
        if (!product)
            return {
                ok: false,
                status: 404,
                message: "Product không tồn tại",
            };
        return { ok: true, product };
    }
    static async delete(id) {
        const product = await ProductModal_1.default.findByIdAndDelete(id);
        if (!product)
            return {
                ok: false,
                status: 404,
                message: "Product không tồn tại",
            };
        return { ok: true, product };
    }
    static async list(query) {
        try {
            const page = Number.isFinite(query.page) && query.page > 0
                ? query.page
                : 1;
            const limit = Number.isFinite(query.limit) && query.limit > 0
                ? Math.min(query.limit, 500)
                : 50;
            const skip = (page - 1) * limit;
            const filter = {};
            // Handle status filter
            if (query.status) {
                filter.status = query.status;
                // If status is approved, also check isActive
                if (query.status === "approved") {
                    filter.isActive = true;
                }
            }
            // If no status filter, show all products (admin can see all including violated)
            // Violated products will be excluded in search/featured/recommended (public APIs)
            // Handle isActive filter (only apply if explicitly provided)
            if (typeof query.isActive === "boolean") {
                filter.isActive = query.isActive;
            }
            // If no status and no isActive filter provided, show all products (for admin panel)
            if (query.categoryId)
                filter.categoryId = query.categoryId;
            if (query.subCategoryId)
                filter.subCategoryId = query.subCategoryId;
            if (query.shopId)
                filter.shopId = query.shopId;
            // Price range filter
            if (query.minPrice != null || query.maxPrice != null) {
                filter.price = {};
                if (query.minPrice != null)
                    filter.price.$gte = query.minPrice;
                if (query.maxPrice != null)
                    filter.price.$lte = query.maxPrice;
            }
            // Rating filter
            if (query.rating != null) {
                filter.rating = { $gte: query.rating };
            }
            // In stock filter
            if (query.inStock) {
                filter.stock = { $gt: 0 };
            }
            // Search by text
            if (query.search) {
                filter.$or = [
                    { name: { $regex: query.search, $options: "i" } },
                    { description: { $regex: query.search, $options: "i" } },
                    { metaKeywords: { $regex: query.search, $options: "i" } },
                ];
            }
            console.log("[ProductService.list] Filter:", JSON.stringify(filter, null, 2));
            const sortField = query.sortBy || "createdAt";
            const sortDir = (query.sortOrder || "desc") === "asc" ? 1 : -1;
            const sort = { [sortField]: sortDir };
            const [items, total] = await Promise.all([
                ProductModal_1.default.find(filter)
                    .populate({
                    path: "images",
                    select: "url publicId _id",
                })
                    .populate({
                    path: "shopId",
                    select: "name logo rating _id",
                })
                    .populate({
                    path: "categoryId",
                    select: "name slug _id",
                })
                    .populate({
                    path: "subCategoryId",
                    select: "name slug _id",
                })
                    .skip(skip)
                    .limit(limit)
                    .sort(sort)
                    .lean(),
                ProductModal_1.default.countDocuments(filter),
            ]);
            const mappedItems = await Promise.all(items.map(mapProduct));
            return { ok: true, items: mappedItems, total, page, limit };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Search products (public - exclude violated products)
    static async search(query) {
        try {
            const page = Number.isFinite(query.page) && query.page > 0
                ? query.page
                : 1;
            const limit = Number.isFinite(query.limit) && query.limit > 0
                ? Math.min(query.limit, 500)
                : 20;
            const skip = (page - 1) * limit;
            const filter = {
                isActive: true,
                status: { $ne: ProductModal_1.ProductStatus.VIOLATED }, // Exclude violated products
            };
            if (query.categoryId)
                filter.categoryId = query.categoryId;
            if (query.subCategoryId)
                filter.subCategoryId = query.subCategoryId;
            if (query.shopId)
                filter.shopId = query.shopId;
            // Price range filter
            if (query.minPrice != null || query.maxPrice != null) {
                filter.price = {};
                if (query.minPrice != null)
                    filter.price.$gte = query.minPrice;
                if (query.maxPrice != null)
                    filter.price.$lte = query.maxPrice;
            }
            // Rating filter
            if (query.rating != null) {
                filter.rating = { $gte: query.rating };
            }
            // In stock filter
            if (query.inStock) {
                filter.stock = { $gt: 0 };
            }
            // Search by text
            if (query.search) {
                filter.$or = [
                    { name: { $regex: query.search, $options: "i" } },
                    { description: { $regex: query.search, $options: "i" } },
                    { metaKeywords: { $regex: query.search, $options: "i" } },
                ];
            }
            console.log("[ProductService.search] Filter:", JSON.stringify(filter, null, 2));
            const sortField = query.sortBy || "createdAt";
            const sortDir = (query.sortOrder || "desc") === "asc" ? 1 : -1;
            const sort = { [sortField]: sortDir };
            const [items, total] = await Promise.all([
                ProductModal_1.default.find(filter)
                    .populate({
                    path: "images",
                    select: "url publicId _id",
                })
                    .populate({
                    path: "shopId",
                    select: "name logo rating _id",
                })
                    .populate({
                    path: "categoryId",
                    select: "name slug _id",
                })
                    .populate({
                    path: "subCategoryId",
                    select: "name slug _id",
                })
                    .skip(skip)
                    .limit(limit)
                    .sort(sort)
                    .lean(),
                ProductModal_1.default.countDocuments(filter),
            ]);
            const mappedItems = await Promise.all(items.map(mapProduct));
            return { ok: true, items: mappedItems, total, page, limit };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Get featured products
    static async getFeatured(query) {
        try {
            const page = Number.isFinite(query.page) && query.page > 0
                ? query.page
                : 1;
            const limit = Number.isFinite(query.limit) && query.limit > 0
                ? Math.min(query.limit, 500)
                : 20;
            const skip = (page - 1) * limit;
            const filter = {
                isActive: true,
                rating: { $gte: 4 },
                status: { $ne: ProductModal_1.ProductStatus.VIOLATED }, // Exclude violated products
            };
            if (query.categoryId)
                filter.categoryId = query.categoryId;
            if (query.subCategoryId)
                filter.subCategoryId = query.subCategoryId;
            if (query.shopId)
                filter.shopId = query.shopId;
            const sort = { rating: -1, salesCount: -1, createdAt: -1 };
            const [items, total] = await Promise.all([
                ProductModal_1.default.find(filter)
                    .populate({
                    path: "images",
                    select: "url publicId _id",
                })
                    .populate({
                    path: "shopId",
                    select: "name logo rating _id",
                })
                    .populate({
                    path: "categoryId",
                    select: "name slug _id",
                })
                    .populate({
                    path: "subCategoryId",
                    select: "name slug _id",
                })
                    .skip(skip)
                    .limit(limit)
                    .sort(sort)
                    .lean(),
                ProductModal_1.default.countDocuments(filter),
            ]);
            const mappedItems = await Promise.all(items.map(mapProduct));
            return { ok: true, items: mappedItems, total, page, limit };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Get recommended products
    static async getRecommended(query) {
        try {
            const page = Number.isFinite(query.page) && query.page > 0
                ? query.page
                : 1;
            const limit = Number.isFinite(query.limit) && query.limit > 0
                ? Math.min(query.limit, 500)
                : 20;
            const skip = (page - 1) * limit;
            const filter = {
                isActive: true,
                status: { $ne: ProductModal_1.ProductStatus.VIOLATED }, // Exclude violated products
            };
            if (query.categoryId)
                filter.categoryId = query.categoryId;
            if (query.subCategoryId)
                filter.subCategoryId = query.subCategoryId;
            if (query.shopId)
                filter.shopId = query.shopId;
            // Recommend based on sales count and rating
            const sort = { salesCount: -1, rating: -1, viewCount: -1 };
            const [items, total] = await Promise.all([
                ProductModal_1.default.find(filter)
                    .populate({
                    path: "images",
                    select: "url publicId _id",
                })
                    .populate({
                    path: "shopId",
                    select: "name logo rating _id",
                })
                    .populate({
                    path: "categoryId",
                    select: "name slug _id",
                })
                    .populate({
                    path: "subCategoryId",
                    select: "name slug _id",
                })
                    .skip(skip)
                    .limit(limit)
                    .sort(sort)
                    .lean(),
                ProductModal_1.default.countDocuments(filter),
            ]);
            const mappedItems = await Promise.all(items.map(mapProduct));
            return { ok: true, items: mappedItems, total, page, limit };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Get related products
    static async getRelated(productId, limit = 8) {
        try {
            const product = await ProductModal_1.default.findById(productId);
            if (!product) {
                return {
                    ok: false,
                    status: 404,
                    message: "Product không tồn tại",
                };
            }
            const filter = {
                _id: { $ne: productId },
                isActive: true,
                status: { $ne: ProductModal_1.ProductStatus.VIOLATED }, // Exclude violated products
                $or: [
                    { categoryId: product.categoryId },
                    { subCategoryId: product.subCategoryId },
                    { shopId: product.shopId },
                ],
            };
            const items = await ProductModal_1.default.find(filter)
                .populate({
                path: "images",
                select: "url publicId _id",
            })
                .populate({
                path: "shopId",
                select: "name logo rating _id",
            })
                .populate({
                path: "categoryId",
                select: "name slug _id",
            })
                .populate({
                path: "subCategoryId",
                select: "name slug _id",
            })
                .limit(limit)
                .sort({ rating: -1, salesCount: -1 })
                .lean();
            const mappedItems = await Promise.all(items.map(mapProduct));
            return { ok: true, items: mappedItems };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Track product view
    static async trackView(productId) {
        try {
            await ProductModal_1.default.findByIdAndUpdate(productId, {
                $inc: { viewCount: 1 },
            });
            return { ok: true };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Get product reviews
    static async getReviews(productId, query) {
        try {
            const page = Number.isFinite(query.page) && query.page && query.page > 0
                ? query.page
                : 1;
            const limit = Number.isFinite(query.limit) && query.limit && query.limit > 0
                ? Math.min(query.limit, 100)
                : 10;
            const skip = (page - 1) * limit;
            const filter = { productId: productId };
            const sortField = query.sortBy || "createdAt";
            const sort = { [sortField]: -1 };
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
                    .skip(skip)
                    .limit(limit)
                    .sort(sort)
                    .lean(),
                ReviewModel_1.default.countDocuments(filter),
            ]);
            // Calculate rating statistics
            const ratingStats = await ReviewModel_1.default.aggregate([
                { $match: filter },
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
            // Map reviews to match frontend expected format
            const mappedReviews = reviews.map((review) => ({
                _id: review._id,
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
    // Update product status (for admin)
    static async updateStatus(req, id, data) {
        try {
            const product = await ProductModal_1.default.findById(id)
                .populate("shopId", "userId name")
                .lean();
            if (!product) {
                return {
                    ok: false,
                    status: 404,
                    message: "Sản phẩm không tồn tại",
                };
            }
            const currentUser = req.currentUser;
            const reviewerId = currentUser?._id?.toString();
            const updateData = {
                status: data.status,
                reviewedAt: new Date(),
                reviewedBy: reviewerId,
            };
            // If status is violated, set violationNote and isActive to false
            if (data.status === ProductModal_1.ProductStatus.VIOLATED) {
                updateData.violationNote = data.violationNote || "Sản phẩm vi phạm quy định";
                updateData.isActive = false;
            }
            else if (data.status === ProductModal_1.ProductStatus.APPROVED) {
                updateData.isActive = true;
            }
            else if (data.status === ProductModal_1.ProductStatus.HIDDEN) {
                updateData.isActive = false;
            }
            const updatedProduct = await ProductModal_1.default.findByIdAndUpdate(id, updateData, { new: true })
                .populate({
                path: "images",
                select: "url publicId _id",
            })
                .populate({
                path: "shopId",
                select: "name logo rating _id userId",
            })
                .populate({
                path: "categoryId",
                select: "name slug _id",
            })
                .populate({
                path: "subCategoryId",
                select: "name slug _id",
            })
                .lean();
            if (!updatedProduct) {
                return {
                    ok: false,
                    status: 404,
                    message: "Không thể cập nhật sản phẩm",
                };
            }
            // If product is reopened (changed from VIOLATED to APPROVED), send notification
            const previousStatus = product.status;
            if (previousStatus === ProductModal_1.ProductStatus.VIOLATED && data.status === ProductModal_1.ProductStatus.APPROVED) {
                const shop = product.shopId;
                if (shop?.userId) {
                    const shopOwnerId = shop.userId.toString();
                    // Send notification
                    try {
                        await notification_service_1.notificationService.createAndEmit({
                            userId: shopOwnerId,
                            title: "Sản phẩm đã được mở lại",
                            content: `Sản phẩm "${product.name}" đã được mở lại và có thể hiển thị cho khách hàng.`,
                            type: "success",
                            icon: "check-circle",
                            actionUrl: `/shop/list-product`,
                            metadata: {
                                productId: id,
                                productName: product.name,
                            },
                            priority: "normal",
                        });
                    }
                    catch (notifyError) {
                        console.error("[product] Failed to send reopen notification:", notifyError);
                    }
                    // Send chat message to shop - find existing conversation or create new one
                    try {
                        const adminUserId = req.user?.userId;
                        if (!adminUserId) {
                            console.error("[product] Admin userId not found in request");
                        }
                        else {
                            const adminUserIdObj = new mongoose_1.Types.ObjectId(adminUserId);
                            const shopOwnerIdObj = new mongoose_1.Types.ObjectId(shopOwnerId);
                            const existingConversation = await ChatConversation_1.default.findOne({
                                $or: [
                                    {
                                        type: "admin",
                                        channel: "admin",
                                        "participants.userId": { $all: [adminUserIdObj, shopOwnerIdObj] },
                                    },
                                    {
                                        type: "shop",
                                        channel: "shop",
                                        "metadata.shopId": shop._id.toString(),
                                        "participants.userId": { $all: [adminUserIdObj, shopOwnerIdObj] },
                                    },
                                ],
                            }).lean();
                            let conversationId;
                            if (existingConversation) {
                                conversationId = existingConversation._id.toString();
                                console.log("[product] Found existing conversation for reopen:", conversationId);
                            }
                            else {
                                const chatResult = await chat_service_1.default.createConversation(req, {
                                    type: "shop",
                                    targetId: shop._id.toString(),
                                    metadata: {
                                        context: "product_reopened",
                                        shopId: shop._id.toString(),
                                    },
                                });
                                if (!chatResult.ok || !chatResult.data) {
                                    console.error("[product] Failed to create chat conversation for reopen:", chatResult.message);
                                    throw new Error(chatResult.message || "Failed to create conversation");
                                }
                                conversationId = chatResult.data._id;
                                console.log("[product] Created new conversation for reopen:", conversationId);
                            }
                            // Send message in the conversation
                            const messageResult = await chat_service_1.default.sendMessage(req, conversationId, {
                                message: `Sản phẩm "${product.name}" đã được mở lại và có thể hiển thị cho khách hàng.\n\nSản phẩm hiện đã được duyệt và hoạt động bình thường.`,
                                type: "text",
                                metadata: {
                                    productId: id,
                                    productName: product.name,
                                    isSystemMessage: true,
                                },
                            });
                            if (!messageResult.ok) {
                                console.error("[product] Failed to send reopen chat message:", messageResult.message);
                            }
                            else {
                                console.log("[product] Successfully sent reopen message to shop");
                            }
                        }
                    }
                    catch (chatError) {
                        console.error("[product] Failed to send reopen chat message:", chatError);
                    }
                }
            }
            // If product is violated, send notification and message to shop
            if (data.status === ProductModal_1.ProductStatus.VIOLATED) {
                const shop = product.shopId;
                if (shop?.userId) {
                    const shopOwnerId = shop.userId.toString();
                    const violationNote = data.violationNote || "Sản phẩm vi phạm quy định của sàn";
                    // Send notification
                    try {
                        await notification_service_1.notificationService.createAndEmit({
                            userId: shopOwnerId,
                            title: "Sản phẩm bị đánh dấu vi phạm",
                            content: `Sản phẩm "${product.name}" đã bị đánh dấu vi phạm. Lý do: ${violationNote}`,
                            type: "warning",
                            icon: "alert-triangle",
                            actionUrl: `/chat`,
                            metadata: {
                                productId: id,
                                productName: product.name,
                                violationNote,
                            },
                            priority: "high",
                        });
                    }
                    catch (notifyError) {
                        console.error("[product] Failed to send notification:", notifyError);
                    }
                    // Send chat message to shop - find existing conversation or create new one
                    try {
                        // First, try to find existing conversation between admin and shop owner
                        const adminUserId = req.user?.userId;
                        if (!adminUserId) {
                            console.error("[product] Admin userId not found in request");
                        }
                        else {
                            // Find existing conversation between admin and shop owner
                            // Convert to ObjectId for proper comparison
                            const adminUserIdObj = new mongoose_1.Types.ObjectId(adminUserId);
                            const shopOwnerIdObj = new mongoose_1.Types.ObjectId(shopOwnerId);
                            const existingConversation = await ChatConversation_1.default.findOne({
                                $or: [
                                    // Conversation with type "admin" (created by shop owner)
                                    {
                                        type: "admin",
                                        channel: "admin",
                                        "participants.userId": { $all: [adminUserIdObj, shopOwnerIdObj] },
                                    },
                                    // Conversation with type "shop" (created by admin)
                                    {
                                        type: "shop",
                                        channel: "shop",
                                        "metadata.shopId": shop._id.toString(),
                                        "participants.userId": { $all: [adminUserIdObj, shopOwnerIdObj] },
                                    },
                                ],
                            }).lean();
                            let conversationId;
                            if (existingConversation) {
                                // Use existing conversation
                                conversationId = existingConversation._id.toString();
                                console.log("[product] Found existing conversation:", conversationId);
                            }
                            else {
                                // Create new conversation if not found
                                const chatResult = await chat_service_1.default.createConversation(req, {
                                    type: "shop",
                                    targetId: shop._id.toString(),
                                    metadata: {
                                        context: "product_violation",
                                        shopId: shop._id.toString(),
                                    },
                                });
                                if (!chatResult.ok || !chatResult.data) {
                                    console.error("[product] Failed to create chat conversation:", chatResult.message);
                                    throw new Error(chatResult.message || "Failed to create conversation");
                                }
                                conversationId = chatResult.data._id;
                                console.log("[product] Created new conversation:", conversationId);
                            }
                            // Send message in the conversation
                            const messageResult = await chat_service_1.default.sendMessage(req, conversationId, {
                                message: `Sản phẩm "${product.name}" đã bị đánh dấu vi phạm.\n\nLý do: ${violationNote}\n\nVui lòng kiểm tra và chỉnh sửa sản phẩm để tuân thủ quy định của sàn.`,
                                type: "text",
                                metadata: {
                                    productId: id,
                                    productName: product.name,
                                    violationNote,
                                    isSystemMessage: true,
                                },
                            });
                            if (!messageResult.ok) {
                                console.error("[product] Failed to send chat message:", messageResult.message);
                            }
                            else {
                                console.log("[product] Successfully sent violation message to shop");
                            }
                        }
                    }
                    catch (chatError) {
                        console.error("[product] Failed to send chat message:", chatError);
                    }
                }
            }
            return {
                ok: true,
                product: await mapProduct(updatedProduct),
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
}
exports.default = ProductService;
