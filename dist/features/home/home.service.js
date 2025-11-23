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
const CategoryModel_1 = __importDefault(require("../../models/CategoryModel"));
const ShopModel_1 = __importDefault(require("../../models/ShopModel"));
const mapHomeProduct = (product) => {
    if (!product)
        return product;
    const formatImages = (images) => (images || []).map((img) => {
        if (!img)
            return img;
        if (typeof img === "string") {
            return {
                _id: img,
                url: img,
            };
        }
        return {
            _id: (img._id || img.id || "").toString(),
            url: img.url,
            publicId: img.publicId,
        };
    });
    return {
        ...product,
        images: formatImages(product.images),
        finalPrice: product.price - (product.discount || 0),
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
    };
};
class HomeService {
    // Get home banner
    static async getBanner() {
        try {
            const HomeConfigurationModel = (await Promise.resolve().then(() => __importStar(require("../../models/HomeConfigurationModel")))).default;
            const config = await HomeConfigurationModel.findOne({ isActive: true })
                .populate({
                path: "sideBanners.categoryId",
                select: "name image_Background _id",
            })
                .lean()
                .sort({ createdAt: -1 });
            if (!config) {
                return {
                    ok: true,
                    banners: {
                        mainBanners: [],
                        sideBanners: [],
                        features: [],
                        settings: {
                            autoSlideInterval: 5000,
                            showCounter: true,
                            showDots: true,
                        },
                    },
                };
            }
            // Map sideBanners to include category image
            const mappedSideBanners = (config.sideBanners || [])
                .filter((b) => b.isActive)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((b) => {
                const category = b.categoryId;
                return {
                    _id: b._id?.toString(),
                    image: category?.image_Background || null,
                    categoryId: category?._id || b.categoryId,
                    category: category
                        ? {
                            _id: category._id,
                            name: category.name,
                        }
                        : null,
                };
            });
            // Sort and filter active items
            const banners = {
                mainBanners: (config.mainBanners || [])
                    .filter((b) => b.isActive)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((b) => ({
                    _id: b._id?.toString(),
                    image: b.image,
                    title: b.title,
                    description: b.description,
                    link: b.link,
                })),
                sideBanners: mappedSideBanners,
                features: (config.features || [])
                    .filter((f) => f.isActive)
                    .sort((a, b) => (a.order || 0) - (b.order || 0)),
                settings: config.settings || {
                    autoSlideInterval: 5000,
                    showCounter: true,
                    showDots: true,
                },
            };
            return {
                ok: true,
                banners,
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
    // Get home categories
    static async getHomeCategories(params) {
        try {
            const page = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
            const limit = Number.isFinite(params.limit) && params.limit > 0
                ? Math.min(params.limit, 50)
                : 10;
            const skip = (page - 1) * limit;
            const filter = { isActive: true };
            const [categories, total] = await Promise.all([
                CategoryModel_1.default.find(filter)
                    .sort({ sortOrder: 1, createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                CategoryModel_1.default.countDocuments(filter),
            ]);
            return {
                ok: true,
                categories,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
                },
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
    // Get best seller products
    static async getBestSellerProducts(params) {
        try {
            const page = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
            const limit = Number.isFinite(params.limit) && params.limit > 0
                ? Math.min(params.limit, 50)
                : 10;
            const skip = (page - 1) * limit;
            const filter = { isActive: true };
            const [products, total] = await Promise.all([
                ProductModal_1.default.find(filter)
                    .populate({
                    path: "images",
                    select: "url publicId _id",
                })
                    .populate("shopId", "name logo rating")
                    .populate("categoryId", "name slug")
                    .populate("subCategoryId", "name slug")
                    .sort({ salesCount: -1, rating: -1, createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                ProductModal_1.default.countDocuments(filter),
            ]);
            // Calculate finalPrice for each product
            const mappedProducts = products.map(mapHomeProduct);
            return {
                ok: true,
                products: mappedProducts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
                },
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
    // Get best shops
    static async getBestShops(params) {
        try {
            const page = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
            const limit = Number.isFinite(params.limit) && params.limit > 0
                ? Math.min(params.limit, 50)
                : 10;
            const skip = (page - 1) * limit;
            const filter = { isActive: true, isVerified: true };
            const [shops, total] = await Promise.all([
                ShopModel_1.default.find(filter)
                    .populate("ownerId", "name email")
                    .sort({
                    rating: -1,
                    followersCount: -1,
                    productsCount: -1,
                    createdAt: -1,
                })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                ShopModel_1.default.countDocuments(filter),
            ]);
            return {
                ok: true,
                shops,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
                },
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
    // Get flash sale products
    static async getFlashSaleProducts(params) {
        try {
            const page = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
            const limit = Number.isFinite(params.limit) && params.limit > 0
                ? Math.min(params.limit, 50)
                : 10;
            const skip = (page - 1) * limit;
            const filter = {
                isActive: true,
                discount: { $gt: 0 }, // Products with discount
            };
            const [products, total] = await Promise.all([
                ProductModal_1.default.find(filter)
                    .populate({
                    path: "images",
                    select: "url publicId _id",
                })
                    .populate("shopId", "name logo rating")
                    .populate("categoryId", "name slug")
                    .populate("subCategoryId", "name slug")
                    .sort({ discount: -1, createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                ProductModal_1.default.countDocuments(filter),
            ]);
            // Calculate finalPrice for each product
            const mappedProducts = products.map(mapHomeProduct);
            return {
                ok: true,
                products: mappedProducts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
                },
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
    // Get search suggestions
    static async getSearchSuggestions(params) {
        try {
            const page = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
            const limit = Number.isFinite(params.limit) && params.limit > 0
                ? Math.min(params.limit, 20)
                : 10;
            const skip = (page - 1) * limit;
            if (!params.q || params.q.trim().length === 0) {
                return {
                    ok: true,
                    products: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0,
                    },
                };
            }
            const filter = {
                isActive: true,
                $or: [
                    { name: { $regex: params.q, $options: "i" } },
                    { description: { $regex: params.q, $options: "i" } },
                    { metaKeywords: { $regex: params.q, $options: "i" } },
                ],
            };
            const [products, total] = await Promise.all([
                ProductModal_1.default.find(filter)
                    .populate({
                    path: "images",
                    select: "url publicId _id",
                })
                    .populate("shopId", "name logo rating")
                    .populate("categoryId", "name slug")
                    .populate("subCategoryId", "name slug")
                    .sort({ salesCount: -1, rating: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                ProductModal_1.default.countDocuments(filter),
            ]);
            // Calculate finalPrice for each product
            const mappedProducts = products.map(mapHomeProduct);
            return {
                ok: true,
                products: mappedProducts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
                },
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
exports.default = HomeService;
