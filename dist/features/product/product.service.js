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
const ProductModal_1 = __importDefault(require("../../models/ProductModal"));
const ReviewModel_1 = __importDefault(require("../../models/ReviewModel"));
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
            const product = await ProductModal_1.default.create(data);
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
            if (typeof query.isActive === "boolean")
                filter.isActive = query.isActive;
            if (query.categoryId)
                filter.categoryId = query.categoryId;
            if (query.subCategoryId)
                filter.subCategoryId = query.subCategoryId;
            if (query.shopId)
                filter.shopId = query.shopId;
            if (query.minPrice != null || query.maxPrice != null) {
                filter.price = {};
                if (query.minPrice != null)
                    filter.price.$gte = query.minPrice;
                if (query.maxPrice != null)
                    filter.price.$lte = query.maxPrice;
            }
            if (query.search)
                filter.$text = { $search: query.search };
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
    // Search products
    static async search(query) {
        try {
            const page = Number.isFinite(query.page) && query.page > 0
                ? query.page
                : 1;
            const limit = Number.isFinite(query.limit) && query.limit > 0
                ? Math.min(query.limit, 500)
                : 20;
            const skip = (page - 1) * limit;
            const filter = { isActive: true };
            if (query.categoryId)
                filter.categoryId = query.categoryId;
            if (query.subCategoryId)
                filter.subCategoryId = query.subCategoryId;
            if (query.shopId)
                filter.shopId = query.shopId;
            if (query.minPrice != null || query.maxPrice != null) {
                filter.price = {};
                if (query.minPrice != null)
                    filter.price.$gte = query.minPrice;
                if (query.maxPrice != null)
                    filter.price.$lte = query.maxPrice;
            }
            if (query.search) {
                filter.$or = [
                    { name: { $regex: query.search, $options: "i" } },
                    { description: { $regex: query.search, $options: "i" } },
                    { metaKeywords: { $regex: query.search, $options: "i" } },
                ];
            }
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
            const filter = { isActive: true, rating: { $gte: 4 } };
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
            const filter = { isActive: true };
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
}
exports.default = ProductService;
